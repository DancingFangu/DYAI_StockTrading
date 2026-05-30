"""
交易客户端 (CLIENT) — 入口

负责：
- 投资者交互界面（Web前端 + API）
- 登录/注册/密码修改
- 股票行情查看
- 持仓与资金查询
- 买卖指令提交与撤单
- 交易结果展示

🎮 游戏化 UI 层：
- 经验条、等级展示
- 成就弹窗动画
- 每日挑战进度
- 排行榜
- 技能树面板
"""

import json
import os
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

_STATIC_DIR = Path(__file__).parent / "static"
_ROOT_DIR = Path(__file__).parent.parent


def _load_dotenv() -> None:
    """极简 .env 加载（无第三方依赖），仅在变量未设置时注入。"""
    for candidate in (_ROOT_DIR / ".env", Path.cwd() / ".env"):
        if not candidate.exists():
            continue
        for line in candidate.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
        break


_load_dotenv()

# DeepSeek 配置
# 默认内置一个共享 key，方便队友零配置直接跑；如需用自己的 key，
# 在项目根目录建 .env 写 DEEPSEEK_API_KEY=xxx 即可覆盖。
# 注意：密钥仅在后端使用，绝不下发到前端。
_DEFAULT_DEEPSEEK_KEY = "sk-d4a494037b7b4077a4091f8eef909b4c"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "") or _DEFAULT_DEEPSEEK_KEY
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

app = FastAPI(
    title="Trading Client",
    description="股票交易系统 - 交易客户端",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "client", "deepseek": bool(DEEPSEEK_API_KEY)}


# ── AI 交易员在线发言（接 DeepSeek）──
class _SpeechReq(BaseModel):
    day: int = 1
    sentiment: str = ""
    news: list[str] = []
    stocks: list[str] = []
    # 每个 agent: {name, persona, dir(真实方向), mode(发言策略)}
    agents: list[dict] = []


@app.post("/api/ai-speeches")
async def ai_speeches(req: _SpeechReq):
    """让 DeepSeek 为 6 个 AI 交易员各生成一句盘前公开发言。

    重要：DeepSeek 只产出『公开发言文本』。真实方向/策略由前端本地决定后作为
    上下文传入（仅用于让发言口吻一致），结算与识破判定全在本地，绝不由大模型决定。
    """
    if not DEEPSEEK_API_KEY:
        return {"ok": False, "reason": "no_key"}

    system = (
        "你是股票交易桌游《股票大亨》的台词生成器。牌桌上有6个性格迥异的AI交易员，"
        "每人盘前会公开说一句话。请依据每个交易员的 persona(性格)、dir(他内心真实看法)、"
        "mode(发言策略：真心=如实说/虚张声势=夸大或装腔/反向喊话=故意说反话误导对手)，"
        "为每人生成一句【公开发言】。要求：中文口语、12~30字、有鲜明性格、像真人在牌桌上互相试探，"
        "可结合今日新闻与在场股票名。严格只输出 JSON。"
    )
    user = {
        "今日第几天": req.day,
        "今日市场情绪": req.sentiment,
        "今日新闻": req.news,
        "在场股票": req.stocks,
        "交易员": req.agents,
        "输出格式": {"speeches": [{"name": "交易员名", "message": "他说的一句话"}]},
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 1.2,
        "max_tokens": 700,
    }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
                json=payload,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            return {"ok": True, "speeches": data.get("speeches", [])}
    except Exception as exc:  # 任何失败都让前端回退本地台词
        return {"ok": False, "reason": str(exc)[:160]}


# ── 今日新闻在线生成（接 DeepSeek）──
class _NewsReq(BaseModel):
    day: int = 1
    # 每条: {stock(公司名/"大盘"), industry(行业), dir(+1利好/-1利空)}
    items: list[dict] = []


@app.post("/api/news")
async def gen_news(req: _NewsReq):
    """根据本地已锁定的(目标股/行业/方向)，让 DeepSeek 写出生动的财经新闻标题。

    DeepSeek 只产出『文案』；目标股票、利好/利空、真假全部在前端本地决定，
    并由本地结算逻辑生效——保证新闻紧扣真实个股、有游戏影响，而不是随机废话。
    """
    if not DEEPSEEK_API_KEY or not req.items:
        return {"ok": False, "reason": "no_key_or_empty"}

    system = (
        "你是股票交易游戏《股票大亨》的财经新闻生成器。给你若干条目(公司名、行业、方向)，"
        "为每条生成一句像真实财经快讯/小道消息的中文新闻标题：12~40字，具体有画面感"
        "(谁、在哪、做了什么事)，自然地暗示给定方向(利好或利空)，但绝不出现'利好/利空'字样、"
        "也不要透露真假。按输入顺序一一对应，严格只输出 JSON。"
    )
    items = [
        {
            "公司": it.get("stock", ""),
            "行业": it.get("industry", ""),
            "方向": "利好" if it.get("dir", 1) > 0 else "利空",
        }
        for it in req.items
    ]
    user = {
        "今日第几天": req.day,
        "条目": items,
        "输出格式": {"news": [{"text": "新闻标题"}]},
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 1.1,
        "max_tokens": 500,
    }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                DEEPSEEK_URL,
                headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
                json=payload,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            return {"ok": True, "news": data.get("news", [])}
    except Exception as exc:  # 失败回退本地新闻库
        return {"ok": False, "reason": str(exc)[:160]}


@app.get("/", response_class=HTMLResponse)
async def index():
    """游戏主页 - 显示所有子服务状态"""
    return _HOME_HTML


@app.get("/game", response_class=HTMLResponse)
async def game():
    """🃏 地下交易酒馆 — 核心玩法原型（骗子酒馆风格）"""
    return FileResponse(_STATIC_DIR / "tavern_demo.html")


# ── 路由注册 ──
# from client.api import dashboard, orders, portfolio, leaderboard
# app.include_router(dashboard.router, prefix="/api/v1/client", tags=["仪表盘"])
# app.include_router(orders.router, prefix="/api/v1/client/orders", tags=["交易指令"])
# app.include_router(portfolio.router, prefix="/api/v1/client/portfolio", tags=["投资组合"])
# app.include_router(leaderboard.router, prefix="/api/v1/client/leaderboard", tags=["排行榜"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("client.main:app", host="0.0.0.0", port=8000, reload=True)


# ── 主页 HTML ──
_HOME_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>🎮 股票大亨 — Stock Trading Game</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Microsoft YaHei',sans-serif;background:#0a0e27;color:#e0e0e0;
display:flex;align-items:center;justify-content:center;min-height:100vh}
.container{text-align:center;max-width:650px;padding:40px}
h1{font-size:3.5rem;margin-bottom:8px;
background:linear-gradient(135deg,#f6d365,#fda085);
-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{color:#8892b0;font-size:1.1rem;margin-bottom:40px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:30px}
.card{background:#1a1f3a;border:1px solid #2a2f4a;border-radius:12px;padding:20px;transition:all .3s}
.card:hover{border-color:#f6d365;transform:translateY(-2px)}
.card .icon{font-size:2rem}.card .name{font-size:.9rem;color:#8892b0;margin:8px 0}
.card .status{font-size:.85rem}.card .online{color:#4caf50}.card .offline{color:#f44336}
.btn{display:inline-block;padding:12px 32px;margin:10px;border:none;border-radius:8px;
font-size:1rem;cursor:pointer;text-decoration:none;transition:all .3s}
.btn-primary{background:linear-gradient(135deg,#f6d365,#fda085);color:#1a1f3a;font-weight:bold}
.btn-primary:hover{transform:scale(1.05)}
.btn-outline{background:transparent;border:1px solid #4a4f6a;color:#e0e0e0}
.btn-outline:hover{border-color:#f6d365}
.version{color:#555;font-size:.8rem;margin-top:30px}
</style>
</head>
<body>
<div class="container">
<h1>🎮 股票大亨</h1>
<p class="subtitle">从散户到股神的传奇之路</p>
<div class="grid">
<div class="card"><div class="icon">🏦</div><div class="name">账户服务 ACCOUNT</div><div class="status offline" id="s-account">检测中...</div></div>
<div class="card"><div class="icon">⚡</div><div class="name">交易引擎 TRADE</div><div class="status offline" id="s-trade">检测中...</div></div>
<div class="card"><div class="icon">📊</div><div class="name">行情服务 INFO</div><div class="status offline" id="s-info">检测中...</div></div>
<div class="card"><div class="icon">⚙️</div><div class="name">管理系统 ADMIN</div><div class="status offline" id="s-admin">检测中...</div></div>
</div>
<a href="/game" class="btn btn-primary">🃏 进入地下交易酒馆</a>
<a href="/docs" class="btn btn-outline">📖 API文档</a>
<p class="version">v0.1.0 • 浙江大学软件工程课程项目</p>
</div>
<script>
[{n:"account",p:8002},{n:"trade",p:8001},{n:"info",p:8003},{n:"admin",p:8004}].forEach(s=>{
fetch(`http://localhost:${s.p}/health`).then(r=>r.json()).then(d=>{
let e=document.getElementById(`s-${s.n}`);
if(d.status==='ok'){e.textContent='✅ 在线';e.className='status online'}
}).catch(()=>{let e=document.getElementById(`s-${s.n}`);e.textContent='❌ 离线';e.className='status offline'})
})
</script>
</body>
</html>"""
