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
    const message = createNewMessage(
      original_message,
      action,
      userId,
      channelId
    );
    const { ts } = original_message;
    slackApi
      .updateMessage(channelId, ts, message)
      .then(res => res.json())
      .then(json => {});
    res.status(200).end();
  } else if (callback_id === 'kicker_leave') {
    const { channel, ts, original_message } = JSON.parse(
      action.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    );
    const playerArray = getPlayerArray(original_message);
    const index = helper.findStringInArray(playerArray, userId);
    const time = helper.createArrayOfMatches(original_message.text, 'time');
    playerArray.splice(index, 1);

    const message = slack.createLookingForMoreMessage(
      `<!channel> kicker ${time[0]}?`,
      playerArray
    );

    slackApi
      .updateMessage(channel, ts, message)
      .then(res => res.json())
      .then(json => {});
    // res.json({ delete_original: true });
  } else if (callback_id === 'kicker_delete') {
    const { channel, ts } = JSON.parse(action);
    slackApi
      .deleteMessage(channel, ts)
      .then(res => res.json())
      .then(json => data.actionDeleteRes.push(json));
    res.json({ delete_original: true });
  }

  res.status(200).end();
});

const createNewMessage = (message, action, userId, channel) => {
  const playerArray = getPlayerArray(message);
  const index = helper.findStringInArray(playerArray, userId);
  const time = helper.createArrayOfMatches(message.text, 'time');

  // join game
  if (parseInt(action) === 0) {
    if (index !== -1) return message;
    // userId was not found
    playerArray.push(userId);
  }

  // leave game
  if (parseInt(action) === 1) {
    if (index === -1) return message;
    // userId was found
    playerArray.splice(index, 1);
  }

  if (playerArray.length < 4) {
    return slack.createLookingForMoreMessage(
      `<!channel> kicker ${time[0]}?`,
      playerArray
    );
  } else {
    notifyPlayers(channel, playerArray, message.text);
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
    for (let attachement of message.attachments) {
      for (let key in attachement) {
        if (key === 'fields') {
          for (let obj of attachement[key]) {
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
      }
    }
  }

  return playerArray;
};

const notifyPlayers = (channel, playerArray, text) => {
  setTimeout(() => {
    for (let player of playerArray) {
      slackApi
        .postEphemeral(channel, player, {
          text: slack.createGameReadyNotificationMessage(player)
        })
        .then(res => res.json())
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
