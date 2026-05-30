"""
账户业务子系统 (ACCOUNT) — 入口

负责：
- 投资者注册与登录认证
- 资金账户管理（余额、冻结、释放、结算）
- 证券账户管理（持仓、冻结、释放、结算）
- 账户关联校验
- 游戏进度持久化（XP、等级、成就、技能）
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Account Service",
    description="股票交易系统 - 账户业务子系统",
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
    return {"status": "ok", "service": "account"}


# ── 数据库初始化 ──
# 将在 account/database.py 中定义

# ── 路由注册 ──
# from account.api import auth, fund, security, game_progress
# app.include_router(auth.router, prefix="/api/v1/account/auth", tags=["认证"])
# app.include_router(fund.router, prefix="/api/v1/account/fund-accounts", tags=["资金账户"])
# app.include_router(security.router, prefix="/api/v1/account/security-accounts", tags=["证券账户"])
# app.include_router(game_progress.router, prefix="/api/v1/account/game", tags=["游戏进度"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("account.main:app", host="0.0.0.0", port=8002, reload=True)
