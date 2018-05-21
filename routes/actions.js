const express = require('express');
const router = express.Router();
const slack = require('../lib/slackMessages');
const slackApi = require('../lib/slackApi');
const helper = require('../lib/helper');
const { GameMap } = require('../rfctr/GameData');
const GameState = require('../rfctr/GameState');

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
  const game = GameMap.get(parseInt(gameId));
  const gameState = new GameState(game);

  if (helper.findStringInArray(game.getPlayers(), userId)) {
    res.status(200).end();

    return;
  }

  gameState.add(userId);
  gameState.send();
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
  const game = GameMap.get(parseInt(gameId));
  const gameState = new GameState(game);

  gameState.remove(userId);
  gameState.send();
  // delete leaveMessage
  res.json({ delete_original: true });
};

const inviteAction = (req, res) => {
  const {
    actions: [
      {
        name,
        selected_options: [{ value }]
      }
    ],
    user: { id: userId }
  } = JSON.parse(req.body['payload']);
  const gameId = helper.createArrayOfMatches('game', name)[0];
  const game = GameMap.get(parseInt(gameId));

  if (helper.findStringInArray(game.getPlayers(), value)) {
    slackApi.postEphemeral(game.getChannel(), userId, {
      text: "This is why we can't have nice things :unamused:"
    });
    res.status(200).end();

    return;
  }

  const gameState = new GameState(game);
  gameState.add(value);
  gameState.send();

  res.status(200).end();
};

const deleteAction = (req, res) => {
  const {
    actions: [{ value: gameId }]
  } = JSON.parse(req.body['payload']);
  const game = GameMap.get(parseInt(gameId));

  slackApi.deleteMessage(game.getChannel(), game.getTimeStamp());
  // delete deleteMessage
  res.json({ delete_original: true });
};

module.exports = router;
