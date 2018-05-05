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
          text: 'Join :soccer:',
          type: 'button',
          style: 'primary',
          value: 0
        },
        {
          name: 'kicker_out',
          text: 'Leave',
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
    },
    {
      fallback: 'Oops. That was not supposed to happen.',
      callback_id: 'kicker_game',
      actions: [
        {},
        {
          name: 'kicker_out',
          text: 'Leave',
          type: 'button',
          value: 1
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
      text: 'Keep the channel tidy. Delete your dead lobby.',
      callback_id: 'kicker_delete',
      image_url: 'https://media.giphy.com/media/jSnQGLHBrgbRK/giphy.gif',
      actions: [
        {
          name: 'kicker_del',
          text: 'Delete',
          type: 'button',
          style: 'danger',
          value: JSON.stringify({ channel, ts })
        }
      ]
    }
  ]);
};
