# Architecture

The first version uses a modular monolith instead of five independent stock trading subsystems.

```text
web/
  player UI

server/
  game      session, day progression, result
  market    stocks, prices, daily events
  account   cash, positions, total asset
  trade     buy, sell, validation
  agent     AI trader intent and chat

configs/
  stocks.json
  events.json
  agents.json
  roles/
```

Original subsystem mapping:

| Original | Game Version |
|---|---|
| CLIENT | Web UI |
| TRADE | server trade module |
| ACCOUNT | server account module |
| INFO | server market module |
| ADMIN | config files |

