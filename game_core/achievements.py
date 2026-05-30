"""
成就系统

定义了所有可解锁的成就及其检测逻辑。
成就引擎在每次游戏事件发生时检查是否满足解锁条件。
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from game_core.events import GameEvent


@dataclass
class Achievement:
    """一个成就的定义"""
    key: str                    # 唯一标识，如 "first_trade"
    name: str                   # 显示名称
    description: str            # 描述文本
    icon: str                   # emoji 图标
    tier: str = "bronze"        # bronze / silver / gold / legend
    xp_reward: int = 50         # 解锁奖励经验
    hidden: bool = False        # 是否隐藏成就（达成前不显示条件）


# ── 全成就定义 ──
# 按分类组织，方便扩展

ACHIEVEMENTS = {
    # ═══ 交易入门 ═══
    "first_trade": Achievement(
        key="first_trade",  name="第一次交易",
        description="完成人生中第一笔股票交易", icon="🌱",
        tier="bronze", xp_reward=50,
    ),
    "first_profit": Achievement(
        key="first_profit", name="第一桶金",
        description="完成第一笔盈利交易", icon="💰",
        tier="bronze", xp_reward=100,
    ),
    "first_loss": Achievement(
        key="first_loss", name="交学费",
        description="完成第一笔亏损交易（亏损也是学习）", icon="📚",
        tier="bronze", xp_reward=30,
    ),
    "first_cancel": Achievement(
        key="first_cancel", name="撤回操作",
        description="成功撤销一笔未成交的指令", icon="↩️",
        tier="bronze", xp_reward=20,
    ),

    # ═══ 交易量 ═══
    "trader_10": Achievement(
        key="trader_10", name="活跃股民",
        description="累计完成10笔交易", icon="📊",
        tier="bronze", xp_reward=100,
    ),
    "trader_50": Achievement(
        key="trader_50", name="交易达人",
        description="累计完成50笔交易", icon="📈",
        tier="silver", xp_reward=300,
    ),
    "trader_100": Achievement(
        key="trader_100", name="交易狂人",
        description="累计完成100笔交易", icon="🔥",
        tier="gold", xp_reward=500,
    ),
    "trader_500": Achievement(
        key="trader_500", name="高频交易者",
        description="累计完成500笔交易", icon="⚡",
        tier="legend", xp_reward=2000, hidden=True,
    ),
    "day_trader": Achievement(
        key="day_trader", name="日内交易者",
        description="单日完成10笔交易", icon="🏃",
        tier="silver", xp_reward=200,
    ),

    # ═══ 收益 ═══
    "profit_10pct": Achievement(
        key="profit_10pct", name="稳健增长",
        description="累计收益率达到10%", icon="📈",
        tier="bronze", xp_reward=100,
    ),
    "profit_50pct": Achievement(
        key="profit_50pct", name="投资高手",
        description="累计收益率达到50%", icon="💎",
        tier="silver", xp_reward=300,
    ),
    "profit_100pct": Achievement(
        key="profit_100pct", name="翻倍神话",
        description="累计收益率达到100%（翻倍）", icon="🎯",
        tier="gold", xp_reward=500,
    ),
    "profit_500pct": Achievement(
        key="profit_500pct", name="暴涨神话",
        description="累计收益率达到500%", icon="🚀",
        tier="legend", xp_reward=2000, hidden=True,
    ),
    "millionaire": Achievement(
        key="millionaire", name="百万富翁",
        description="总资产达到 ¥1,000,000", icon="👑",
        tier="gold", xp_reward=1000,
    ),
    "ten_millionaire": Achievement(
        key="ten_millionaire", name="千万富翁",
        description="总资产达到 ¥10,000,000", icon="💎",
        tier="legend", xp_reward=5000, hidden=True,
    ),

    # ═══ 连胜 ═══
    "streak_5": Achievement(
        key="streak_5", name="五连胜",
        description="连续5笔交易全部盈利", icon="🔥",
        tier="silver", xp_reward=200,
    ),
    "streak_10": Achievement(
        key="streak_10", name="十连胜",
        description="连续10笔交易全部盈利", icon="💫",
        tier="gold", xp_reward=500,
    ),

    # ═══ 风险 ═══
    "survivor": Achievement(
        key="survivor", name="绝地求生",
        description="亏损超过30%后扭亏为盈", icon="🦅",
        tier="gold", xp_reward=300,
    ),
    "bankruptcy": Achievement(
        key="bankruptcy", name="破产重来",
        description="触发一次破产保护", icon="💀",
        tier="bronze", xp_reward=50,
    ),
    "full_position": Achievement(
        key="full_position", name="满仓干！",
        description="单笔买入使用超过90%的可用资金", icon="🎰",
        tier="silver", xp_reward=150,
    ),

    # ═══ 探索 ═══
    "stock_explorer": Achievement(
        key="stock_explorer", name="市场研究员",
        description="交易过5支不同的股票", icon="🔍",
        tier="bronze", xp_reward=80,
    ),
    "stock_collector": Achievement(
        key="stock_collector", name="股票收藏家",
        description="交易过20支不同的股票", icon="🏆",
        tier="gold", xp_reward=500,
    ),
    "st_stock_trader": Achievement(
        key="st_stock_trader", name="刀尖上的舞者",
        description="成功交易一支ST股票并盈利", icon="🗡️",
        tier="silver", xp_reward=200,
    ),

    # ═══ 持久 ═══
    "daily_login_7": Achievement(
        key="daily_login_7", name="常客",
        description="连续7天登录", icon="📅",
        tier="bronze", xp_reward=100,
    ),
    "daily_login_30": Achievement(
        key="daily_login_30", name="铁粉",
        description="连续30天登录", icon="🗓️",
        tier="silver", xp_reward=500,
    ),
    "perfect_week": Achievement(
        key="perfect_week", name="完美一周",
        description="连续7个交易日每天盈利", icon="💎",
        tier="gold", xp_reward=500,
    ),
}


# ── 成就检测引擎 ──

class AchievementEngine:
    """成就检测引擎

    每个游戏事件到来时，检查相关成就是否满足条件。
    """

    def __init__(self):
        self.achievements = ACHIEVEMENTS

    def get_all(self) -> list[Achievement]:
        """返回所有成就定义"""
        return list(self.achievements.values())

    def check(self, player_state: dict, event_type: GameEvent) -> list[Achievement]:
        """
        根据事件类型检测新解锁的成就

        Args:
            player_state: 玩家当前状态数据，包含:
                - total_trades (int)
                - profit_trades (int)
                - loss_trades (int)
                - total_profit_rate (float)
                - total_assets (float)
                - win_streak (int)
                - daily_trades (int)
                - different_stocks_traded (list[str])
                - unlocked_achievements (list[str])
                - had_bankruptcy (bool)
                - daily_profit_days (int)
                - consecutive_login_days (int)
                - max_single_position_pct (float)
                - traded_st_stock (bool)
            event_type: 触发检测的事件类型

        Returns:
            新解锁的成就列表
        """
        unlocked_keys = set(player_state.get("unlocked_achievements", []))
        newly_unlocked = []

        for ach in self.achievements.values():
            if ach.key in unlocked_keys:
                continue
            if self._matches(ach, player_state, event_type):
                newly_unlocked.append(ach)

        return newly_unlocked

    def _matches(self, ach: Achievement, p: dict, evt: GameEvent) -> bool:
        """判断玩家状态是否满足某个成就的条件"""
        k = ach.key

        # 用简单的条件映射替代 eval，安全且可扩展
        conditions = {

            # ── 交易入门 ──
            "first_trade":       lambda: p.get("total_trades", 0) >= 1,
            "first_profit":      lambda: p.get("profit_trades", 0) >= 1,
            "first_loss":        lambda: p.get("loss_trades", 0) >= 1,
            "first_cancel":      lambda: p.get("total_cancels", 0) >= 1,

            # ── 交易量 ──
            "trader_10":         lambda: p.get("total_trades", 0) >= 10,
            "trader_50":         lambda: p.get("total_trades", 0) >= 50,
            "trader_100":        lambda: p.get("total_trades", 0) >= 100,
            "trader_500":        lambda: p.get("total_trades", 0) >= 500,
            "day_trader":        lambda: p.get("daily_trades", 0) >= 10,

            # ── 收益 ──
            "profit_10pct":      lambda: p.get("total_profit_rate", 0) >= 0.10,
            "profit_50pct":      lambda: p.get("total_profit_rate", 0) >= 0.50,
            "profit_100pct":     lambda: p.get("total_profit_rate", 0) >= 1.00,
            "profit_500pct":     lambda: p.get("total_profit_rate", 0) >= 5.00,
            "millionaire":       lambda: p.get("total_assets", 0) >= 1_000_000,
            "ten_millionaire":   lambda: p.get("total_assets", 0) >= 10_000_000,

            # ── 连胜 ──
            "streak_5":          lambda: p.get("win_streak", 0) >= 5,
            "streak_10":         lambda: p.get("win_streak", 0) >= 10,

            # ── 风险 ──
            "survivor":          lambda: p.get("had_big_loss", False) and p.get("total_profit_rate", 0) > 0,
            "bankruptcy":        lambda: p.get("had_bankruptcy", False),
            "full_position":     lambda: p.get("max_single_position_pct", 0) >= 0.90,

            # ── 探索 ──
            "stock_explorer":    lambda: len(p.get("different_stocks_traded", [])) >= 5,
            "stock_collector":   lambda: len(p.get("different_stocks_traded", [])) >= 20,
            "st_stock_trader":   lambda: p.get("traded_st_stock", False) and p.get("profit_trades", 0) > 0,

            # ── 持久 ──
            "daily_login_7":     lambda: p.get("consecutive_login_days", 0) >= 7,
            "daily_login_30":    lambda: p.get("consecutive_login_days", 0) >= 30,
            "perfect_week":      lambda: p.get("consecutive_profit_days", 0) >= 7,
        }

        checker = conditions.get(k)
        if checker:
            return checker()
        return False
