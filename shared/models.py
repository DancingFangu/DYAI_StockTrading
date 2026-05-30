"""
统一响应格式和共享 Pydantic 模型

所有 API 统一使用 ApiResponse 包装返回。
"""

from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime


# ── 通用 API 响应 ──

class ApiResponse(BaseModel):
    """所有接口统一返回格式"""
    success: bool = True
    code: str = "OK"
    message: str = "success"
    data: Any = None
    request_id: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


def ok(data: Any = None, message: str = "success", request_id: str = "") -> ApiResponse:
    """成功响应"""
    return ApiResponse(success=True, code="OK", message=message,
                       data=data, request_id=request_id)


def fail(code: str, message: str, request_id: str = "") -> ApiResponse:
    """失败响应"""
    return ApiResponse(success=False, code=code, message=message,
                       data=None, request_id=request_id)


# ── 分页模型 ──

class PageInfo(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0
    total_pages: int = 0

class PagedData(BaseModel):
    items: list = []
    page: PageInfo = Field(default_factory=PageInfo)


# ── 玩家状态（供成就检测用） ──

class PlayerState(BaseModel):
    """玩家的游戏状态快照，成就引擎用它来判断解锁"""
    investor_id: str = ""
    total_trades: int = 0
    profit_trades: int = 0
    loss_trades: int = 0
    total_cancels: int = 0
    total_profit_rate: float = 0.0      # 累计收益率
    total_assets: float = 0.0           # 总资产
    win_streak: int = 0                 # 当前连胜
    daily_trades: int = 0               # 今日交易数
    different_stocks_traded: list[str] = []  # 交易过的股票代码
    unlocked_achievements: list[str] = []    # 已解锁成就key列表
    had_bankruptcy: bool = False        # 是否破产过
    had_big_loss: bool = False          # 是否亏损超过30%
    consecutive_profit_days: int = 0    # 连续盈利天数
    consecutive_login_days: int = 0     # 连续登录天数
    max_single_position_pct: float = 0.0 # 最大单仓占比
    traded_st_stock: bool = False       # 是否交易过ST股票
    stocks_viewed: int = 0              # 今日查看股票数
    daily_profit_rate: float = 0.0      # 今日收益率
    daily_net_profit: float = 0.0       # 今日净盈利
    daily_cancels: int = 0              # 今日撤单数
    max_position_pct: float = 0.0       # 今日最大仓位占比
    all_trades_profitable: int = 0      # 今天是否全部盈利 (0/1)
