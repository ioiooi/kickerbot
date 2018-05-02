const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const slack = require('../lib/slack');
const helper = require('../lib/helper');
const data = require('../data');

router.post('/', (req, res) => {
  const { text, user_id, channel_id } = req.body;
  data.push(req.body);
  const time = helper.createArrayOfMatches(text, 'time');
  const playerArray = [user_id, ...helper.createArrayOfMatches(text, 'user')];

  if (time.length > 0) {
    fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      body: JSON.stringify(createMessage(channel_id, time[0], playerArray)),
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
    })
      .then(res => res.json())
      .then(json => {
        data.push(json);
        const { channel, ts } = json;
        const message = {
          channel,
          user: user_id,
          attachments: [
            {
              fallback: 'Oops. That was not supposed to happen.',
              text: 'Delete your game',
              callback_id: 'kicker_delete',
              attachment_type: 'default',
              actions: [
                {
                  name: 'kicker_del',
                  text: 'delete',
                  type: 'button',
                  style: 'danger',
                  value: JSON.stringify({ channel, ts })
                }
              ]
            }
          ]
        };

        fetch('https://slack.com/api/chat.postEphemeral', {
          method: 'POST',
          body: JSON.stringify(message),
          headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
          }
        })
          .then(res => res.json())
          .then(json => data.push(json));
      })
      .catch(err => console.log(err));
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
