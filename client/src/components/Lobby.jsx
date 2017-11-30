import React, { Component, } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export default class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: null,
      socket: null,
    };
  }

  componentDidMount() {
    axios.get('/user')
      .then(({ data }) => {
        if (data.username) {
          const { username } = data;
          const socket = io();

          this.setState({
            name: username,
            socket
          });

          socket.emit('join lobby', { name: username });

        } else {
          this.props.history.replace("/login");
        }
      })
      .catch((error) => {
        console.log('Oh no! Are you sure you\'re logged in?');
      });
  }

  render() {
    return (
      <div>Hi</div>
    );
  }
}

