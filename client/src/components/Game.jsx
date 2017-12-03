import React, { Component } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Home from './Home.jsx';
import Login from './Login.jsx';
import Chat from './Chat.jsx';
import Terminal from './Terminal.jsx';
import GameView from './GameView.jsx';
import GameHistory from './GameHistory.jsx';
import GameOverView from './GameOverView.jsx';
import GameState from './GameState.jsx';
import Logo from './Logo.jsx';
import css from '../styles.css';

import help from './../../../utils/helpers.js';

import { commandHistory } from './../../../utils/commandHistory.js';

// A helper function for terminal commands, to return true if the source contains the target string
//   Ex. source -> 'attack' contains the targets -> 'a', 'at', 'att', 'atta', 'attac', and 'attack'
//   Ex. source -> 'attack' does NOT contain the targets -> 'h', 'he', 'hel', or 'help'
//   Ex. source -> 'help' does NOT contain the targets -> 'c', 'ch', 'cho', 'choo', 'choos', or 'choose'
const matcher = (target, source) => {
  if (target.length < 1) { // if the target is an empty string, don't bother searching
    return false;
  } else if (target.length > source.length) { // if the target is longer than the source, it's not a match
    return false;
  }

  // search from the beginning of the source
  //   Ex. Scenario: Pokemon array -> ['wigglytuff', 'charzard', 'farfetched']
  //     This stops the command 'choose f' from selecting wigglytuff
  //     Presumably, in this instance the user would prefer to get their farfetchd instead
  return new RegExp(target).test(source.slice(0, (target.length + 1)));
};

// A helper function that returns an array of possible matches of pokemon to a string
// The input string is just the potential match of the name itself, not the command
//   Ex. value = 'pika', not value = 'choose pika'
const getTeamMatches = (team, value) => {
  // handle choosing pokemon here
  const teamMatches = [];

  // check every member of the team for a match
  for (let i = 0; i < team.length; i++) {
    if (matcher(value, team[i].name)) {
      teamMatches.push(team[i].name);
    }
  }

  return teamMatches;
};

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
      commandArray: [{ command: 'The game will begin shortly - type \'help\' to learn how to play' }],
      socket: null,
      showGameHistory: false,
      gameHistoryData: [],
      numWins: 0,
      numOpponentWins: 0
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleChatInputSubmit = this.handleChatInputSubmit.bind(this);
    this.handleCommands = this.handleCommands.bind(this);
    this.getGameHistory = this.getGameHistory.bind(this);
    this.toggleGameHistory = this.toggleGameHistory.bind(this);
    this.getSeriesRecord = this.getSeriesRecord.bind(this);

    // keeps track of the user's terminal commands for easy future use with Up/Down arrow keys
    this.commandList = new commandHistory();
  }

  socketHandlers() {
    return {
      handleChat: (message) => {
        var messageInstance = {
          name: message.name,
          text: message.text
        };
        this.setState(prevState => {
          return {
            messageArray: prevState.messageArray.concat(messageInstance)
          };
        });
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
        this.getSeriesRecord();
        this.setState({
          commandArray: [{ command: 'Let the battle begin!' }]
        });
      },
      attackProcess: (data) => {
        this.setState(prevState => {
          return {
            commandArray: prevState.commandArray.concat('\n').concat(data.basicAttackDialog)
          };
        });
      },
      turnMove: (data) => {
        if (this.state.player1) {
          this.setState(prevState => {
            return {
              pokemon: data.player1.pokemon,
              opponent: data.player2,
              isActive: !prevState.isActive
            };
          });
        } else {
          this.setState(prevState => {
            return {
              pokemon: data.player2.pokemon,
              opponent: data.player1,
              isActive: !prevState.isActive
            };
          });
        }
      },
      gameOver: (data) => {
        this.getGameHistory();
        this.getSeriesRecord();
        this.setState({
          winner: data.name,
          gameOver: true,
          isActive: false
        });
        // 30 seconds
        setTimeout(() => this.props.history.replace('/'), 30000);
      }
    };
  }

  getSeriesRecord() {
    // Get number of this player's wins against opponent
    axios(`/seriesRecord?playerName=${this.state.name}&opponentName=${this.state.opponent.name}`)
      .then((numWins) => {
        this.setState({ 
          numWins: numWins.data[0].playerName_wins,
        });
      })
      .catch((error) => {
        console.log('Error getting series record data:', error);
      });

    // Get number of this opponent's wins against this player
    axios(`/seriesRecord?playerName=${this.state.opponent.name}&opponentName=${this.state.name}`)
      .then((numWins) => {
        this.setState({ 
          numOpponentWins: numWins.data[0].playerName_wins
        });
      })
      .catch((error) => {
        console.log('Error getting series record data:', error);
      });
  }

  getGameHistory(playerName = this.state.name) {
    axios(`/gameHistory?playerName=${playerName}`)
      .then((gameHistoryData) => {
        this.setState({ gameHistoryData: gameHistoryData.data });
      })
      .catch((error) => {
        console.log('Error getting Game History:', error);
      });
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
          });
          this.getGameHistory(data.username);
          const playerInit = {
            gameid: this.props.match.params.gameid,
            name: username,
            pokemon: this.state.pokemon
          };
          socket.emit('join game', playerInit);
          socket.on('gamefull', message => alert(message));
          socket.on('chat message', this.socketHandlers().handleChat);
          socket.on('player', this.socketHandlers().playerInitialized);
          socket.on('ready', this.socketHandlers().handleReady);
          socket.on('attack processed', this.socketHandlers().attackProcess);
          socket.on('turn move', this.socketHandlers().turnMove);
          socket.on('gameover', this.socketHandlers().gameOver);
          socket.on('seppuku', this.socketHandlers().seppuku);
        } else {
          this.props.history.replace('/login');
        }
      })
      .then(() => {
        // Set the focus to be on the terminal input
        const areas = document.getElementsByTagName('textArea')[0].focus();
      });
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
        // add the command to the user's command list history
        this.commandList.addCommand('help');

        this.setState(prevState => {
          return {
            commandArray: prevState.commandArray.concat('\n').concat(help),
            commandInput: ''
          };
        });
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
        // add the command to the user's command list history
        this.commandList.addCommand('choose ' + pokemonToSwap);

        let isAvailable = false;
        let index;
        let health;
        this.state.pokemon.forEach((poke, i) => {
          if (poke.name === pokemonToSwap) {
            isAvailable = true;
            index = i;
            health = poke.health;
          }
        });
        if (isAvailable && health > 0) {
          this.state.socket.emit('switch', {
            gameid: this.props.match.params.gameid,
            pokemon: this.state.pokemon,
            index
          });
        } else if (health === 0) {
          alert('That pokemon has fainted!');
        } else {
          alert('You do not have that pokemon!');
        }
      },
      seppuku: () => {
        // set terminal input to be an empty string
        this.setState({
          'commandInput': ''
        });

        this.state.socket.emit('seppuku', {
          gameid: this.props.match.params.gameid,
          winner_name: this.state.opponent.name,
          winner_pokemon: this.state.opponent.pokemon,
          loser_name: this.state.name,
          loser_pokemon: this.state.pokemon
        });
      },
      nextCommand: () => {
        let newInputText; // declare here, due to scope
        if (this.state.commandInput === '') { // if the current terminal input text is ''
          const command = this.commandList.getRecentCommand();
          // then ensure that the new terminal input text is NOT ''
          newInputText = (command !== '') ? command : this.commandList.getRecentCommand();
        } else {
          newInputText = this.commandList.getRecentCommand();
        }

        // set the new terminal input text
        this.setState({
          'commandInput': newInputText
        });

        // Move the cursor to the end of the text input when an old command is brought up
        // Have to use setTimeout to ensure that this occurs after the commandInput text is set by React
        setTimeout(() => {
          const textArea = document.getElementsByTagName('textArea')[0];
          textArea.selectionStart = textArea.selectionEnd = this.state.commandInput.length;
        }, 0);
      },
      prevCommand: () => {
        // since this is triggered by the down arrow key the cursor is already at the end of the text input

        let newInputText; // declare here, due to scope
        if (this.state.commandInput === '') { // if the current terminal input text is ''
          const command = this.commandList.getOldCommand();
          // then ensure that the new terminal input text is NOT ''
          newInputText = (command !== '') ? command : this.commandList.getOldCommand();
        } else {
          newInputText = this.commandList.getOldCommand();
        }

        // set the new terminal input text
        this.setState({
          'commandInput': newInputText
        });
      }
    };
  }

  handleCommands(e) {
    let value = e.target.value.toLowerCase();

    if (e.keyCode === 38) { // UP ARROW KEY
      // replace current terminal input with value from command history
      return this.commandHandlers().nextCommand();
    } else if (e.keyCode === 40) { // DOWN ARROW KEY
      // replace current terminal input with value from command history
      return this.commandHandlers().prevCommand();
    } else if (e.keyCode === 9) { // TAB KEY
      // stop the tap keypress from changing the focus
      e.preventDefault();

      // check the terminal input for values to autocomplete
      if (matcher(value, 'help')) {
        this.setState({
          'commandInput': 'help'
        });
      } else if (matcher(value, 'seppuku')) {
        this.setState({
          'commandInput': 'seppuku'
        });
      } else if (matcher(value, 'attack')) {
        this.setState({
          'commandInput': 'attack'
        });
      } else if (matcher(value.split(' ')[0], 'choose')) {
        if (value.split(' ').length > 1) { // if they also have a pokemon name started
          this.setState({
            'commandInput': 'choose ' + getTeamMatches(this.state.pokemon, value.split(' ')[1])[0]
          });
        } else { // just the command 'choose'
          this.setState({
            'commandInput': 'choose'
          });
        }
      } else {
        // there is no matching command, so there's nothing to autocomplete
      }
    }

    if (e.keyCode !== 13) { // If the user did NOT hit the 'enter' key, just return undefined
      return undefined;
    }

    if (matcher(value, 'help')) {
      return this.commandHandlers().help();
    }

    if (matcher(value, 'seppuku')) {
      return this.commandHandlers().seppuku();
    }

    if (!this.state.isActive) {
      alert('it is not your turn!');
    } else {
      if (matcher(value, 'attack')) {
        if (this.state.pokemon[0].health <= 0) {
          alert('you must choose a new pokemon, this one has fainted!');
        } else {
          // add the command to the user's command list history
          this.commandList.addCommand('attack');

          this.setState({
            attacking: true
          });
          setTimeout(() => this.commandHandlers().attack(), 300);
        }
      } else if (matcher(value.split(' ')[0], 'choose')) {
        // handle choosing pokemon here
        const teamMatches = getTeamMatches(this.state.pokemon, value.split(' ')[1]);

        if (this.state.pokemon[0].name === teamMatches[0]) {
          // The user is trying to choose their current pokemon, don't allow that
          this.setState(prevState => {
            return {
              commandArray: prevState.commandArray.concat('\n').concat([{ command: 'This Pokemon is already chosen!' }]),
              commandInput: ''
            };
          });
        } else {
          // use the first match found
          this.commandHandlers().choose(teamMatches[0]);
        }
      } else {
        alert('invalid input!');
      }
    }

    this.setState({
      commandInput: ''
    });

  }

  renderGame() {
    const { gameOver, pokemon, opponent, winner, name, attacking } = this.state;
    if (!this.state.opponent) {
      return (
        <div className={css.loading}>
          <h1>Awaiting opponent...</h1>
        </div>
      );
    } else if (this.state.gameOver) {
      return <GameOverView pokemon={winner === name ? pokemon : opponent.pokemon} winner={winner} toggleGameHistory={this.toggleGameHistory} gameOver={gameOver} />;
    } else {
      return <GameView opponent={opponent} pokemon={pokemon} attacking={attacking} />;
    }
  }

  renderSideBar() {
    return (
      <div className={css.stateContainer}>
        <Logo name={this.state.name} isActive={this.state.isActive} opponent={this.state.opponent} toggleGameHistory={this.toggleGameHistory} numWins={this.state.numWins} numOpponentWins={this.state.numOpponentWins} />
        <GameState pokemon={this.state.pokemon} />
        <Chat messageArray={this.state.messageArray} chatInput={this.state.chatInput} handleChatInputSubmit={this.handleChatInputSubmit} handleInputChange={this.handleInputChange} />
      </div>
    );
  }

  renderGameHistory() {
    if (this.state.showGameHistory) {
      return (
        <GameHistory name={this.state.name} gameHistoryData={this.state.gameHistoryData} toggleGameHistory={this.toggleGameHistory} />
      );
    }
  }

  toggleGameHistory() {
    this.setState({ showGameHistory: !this.state.showGameHistory });
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
        {this.renderGameHistory()}
      </div>
    );
  }
}
