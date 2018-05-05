exports.createLookingForMoreMessage = (text, playerArray) => {
  const attachments = [
    {
      fallback: 'Oops. That was not supposed to happen.',
      color: 'good',
      text: 'Looking for more',
      callback_id: 'kicker_game',
      attachment_type: 'default',
      actions: [
        {
          name: 'kicker_in',
          text: ':soccer:',
          type: 'button',
          style: 'primary',
          value: 0
        },
        {
          name: 'kicker_out',
          text: ':no_pedestrians:',
          type: 'button',
          value: 1
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

exports.createGameReadyMessage = (text, playerArray) => {
  shuffleArray(playerArray);
  const attachments = [
    {
      fallback: 'Oops. That was not supposed to happen.',
      color: 'good',
      text: 'Game is ready!',
      callback_id: 'kicker_game',
      attachment_type: 'default',
      actions: [
        {},
        {
          name: 'kicker_out',
          text: ':no_pedestrians:',
          type: 'button',
          value: 1
        }
      ],
      fields: [
        {
          title: 'Team 1',
          short: true
        },
        {
          title: 'Team 2',
          short: true
        },
        {
          value: createPlayerTitle(playerArray[0], 'Attack'),
          short: true
        },
        {
          value: createPlayerTitle(playerArray[1], 'Attack'),
          short: true
        },
        {
          value: createPlayerTitle(playerArray[2], 'Defense'),
          short: true
        },
        {
          value: createPlayerTitle(playerArray[3], 'Defense'),
          short: true
        }
      ]
    },
    {
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
      ]
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
      ]
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

exports.createDeleteGameMessage = (channel, ts) => {
  return (attachments = [
    {
      fallback: 'Oops. That was not supposed to happen.',
      text: 'Delete your game',
      callback_id: 'kicker_delete',
      attachment_type: 'default',
      actions: [
        {
          name: 'kicker_del',
          text: 'delete',
          type: 'button',
          style: 'danger',
          value: JSON.stringify({ channel, ts })
        }
      ]
    }
  ]);
};
