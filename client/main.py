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

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

_STATIC_DIR = Path(__file__).parent / "static"

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
    return {"status": "ok", "service": "client"}


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
