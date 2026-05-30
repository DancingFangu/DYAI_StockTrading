"""
网上信息发布子系统 (INFO) — 入口

负责：
- 实时行情展示（股票价格、成交量、买卖报价）
- K线数据（日/周/月/年）
- 🎮 随机市场新闻事件生成与推送
- 普通/VIP用户差异化服务
- 5秒行情定时刷新
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Info Service",
    description="股票交易系统 - 网上信息发布子系统",
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
    return {"status": "ok", "service": "info"}


# ── 路由注册 ──
# from info.api import market, kline, events, user
# app.include_router(market.router, prefix="/api/v1/info/market", tags=["行情"])
# app.include_router(kline.router, prefix="/api/v1/info/kline", tags=["K线"])
# app.include_router(events.router, prefix="/api/v1/info/events", tags=["市场事件"])
# app.include_router(user.router, prefix="/api/v1/info/users", tags=["用户"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("info.main:app", host="0.0.0.0", port=8003, reload=True)
