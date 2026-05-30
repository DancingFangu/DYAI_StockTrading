from fastapi import APIRouter

from app.agent.service import ask_deepseek_agent
from app.game.schemas import AskAgentRequest, AskAgentResponse

router = APIRouter()


@router.post("/start")
def start_game() -> dict[str, str]:
    return {"message": "game start endpoint placeholder"}


@router.get("/state")
def get_game_state() -> dict[str, str]:
    return {"message": "game state endpoint placeholder"}


@router.post("/ask-agent", response_model=AskAgentResponse)
def ask_agent(request: AskAgentRequest) -> AskAgentResponse:
    return ask_deepseek_agent(request)
