/**
 * Registers Bolt action handlers for join/leave/invite/delete.
 *
 * @param {import('@slack/bolt').App} boltApp
 * @param {import('../services/GameService.js').GameService} gameService
 */
export function registerActionHandlers(boltApp, gameService) {
  // ── Join ──────────────────────────────────────────────────────────────────
  boltApp.action('join_game', async ({ action, body, ack, client }) => {
    await ack();

    const gameId = action.value;
    const userId = body.user.id;

    const result = await gameService.joinGame({ gameId, userId });
    if (!result) return;

    const { game, lobbyPayload, privatePayload } = result;

    await client.chat.update({
      channel: game.channelId,
      ts: game.ts,
      ...lobbyPayload,
    });

    await client.chat.postEphemeral({
      channel: game.channelId,
      user: userId,
      ...privatePayload,
    });
  });

  // ── Leave ─────────────────────────────────────────────────────────────────
  boltApp.action('leave_game', async ({ action, body, ack, client, respond }) => {
    await ack();

    const gameId = action.value;
    const userId = body.user.id;

    const result = await gameService.leaveGame({ gameId, userId });
    if (!result) return;

    const { game, lobbyPayload } = result;

    await client.chat.update({
      channel: game.channelId,
      ts: game.ts,
      ...lobbyPayload,
    });

    // Remove the ephemeral leave/invite message
    await respond({ delete_original: true });
  });

  // ── Invite ────────────────────────────────────────────────────────────────
  boltApp.action('invite_player', async ({ action, body, ack, client }) => {
    await ack();

    // gameId is stored in block_id; selected user comes from users_select
    const gameId = action.block_id;
    const inviteeId = action.selected_user;
    const inviterId = body.user.id;
    const channelId = body.channel?.id ?? body.container?.channel_id;

    const result = await gameService.invitePlayer({ gameId, inviterId, inviteeId });
    if (!result) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: inviterId,
        text: "This is why we can't have nice things :unamused: (player already in game)",
      });
      return;
    }

    const { game, lobbyPayload, privatePayload } = result;

    await client.chat.update({
      channel: game.channelId,
      ts: game.ts,
      ...lobbyPayload,
    });

    await client.chat.postEphemeral({
      channel: game.channelId,
      user: inviteeId,
      ...privatePayload,
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  boltApp.action('delete_game', async ({ action, ack, client, respond }) => {
    await ack();

    const gameId = action.value;

    const result = await gameService.deleteGame({ gameId });
    if (!result) return;

    const { channelId, ts } = result;

    if (ts) {
      await client.chat.delete({ channel: channelId, ts });
    }

    // Remove the ephemeral delete button
    await respond({ delete_original: true });
  });
}
