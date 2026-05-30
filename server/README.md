# Server

FastAPI backend for the trading game.

Planned internal modules:

- `game`: session and day progression
- `market`: stocks, prices, random events
- `account`: cash, positions, total asset
- `trade`: buy/sell validation and execution
- `agent`: AI trader intent and chat

## DeepSeek Agent API

Set the API key in the backend environment before starting FastAPI:

```powershell
$env:DEEPSEEK_API_KEY="your-deepseek-api-key"
py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Optional variables:

- `DEEPSEEK_BASE_URL`, default `https://api.deepseek.com`
- `DEEPSEEK_MODEL`, default `deepseek-v4-flash`

The web demo calls `http://127.0.0.1:8000/game/ask-agent`. Do not put the DeepSeek key in the web frontend.
