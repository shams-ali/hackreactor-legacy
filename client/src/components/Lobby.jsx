import React, { Component, } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

import styles from '../lobby.css';

export default class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: null,
      socket: null,
      users: {},
      map: [[]],
    };
  }

  componentDidMount() {
    axios.get('/user')
      .then(({ data }) => {
        if (data.username) {
          const { username } = data;
          const socket = io();

          // socket must be assigned before handleKeydown is useful
          document.addEventListener('keydown', this.handleKeydown.bind(this));

          this.setState({
            name: username,
            socket,
          });

          socket.emit('join lobby', { name: username });
          socket.on('lobby update', this.handleUpdateLobby.bind(this));

        } else {
          this.props.history.replace('/login');
        }
      })
      .catch((error) => {
        console.log('Oh no! Are you logged in?');
      });
  }

  handleKeydown(event) {
    const { socket, map, name, users } = this.state;

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

      if (direction === 'up') {
        --r;
      } else if (direction === 'down') {
        ++r;
      } else if (direction === 'left') {
        --c;
      } else if (direction === 'right') {
        ++c;
      }

      const target = map[r][c];
      if (target) {
        console.log('interacting with', target);
        socket.emit('lobby interact', { target });
      }
      break;
    }
  }

  // TODO: separate lobby, user and map updates
  handleUpdateLobby({ users, map }) {
    this.setState({ users, map });
  }

  render() {
    const { users, map } = this.state;

    return (
      <div>
        {map.map((row, rowId) => (
          <div key={rowId} className={styles.row}>
            {row.map((col, colId) => {
              return (
                <div key={colId} className={styles.grass}></div>
              );
            })}
          </div>
        ))}

        {Object.entries(users).map(([ name, data ]) => {
          const { position, direction } = data;
          const style = {
            position: 'absolute',
            left: position[1] * 34,
            top: position[0] * 32,
          };

          return <div key={name} className={styles[`player-${direction}`]} style={style}></div>;
        })}
      </div>
    );
  }
}
