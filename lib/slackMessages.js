const lookingForMoreMessage = (text, playerArray, gameId) => {
  const attachments = [
    {
      fallback: 'Oops. That was not supposed to happen.',
      color: 'good',
      text: 'Looking for more',
      callback_id: 'join',
      attachment_type: 'default',
      actions: [
        {
          name: 'join',
          text: 'Join :soccer:',
          type: 'button',
          style: 'primary',
          value: gameId
        }
      ],
      fields: [createLFMFieldObj(playerArray)]
    }
  ];

  return {
    text,
    attachments
  };
};

const createLFMFieldObj = playerArray => {
  const title =
    playerArray.length === 3
      ? `(1) Player left`
      : `(${4 - playerArray.length}) Players left`;
  const value = playerArray.map(user => `<@${user}>`).join(', ');

  return {
    title,
    value
  };
};

const gameReadyMessage = (text, playerArray) => {
  shuffleArray(playerArray);
  const attachments = [
    {
      pretext: 'Game is ready!',
      title: 'Team 1',
      color: '#00bcd4',
      fields: [
        {
          value: createPlayerTitle(playerArray[0], 'Attack'),
          short: true
        },
        {
          value: createPlayerTitle(playerArray[1], 'Defense'),
          short: true
        }
      ],
      mrkdwn_in: ['fields']
    },
    {
      title: 'Team 2',
      color: '#ff4081',
      fields: [
        {
          value: createPlayerTitle(playerArray[2], 'Defense'),
          short: true
        },
        {
          value: createPlayerTitle(playerArray[3], 'Attack'),
          short: true
        }
      ],
      mrkdwn_in: ['fields']
    }
  ];

  return {
    text,
    attachments
  };
};

const createPlayerTitle = (player, position) => {
  return `_${position}_ \n *<@${player}>*`;
};

const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const leaveMessage = gameId => {
  return [
    {
      fallback: 'Oops. That was not supposed to happen.',
      text: 'Leave the game lobby.',
      callback_id: 'leave',
      actions: [
        {
          name: 'leave',
          text: 'Leave',
          type: 'button',
          value: gameId
        }
      ]
    },
    {
      fallback: 'Oops. That was not supposed to happen.',
      text: 'Invite someone else.',
      callback_id: 'invite',
      actions: [
        {
          name: `invite_${gameId}`,
          text: 'Player',
          type: 'select',
          data_source: 'users'
        }
      ]
    }
  ];
};

const deleteGameMessage = gameId => {
  return [
    {
      fallback: 'Oops. That was not supposed to happen.',
      text: 'Keep the channel tidy. Delete your dead lobby.',
      callback_id: 'delete',
      actions: [
        {
          name: 'delete',
          text: 'Delete',
          type: 'button',
          style: 'danger',
          value: gameId
        }
      ]
    }
  ];
};

const gameReadyNotificationMessage = player => {
  return `Hey <@${player}>, your game is ready! GL & HF !`;
};

module.exports = {
  lookingForMoreMessage,
  gameReadyMessage,
  leaveMessage,
  deleteGameMessage,
  gameReadyNotificationMessage
};
