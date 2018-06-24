const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const { GameMap } = require('../rfctr/GameData');
const GameState = require('../rfctr/GameState');
const db = require('../database/index');

router.post('/', (req, res) => {
  const { callback_id } = JSON.parse(req.body['payload']);

  switch (callback_id) {
    case 'join': {
      console.log('join action');
      joinAction(req, res);
      break;
    }
    case 'leave': {
      console.log('leave action');
      leaveAction(req, res);
      break;
    }
    case 'invite': {
      console.log('invite action');
      inviteAction(req, res);
      break;
    }
    case 'delete': {
      console.log('delete action');
      deleteAction(req, res);
      break;
    }
    default:
      console.log('ACTION NOT FOUND');
      res.status(200).json({ text: 'action not found' });
      break;
  }
});

const joinAction = (req, res) => {
  const {
    actions: [{ value: gameId }],
    user: { id: userId }
  } = JSON.parse(req.body['payload']);
  const game = GameMap.get(gameId);
  const gameState = new GameState(game);

  if (helper.findStringInArray(game.getPlayers(), userId)) {
    res.status(200).end();

    return;
  }

  gameState.add(userId);
  gameState.send();

  db.update({
    Key: { gameId },
    UpdateExpression: 'add players :p',
    ExpressionAttributeValues: {
      ':p': db.docClient.createSet([userId])
    }
  });

  // send leaveMessage
  slackApi.postEphemeral(game.getChannel(), userId, {
    attachments: slack.leaveMessage(gameId)
  });

  res.status(200).end();
};

const leaveAction = (req, res) => {
  const {
    actions: [{ value: gameId }],
    user: { id: userId }
  } = JSON.parse(req.body['payload']);
  const game = GameMap.get(gameId);
  const gameState = new GameState(game);

  db.update({
    Key: { gameId },
    UpdateExpression: 'add #left :left delete players :left',
    ExpressionAttributeNames: { '#left': 'left' },
    ExpressionAttributeValues: {
      ':left': db.docClient.createSet([userId])
    }
  });

  gameState.remove(userId);
  gameState.send();
  // delete leaveMessage
  res.json({ delete_original: true });
};

const inviteAction = (req, res) => {
  const {
    actions: [
      {
        name: gameId,
        selected_options: [{ value }]
      }
    ],
    user: { id: userId }
  } = JSON.parse(req.body['payload']);
  // const gameId = helper.createArrayOfMatches('game', name)[0];
  const game = GameMap.get(gameId);

  if (helper.findStringInArray(game.getPlayers(), value)) {
    slackApi.postEphemeral(game.getChannel(), userId, {
      text: "This is why we can't have nice things :unamused:"
    });
    res.status(200).end();

    return;
  }

  db.update({
    Key: { gameId },
    UpdateExpression:
      'add invited :inv, players :inv',
    ExpressionAttributeValues: {
      ':inv': db.docClient.createSet([value])
    }
  });

  const gameState = new GameState(game);
  gameState.add(value);
  gameState.send();
  // send leaveMessage
  slackApi.postEphemeral(game.getChannel(), value, {
    attachments: slack.leaveMessage(gameId)
  });

  res.status(200).end();
};

const deleteAction = (req, res) => {
  const {
    actions: [{ value: gameId }]
  } = JSON.parse(req.body['payload']);
  const game = GameMap.get(gameId);

  slackApi.deleteMessage(game.getChannel(), game.getTimeStamp());

  db.update({
    Key: { gameId },
    UpdateExpression: 'set deleted = :d',
    ExpressionAttributeValues: {
      ':d': true
    }
  });
  // delete deleteMessage
  res.json({ delete_original: true });
};

module.exports = router;
