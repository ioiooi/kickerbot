const fetch = require('node-fetch');

const url = 'https://slack.com/api';

const headers = {
  'Content-type': 'application/json;charset=utf-8',
  Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
};

exports.postMessage = (channel, { text = '', attachments = '' }) => {
  return fetch(`${url}/chat.postMessage`, {
    method: 'POST',
    body: JSON.stringify({ channel, text, attachments }),
    headers
  }).then(res => res.json());
};

exports.postEphemeral = (channel, user, { text = '', attachments = '' }) => {
  return fetch(`${url}/chat.postEphemeral`, {
    method: 'POST',
    body: JSON.stringify({ channel, user, text, attachments }),
    headers
  }).then(res => res.json());
};

exports.deleteMessage = (channel, ts) => {
  return fetch(`${url}/chat.delete`, {
    method: 'POST',
    body: JSON.stringify({ channel, ts }),
    headers
  }).then(res => res.json());
};

exports.updateMessage = (channel, ts, { text = '', attachments = '' }) => {
  return fetch(`${url}/chat.update`, {
    method: 'POST',
    body: JSON.stringify({ channel, ts, text, attachments }),
    headers
  }).then(res => res.json());
};
