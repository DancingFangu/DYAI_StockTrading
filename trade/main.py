"""
中央交易子系统 (TRADE) — 入口

负责：
- 指令接收与多层级校验
- 订单簿维护（买卖队列）
- 连续竞价撮合引擎
- 成交记录生成与结算消息
- 🎮 游戏事件发射（成就检测、经验发放）
- 交易日生命周期管理
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Central Trade System",
    description="股票交易系统 - 中央交易子系统",
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
    return {"status": "ok", "service": "trade"}


# ── 路由注册 ──
# from trade.api import orders, orderbook, market, trading_day
# app.include_router(orders.router, prefix="/api/v1/trade/orders", tags=["指令"])
# app.include_router(orderbook.router, prefix="/api/v1/trade/order-books", tags=["订单簿"])
# app.include_router(market.router, prefix="/api/v1/trade/market", tags=["行情快照"])
# app.include_router(trading_day.router, prefix="/api/v1/trade/trading-days", tags=["交易日"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("trade.main:app", host="0.0.0.0", port=8001, reload=True)
