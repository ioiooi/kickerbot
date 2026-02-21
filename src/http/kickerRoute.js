import { Router } from 'express';

/**
 * Creates the /kicker Express router.
 * GET / → returns email addresses of the latest full game's players.
 *
 * @param {import('../services/GameService.js').GameService} gameService
 * @param {(userId: string) => Promise<string>} getUserEmail
 * @returns {Router}
 */
export function createKickerRouter(gameService, getUserEmail) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const userIds = await gameService.getLatestFullGamePlayers();
      if (userIds.length === 0) {
        res.json([]);
        return;
      }
      const emails = await Promise.all(userIds.map(userId => getUserEmail(userId)));
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.json(emails);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
