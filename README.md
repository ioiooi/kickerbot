# Kickerbot

A Slack bot for organizing foosball games. Create lobbies, fill spots, get randomly assigned teams — all without leaving Slack.

![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Features

- **Slash command** — `/kicker asap` or `/kicker 14:30 @alice @bob` to open a lobby
- **Live lobby** — public channel message updates as players join or leave
- **4-player cap** — join button disappears once the lobby is full
- **Random team assignment** — attack & defense roles shuffled when the 4th player joins
- **Pre-game DMs** — each player gets a private reminder ~2 minutes before a scheduled game
- **Invite** — any lobby member can invite a specific teammate via a user picker
- **Restart recovery** — active games are rehydrated from DynamoDB on startup; existing lobbies stay interactive
- **External API** — `GET /kicker` returns the email addresses of the latest full game's players

---

## Requirements

- Node.js ≥ 22
- A Slack app with a bot token and signing secret
- AWS DynamoDB table (or local DynamoDB for development)

---

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

```sh
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `SLACK_BOT_TOKEN` | Bot OAuth token (`xoxb-…`) |
| `SLACK_SIGNING_SECRET` | From your Slack app settings |
| `AWS_REGION` | DynamoDB region (default `eu-central-1`) |
| `DYNAMODB_TABLE` | Table name (default `kickerbot-games`) |
| `DYNAMODB_ENDPOINT` | Override endpoint — set to `http://localhost:8000` for local dev |
| `PORT` | HTTP port (default `3000`) |

### 3. Create the DynamoDB table

The table needs a single string partition key named `gameId`. Using the AWS CLI:

```sh
aws dynamodb create-table \
  --table-name kickerbot-games \
  --attribute-definitions AttributeName=gameId,AttributeType=S \
  --key-schema AttributeName=gameId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

For local development with [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html):

```sh
docker run -p 8000:8000 amazon/dynamodb-local

aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name kickerbot-games \
  --attribute-definitions AttributeName=gameId,AttributeType=S \
  --key-schema AttributeName=gameId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 4. Configure your Slack app

In your [Slack app settings](https://api.slack.com/apps):

- **Slash command**: `/kicker` → `https://your-host/slack/events`
- **Interactivity**: Request URL → `https://your-host/slack/events`
- **Bot token scopes**: `chat:write`, `chat:write.public`, `commands`, `users:read`, `users:read.email`

> Bolt handles all Slack event routing at `/slack/events`.

### 5. Start

```sh
npm start
```

---

## Usage

### Create a game

```
/kicker asap
/kicker 14:30
/kicker 14:30 @alice @bob
```

- Time is either `asap` or `HH:mm` (24-hour)
- Mentioned users are pre-added to the lobby
- A public lobby message appears in the channel
- You receive private **Leave**, **Invite**, and **Delete** controls

### Join / Leave

Click **Join** on the lobby message to enter, or **Leave** on your private controls to exit. The lobby updates live.

### Invite

Use the **Invite a player** picker in your private controls to add a specific teammate.

### Delete

Use the **Delete game** button (creator only) to remove the lobby message and end the game.

### Teams

When the 4th player joins, the lobby message automatically reveals two teams with randomly assigned Attack and Defense roles.

### Pre-game notifications

For scheduled games (non-asap), each player receives a Slack DM approximately 2 minutes before the game starts.

---

## HTTP API

```
GET /kicker
```

Returns the email addresses of the players in the most recent full (4-player) game, for use in external integrations (e.g., calendar invites).

**Response**

```json
["alice@example.com", "bob@example.com", "carol@example.com", "dave@example.com"]
```

Returns `[]` if no full game exists.

---

## Project Structure

```
kickerbot/
├── app.js                          # Entry point — boot sequence with top-level await
│
├── src/
│   ├── domain/
│   │   ├── Game.js                 # Game entity — private fields, state machine
│   │   ├── GameStatus.js           # Frozen enum: OPEN | FULL
│   │   └── TeamAssigner.js         # Pure fn: Fisher-Yates shuffle → 2 teams
│   │
│   ├── repository/
│   │   ├── GameRepository.js       # Abstract base (interface contract)
│   │   └── DynamoGameRepository.js # DynamoDB implementation (AWS SDK v3)
│   │
│   ├── services/
│   │   ├── GameService.js          # Orchestration: create/join/leave/invite/delete
│   │   └── NotificationService.js  # Polling daemon: 2-min pre-game DMs
│   │
│   ├── slack/
│   │   ├── messages.js             # Pure fns: Block Kit payloads
│   │   ├── commandHandlers.js      # /kicker slash command
│   │   └── actionHandlers.js       # join / leave / invite / delete actions
│   │
│   └── http/
│       └── kickerRoute.js          # GET /kicker Express router
│
└── tests/
    ├── domain/
    │   ├── Game.test.js
    │   └── TeamAssigner.test.js
    └── services/
        ├── GameService.test.js
        └── NotificationService.test.js
```

---

## Development

### Run tests

```sh
npm test
```

Uses Node.js's built-in test runner (`node:test`) — no additional dependencies.

### Local bot tunnel

Slack needs to reach your local server. [ngrok](https://ngrok.com) is an easy option:

```sh
ngrok http 3000
```

Point your Slack app's slash command and interactivity URLs at the generated `https://` address.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 22, ESM (`"type": "module"`) |
| Slack framework | [`@slack/bolt`](https://github.com/slackapi/bolt-js) v3 |
| Database | AWS DynamoDB via `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` v3 |
| Tests | `node:test` + `node:assert` (zero extra dependencies) |

---

## License

ISC
