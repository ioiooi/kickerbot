const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const data = require('../data');

router.post('/', (req, res) => {
  const { text, user_id, channel_id } = req.body;
  data.slashReq.push(req.body);
  const time = helper.createArrayOfMatches(text, 'time');
  const playerArray = [user_id, ...helper.createArrayOfMatches(text, 'user')];

  if (time.length > 0) {
    let message;
    if (playerArray.length < 4) {
      message = slack.createLookingForMoreMessage(
        `<!channel> kicker ${time[0]}?`,
        playerArray
      );
    } else {
      message = slack.createGameReadyMessage(
        `kicker ${time[0]}?`,
        playerArray.slice(0, 4)
      );
    }

    slackApi
      .postMessage(channel_id, message)
      .then(res => res.json())
      .then(json => {
        data.slashMessageRes.push(json);
        const { channel, ts } = json;

        slackApi
          .postEphemeral(channel, user_id, {
            attachments: slack.createDeleteGameMessage(channel, ts)
          })
          .then(res => res.json())
          .then(json => data.slashEphemeralRes.push(json));
      })
      .catch(err => console.log(err));
  } else {
    res.json({ text: '`asap` or `HH:mm`' });
  }

  res.status(200).end();
});

module.exports = router;
