let GAME_ID = 100;

const GameMap = new Map();

class Game {
  constructor(channel = '', ts = 0, text = '', players = []) {
    this.id = GAME_ID++;
    this.channel = channel;
    this.ts = ts;
    this.text = text;
    this.players = players;
    // gameCreator, creationDate, scheduledTime, readyTime

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
  }

  getText() {
    return this.text;
  }
}

module.exports = {
  GameMap,
  Game
};
