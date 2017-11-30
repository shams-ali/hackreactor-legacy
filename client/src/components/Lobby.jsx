import React, { Component, } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: null,
      socket: null,
      lobby: null,
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
    const { socket, lobby } = this.state;

    switch (event.key.toLowerCase()) {
    case 'w':
      socket.emit('lobby move', { lobby: lobby, dir: 'up' });
      break;
    case 'a':
      socket.emit('lobby move', { lobby: lobby, dir: 'left' });
      break;
    case 's':
      socket.emit('lobby move', { lobby: lobby, dir: 'down' });
      break;
    case 'd':
      socket.emit('lobby move', { lobby: lobby, dir: 'right' });
      break;
    }
  }

  handleUpdateLobby({ lobby, users, map }) {
    // TODO: separate user and map updates
    this.setState({ lobby, users, map });
  }

  render() {
    const { users, map } = this.state;
    return (
      <div>
        <table>
          { // TODO: table should be replaced with something pretty
            map.map((row, rowId) => (
              <tr key={rowId}>
                {
                  row.map((col, colId) => (
                    <td key={colId}>{(col) ? '11' : '00'}</td>
                  ))
                }
              </tr>
            ))
          }
        </table>
      </div>
    );
  }
}
