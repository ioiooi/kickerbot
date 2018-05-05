const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const data = require('../data');

router.post('/', (req, res) => {
  // extract action value, callback_id, userId, channelId and original_message
  const {
    actions: [{ value: action }],
    callback_id,
    user: { id: userId },
    channel: { id: channelId },
    original_message
  } = JSON.parse(req.body['payload']);
  data.actionReq.push(JSON.parse(req.body['payload']));

  if (callback_id === 'kicker_game') {
    const message = createNewMessage(original_message, action, userId);
    const { ts } = original_message;
    slackApi
      .updateMessage(channelId, ts, message)
      .then(res => res.json())
      .then(json => console.log(json));
    res.status(200).end();
  } else if (callback_id === 'kicker_delete') {
    const { channel, ts } = JSON.parse(action);
    slackApi
      .deleteMessage(channel, ts)
      .then(res => res.json())
      .then(json => data.actionDeleteRes.push(json));
    res.status(200).end();
  }

  res.status(200).end();
});

const createNewMessage = (message, action, userId) => {
  const playerArray = getPlayerArray(message);
  const index = helper.findStringInArray(playerArray, userId);
  const time = helper.createArrayOfMatches(message.text, 'time');

  // join game
  if (parseInt(action) === 0) {
    if (index !== -1) return;
    // userId was not found
    playerArray.push(userId);
  }

  // leave game
  if (parseInt(action) === 1) {
    if (index === -1) return;
    // userId was found
    playerArray.splice(index, 1);
  }

  if (playerArray.length < 4) {
    return slack.createLookingForMoreMessage(
      `<!channel> kicker ${time[0]}?`,
      playerArray
    );
  } else {
    return slack.createGameReadyMessage(
      `<!channel> kicker ${time[0]}?`,
      playerArray
    );
  }
};

const getPlayerArray = message => {
  let playerArray = [];
  // lookingForMoreMessage
  if (message.attachments[0].fields.length <= 1) {
    playerArray = [
      ...helper.createArrayOfMatches(
        message.attachments[0].fields[0].value,
        'user'
      )
    ];
    // gameReadyMessage
  } else {
    for (let obj of message.attachments[0].fields) {
      for (let key in obj) {
        if (key === 'value') {
          playerArray = [
            ...playerArray,
            ...helper.createArrayOfMatches(obj[key], 'user')
          ];
        }
      }
    }
  }

  return playerArray;
};

module.exports = router;
