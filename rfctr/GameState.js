const slackApi = require('../lib/slackApi');
const slackMessages = require('../lib/slackMessages');

module.exports = class GameState {
  constructor(Game) {
    if (Game.getPlayers().length < 4) {
      this.currentState = new LookingForMore(Game);
    } else {
      this.currentState = new GameReady(Game);
    }
  }

  setState(state) {
    this.currentState = state;
  }

  getState() {
    return this.currentState;
  }

  add(player) {
    this.currentState.add(this, player);
  }

  remove(player) {
    this.currentState.remove(this, player);
  }

  send() {
    return this.currentState.send();
  }
};

class LookingForMore {
  constructor(Game) {
    this.Game = Game;
  }

  add(context, player) {
    const players = this.Game.getPlayers();
    const index = players.findIndex(ele => ele === player);
    if (index >= 0) return;
    players.push(player);
    if (players.length === 4) {
      context.setState(new GameReady(this.Game));
    }
  }

  remove(context, player) {
    const players = this.Game.getPlayers();
    const index = players.findIndex(ele => ele === player);
    if (index < 0) return;
    players.splice(index, 1);
  }

  send() {
    const ts = this.Game.getTimeStamp();
    const gameId = this.Game.getId();
    const text = `<!channel> kicker ${this.Game.getText()}?`;

    if (!ts) {
      return slackApi.postMessage(
        this.Game.getChannel(),
        slackMessages.lookingForMoreMessage(
          text,
          this.Game.getPlayers(),
          gameId
        )
      );
    } else {
      return slackApi.updateMessage(
        this.Game.getChannel(),
        ts,
        slackMessages.lookingForMoreMessage(
          text,
          this.Game.getPlayers(),
          gameId
        )
      );
    }
  }
}

class GameReady {
  constructor(Game) {
    this.Game = Game;
  }

  add(context, player) {
    console.log('Cant add more players.');
    return;
  }

  remove(context, player) {
    const players = this.Game.getPlayers();
    const index = players.findIndex(ele => ele === player);
    players.splice(index, 1);
    context.setState(new LookingForMore(this.Game));
  }

  send() {
    const ts = this.Game.getTimeStamp();
    const text = `kicker ${this.Game.getText()}?`;

    if (!ts) {
      return slackApi.postMessage(
        this.Game.getChannel(),
        slackMessages.gameReadyMessage(text, this.Game.getPlayers())
      );
    } else {
      return slackApi.updateMessage(
        this.Game.getChannel(),
        ts,
        slackMessages.gameReadyMessage(text, this.Game.getPlayers())
      );
    }
  }

  _notifyPlayers() {}
}
