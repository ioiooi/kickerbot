import { Game } from '../domain/Game.js';
import { GameStatus } from '../domain/GameStatus.js';
import { buildLobbyMessage, buildPlayerControls, buildCreatorControls, buildNotificationText } from '../slack/messages.js';

function parseTimeText(timeText) {
  if (timeText === 'asap') return 0;
  const hours = parseInt(timeText.slice(0, 2), 10);
  const minutes = parseInt(timeText.slice(3, 5), 10);
  return Math.floor(new Date().setHours(hours, minutes, 0, 0) / 1000);
}

export class GameService {
  #repository;
  #gameMap;
  #sendDm;

  /**
   * @param {import('../repository/GameRepository.js').GameRepository} repository
   * @param {Map} gameMap
   * @param {Function|null} sendDm
   */
  constructor(repository, gameMap, sendDm = null) {
    this.#repository = repository;
    this.#gameMap = gameMap;
    this.#sendDm = sendDm;
  }

  /** Inject sendDm after Bolt app is created. */
  setSendDm(sendDm) {
    this.#sendDm = sendDm;
  }

  /**
   * @param {{ channel: string, creatorId: string, timeText: string, initialPlayerIds: string[] }}
   * @returns {Promise<{ game: Game, lobbyPayload: object, privatePayloads: Array<{userId: string, payload: object}> }>}
   */
  async createGame({ channel, creatorId, timeText, initialPlayerIds }) {
    const scheduledUnix = parseTimeText(timeText);
    const game = new Game({
      channelId: channel,
      creatorId,
      timeText,
      scheduledUnix,
      players: initialPlayerIds,
    });
    this.#gameMap.set(game.gameId, game);
    await this.#repository.save(game);

    const lobbyPayload = buildLobbyMessage(game);
    const privatePayloads = initialPlayerIds.map(userId => ({
      userId,
      payload: buildPlayerControls(game.gameId),
    }));

    return { game, lobbyPayload, privatePayloads };
  }

  /**
   * Updates the game ts after the Slack message is posted.
   * @param {string} gameId
   * @param {string} ts
   */
  async saveTs(gameId, ts) {
    const game = this.#gameMap.get(gameId);
    if (!game) return;
    game.setTs(ts);
    await this.#repository.save(game);
  }

  /**
   * @param {{ gameId: string, userId: string }}
   * @returns {Promise<{ game: Game, lobbyPayload: object, privatePayload: object }|null>}
   */
  async joinGame({ gameId, userId }) {
    const game = this.#gameMap.get(gameId);
    if (!game) return null;

    const added = game.addPlayer(userId);
    if (!added) return null;

    const shouldNotify = game.status === GameStatus.FULL &&
      game.scheduledUnix === 0 &&
      this.#sendDm &&
      !game.notified;
    if (shouldNotify) game.markNotified();

    await this.#repository.save(game);

    if (shouldNotify) await this.#sendFullGameDms(game);

    return {
      game,
      lobbyPayload: buildLobbyMessage(game),
      privatePayload: buildPlayerControls(game.gameId),
    };
  }

  /**
   * @param {{ gameId: string, userId: string }}
   * @returns {Promise<{ game: Game, lobbyPayload: object }|null>}
   */
  async leaveGame({ gameId, userId }) {
    const game = this.#gameMap.get(gameId);
    if (!game) return null;

    game.removePlayer(userId);
    await this.#repository.save(game);

    return { game, lobbyPayload: buildLobbyMessage(game) };
  }

  /**
   * @param {{ gameId: string, inviterId: string, inviteeId: string }}
   * @returns {Promise<{ game: Game, lobbyPayload: object, privatePayload: object }|null>}
   */
  async invitePlayer({ gameId, inviterId, inviteeId }) {
    const game = this.#gameMap.get(gameId);
    if (!game) return null;

    const added = game.addPlayer(inviteeId);
    if (!added) return null;

    const shouldNotify = game.status === GameStatus.FULL &&
      game.scheduledUnix === 0 &&
      this.#sendDm &&
      !game.notified;
    if (shouldNotify) game.markNotified();

    await this.#repository.save(game);

    if (shouldNotify) await this.#sendFullGameDms(game);

    return {
      game,
      lobbyPayload: buildLobbyMessage(game),
      privatePayload: buildPlayerControls(game.gameId),
    };
  }

  /**
   * @param {{ gameId: string }}
   * @returns {Promise<{ channelId: string, ts: string }|null>}
   */
  async deleteGame({ gameId }) {
    const game = this.#gameMap.get(gameId);
    if (!game) return null;

    this.#gameMap.delete(gameId);
    await this.#repository.delete(gameId);

    return { channelId: game.channelId, ts: game.ts };
  }

  /** @returns {Promise<string[]>} Slack user IDs of the latest full game's players. */
  async getLatestFullGamePlayers() {
    const game = await this.#repository.findLatestFullGame();
    return game ? game.players : [];
  }

  /** Populate gameMap from DB — must complete before accepting traffic. */
  async rehydrate() {
    const games = await this.#repository.findAllActive();
    for (const game of games) {
      this.#gameMap.set(game.gameId, game);
    }
    console.log(`Rehydrated ${games.length} active game(s).`);
  }

  /** @param {string} gameId @returns {Game|undefined} */
  getGame(gameId) {
    return this.#gameMap.get(gameId);
  }

  async #sendFullGameDms(game) {
    const text = buildNotificationText(game.timeText);
    for (const userId of game.players) {
      await this.#sendDm(userId, text);
    }
  }
}
