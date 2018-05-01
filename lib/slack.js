exports.createLFMAttachment = playerArray => {
  return [
    {
      fallback: 'Oops. That was not supposed to happen.',
      color: 'good',
      text: 'You in or you out?!',
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

exports.createGameReadyAttachement = playerArray => {
  shuffleArray(playerArray);

  return [
    {
      fallback: 'Oops. That was not supposed to happen.',
      color: 'good',
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
    }
  ];
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
