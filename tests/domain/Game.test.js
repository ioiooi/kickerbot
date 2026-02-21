import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../../src/domain/Game.js';
import { GameStatus } from '../../src/domain/GameStatus.js';

function makeGame(overrides = {}) {
  return new Game({
    channelId: 'C123',
    creatorId: 'U000',
    timeText: '14:30',
    scheduledUnix: Math.floor(new Date().setHours(14, 30, 0, 0) / 1000),
    players: ['U001'],
    ...overrides,
  });
}

describe('Game', () => {
  it('creates a game with correct fields', () => {
    const game = makeGame();
    assert.equal(game.channelId, 'C123');
    assert.equal(game.creatorId, 'U000');
    assert.equal(game.timeText, '14:30');
    assert.equal(game.status, GameStatus.OPEN);
    assert.ok(game.gameId, 'gameId should be set');
    assert.deepEqual(game.players, ['U001']);
    assert.equal(game.notified, false);
    assert.equal(game.ts, null);
  });

  it('addPlayer returns false for duplicate', () => {
    const game = makeGame({ players: ['U001'] });
    assert.equal(game.addPlayer('U001'), false);
    assert.equal(game.players.length, 1);
  });

  it('addPlayer returns false when game is FULL', () => {
    const game = makeGame({ players: ['U001', 'U002', 'U003', 'U004'] });
    assert.equal(game.addPlayer('U005'), false);
    assert.equal(game.players.length, 4);
  });

  it('addPlayer transitions status to FULL on 4th player', () => {
    const game = makeGame({ players: ['U001', 'U002', 'U003'] });
    assert.equal(game.status, GameStatus.OPEN);
    const result = game.addPlayer('U004');
    assert.equal(result, true);
    assert.equal(game.status, GameStatus.FULL);
    assert.equal(game.players.length, 4);
  });

  it('removePlayer transitions status back to OPEN', () => {
    const game = makeGame({ players: ['U001', 'U002', 'U003', 'U004'] });
    assert.equal(game.status, GameStatus.FULL);
    const result = game.removePlayer('U004');
    assert.equal(result, true);
    assert.equal(game.status, GameStatus.OPEN);
    assert.equal(game.players.length, 3);
  });

  it('removePlayer returns false for unknown player', () => {
    const game = makeGame();
    assert.equal(game.removePlayer('UNKNOWN'), false);
  });

  it('setTs stores the Slack message timestamp', () => {
    const game = makeGame();
    game.setTs('123.456');
    assert.equal(game.ts, '123.456');
  });

  it('markNotified is idempotent', () => {
    const game = makeGame();
    game.markNotified();
    game.markNotified();
    assert.equal(game.notified, true);
  });

  it('isWithinNotificationWindow returns false for asap games', () => {
    const game = new Game({
      channelId: 'C123',
      creatorId: 'U000',
      timeText: 'asap',
      scheduledUnix: 0,
      players: ['U001', 'U002', 'U003', 'U004'],
    });
    assert.equal(game.isWithinNotificationWindow(), false);
  });

  it('isWithinNotificationWindow returns true when within 2 minutes', () => {
    const nearFuture = Math.floor((Date.now() + 60_000) / 1000); // 1 min from now
    const game = new Game({
      channelId: 'C123',
      creatorId: 'U000',
      timeText: '14:30',
      scheduledUnix: nearFuture,
      players: ['U001', 'U002', 'U003', 'U004'],
    });
    assert.equal(game.isWithinNotificationWindow(), true);
  });

  it('isWithinNotificationWindow returns false when more than 2 minutes away', () => {
    const farFuture = Math.floor((Date.now() + 600_000) / 1000); // 10 min from now
    const game = new Game({
      channelId: 'C123',
      creatorId: 'U000',
      timeText: '14:30',
      scheduledUnix: farFuture,
      players: ['U001', 'U002', 'U003', 'U004'],
    });
    assert.equal(game.isWithinNotificationWindow(), false);
  });

  it('toRecord / fromRecord round-trip produces equivalent game state', () => {
    const game = makeGame({ players: ['U001', 'U002'] });
    game.setTs('123.456');
    game.markNotified();

    const record = game.toRecord();
    const restored = Game.fromRecord(record);

    assert.equal(restored.gameId, game.gameId);
    assert.equal(restored.channelId, game.channelId);
    assert.equal(restored.creatorId, game.creatorId);
    assert.equal(restored.timeText, game.timeText);
    assert.equal(restored.scheduledUnix, game.scheduledUnix);
    assert.equal(restored.ts, game.ts);
    assert.equal(restored.status, game.status);
    assert.equal(restored.notified, game.notified);
    assert.equal(restored.createdAt, game.createdAt);
    assert.deepEqual(restored.players, game.players);
  });

  it('players getter returns a copy (not internal reference)', () => {
    const game = makeGame({ players: ['U001'] });
    const players = game.players;
    players.push('MUTATED');
    assert.equal(game.players.length, 1);
  });
});
