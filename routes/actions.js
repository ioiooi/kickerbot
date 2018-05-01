const express = require('express');
const router = express.Router();
const slack = require('../lib/slack');
const helper = require('../lib/helper');

router.post('/', (req, res) => {
  // extract action value, user id and original message
  const {
    actions: [{ value: action }],
    user: { id: userId },
    original_message: message
  } = JSON.parse(req.body['payload']);
  updateMessage(message, action, userId);
  res.json(message);
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
