# API Design

First backend version only needs these endpoints:

```text
POST /game/start
GET  /game/state
POST /game/buy
POST /game/sell
POST /game/next-day
POST /game/ask-agent
GET  /game/result
```

## Buy/Sell Request

```json
{
  "session_id": "demo-session-001",
  "stock_id": "tech",
  "quantity": 100
}
```

## Ask Agent Request

```json
{
  "session_id": "demo-session-001",
  "agent_id": "trend_follower"
}
```

