import { randomUUID } from 'node:crypto';
import { GameStatus } from './GameStatus.js';

export class Game {
  #gameId;
  #channelId;
  #ts;
  #creatorId;
  #timeText;
  #scheduledUnix;
  #players;
  #status;
  #notified;
  #createdAt;

  constructor({
    channelId,
    creatorId,
    timeText,
    scheduledUnix,
    players = [],
    gameId,
    ts,
    status,
    notified,
    createdAt,
  }) {
    this.#gameId = gameId ?? randomUUID();
    this.#channelId = channelId;
    this.#ts = ts ?? null;
    this.#creatorId = creatorId;
    this.#timeText = timeText;
    this.#scheduledUnix = scheduledUnix;
    this.#players = [...players];
    this.#status = status ?? (this.#players.length >= 4 ? GameStatus.FULL : GameStatus.OPEN);
    this.#notified = notified ?? false;
    this.#createdAt = createdAt ?? Math.floor(Date.now() / 1000);
  }

  get gameId() { return this.#gameId; }
  get channelId() { return this.#channelId; }
  get ts() { return this.#ts; }
  get creatorId() { return this.#creatorId; }
  get timeText() { return this.#timeText; }
  get scheduledUnix() { return this.#scheduledUnix; }
  get players() { return [...this.#players]; }
  get status() { return this.#status; }
  get notified() { return this.#notified; }
  get createdAt() { return this.#createdAt; }

  /**
   * Adds a player to the game.
   * @param {string} userId
   * @returns {boolean} false if duplicate or game already full
   */
  addPlayer(userId) {
    if (this.#status === GameStatus.FULL) return false;
    if (this.#players.includes(userId)) return false;
    this.#players.push(userId);
    if (this.#players.length >= 4) {
      this.#status = GameStatus.FULL;
    }
    return true;
  }

  /**
   * Removes a player from the game.
   * @param {string} userId
   * @returns {boolean} false if player not found
   */
  removePlayer(userId) {
    const idx = this.#players.indexOf(userId);
    if (idx === -1) return false;
    this.#players.splice(idx, 1);
    if (this.#status === GameStatus.FULL) {
      this.#status = GameStatus.OPEN;
    }
    return true;
  }

  /** Called after Slack confirms the message was posted. */
  setTs(ts) {
    this.#ts = ts;
  }

  /** Idempotent — marks game as having sent pre-game DMs. */
  markNotified() {
    this.#notified = true;
  }

  /**
   * True when the game is scheduled (not asap) and within 2 minutes of start.
   * @returns {boolean}
   */
  isWithinNotificationWindow() {
    return this.#scheduledUnix > 0 && this.#scheduledUnix * 1000 - Date.now() <= 120_000;
  }

  /** Serialize to a plain object suitable for DynamoDB storage. */
  toRecord() {
    return {
      gameId: this.#gameId,
      channelId: this.#channelId,
      ts: this.#ts,
      creatorId: this.#creatorId,
      timeText: this.#timeText,
      scheduledUnix: this.#scheduledUnix,
      players: [...this.#players],
      status: this.#status,
      notified: this.#notified,
      createdAt: this.#createdAt,
    };
  }

  /** Rehydration factory — reconstruct a Game from a stored record. */
  static fromRecord(record) {
    return new Game(record);
  }
}
