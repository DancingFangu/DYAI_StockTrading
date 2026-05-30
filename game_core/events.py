"""
游戏事件系统

定义了游戏中所有可能发生的事件类型和事件总线。
TRADE 引擎是主要的事件生产者，CLIENT 是主要的消费者。
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from collections import defaultdict
from typing import Callable, Any


class GameEvent(str, Enum):
    """游戏中所有可能的事件类型"""

    # ── 交易流程事件 ──
    ORDER_SUBMITTED       = "order.submitted"         # 指令已提交
    ORDER_ACCEPTED        = "order.accepted"          # 指令通过校验
    ORDER_REJECTED        = "order.rejected"          # 指令被拒绝
    ORDER_QUEUED          = "order.queued"            # 指令进入订单簿
    ORDER_PARTIALLY_FILLED = "order.partially_filled" # 部分成交
    ORDER_FILLED          = "order.filled"            # 完全成交
    ORDER_CANCELLED       = "order.cancelled"         # 已撤销
    ORDER_EXPIRED         = "order.expired"           # 已过期

    # ── 收益事件 ──
    TRADE_PROFIT          = "trade.profit"            # 单笔交易盈利
    TRADE_LOSS            = "trade.loss"              # 单笔交易亏损

    # ── 玩家行为事件 ──
    PLAYER_LOGIN          = "player.login"            # 登录
    PLAYER_LOGOUT         = "player.logout"           # 登出
    PLAYER_REGISTER       = "player.register"         # 注册
    STOCK_VIEWED          = "stock.viewed"            # 查看某支股票
    PORTFOLIO_CHECKED     = "portfolio.checked"       # 查看持仓
    LEADERBOARD_CHECKED   = "leaderboard.checked"     # 查看排行榜

    # ── 游戏进度事件 ──
    XP_GAINED             = "xp.gained"               # 获得经验
    LEVEL_UP              = "player.level_up"         # 升级
    ACHIEVEMENT_UNLOCKED  = "achievement.unlocked"    # 解锁成就
    CHALLENGE_COMPLETED   = "challenge.completed"     # 完成每日挑战
    SKILL_UPGRADED        = "skill.upgraded"          # 技能升级

    # ── 市场事件 ──
    MARKET_NEWS           = "market.news"             # 随机新闻
    MARKET_CRASH          = "market.crash"            # 市场崩盘
    STOCK_HALTED          = "stock.halted"            # 股票停牌
    STOCK_RESUMED         = "stock.resumed"           # 股票复牌
    TRADING_DAY_OPEN      = "trading_day.open"        # 交易日开盘
    TRADING_DAY_CLOSE     = "trading_day.close"       # 交易日收盘

    # ── 竞技事件 ──
    ARENA_CREATED         = "arena.created"           # 创建对战房间
    ARENA_JOINED          = "arena.joined"            # 加入对战
    ARENA_FINISHED        = "arena.finished"          # 对战结束

    # ── 破产事件 ──
    BANKRUPT              = "player.bankrupt"         # 资金亏损达阈值


@dataclass
class Event:
    """游戏事件的数据载体"""
    type: GameEvent
    data: dict
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    source: str = ""  # 来源服务名


# ── 事件总线 ──
# 支持多路监听，用于解耦游戏逻辑和交易逻辑

class EventBus:
    """简单的内存事件总线"""

    def __init__(self):
        self._listeners: dict[GameEvent, list[Callable]] = defaultdict(list)

    def on(self, event_type: GameEvent, callback: Callable):
        """注册事件监听器"""
        self._listeners[event_type].append(callback)

    def off(self, event_type: GameEvent, callback: Callable):
        """移除事件监听器"""
        if event_type in self._listeners:
            self._listeners[event_type] = [
                cb for cb in self._listeners[event_type] if cb != callback
            ]

    async def emit(self, event: Event):
        """发射事件，异步通知所有监听器"""
        callbacks = self._listeners.get(event.type, [])
        for callback in callbacks:
            try:
                await callback(event)
            except Exception as e:
                # 一个监听器挂了不能影响其他
                import logging
                logging.error(f"EventBus callback error for {event.type}: {e}")

    async def emit_simple(self, event_type: GameEvent, data: dict, source: str = ""):
        """简化版发射"""
        await self.emit(Event(type=event_type, data=data, source=source))
