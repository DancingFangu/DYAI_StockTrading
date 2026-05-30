"""
经验值与等级系统

玩家通过交易、完成挑战、解锁成就来获取经验值（XP）。
升级后解锁新的交易功能和能力。
"""

from game_core.config import GAME_CONFIG

# ── 等级称号 ──
LEVEL_TITLES = {
    1:  "初出茅庐",
    2:  "新手散户",
    3:  "见习交易员",
    4:  "初级操盘手",
    5:  "中级操盘手",
    6:  "资深交易员",
    7:  "高级操盘手",
    8:  "王牌交易员",
    9:  "基金经理",
    10: "对冲基金合伙人",
    11: "华尔街之狼",
    12: "做空大鳄",
    13: "市场庄家",
    14: "资本之王",
    15: "股神",
}

# ── 等级解锁的功能 ──
LEVEL_UNLOCKS = {
    3:  {"id": "price_alert",     "name": "价格提醒",   "desc": "设置目标价，达到自动通知",       "icon": "🔔"},
    5:  {"id": "conditional_order","name": "条件单",     "desc": "止损/止盈自动触发",               "icon": "🎯"},
    8:  {"id": "deep_orderbook",  "name": "深度行情",   "desc": "查看前20档买卖盘口",              "icon": "📊"},
    10: {"id": "leverage_2x",     "name": "杠杆交易2x", "desc": "最高2倍杠杆，放大收益与风险",      "icon": "⚡"},
    12: {"id": "short_selling",   "name": "做空交易",   "desc": "融券卖出，下跌也能赚钱",           "icon": "🔻"},
    15: {"id": "advanced_indicators","name": "高级指标","desc": "MACD / RSI / 布林带 等技术指标",  "icon": "📈"},
}


def calculate_level(xp: int) -> tuple[int, int, int]:
    """
    根据总经验值计算当前等级

    返回:
        (当前等级, 当前等级已获得经验, 升级所需经验)
    """
    thresholds = GAME_CONFIG["level_thresholds"]
    level = 1
    for i, threshold in enumerate(thresholds):
        if xp >= threshold:
            level = i + 1

    current_level_xp = thresholds[level - 1] if level <= len(thresholds) else thresholds[-1]
    xp_in_level = xp - current_level_xp

    if level < len(thresholds):
        xp_to_next = thresholds[level] - current_level_xp
    else:
        xp_to_next = 0  # 满级

    return level, xp_in_level, xp_to_next


def get_title(level: int) -> str:
    """获取等级对应的称号"""
    return LEVEL_TITLES.get(level, LEVEL_TITLES[max(LEVEL_TITLES)])


def get_unlocks(level: int) -> list[dict]:
    """获取该等级已解锁的所有功能"""
    return [
        {"level": k, **v}
        for k, v in sorted(LEVEL_UNLOCKS.items())
        if level >= k
    ]


def get_next_unlock(level: int) -> dict | None:
    """获取下一个即将解锁的功能"""
    for k, v in sorted(LEVEL_UNLOCKS.items()):
        if level < k:
            return {"level": k, **v}
    return None


def xp_for_next_level(current_xp: int) -> int:
    """距离下一级还需要多少经验"""
    level, xp_in, xp_to = calculate_level(current_xp)
    return xp_to - xp_in
