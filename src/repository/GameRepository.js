/**
 * Abstract base class defining the GameRepository contract.
 * Concrete implementations must override all methods.
 */
export class GameRepository {
  /** @param {import('../domain/Game.js').Game} game */
  async save(game) { throw new Error('Not implemented'); }

  /** @param {string} gameId */
  async delete(gameId) { throw new Error('Not implemented'); }

  /** @returns {Promise<import('../domain/Game.js').Game[]>} */
  async findAllActive() { throw new Error('Not implemented'); }

  /** @returns {Promise<import('../domain/Game.js').Game|null>} */
  async findLatestFullGame() { throw new Error('Not implemented'); }
}
