require('dotenv').config();
const app = require('express')();
const server = require('http').Server(app);
const bodyParser = require('body-parser');
const logger = require('morgan');
const data = require('./data');

// routes
const commandsRouter = require('./routes/commands');
const actionsRouter = require('./routes/actions');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup routes
app.use('/commands', commandsRouter);
app.use('/actions', actionsRouter);
app.get('/data', (req, res) => {
  res.json(data);
});

const port = normalizePort(process.env.PORT || '3000');
server.listen(port, () => console.log(`listening on port: ${port}`));

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
