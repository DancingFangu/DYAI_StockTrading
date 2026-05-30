"""
交易系统管理子系统 (ADMIN) — 入口

负责：
- 管理员登录与权限管理（RBAC 四级角色）
- 股票基础信息管理（CRUD）
- 涨跌停比例配置
- 交易暂停/重启控制
- 操作日志与审计
- 🎮 游戏参数配置（经验值表、成就模板、事件规则）
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Admin Service",
    description="股票交易系统 - 交易系统管理子系统",
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
    return {"status": "ok", "service": "admin"}


# ── 路由注册 ──
# from admin.api import auth, stocks, limits, control, audit, game_config
# app.include_router(auth.router, prefix="/api/v1/admin/auth", tags=["管理员认证"])
# app.include_router(stocks.router, prefix="/api/v1/admin/stocks", tags=["股票管理"])
# app.include_router(limits.router, prefix="/api/v1/admin/limits", tags=["涨跌停配置"])
# app.include_router(control.router, prefix="/api/v1/admin/control", tags=["交易控制"])
# app.include_router(audit.router, prefix="/api/v1/admin/audit", tags=["审计"])
# app.include_router(game_config.router, prefix="/api/v1/admin/game-config", tags=["游戏配置"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("admin.main:app", host="0.0.0.0", port=8004, reload=True)
