module.exports = {
  development: {
    region: 'eu-central-1',
    endpoint: 'http://localhost:8000'
  },
  production: {
    region: 'eu-central-1',
    endpoint: 'https://dynamodb.eu-central-1.amazonaws.com',
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET
  }
};
