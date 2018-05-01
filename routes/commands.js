const express = require('express');
const router = express.Router();
const slack = require('../lib/slack');
const helper = require('../lib/helper');

router.post('/', (req, res) => {
  const { text, user_id } = req.body;
  const channelId = process.env.SLACK_KICKER_CHANNEL_ID;
  const time = helper.createArrayOfMatches(text, 'time');
  const playerArray = [user_id, ...helper.createArrayOfMatches(text, 'user')];

  if (time.length > 0) {
    res.json(createMessage(channelId, time[0], playerArray));
  } else {
    res.json({ text: '`asap` or `HH:mm`' });
  }

  res.status(200).end();
});

const createMessage = (channelId, time, playerArray) => {
  let attachments = slack.createLFMAttachment(playerArray);

  if (playerArray.length >= 4) {
    attachments = slack.createGameReadyAttachement(playerArray.slice(0, 4));
  }

  return {
    channel: channelId,
    response_type: 'in_channel',
    text: `<!channel> kicker ${time}?`,
    attachments
  };
};

module.exports = router;
