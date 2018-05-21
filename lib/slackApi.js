const { URL, URLSearchParams } = require('url');
const fetch = require('node-fetch');

const slackApiURL = 'https://slack.com/api';

const headers = {
  'Content-type': 'application/json;charset=utf-8',
  Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
};

exports.postMessage = (channel, { text = '', attachments = '' }) => {
  return fetch(`${slackApiURL}/chat.postMessage`, {
    method: 'POST',
    body: JSON.stringify({ channel, text, attachments }),
    headers
  }).then(res => res.json());
};

exports.postEphemeral = (channel, user, { text = '', attachments = '' }) => {
  return fetch(`${slackApiURL}/chat.postEphemeral`, {
    method: 'POST',
    body: JSON.stringify({ channel, user, text, attachments }),
    headers
  }).then(res => res.json());
};

exports.deleteMessage = (channel, ts) => {
  return fetch(`${slackApiURL}/chat.delete`, {
    method: 'POST',
    body: JSON.stringify({ channel, ts }),
    headers
  }).then(res => res.json());
};

exports.updateMessage = (channel, ts, { text = '', attachments = '' }) => {
  return fetch(`${slackApiURL}/chat.update`, {
    method: 'POST',
    body: JSON.stringify({ channel, ts, text, attachments }),
    headers
  }).then(res => res.json());
};

exports.getUserInfo = userId => {
  const params = new URLSearchParams({
    token: process.env.SLACK_BOT_TOKEN,
    user: userId,
    pretty: 1
  });
  const reqUrl = new URL(`${slackApiURL}/users.info`);
  reqUrl.search = params;
  return fetch(reqUrl.toString()).then(res => res.json());
};
