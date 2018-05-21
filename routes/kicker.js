const express = require('express');
const router = express.Router();
const slackApi = require('../lib/slackApi');
const { GameMap } = require('../rfctr/GameData');

router.get('/', async (req, res, next) => {
  const keys = [...GameMap.keys()].reverse();
  let gameId;

  // search for the gameId of the latest full game
  for (let key of keys) {
    if (GameMap.get(key).getPlayers().length === 4) {
      gameId = key;
      break;
    }
  }

  // no full game was found
  if (!gameId) {
    res.status(404).json({ error: 'No Game with 4 Players found.' });
    return;
  }

  try {
    const promiseArray = GameMap.get(gameId)
      .getPlayers()
      .map(userId => slackApi.getUserInfo(userId));
    const userInfos = await Promise.all(promiseArray);
    const emails = userInfos.map(
      ({
        user: {
          profile: { email }
        }
      }) => email
    );

    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.json(emails);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
