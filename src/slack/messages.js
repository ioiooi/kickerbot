import { GameStatus } from '../domain/GameStatus.js';
import { assignTeams } from '../domain/TeamAssigner.js';

const mention = userId => `<@${userId}>`;

/**
 * Builds the public channel lobby message (Block Kit).
 * Shows team assignments when FULL, join button when OPEN.
 * @param {import('../domain/Game.js').Game} game
 * @returns {object} Slack message payload
 */
export function buildLobbyMessage(game) {
  if (game.status === GameStatus.FULL) {
    const teams = assignTeams(game.players);
    return {
      text: `kicker ${game.timeText}? Game is ready!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*kicker ${game.timeText}?* — Game is ready! :soccer:`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Team 1*\n:crossed_swords: ${mention(teams.team1.attack)}\n:shield: ${mention(teams.team1.defense)}`,
            },
            {
              type: 'mrkdwn',
              text: `*Team 2*\n:crossed_swords: ${mention(teams.team2.attack)}\n:shield: ${mention(teams.team2.defense)}`,
            },
          ],
        },
      ],
    };
  }

  const spotsLeft = 4 - game.players.length;
  const spotsText = spotsLeft === 1 ? '(1) Player left' : `(${spotsLeft}) Players left`;
  const playerList = game.players.length > 0
    ? game.players.map(mention).join(', ')
    : '_none yet_';

  return {
    text: `<!channel> kicker ${game.timeText}?`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<!channel> kicker ${game.timeText}?*\n${spotsText} — ${playerList}`,
        },
      },
      {
        type: 'actions',
        block_id: `lobby_${game.gameId}`,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Join :soccer:', emoji: true },
            action_id: 'join_game',
            value: game.gameId,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Ephemeral controls sent to each player who joins (leave + invite).
 * @param {string} gameId
 * @returns {object} Slack message payload
 */
export function buildPlayerControls(gameId) {
  return {
    blocks: [
      {
        type: 'actions',
        block_id: gameId,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Leave' },
            action_id: 'leave_game',
            value: gameId,
          },
          {
            type: 'users_select',
            placeholder: { type: 'plain_text', text: 'Invite a player' },
            action_id: 'invite_player',
          },
        ],
      },
    ],
  };
}

/**
 * Ephemeral control sent to the game creator (delete button).
 * @param {string} gameId
 * @returns {object} Slack message payload
 */
export function buildCreatorControls(gameId) {
  return {
    blocks: [
      {
        type: 'actions',
        block_id: gameId,
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Delete game' },
            action_id: 'delete_game',
            value: gameId,
            style: 'danger',
          },
        ],
      },
    ],
  };
}

/**
 * Text sent as a DM to notify players that a game is starting.
 * @param {string} timeText
 * @returns {string}
 */
export function buildNotificationText(timeText) {
  return `Hey! Your kicker game *${timeText}* is about to start. GL & HF! :soccer:`;
}
