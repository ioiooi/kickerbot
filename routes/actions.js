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
    if (helper.findStringInArray(game.getPlayers(), userId)) {
      res.status(200).end();
      return;
    }

    gameState.add(userId);
    gameState.send();
    // send leaveMessage
    slackApi.postEphemeral(channelId, userId, {
      attachments: slack.leaveMessage(gameId)
    });
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

module.exports = router;
