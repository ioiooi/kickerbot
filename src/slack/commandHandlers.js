import { buildCreatorControls } from './messages.js';

const TIME_PATTERN = /([0-1]\d|2[0-3]):[0-5]\d|\basap\b/;
const MENTION_PATTERN = /<@([A-Z0-9]+)(?:\|[^>]*)?>/g;

/**
 * Registers the /kicker slash command handler.
 * Format: /kicker asap|HH:mm [@user ...]
 *
 * @param {import('@slack/bolt').App} boltApp
 * @param {import('../services/GameService.js').GameService} gameService
 */
export function registerCommandHandlers(boltApp, gameService) {
  boltApp.command('/kicker', async ({ command, ack, client, respond }) => {
    await ack();

    const { text, user_id, channel_id } = command;

    const timeMatch = text.match(TIME_PATTERN);
    if (!timeMatch) {
      await respond({ text: 'Usage: `/kicker asap` or `/kicker HH:mm [@user ...]`' });
      return;
    }
    const timeText = timeMatch[0];

    const mentionedUsers = [];
    let match;
    const mentionIter = text.matchAll(MENTION_PATTERN);
    for (const m of mentionIter) {
      mentionedUsers.push(m[1]);
    }

    const initialPlayerIds = [user_id, ...mentionedUsers];

    const { game, lobbyPayload, privatePayloads } = await gameService.createGame({
      channel: channel_id,
      creatorId: user_id,
      timeText,
      initialPlayerIds,
    });

    // Post the public lobby message
    const posted = await client.chat.postMessage({
      channel: channel_id,
      ...lobbyPayload,
    });

    // Persist the message timestamp for future updates
    await gameService.saveTs(game.gameId, posted.ts);

    // Send ephemeral leave/invite controls to each initial player
    for (const { userId, payload } of privatePayloads) {
      await client.chat.postEphemeral({
        channel: channel_id,
        user: userId,
        ...payload,
      });
    }

    // Send ephemeral delete control to the creator
    await client.chat.postEphemeral({
      channel: channel_id,
      user: user_id,
      ...buildCreatorControls(game.gameId),
    });
  });
}
