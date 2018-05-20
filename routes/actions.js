const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const { GameMap } = require('../rfctr/GameData');
const GameState = require('../rfctr/GameState');

router.post('/', (req, res) => {
  const {
    callback_id,
    actions: [{ value: gameId }],
    user: { id: userId },
    channel: { id: channelId }
  } = JSON.parse(req.body['payload']);
  const game = GameMap.get(parseInt(gameId));
  const gameState = new GameState(game);

  if (callback_id === 'kicker_join') {
    gameState.add(userId);
    gameState.send();
    // send leaveMessage
    slackApi.postEphemeral(channelId, userId, slack.leaveMessage(gameId));
  } else if (callback_id === 'kicker_leave') {
    gameState.remove(userId);
    gameState.send();
    // delete leaveMessage
    res.json({ delete_original: true });
  } else if (callback_id === 'kicker_delete') {
    slackApi.deleteMessage(game.getChannel(), game.getTimeStamp());
    // delete deleteMessage
    res.json({ delete_original: true });
  }

  res.status(200).end();
});

const notifyPlayers = (channel, playerArray, text) => {
  setTimeout(() => {
    for (let player of playerArray) {
      slackApi
        .postEphemeral(channel, player, {
          text: slack.gameReadyNotificationMessage(player)
        })
        .then(json => {});
    }
  }, getTimeout(text));
};

const getTimeout = text => {
  const time = helper.createArrayOfMatches(text, 'time')[0];
  if (time === 'asap') return 0;
  const hours = parseInt(time.slice(0, 2));
  const minutes = parseInt(time.slice(3, 5));
  const date = new Date().setHours(hours, minutes);
  const now = Date.now();
  // 2 minutes before
  return date - now - 120000;
};

module.exports = router;
