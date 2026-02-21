import { PutCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Game } from '../domain/Game.js';
import { GameRepository } from './GameRepository.js';
import { GameStatus } from '../domain/GameStatus.js';

export class DynamoGameRepository extends GameRepository {
  #client;
  #tableName;

  /**
   * @param {import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient} client
   * @param {string} tableName
   */
  constructor(client, tableName) {
    super();
    this.#client = client;
    this.#tableName = tableName;
  }

  /**
   * PutCommand for new games (ts not set); UpdateCommand for existing games (ts set).
   * @param {import('../domain/Game.js').Game} game
   */
  async save(game) {
    const record = game.toRecord();
    if (!record.ts) {
      await this.#client.send(new PutCommand({
        TableName: this.#tableName,
        Item: record,
        ConditionExpression: 'attribute_not_exists(gameId)',
      }));
    } else {
      await this.#client.send(new UpdateCommand({
        TableName: this.#tableName,
        Key: { gameId: record.gameId },
        UpdateExpression: 'SET ts = :ts, players = :players, #s = :status, notified = :notified',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':ts': record.ts,
          ':players': record.players,
          ':status': record.status,
          ':notified': record.notified,
        },
      }));
    }
  }

  /**
   * Soft-delete: sets `deleted = true` on the DynamoDB item.
   * @param {string} gameId
   */
  async delete(gameId) {
    await this.#client.send(new UpdateCommand({
      TableName: this.#tableName,
      Key: { gameId },
      UpdateExpression: 'SET deleted = :d',
      ExpressionAttributeValues: { ':d': true },
    }));
  }

  /** @returns {Promise<Game[]>} */
  async findAllActive() {
    const result = await this.#client.send(new ScanCommand({
      TableName: this.#tableName,
      FilterExpression: 'attribute_not_exists(deleted)',
    }));
    return (result.Items ?? []).map(item => Game.fromRecord(item));
  }

  /** @returns {Promise<Game|null>} */
  async findLatestFullGame() {
    const result = await this.#client.send(new ScanCommand({
      TableName: this.#tableName,
      FilterExpression: '#s = :status AND attribute_not_exists(deleted)',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': GameStatus.FULL },
    }));
    const items = result.Items ?? [];
    if (items.length === 0) return null;
    items.sort((a, b) => b.createdAt - a.createdAt);
    return Game.fromRecord(items[0]);
  }
}
