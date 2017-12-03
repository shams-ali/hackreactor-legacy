import React, { Component, } from 'react';
import { Link, } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

import Avatar from './Avatar.jsx';
import styles from '../lobby.css';
import css from '../styles.css';

export default class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: null,
      socket: null,
      users: {},
      map: [[]],
      waiting: false,
      waitFor: null,
    };
  }

  componentDidMount() {
    axios.get('/user')
      .then(({ data }) => {
        if (data.username) {
          const { username } = data;
          const socket = io();

          document.addEventListener('keydown', this.handleKeydown.bind(this));

          this.setState({
            name: username,
            socket,
          });

          socket.emit('join lobby', { name: username });
          socket.on('lobby update', this.handleLobbyUpdate.bind(this));
          socket.on('lobby wait', this.handleLobbyWait.bind(this));
          socket.on('challenge request', this.handleLobbyChallenge.bind(this));
          socket.on('challenge start', this.handleLobbyToGame.bind(this));

        } else {
          this.props.history.replace('/login');
        }
      })
      .catch((error) => {
        console.log('Oh no! Are you logged in?');
      });
  }

  handleKeydown(event) {
    const { socket, map, name, users, waiting } = this.state;

    if (waiting) {
      console.log('You are waiting');
      return;
    }

    switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      socket.emit('lobby move', { dir: 'up' });
      break;

    case 'a':
    case 'arrowleft':
      socket.emit('lobby move', { dir: 'left' });
      break;

    case 's':
    case 'arrowdown':
      socket.emit('lobby move', { dir: 'down' });
      break;

    case 'd':
    case 'arrowright':
      socket.emit('lobby move', { dir: 'right' });
      break;

    case ' ':
    case 'j':
    case 'enter':
      let { position: [ r, c ], direction } = users[name];

      switch (direction) {
      case 'up': --r;
        break;
      case 'down': ++r;
        break;
      case 'left': --c;
        break;
      case 'right': ++c;
        break;
      }

      const target = map[r][c];

      if (target) {
        const { status } = users[target];

        if (status === 'available') {
          console.log('interacting with', target);
          socket.emit('lobby interact', { target });

        } else if (status === 'battling') {
          console.log('Cool! A battle!');
        }
      }
      break;
    }
  }

  handleLobbyChallenge({ from }) {
    // Auto-accept for now
    this.state.socket.emit('challenge accept', { from });
  }

  handleLobbyUpdate({ users, map }) {
    this.setState({ users, map });
  }

  handleLobbyWait(data) {
    this.setState({
      waiting: true,
      waitFor: data,
    });
  }

  handleGoHome() {
    axios('/welcome');
  }

  handleLogout() {
    console.log('handle logout');
    axios('/logout');
  }

  handleLobbyToGame({ gameId }) {
    this.props.history.replace(`/game/${gameId}`);
  }

  render() {
    const { users, map } = this.state;

    return (
      <div>
        <div className={css.navBar}>
          <div className={css.logo}>Chattermon</div>
          <div className={css.navBarLinksContainer}>
            <div className={css.navBarLink} onClick={this.handleGoHome}><Link to={'/login'} className={css.navBarLinkA}>Home</Link></div>
            <div className={css.navBarLink} onClick={this.handleLogout}><Link to={'/login'} className={css.navBarLinkA}>Logout</Link></div>
          </div>
        </div>

        <br />

        <div className={styles.lobby}>
          {map.map((row, rowId) => (
            <div key={rowId} className={styles.row}>
              {row.map((col, colId) => (
                <div key={colId} className={styles.grass}></div>
              ))}
            </div>
          ))}

          {Object.entries(users).map(([ name, data ]) => {
            const { position, direction } = data;
            const style = {
              left: position[1] * 48,
              top: position[0] * 48,
            };

            return (
              <Avatar name={name} style={style} direction={direction} />
            );
          })}
        </div>
      </div>
    );
  }
}
