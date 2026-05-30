import json
import urllib.error
import urllib.request

from app.core.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from app.game.schemas import AskAgentRequest, AskAgentResponse


def build_fallback_response(request: AskAgentRequest) -> AskAgentResponse:
    favorite = next((stock for stock in request.stocks if stock.id == request.favorite_stock), None)
    stock_name = favorite.name if favorite else request.favorite_stock
    return AskAgentResponse(
        message=(
            f"{request.agent_name}: DeepSeek API 尚未连接，我先按{request.role}的习惯判断。"
            f"我会盯住{stock_name}，同时观察「{request.event_title}」是否继续放大波动。"
        ),
        source="fallback",
    )


def ask_deepseek_agent(request: AskAgentRequest) -> AskAgentResponse:
    if not DEEPSEEK_API_KEY:
        return build_fallback_response(request)

    stock_lines = [
        f"- {stock.name}: 现价 {stock.price:.2f}, 涨跌 {stock.change * 100:+.2f}%"
        for stock in request.stocks
    ]
    prompt = "\n".join(
        [
            f"交易日: D{request.day}/7",
            f"当前事件: {request.event_title} - {request.event_description}",
            f"市场冲击: {request.market_shock or '暂无'}",
            "股票快照:",
            *stock_lines,
        ]
    )
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个炒股模拟游戏里的AI交易员。"
                    "请严格扮演指定人设，用第一人称中文回答。"
                    "回答必须短、像交易员临场判断，不超过80字。"
                    "不要声称知道内幕，不要替玩家下单，只透露你的倾向。"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"你的名字是{request.agent_name}，角色是{request.role}，偏好股票ID是{request.favorite_stock}。\n"
                    f"{prompt}\n"
                    "请给玩家一句可用于打探的交易想法。"
                ),
            },
        ],
        "temperature": 0.9,
        "max_tokens": 160,
        "stream": False,
    }
    api_request = urllib.request.Request(
        f"{DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(api_request, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return build_fallback_response(request)

    message = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not message:
        return build_fallback_response(request)
    return AskAgentResponse(message=message[:180], source="deepseek")
