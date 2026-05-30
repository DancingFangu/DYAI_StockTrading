from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.game.routes import router as game_router

app = FastAPI(title="AI Agent Trading Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router, prefix="/game", tags=["game"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
