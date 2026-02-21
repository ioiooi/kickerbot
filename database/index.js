const AWS = require('aws-sdk');
const config = require('./config')[process.env.NODE_ENV || 'development'];

AWS.config.update(config);
const docClient = new AWS.DynamoDB.DocumentClient();
const TableName = 'kickerbot-games';

const get = params => {
  const o = {
    TableName,
    Key: params
  };

  return new Promise((resolve, reject) => {
    docClient.get(o, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

const put = params => {
  const o = {
    TableName,
    Item: params,
    ConditionExpression: 'attribute_not_exists(gameId)'
  };

  return new Promise((resolve, reject) => {
    docClient.put(o, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

const update = params => {
  const o = {
    TableName,
    ...params
  };

  return new Promise((resolve, reject) => {
    docClient.update(o, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

const deleteItem = params => {
  const o = {
    TableName,
    Key: params,
    ReturnValues: 'ALL_OLD'
  };

  return new Promise((resolve, reject) => {
    docClient.delete(o, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

module.exports = {
  get,
  put,
  update,
  deleteItem,
  docClient
};
