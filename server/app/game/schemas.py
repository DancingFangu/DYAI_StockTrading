from pydantic import BaseModel, Field


class StockSnapshot(BaseModel):
    id: str
    name: str
    price: float
    change: float


class AskAgentRequest(BaseModel):
    session_id: str = "demo-session-001"
    agent_id: str
    agent_name: str
    role: str
    favorite_stock: str
    day: int = Field(ge=1, le=7)
    event_title: str
    event_description: str
    market_shock: str = ""
    stocks: list[StockSnapshot]


class AskAgentResponse(BaseModel):
    message: str
    source: str
