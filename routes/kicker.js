const express = require('express');
const router = express.Router();
const slackApi = require('../lib/slackApi');
const { GameMap } = require('../rfctr/GameData');

router.get('/', async (req, res) => {
  const keys = [...GameMap.keys()].reverse();
  let gameId;

  for (let key of keys) {
    if (GameMap.get(key).getPlayers().length === 4) {
      gameId = key;
      break;
    }
  }

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
});

module.exports = router;
