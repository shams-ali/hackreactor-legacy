const ROOM_CAPACITY = process.env.ROOM_CAPACITY || 6;
const ROOM_WIDTH = process.env.ROOM_WIDTH || 10;
const ROOM_HEIGHT = process.env.ROOM_HEIGHT || 10;

class Lobby {
  constructor(name) {
    this.name = name;
    this.users = {};
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
    this.users[name] = {
      id,
      position: this._spawnToMap(name),
      direction: 'down',
    };
  }

  hasUser(name) {
    return !!this.users[name];
  }

  move(name, dir) {
    if (!this.users[name] || !Set(['up', 'down', 'left', 'right']).has(dir)) {
      return;
    }

    this.users[name].direction = dir;

    switch (dir) {
    case 'up':
      // TODO: collision check, move
      break;
    case 'down':
      // TODO: collision check, move
      break;
    case 'left':
      // TODO: collision check, move
      break;
    case 'right':
      // TODO: collision check, move
      break;
    }
  }

  removeUser(name) {
    if (this.users[name]) {
      const [ r, c ] = this.users[name].position;
      this.map[r][c] = undefined;
      delete this.users[name];
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
