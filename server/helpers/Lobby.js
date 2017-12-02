const ROOM_CAPACITY = process.env.ROOM_CAPACITY || 6;
const ROOM_WIDTH = process.env.ROOM_WIDTH || 10;
const ROOM_HEIGHT = process.env.ROOM_HEIGHT || 10;

class Lobby {
  constructor(name) {
    this.name = name;
    this.users = {}; // key assumed to be string username
    this.ids = {}; // key assumed to be string socket id
    this.map = [...Array(ROOM_HEIGHT).keys()].map(i => Array(ROOM_WIDTH));
  }

  _spawnToMap(name) {
    for (let r = 0; r < this.map.length; ++r) {
      for (let c = 0; c < this.map[r].length; ++c) {
        if (!this.map[r][c]) {
          this.map[r][c] = name;
          return [r, c];
        }
      }
    }
  }

  addUser(name, id) {
    this.ids[id] = name;
    this.users[name] = {
      position: this._spawnToMap(name),
      direction: 'down',
      status: 'available',
    };
  }

  getUserById(id) {
    return this.ids[id];
  }

  getUserData() {
    return this.users;
  }

  getUserStatus(name) {
    if (this.users[name]) {
      return this.users[name].status;
    }
  }

  setUserStatus(name, status = 'available') {
    if (this.users[name] && new Set(['available', 'battling']).has(status)) {
      this.users[name].status = status;
    }
  }

  getIds() {
    return Object.keys(this.ids);
  }

  getLobbyName() {
    return this.name;
  }

  hasUser(name) {
    return !!this.users[name];
  }

  _move(name, rFrom, cFrom, rTo, cTo) {
    if (rTo >= 0 && rTo < ROOM_HEIGHT && cTo >= 0 && cTo < ROOM_WIDTH && !this.map[rTo][cTo]) {
      this.map[rTo][cTo] = this.map[rFrom][cFrom];
      this.map[rFrom][cFrom] = undefined;
      this.users[name].position = [rTo, cTo];
    }
  }

  move(id, dir) {
    const name = this.ids[id];

    if (!this.users[name] || !(new Set(['up', 'down', 'left', 'right']).has(dir))) {
      return;
    }

    const [ r, c ] = this.users[name].position;
    this.users[name].direction = dir;

    switch (dir) {
    case 'up':
      this._move(name, r, c, r - 1, c);
      break;

    case 'down':
      this._move(name, r, c, r + 1, c);
      break;

    case 'left':
      this._move(name, r, c, r, c - 1);
      break;

    case 'right':
      this._move(name, r, c, r, c + 1);
      break;
    }
  }

  removeUserById(id) {
    if (this.ids[id]) {
      const name = this.ids[id];
      const [ r, c ] = this.users[name].position;
      this.map[r][c] = undefined;
      delete this.users[name];
      delete this.ids[id];
    }
  }

  getMap() {
    return this.map;
  }

  isFull() {
    return !(Object.keys(this.users).length < ROOM_CAPACITY);
  }
}

module.exports = Lobby;
