const { GameMap } = require('./GameData');
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');

const notifyPlayers = () => {
  setInterval(() => {
    for (let Game of GameMap.values()) {
      if (
        Game.getPlayers().length === 4 &&
        Game.getUTCTime() - 120000 <= Date.now() &&
        !Game.hasNotified()
      ) {
        Game.notify();
        for (let player of Game.getPlayers()) {
          slackApi.postEphemeral(Game.getChannel(), player, {
            text: slack.gameReadyNotificationMessage(player)
          });
        }
      }
    }
  }, 5000);
};

module.exports = notifyPlayers;
