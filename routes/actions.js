const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const slack = require('../lib/slack');
const helper = require('../lib/helper');
const data = require('../data');

router.post('/', (req, res) => {
  // extract action value, user id and original message
  const {
    actions: [{ value: action }],
    callback_id,
    user: { id: userId },
    original_message: message
  } = JSON.parse(req.body['payload']);
  data.push(JSON.parse(req.body['payload']));

  switch (callback_id) {
    case 'kicker_game':
      updateMessage(message, action, userId);
      res.json(message);
      break;
    case 'kicker_delete':
      // actions.value is already stringified - delete kicker_game
      fetch('https://slack.com/api/chat.delete', {
        method: 'POST',
        body: action,
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
        }
      })
        .then(res => res.json())
        .then(json => data.push(json));
      res.status(200).end();
      break;
    default:
      res.status(200).end();
      break;
  }
});

const updateMessage = (message, action, userId) => {
  let playerArray = [];
  // lookingForMore- OR gameReadyAttachment
  if (message.attachments[0].fields.length <= 1) {
    playerArray = [
      ...helper.createArrayOfMatches(
        message.attachments[0].fields[0].value,
        'user'
      )
    ];
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

  const index = helper.findStringInArray(playerArray, userId);
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

  playerArray.length === 4
    ? (message.attachments = slack.createGameReadyAttachement(playerArray))
    : (message.attachments = slack.createLFMAttachment(playerArray));
};

module.exports = router;
