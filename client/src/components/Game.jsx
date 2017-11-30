import React, { Component } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Chat from './Chat.jsx';
import Terminal from './Terminal.jsx';
import GameView from './GameView.jsx';
import GameOverView from './GameOverView.jsx';
import GameState from './GameState.jsx';
import Logo from './Logo.jsx';
import css from '../styles.css';

import help from './../../../utils/helpers.js'

export default class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      player1: false,
      player2: false,
      messageArray: [],
      name: null,
      pokemon: [],
      opponent: null,
      isActive: null,
      attacking: false,
      gameOver: false,
      winner: null,
      chatInput: '',
      commandInput: '',
      commandArray: [{command: `The game will begin shortly - type 'help' to learn how to play`}],
      socket: null
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChatInputSubmit = this.handleChatInputSubmit.bind(this);
    this.handleCommands = this.handleCommands.bind(this);
  }

  socketHandlers() {
    return {
      handleChat: (message) => {
      var messageInstance = {
          name: message.name,
          text: message.text
        }
        this.setState(prevState => {
          return {
            messageArray: prevState.messageArray.concat(messageInstance)
          }
        })
      },
      playerInitialized: (data) => {
        this.setState({
          [data.player]: true,
          pokemon: data.pokemon
        });
      },
      handleReady: (data) => {
        if (this.state.player1) {
          this.setState({
            isActive: true,
            opponent: data.player2
          });
        } else {
          this.setState({
            isActive: false,
            opponent: data.player1
          });
        }
        this.setState({
          commandArray: [{command: 'Let the battle begin!'}]
        });
      },
      attackProcess: (data) => {
        this.setState(prevState => {
          return {
            commandArray: prevState.commandArray.concat(data.basicAttackDialog)
          }
        });
      },
      turnMove: (data) => {
        if (this.state.player1) {
          this.setState(prevState => {
            return {
              pokemon: data.player1.pokemon,
              opponent: data.player2,
              isActive: !prevState.isActive
            }
          });
        } else {
          this.setState(prevState => {
            return {
              pokemon: data.player2.pokemon,
              opponent: data.player1,
              isActive: !prevState.isActive
            }
          })
        }
      },
      gameOver: (data) => {
        // This method is triggered by the winner's last 'attack' command.
        // So, we can presume this player is the winner.

        // TODO: Save win-loss data in db
        // build a gameObj
        // use axios to do post request to /saveResults and send gameObj in body
        console.log('in socketHandlers - gameOver', data);
        console.log('this.state', this.state);
        console.log('this.props', this.props);

        this.setState({
          winner: data.name,
          gameOver: true,
          isActive: false
        }); 
        setTimeout(() => this.props.history.replace("/"), 20000); 
      },
      seppuku: (data) => {
        console.log('in socketHandlers - seppuku', data);
        console.log('this.state', this.state);
        console.log('this.props', this.props);

        this.setState({
          winner: this.state.opponent.name,
          gameOver: true,
          isActive: false
        }); 
        setTimeout(() => this.props.history.replace("/"), 20000); 
      }
    }
  }

  componentDidMount() {
    axios('/user')
      .then(({ data }) => {
        if (data.username) {
          const username = data.username;
          var socket = io();
          this.setState({
            name: username,
            socket
          })
          const playerInit = {
            gameid: this.props.match.params.gameid,
            name: username,
            pokemon: this.state.pokemon
          }
          socket.emit('join game', playerInit);
          socket.on('gamefull', message => alert(message)); 
          socket.on('chat message', this.socketHandlers().handleChat); 
          socket.on('player', this.socketHandlers().playerInitialized); 
          socket.on('ready', this.socketHandlers().handleReady); 
          socket.on('attack processed', this.socketHandlers().attackProcess); 
          socket.on('turn move', this.socketHandlers().turnMove);
          socket.on('gameover', this.socketHandlers().gameOver); 
          socket.on('seppuku', this.socketHandlers().seppuku); 
        }
        else {
          this.props.history.replace("/login");
        }
      })
  }

  handleInputChange(e, type) {
    // this if statement prevents the chat text area from expanding on submit (keyCode 13)
    if (e.target.value !== '\n') {
      this.setState({
        [type]: e.target.value
      });
    }
  }

  handleChatInputSubmit(e) {
    if (e.keyCode === 13) {
      var socket = io();
      this.state.socket.emit('chat message', {
        gameid: this.props.match.params.gameid, 
        name: this.state.name, 
        text: e.target.value
      });
      this.setState({
        chatInput: ''
      });
    }
  }

  commandHandlers() {
    return {
      help: () => {
        this.setState(prevState => {
          return {
            commandArray: prevState.commandArray.concat(help),
            commandInput: ''
          }
        })
      },
      attack: () => {
        this.state.socket.emit('attack', {
          gameid: this.props.match.params.gameid,
          name: this.state.name,
          pokemon: this.state.pokemon
        });
        this.setState({
            attacking: false
        });
      },
      choose: (pokemonToSwap) => {
        let isAvailable = false;
        let index;
        let health;
        this.state.pokemon.forEach((poke, i) => {
          if (poke.name === pokemonToSwap) {
            isAvailable = true;
            index = i;
            health = poke.health 
          }
        });
        if (isAvailable && health > 0) {
          this.state.socket.emit('switch', {
            gameid: this.props.match.params.gameid,
            pokemon: this.state.pokemon,
            index
          })
        } else if (health === 0) {
          alert('That pokemon has fainted!')
        } else {
          alert('You do not have that pokemon!');
        }
      },
      seppuku: () => {
        let opponentName = this.state.opponent.name;
        console.log('You surrendered. This person wins: ', opponentName);
        this.state.socket.emit('seppuku', {
          gameid: this.props.match.params.gameid,
          name: opponentName
        });
      }
    }
  }



  handleCommands(e) {
    if (e.keyCode !== 13) return;
    let value = e.target.value.toLowerCase(); 

    if (value === 'help') {
      return this.commandHandlers().help(); 
    }

    if (value === 'seppuku') {
      return this.commandHandlers().seppuku();
    }
    
    if (!this.state.isActive) {
      alert('it is not your turn!');
    } else {
      if (value === 'attack') {
        if (this.state.pokemon[0].health <= 0) {
          alert('you must choose a new pokemon, this one has fainted!');
        } else {
          this.setState({
            attacking: true
          })
          setTimeout(() => this.commandHandlers().attack(), 300);  
        }
      } else if (value.split(' ')[0] === "choose") {
        this.commandHandlers().choose(value.split(' ')[1]); 
      } else {
        alert('invalid input!')
      }
    }

    this.setState({
      commandInput: ''
    });
  
  }

  renderGame() {
    const { pokemon, opponent, winner, name, attacking } = this.state;
    if (!this.state.opponent) {
      return (
        <div className={css.loading}>
          <h1>Awaiting opponent...</h1>
        </div>
      )
    } else if (this.state.gameOver) {
      return <GameOverView pokemon={winner === name ? pokemon : opponent.pokemon} winner={winner} />
    } else {
      return <GameView opponent={opponent} pokemon={pokemon} attacking={attacking} />
    }
  }

  renderSideBar() {
    return (
      <div className={css.stateContainer}>
        <Logo name={this.state.name} isActive={this.state.isActive} opponent={this.state.opponent} />
        <GameState pokemon={this.state.pokemon} />
        <Chat messageArray={this.state.messageArray} chatInput={this.state.chatInput} handleChatInputSubmit={this.handleChatInputSubmit} handleInputChange={this.handleInputChange} /> 
      </div>
    );
  }


  render() {
    const { players, spectators, gameOver, pokemon } = this.state;
    return (
      <div className={css.gamePageContainer}>
        <div className={css.gameContainer}>
          {this.renderGame()}
          <Terminal commandArray={this.state.commandArray} commandInput={this.state.commandInput} handleCommands={this.handleCommands} handleInputChange={this.handleInputChange} />
        </div>
        {this.renderSideBar()}
      </div>
    )
  }
}

