import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { App, ExpressReceiver } from '@slack/bolt';
import { DynamoGameRepository } from './src/repository/DynamoGameRepository.js';
import { GameService } from './src/services/GameService.js';
import { NotificationService } from './src/services/NotificationService.js';
import { registerCommandHandlers } from './src/slack/commandHandlers.js';
import { registerActionHandlers } from './src/slack/actionHandlers.js';
import { createKickerRouter } from './src/http/kickerRoute.js';

const PORT = process.env.PORT || 3000;
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'kickerbot-games';

// ── 1. DynamoDB ──────────────────────────────────────────────────────────────
const dynamoConfig = {
  region: process.env.AWS_REGION || 'eu-central-1',
};
if (process.env.DYNAMODB_ENDPOINT) {
  dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoClient = new DynamoDBClient(dynamoConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const repository = new DynamoGameRepository(docClient, TABLE_NAME);

// ── 2. Shared in-memory game map ─────────────────────────────────────────────
const gameMap = new Map();

// ── 3. GameService ────────────────────────────────────────────────────────────
const gameService = new GameService(repository, gameMap);

// ── 4. Rehydrate — MUST complete before accepting traffic ────────────────────
await gameService.rehydrate();

// ── 5. Bolt App + ExpressReceiver ─────────────────────────────────────────────
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const boltApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// ── 6. Wire sendDm into GameService ──────────────────────────────────────────
const sendDm = async (userId, text) => {
  await boltApp.client.chat.postMessage({ channel: userId, text });
};
gameService.setSendDm(sendDm);

// ── 7. Register Slack handlers ────────────────────────────────────────────────
registerCommandHandlers(boltApp, gameService);
registerActionHandlers(boltApp, gameService);

// ── 8. HTTP route ─────────────────────────────────────────────────────────────
const getUserEmail = async (userId) => {
  const result = await boltApp.client.users.info({ user: userId });
  return result.user.profile.email;
};
receiver.router.use('/kicker', createKickerRouter(gameService, getUserEmail));

// ── 9. Notification daemon ────────────────────────────────────────────────────
const notificationService = new NotificationService(gameMap, sendDm);
notificationService.start();

// ── 10. Start ─────────────────────────────────────────────────────────────────
await boltApp.start(PORT);
console.log(`Kickerbot running on port ${PORT}`);
