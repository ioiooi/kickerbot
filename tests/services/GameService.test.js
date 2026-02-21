import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GameService } from '../../src/services/GameService.js';
import { GameRepository } from '../../src/repository/GameRepository.js';
import { Game } from '../../src/domain/Game.js';
import { GameStatus } from '../../src/domain/GameStatus.js';

class StubRepository extends GameRepository {
  constructor() {
    super();
    this.saves = [];
    this.deletes = [];
    this.activeGames = [];
  }
  async save(game) { this.saves.push(game.toRecord()); }
  async delete(gameId) { this.deletes.push(gameId); }
  async findAllActive() { return this.activeGames; }
  async findLatestFullGame() {
    return this.activeGames.find(g => g.status === GameStatus.FULL) ?? null;
  }
}

function makeService(overrides = {}) {
  const repository = overrides.repository ?? new StubRepository();
  const gameMap = overrides.gameMap ?? new Map();
  const service = new GameService(repository, gameMap);
  return { repository, gameMap, service };
}

describe('GameService', () => {
  describe('createGame', () => {
    it('adds game to gameMap and calls repository.save', async () => {
      const { repository, gameMap, service } = makeService();

      const result = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      assert.ok(result.game, 'should return a game');
      assert.ok(gameMap.has(result.game.gameId), 'game should be in gameMap');
      assert.equal(repository.saves.length, 1, 'should have saved once');
    });

    it('returns lobbyPayload and privatePayloads', async () => {
      const { service } = makeService();

      const result = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: '14:30',
        initialPlayerIds: ['U000', 'U001'],
      });

      assert.ok(result.lobbyPayload);
      assert.equal(result.privatePayloads.length, 2);
      assert.equal(result.privatePayloads[0].userId, 'U000');
      assert.equal(result.privatePayloads[1].userId, 'U001');
    });
  });

  describe('joinGame', () => {
    it('returns null for unknown gameId', async () => {
      const { service } = makeService();
      const result = await service.joinGame({ gameId: 'nonexistent', userId: 'U001' });
      assert.equal(result, null);
    });

    it('returns null if player already in game', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      const result = await service.joinGame({ gameId: game.gameId, userId: 'U000' });
      assert.equal(result, null);
    });

    it('returns null if game is already full', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000', 'U001', 'U002', 'U003'],
      });

      const result = await service.joinGame({ gameId: game.gameId, userId: 'U004' });
      assert.equal(result, null);
    });

    it('returns payload and updates game when player successfully added', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      const result = await service.joinGame({ gameId: game.gameId, userId: 'U001' });
      assert.ok(result, 'should return a result');
      assert.ok(result.lobbyPayload, 'should have lobbyPayload');
      assert.ok(result.privatePayload, 'should have privatePayload');
      assert.equal(result.game.players.length, 2);
    });

    it('calls sendDm for each player when asap game becomes full', async () => {
      const dmCalls = [];
      const sendDm = async (userId, text) => dmCalls.push({ userId, text });

      const repository = new StubRepository();
      const gameMap = new Map();
      const service = new GameService(repository, gameMap, sendDm);

      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000', 'U001', 'U002'],
      });

      await service.joinGame({ gameId: game.gameId, userId: 'U003' });

      assert.equal(dmCalls.length, 4, 'should DM all 4 players');
    });
  });

  describe('leaveGame', () => {
    it('returns null for unknown gameId', async () => {
      const { service } = makeService();
      const result = await service.leaveGame({ gameId: 'nonexistent', userId: 'U001' });
      assert.equal(result, null);
    });

    it('updates game state and returns lobbyPayload', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000', 'U001'],
      });

      const result = await service.leaveGame({ gameId: game.gameId, userId: 'U001' });
      assert.ok(result);
      assert.equal(result.game.players.length, 1);
      assert.ok(result.lobbyPayload);
    });
  });

  describe('invitePlayer', () => {
    it('returns null for unknown gameId', async () => {
      const { service } = makeService();
      const result = await service.invitePlayer({
        gameId: 'nonexistent',
        inviterId: 'U000',
        inviteeId: 'U001',
      });
      assert.equal(result, null);
    });

    it('returns null if invitee already in game', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000', 'U001'],
      });

      const result = await service.invitePlayer({
        gameId: game.gameId,
        inviterId: 'U000',
        inviteeId: 'U001',
      });
      assert.equal(result, null);
    });

    it('adds invitee and returns payload', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      const result = await service.invitePlayer({
        gameId: game.gameId,
        inviterId: 'U000',
        inviteeId: 'U001',
      });
      assert.ok(result);
      assert.equal(result.game.players.length, 2);
    });
  });

  describe('deleteGame', () => {
    it('returns null for unknown gameId', async () => {
      const { service } = makeService();
      const result = await service.deleteGame({ gameId: 'nonexistent' });
      assert.equal(result, null);
    });

    it('removes game from gameMap and calls repository.delete', async () => {
      const { repository, gameMap, service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      await service.deleteGame({ gameId: game.gameId });

      assert.equal(gameMap.has(game.gameId), false);
      assert.ok(repository.deletes.includes(game.gameId));
    });

    it('returns channelId and ts', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      const result = await service.deleteGame({ gameId: game.gameId });
      assert.equal(result.channelId, 'C123');
    });
  });

  describe('rehydrate', () => {
    it('populates gameMap from repository.findAllActive', async () => {
      const repository = new StubRepository();
      const gameMap = new Map();
      const service = new GameService(repository, gameMap);

      const existingGame = new Game({
        channelId: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        scheduledUnix: 0,
        players: ['U001'],
        ts: '123.456',
      });
      repository.activeGames = [existingGame];

      await service.rehydrate();

      assert.ok(gameMap.has(existingGame.gameId));
      assert.equal(gameMap.get(existingGame.gameId).channelId, 'C123');
    });

    it('handles empty database gracefully', async () => {
      const repository = new StubRepository();
      const gameMap = new Map();
      const service = new GameService(repository, gameMap);

      await service.rehydrate();
      assert.equal(gameMap.size, 0);
    });
  });

  describe('getGame', () => {
    it('returns game by id', async () => {
      const { service } = makeService();
      const { game } = await service.createGame({
        channel: 'C123',
        creatorId: 'U000',
        timeText: 'asap',
        initialPlayerIds: ['U000'],
      });

      const found = service.getGame(game.gameId);
      assert.equal(found, game);
    });

    it('returns undefined for unknown id', () => {
      const { service } = makeService();
      assert.equal(service.getGame('nonexistent'), undefined);
    });
  });
});
