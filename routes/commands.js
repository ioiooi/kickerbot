const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const data = require('../data');

router.post('/', async (req, res) => {
  const { text, user_id, channel_id } = req.body;
  data.slashReq.push(req.body);
  const time = helper.createArrayOfMatches(text, 'time');
  const players = [user_id, ...helper.createArrayOfMatches(text, 'user')];

  if (!time.length) {
    res.json({ text: '`asap` or `HH:mm`' });

    return;
  }

  const game = slack.lfmOrGameReady(time[0], players);

  const gameMessageRes = await slackApi.postMessage(channel_id, game);
  const { channel, ts, message } = gameMessageRes;

  for (let player of players) {
    // leave button
    slackApi
      .postEphemeral(channel, player, {
        attachments: slack.leaveMessage(channel, ts, message)
      })
      .then(json => {});
  }

  // delete button
  slackApi
    .postEphemeral(channel, user_id, {
      attachments: slack.deleteGameMessage(channel, ts)
    })
    .then(json => data.slashEphemeralRes.push(json));

  res.status(200).end();
});

module.exports = router;
