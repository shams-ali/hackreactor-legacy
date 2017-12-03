// This line sets the environment variables, since we are on our local machines
// Therefore, in production (or whenever we are hosted on an actual server),
//   this line can be removed along with the .env file
require('dotenv') // same as const dotenv = require('dotenv');
  .config(); // we just want to call .config, not save
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Promise = require('bluebird');
const db = require('../database/db.js');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const saltRounds = 10;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const axios = require('axios');
const { createPokemon, createTurnlog, createPlayer } = require('./helpers/creators.js');
const { damageCalculation } = require('../game-logic.js');
const Lobby = require('./helpers/Lobby');

const dist = path.join(__dirname, '/../client/dist');



/* ======================== MIDDLEWARE ======================== */

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.static(dist));

app.use(cookieParser());
app.use(session({
  secret: 'odajs2iqw9asjxzascatsas22',
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());

// ** Webpack middleware **
// Note: Make sure while developing that bundle.js is NOT built - delete if it is in dist directory

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require('../webpack.config.js');
  const compiler = webpack(config);

  app.use(webpackHotMiddleware(compiler));
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPathdist
  }));
}

/* =============================================================== */


/* ======================== GAME STATE =========================== */

/* The state of all games currently happening are saved in the
'games' object.

The sample shape of a game is:

  {
    player1: object,
    player2: object,
    playerTurn: string ('player1' or 'player2')
  }

Refer to './helpers/creators.js' for more detail
on what is inside each player object

*/

const games = {};


/* =============================================================== */

// Lobbies can be created as more users join the server and exceed the room capacity
// Try to keep capacity even so everybody has someone to play with
const lobbies = {
  bulbasaur: new Lobby('bulbasaur'),
  charmander: new Lobby('charmander'),
  squirtle: new Lobby('squirtle'),
};

const lobbyUsers = {}; // Map sockets to lobbies
const socketUsers = {}; // Map users to sockets

const removeLobbyUsersById = (ids) => {
  for (let id of ids) {
    const lobby = lobbyUsers[id];

    if (lobby) {
      const name = lobby.getUserById(id);
      lobby.removeUserById(id);
      delete lobbyUsers[id];
      delete socketUsers[name];
    }
  }
};

/* =============================================================== */



/* =============== SOCKET CONNECTION / LOGIC ===================== */

io.on('connection', (socket) => {

  // Send new lobby state to all users
  const emitMap = (lobby) => {
    lobby.getIds().forEach((id) => {
      io.to(id).emit('lobby update', {
        users: lobby.getUserData(),
        map: lobby.getMap(),
      });
    });
  };

  /* socket.on('join lobby')
  When a user attempts to join lobby, the server will iterate through the array of lobbies and insert the user to the next available room. It can be extended such that when there are no available rooms, the server will generate a new room to put the user in.
   */

  socket.on('join lobby', ({ name }) => {
    for (let lobby of Object.values(lobbies)) {
      if (lobby.hasUser(name)) {
        lobby.changeUserId(name, socket.id);
        lobbyUsers[socket.id] = lobby;
        socketUsers[name] = socket.id;
        emitMap(lobby);
        break;

      } else if (!lobby.isFull()) {
        lobby.addUser(name, socket.id);
        lobbyUsers[socket.id] = lobby;
        socketUsers[name] = socket.id;
        emitMap(lobby);

        break;
      }
    }
  });

  socket.on('lobby move', ({ dir }) => {
    const lobby = lobbyUsers[socket.id];

    if (lobby) {
      lobby.move(socket.id, dir);
      emitMap(lobby);
    }
  });

  socket.on('lobby interact', ({ target }) => {
    const lobby = lobbyUsers[socket.id];

    // Checked on client-side but server should confirm availability
    if (lobby && lobby.getUserStatus(target) === 'available') {
      const targetId = socketUsers[target];

      // io.to(socket.id).emit('lobby wait', { type: 'challenge', target: target });
      lobby.setUserStatus(lobby.getUserById(socket.id, 'busy'));
      io.to(targetId).emit('challenge request', { from: lobby.getUserById(socket.id) });
    }
  });

  socket.on('challenge accept', ({ from }) => {
    const lobby = lobbyUsers[socket.id];
    const challenger = socketUsers[from];
    const opponent = lobby.getUserById(socket.id);
    const gameId = `${lobby.getLobbyName()}_${from}_VS_${opponent}_${Math.floor(Math.random() * 1000)}`.toUpperCase();

    lobby.setUserStatus(opponent, 'battling');
    lobby.setUserStatus(from, 'battling');
    io.to(challenger).emit('challenge start', { gameId });
    setTimeout(() => io.to(socket.id).emit('challenge start', { gameId }), 420);

    // Sample remove users from lobby
    removeLobbyUsersById([socket.id, challenger]);
  });

  /* socket.on('join game')

  The first check is to see if there is a game in the games object with this id, and if there is not, it initializes a new one with this new player.This means creating a new socket 'room' via socket.join() using the game's URL name. Once the player is created, update the game state and emit to player one ONLY that he / she is player1 by emitting directly to that socket id.

  If the game already exists but there is no player 2, it creates that player and first emits to that client directly that it is player2 as well as to the newly created room that the game is now ready, and it sends down the game's state to both clients to parse out and render.

  */

  socket.on('join game', (data) => {
    socket.join(data.gameid);
    if (!(data.gameid in games)) {
      createPlayer(data, 'player1')
        .then(player1 => {
          games[data.gameid] = {
            player1,
            player2: null,
            playerTurn: 'player1'
          };
          io.to(socket.id).emit('player', player1);
        });
    } else if (data.gameid in games && !games[data.gameid].player2) {
      createPlayer(data, 'player2')
        .then(player2 => {
          games[data.gameid].player2 = player2;
          io.to(socket.id).emit('player', player2);
          io.to(data.gameid).emit('ready', games[data.gameid]);
        });
    } else {
      io.to(socket.id).emit('gamefull', 'this game is full!');
    }
  });

  socket.on('chat message', (data) => {
    io.to(data.gameid).emit('chat message', data);
  });

  /* socket.on('attack') / socket.on('switch')

  These two functions both involve updating the game's state in some way and re-sending it back down to the client once it has been fully processed. Different events are emitted back to the client based on the state of the game, and can be extended to add more complexity into the game.

  */

  socket.on('attack', (data) => {
    const game = games[data.gameid];
    if (game !== undefined) { // Fixes runtime error
      // if the player loads a game page (Ex. '/game/NDMIB') without being logged in,
      // it throws a 'TypeError' when it tries to access a method on game (Ex. game.playerTurn)
      // which kills the server
      const player = game.playerTurn;
      const opponent = (game.playerTurn === 'player1') ? 'player2' : 'player1';
      const turnResults = damageCalculation(game[player], game[opponent]);
      game[opponent].pokemon[0].health -= turnResults.damageToBeDone;
      const turnlog = createTurnlog(game, turnResults, 'attack');
      io.to(data.gameid).emit('attack processed', {
        basicAttackDialog: turnlog
      });
      if (
        game[opponent].pokemon[0].health <= 0 &&
        game[opponent].pokemon[1].health <= 0 &&
        game[opponent].pokemon[2].health <= 0
      ) {
        game[opponent].pokemon[0].health = 0;
        io.to(data.gameid).emit('turn move', game);
        // Save game data
        let gameObj = {
          winner_name: game[player].name,
          winner_pokemon: game[player].pokemon,
          loser_name: game[opponent].name,
          loser_pokemon: game[opponent].pokemon
        };
        db.saveWinLoss(gameObj, function (err, response) {
          if (err) {
            console.log('Save game data error:', err);
          }
          // Emit 'gameover' after data has been saved so this lastest game appears in the Game History list immediately
          io.to(data.gameid).emit('gameover', { name: game[player].name });
        });
      } else if (game[opponent].pokemon[0].health <= 0) {
        game[opponent].pokemon[0].health = 0;
        game.playerTurn = opponent;
        io.to(data.gameid).emit('turn move', game);
      } else {
        game.playerTurn = opponent;
        io.to(data.gameid).emit('turn move', game);
      }
    }
  });

  socket.on('switch', data => {
    const game = games[data.gameid];
    const player = game.playerTurn;
    const opponent = game.playerTurn === 'player1' ? 'player2' : 'player1';
    game[player].pokemon.unshift(game[player].pokemon.splice(data.index, 1)[0]);
    const turnlog = createTurnlog(game, null, 'switch');
    game.playerTurn = opponent;
    io.to(data.gameid).emit('attack processed', {
      basicAttackDialog: turnlog
    });
    io.to(data.gameid).emit('turn move', game);
  });

  socket.on('seppuku', data => {
    // Save game data
    let gameObj = {
      winner_name: data.winner_name,
      winner_pokemon: data.winner_pokemon,
      loser_name: data.loser_name,
      loser_pokemon: data.loser_pokemon
    };
    db.saveWinLoss(gameObj, function (err, response) {
      if (err) {
        console.log('Save game data error:', err);
      }
      // Emit 'gameover' after data has been saved so this lastest game appears in the Game History list immediately
      io.to(data.gameid).emit('gameover', { name: data.winner_name });
    });
  });

});

/* =============================================================== */


/* =============== AUTHENTICATION ROUTES / LOGIC ================= */


app.post('/login', (req, resp) => {
  const username = req.body.username;
  const password = req.body.password;

  db.Users.findOne({
    // make the username search case INsensitive
    where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('username')), username.toLowerCase())
  })
    .then(user => {
      // finds user
      // not found => end resp
      // found => compare passwords
      // don't match => end resp
      // login

      // TODO: FIX THE BELOW ERROR
      //   If the then's if statement (!passwordsMatch) is true
      //   then the server will try to RE-send the header
      //   (assuming that (!user) is also true)
      //   It should only send either 1 or the other
      //   OR wait until it has all of the scenarios accounted for,
      //     then send everything at the end, all at once

      if (!user) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Username Not Found');
      } else {
        const hash = user.dataValues.password;
        return bcrypt.compare(password, hash);
      }
    })
    .then(passwordsMatch => {
      if (!passwordsMatch) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Passwords Do Not Match');
      } else {
        req.session.username = username;
        req.session.loggedIn = true;
        resp.redirect('/welcome');
      }
    });
});

app.post('/signup', (req, resp) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  bcrypt.hash(password, saltRounds)
    .then(hash => db.saveUser(username, hash, email))
    .then(newuser => {
      if (newuser.dataValues) {
        req.login({ user_id: newuser.id }, err => {
          if (err) { throw err; }
          req.session.username = username;
          req.session.loggedIn = true;
          let session = JSON.stringify(req.session);
          resp.writeHead(201, { 'Content-Type': 'app/json' });
          resp.end(session);
        });
      } else if (newuser.match('Username Already Exists')) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Username Already Exists');
      } else if (newuser.match('Email Already Exists')) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Email Already Exists');
      }
    })
    .catch(err => {
      throw new Error(err);
    });
});

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get('/user', (req, resp) => {
  resp.end(JSON.stringify({
    username: req.session.username,
    loggedIn: req.session.loggedIn
  }));
});

app.get('/logout', (req, resp) => {
  req.session.destroy(err => {
    if (err) { throw err; }
    resp.redirect('/login');
  });
});

/* =============================================================== */

/* =============== WIN / LOSS RESULTS ================= */

app.get('/seriesRecord', (req, resp) => {
  db.getSeriesRecord(req.query.playerName, req.query.opponentName, function (err, data) {
    if (err) {
      resp.status(404).send(err);
    }
    resp.status(200).send(JSON.stringify(data));
  });  
});

app.get('/gameHistory', (req, resp) => {
  db.getWinLoss(req.query.playerName, function (err, data) {
    if (err) {
      resp.status(404).send(err);
    }
    resp.status(200).send(JSON.stringify(data));
  });
});

app.post('/saveResults', (req, resp) => {
  db.saveWinLoss(req.body, function (err, data) {
    if (err) {
      resp.status(500).send(err);
    }
    resp.status(201).send(JSON.stringify(data));
  });
});


/* =============================================================== */

// a catch-all route for BrowserRouter - enables direct linking to this point.

app.get('/*', (req, resp) => {
  resp.sendFile(dist + '/index.html');
});


var port = process.env.PORT || 3000;
http.listen(port, function () {
  console.log('listening on *:' + port);
});

module.exports = app;
