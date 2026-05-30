"""
每日挑战系统

每天随机给玩家推送 N 个挑战任务，完成可获得额外经验值奖励。
"""

import random
from dataclasses import dataclass
from datetime import date


@dataclass
class Challenge:
    """一个挑战任务的定义"""
    id: str
    name: str
    description: str
    icon: str
    xp_reward: int
    check_type: str       # 检测类型
    target: int | float   # 目标值
    difficulty: str = "easy"  # easy / medium / hard


# ── 挑战池 ──
# 按难度分组，每天从每组随机抽取

EASY_CHALLENGES = [
    Challenge(
        id="view_5", name="随便看看",
        description="查看5支不同股票的行情",
        icon="👀", xp_reward=20, check_type="stocks_viewed", target=5,
    ),
    Challenge(
        id="trade_1", name="初次尝试",
        description="今天完成1笔交易",
        icon="🔄", xp_reward=30, check_type="daily_trades", target=1,
    ),
    Challenge(
        id="login", name="每日签到",
        description="登录即可完成",
        icon="✅", xp_reward=10, check_type="login", target=1,
    ),
    Challenge(
        id="cancel_1", name="撤回操作",
        description="撤销1笔未成交指令",
        icon="↩️", xp_reward=20, check_type="daily_cancels", target=1,
    ),
]

MEDIUM_CHALLENGES = [
    Challenge(
        id="trade_3", name="活跃交易者",
        description="今天完成3笔交易",
        icon="📊", xp_reward=60, check_type="daily_trades", target=3,
        difficulty="medium",
    ),
    Challenge(
        id="profit_2", name="两连胜",
        description="今天完成2笔盈利交易",
        icon="💹", xp_reward=80, check_type="profit_trades", target=2,
        difficulty="medium",
    ),
    Challenge(
        id="view_10", name="市场研究员",
        description="查看10支不同股票的行情",
        icon="🔍", xp_reward=40, check_type="stocks_viewed", target=10,
        difficulty="medium",
    ),
    Challenge(
        id="different_3", name="多元化",
        description="今天交易3支不同的股票",
        icon="🎯", xp_reward=70, check_type="different_stocks_traded", target=3,
        difficulty="medium",
    ),
]

HARD_CHALLENGES = [
    Challenge(
        id="profit_5pct", name="日收益率5%",
        description="今天总收益率超过5%",
        icon="🚀", xp_reward=200, check_type="daily_profit_rate", target=0.05,
        difficulty="hard",
    ),
    Challenge(
        id="trade_10", name="高频交易者",
        description="今天完成10笔交易",
        icon="⚡", xp_reward=150, check_type="daily_trades", target=10,
        difficulty="hard",
    ),
    Challenge(
        id="no_loss", name="稳如泰山",
        description="今天所有交易全部盈利",
        icon="💎", xp_reward=120, check_type="all_trades_profitable", target=1,
        difficulty="hard",
    ),
    Challenge(
        id="profit_1000", name="日入千元",
        description="今天净盈利超过¥1,000",
        icon="💰", xp_reward=150, check_type="daily_net_profit", target=1000.0,
        difficulty="hard",
    ),
    Challenge(
        id="full_trade", name="极限操作",
        description="用超过80%的可用资金完成一笔买入",
        icon="🎰", xp_reward=100, check_type="max_position_pct", target=0.80,
        difficulty="hard",
    ),
]

ALL_CHALLENGES = EASY_CHALLENGES + MEDIUM_CHALLENGES + HARD_CHALLENGES


class ChallengeManager:
    """每日挑战管理器"""

    def __init__(self, seed: int | None = None):
        self.rng = random.Random(seed or date.today().toordinal())

    def generate_daily(self, count: int = 3) -> list[Challenge]:
        """
        生成今日挑战列表

        规则:
            - 1个简单 + 1个中等 + 1个困难
            - 用当日日期做种子，保证同一天所有人看到一样的挑战
        """
        easy = self.rng.choice(EASY_CHALLENGES)
        medium = self.rng.choice(MEDIUM_CHALLENGES)
        hard = self.rng.choice(HARD_CHALLENGES)
        return [easy, medium, hard]

    def check_progress(self, challenge: Challenge, player_state: dict) -> tuple[bool, float]:
        """
        检查某个挑战的完成进度

        Returns:
            (是否完成, 完成百分比 0.0~1.0)
        """
        current = player_state.get(challenge.check_type, 0)
        target = challenge.target

        if challenge.check_type == "all_trades_profitable":
            # 特殊：今天所有交易都盈利
            total = player_state.get("daily_trades", 0)
            profit = player_state.get("profit_trades", 0)
            if total == 0:
                return False, 0.0
            return total == profit, 1.0 if total == profit else profit / total

        if isinstance(target, (int, float)) and target > 0:
            progress = min(current / target, 1.0)
            return current >= target, progress

        return current >= target, 1.0 if current >= target else 0.0

    @staticmethod
    def get_by_id(challenge_id: str) -> Challenge | None:
        """根据ID查找挑战"""
        for c in ALL_CHALLENGES:
            if c.id == challenge_id:
                return c
        return None
