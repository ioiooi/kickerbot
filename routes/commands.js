const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const { Game } = require('../rfctr/GameData');
const GameState = require('../rfctr/GameState');
const db = require('../database/index.js');

router.post('/', async (req, res) => {
  const { text, user_id, channel_id } = req.body;
  const time = helper.createArrayOfMatches('time', text)[0];
  const players = [user_id, ...helper.createArrayOfMatches('user', text)];

  if (!time.length) {
    res.json({ text: '`asap` or `HH:mm`' });

    return;
  }

  const game = new Game(channel_id, time, players);
  const gameState = new GameState(game);
  const slackResponse = await gameState.send();
  const { ts } = slackResponse;
  game.setTimeStamp(ts);

  db.put({
    gameId: game.getId(),
    channelId: channel_id,
    ts: parseFloat(ts),
    host: user_id,
    scheduledText: time,
    scheduledUnix: helper.createDate(time),
    players: db.docClient.createSet(players),
    createdAt: Math.floor(Date.now() / 1000)
  });

  // leave buttons
  for (let player of players) {
    slackApi.postEphemeral(channel_id, player, {
      attachments: slack.leaveMessage(game.getId())
    });
  }

  // game host - delete button
  slackApi.postEphemeral(channel_id, user_id, {
    attachments: slack.deleteGameMessage(game.getId())
  });

  res.status(200).end();
});

module.exports = router;
