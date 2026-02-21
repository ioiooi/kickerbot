import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationService } from '../../src/services/NotificationService.js';
import { Game } from '../../src/domain/Game.js';
import { GameStatus } from '../../src/domain/GameStatus.js';

function makeFullGame({ scheduledUnix, notified = false }) {
  return new Game({
    channelId: 'C123',
    creatorId: 'U000',
    timeText: '14:30',
    scheduledUnix,
    players: ['U001', 'U002', 'U003', 'U004'],
    status: GameStatus.FULL,
    notified,
  });
}

describe('NotificationService', () => {
  let gameMap;
  let dmCalls;
  let sendDm;

  beforeEach(() => {
    gameMap = new Map();
    dmCalls = [];
    sendDm = async (userId, text) => dmCalls.push({ userId, text });
  });

  it('does not call sendDm for games not in notification window', async () => {
    const farFuture = Math.floor((Date.now() + 600_000) / 1000); // 10 min from now
    const game = makeFullGame({ scheduledUnix: farFuture });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();

    assert.equal(dmCalls.length, 0);
  });

  it('calls sendDm for each player of a game within the notification window', async () => {
    const nearFuture = Math.floor((Date.now() + 60_000) / 1000); // 1 min from now
    const game = makeFullGame({ scheduledUnix: nearFuture });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();

    assert.equal(dmCalls.length, 4, 'should DM all 4 players');
    const userIds = dmCalls.map(c => c.userId);
    assert.deepEqual(userIds.sort(), ['U001', 'U002', 'U003', 'U004'].sort());
  });

  it('does not call sendDm for already-notified games', async () => {
    const nearFuture = Math.floor((Date.now() + 60_000) / 1000);
    const game = makeFullGame({ scheduledUnix: nearFuture, notified: true });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();

    assert.equal(dmCalls.length, 0);
  });

  it('sets notified flag after sending', async () => {
    const nearFuture = Math.floor((Date.now() + 60_000) / 1000);
    const game = makeFullGame({ scheduledUnix: nearFuture });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();

    assert.equal(game.notified, true);
  });

  it('does not send twice on consecutive ticks', async () => {
    const nearFuture = Math.floor((Date.now() + 60_000) / 1000);
    const game = makeFullGame({ scheduledUnix: nearFuture });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();
    await service._tick();

    assert.equal(dmCalls.length, 4, 'should only notify once across two ticks');
  });

  it('does not call sendDm for asap games (scheduledUnix = 0)', async () => {
    const game = makeFullGame({ scheduledUnix: 0 });
    gameMap.set(game.gameId, game);

    const service = new NotificationService(gameMap, sendDm, 999_999);
    await service._tick();

    assert.equal(dmCalls.length, 0, 'asap games are not in notification window');
  });

  it('start and stop control the interval', () => {
    const service = new NotificationService(gameMap, sendDm, 999_999);
    service.start();
    // No error thrown — interval is running
    service.stop();
    // No error thrown — interval is cleared
    service.stop(); // idempotent
  });
});
