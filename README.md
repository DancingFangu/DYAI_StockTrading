# AI Agent Trading Game

This repository contains a Web-based single-player stock trading game demo.

The first playable version is intentionally simple:

- 1 player
- 7 trading days per round
- 5 virtual stocks
- 6 AI trader agents
- random daily events
- instant buy/sell execution
- final asset rating

See `game.md` for the current product and gameplay design.

## Project Layout

```text
web/        Web player UI
server/     FastAPI game backend
configs/    stocks, events, agents, and role configs
docs/       implementation notes and API drafts
web-demo/   earlier static prototype
roles_md/   existing role markdown package
```

## First Build Target

Build the shortest playable loop:

```text
start game -> view stocks -> buy/sell -> AI acts -> next day -> day 7 result
```

