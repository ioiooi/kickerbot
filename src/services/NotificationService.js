import { GameStatus } from '../domain/GameStatus.js';
import { buildNotificationText } from '../slack/messages.js';

export class NotificationService {
  #gameMap;
  #sendDm;
  #intervalMs;
  #timer;

  /**
   * @param {Map} gameMap
   * @param {(userId: string, text: string) => Promise<void>} sendDm
   * @param {number} intervalMs
   */
  constructor(gameMap, sendDm, intervalMs = 5000) {
    this.#gameMap = gameMap;
    this.#sendDm = sendDm;
    this.#intervalMs = intervalMs;
    this.#timer = null;
  }

  start() {
    this.#timer = setInterval(() => this._tick(), this.#intervalMs);
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  async _tick() {
    for (const game of this.#gameMap.values()) {
      if (
        game.status === GameStatus.FULL &&
        game.isWithinNotificationWindow() &&
        !game.notified
      ) {
        game.markNotified();
        const text = buildNotificationText(game.timeText);
        for (const userId of game.players) {
          await this.#sendDm(userId, text);
        }
      }
    }
  }
}
