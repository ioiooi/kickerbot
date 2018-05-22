let GAME_ID = 1;

const GameMap = new Map();

class Game {
  constructor(channel = '', text = '', players = []) {
    this.id = GAME_ID++;
    this.channel = channel;
    this.text = text;
    this.players = players;
    this.ts = null;
    this.notified = false;
    this.setUTCTime(this._createUTCTime(text));
    GameMap.set(this.id, this);
  }

  getId() {
    return this.id;
  }

  getChannel() {
    return this.channel;
  }

  setTimeStamp(ts) {
    this.ts = ts;
  }

  getTimeStamp() {
    return this.ts;
  }

  setPlayers(players) {
    this.players = players;
  }

  getPlayers() {
    return this.players;
  }

  setText(text) {
    this.text = text;
    this._setUTCTime(text);
  }

  getText() {
    return this.text;
  }

  notify() {
    this.notified = true;
  }

  hasNotified() {
    return this.notified;
  }

  _createUTCTime(text) {
    if (text === 'asap') return 0;
    const hours = parseInt(text.slice(0, 2));
    const minutes = parseInt(text.slice(3, 5));

    return new Date().setHours(hours, minutes);
  }

  setUTCTime(date) {
    this.date = date;
  }

  getUTCTime() {
    return this.date;
  }
}

module.exports = {
  GameMap,
  Game
};
