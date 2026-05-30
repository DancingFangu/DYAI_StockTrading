"""
技能树系统

玩家升级后获得技能点，可以在技能树上分配。

每项技能最高5级，不同技能影响交易的不同方面：
- 基本面分析：显示股票"内在价值"估算，精度随等级提升
- 技术分析：解锁更多K线指标
- 人脉网络：降低手续费，提前获知新闻事件
- 风险管理：止损/仓位控制能力
- 量化交易：自动化交易策略
"""

from dataclasses import dataclass


@dataclass
class Skill:
    """单个技能的定义"""
    id: str
    name: str
    category: str       # 所属分类
    icon: str
    max_level: int = 5
    description: str = ""


@dataclass
class SkillLevel:
    """技能每一级的效果"""
    level: int
    cost: int           # 升级所需技能点
    effect_desc: str    # 效果描述
    effect_data: dict   # 效果的量化数据


# ── 技能树定义 ──

SKILL_TREE = {
    # ═══ 基本面分析 ═══
    "fundamental": Skill(
        id="fundamental", name="基本面分析", category="analysis",
        icon="📋",
        description="深入分析公司财务，估算股票内在价值",
    ),
    # ═══ 技术分析 ═══
    "technical": Skill(
        id="technical", name="技术分析", category="analysis",
        icon="📈",
        description="掌握K线图和各种技术指标",
    ),
    # ═══ 人脉网络 ═══
    "network": Skill(
        id="network", name="人脉网络", category="resource",
        icon="🤝",
        description="业内人脉带来信息优势和费率优惠",
    ),
    # ═══ 风险管理 ═══
    "risk_mgmt": Skill(
        id="risk_mgmt", name="风险管理", category="defense",
        icon="🛡️",
        description="控制仓位，设置止损，降低回撤",
    ),
    # ═══ 量化交易 ═══
    "quant": Skill(
        id="quant", name="量化交易", category="automation",
        icon="🤖",
        description="使用算法和自动化策略辅助交易",
    ),
}


# ── 每级效果 ──

SKILL_LEVELS = {
    "fundamental": [
        SkillLevel(1, 1, "查看内在价值估算（误差±30%）",
                   {"value_accuracy": 0.30}),
        SkillLevel(2, 1, "误差缩小到±25%，显示PE估值",
                   {"value_accuracy": 0.25, "show_pe": True}),
        SkillLevel(3, 2, "误差缩小到±20%，显示PB估值",
                   {"value_accuracy": 0.20, "show_pb": True}),
        SkillLevel(4, 2, "误差缩小到±15%，显示ROE",
                   {"value_accuracy": 0.15, "show_roe": True}),
        SkillLevel(5, 3, "误差缩小到±10%，综合评分",
                   {"value_accuracy": 0.10, "show_score": True}),
    ],
    "technical": [
        SkillLevel(1, 1, "解锁移动均线 MA(5/10/20)",
                   {"indicators": ["MA5", "MA10", "MA20"]}),
        SkillLevel(2, 1, "解锁成交量分析 VOL",
                   {"indicators": ["VOL"]}),
        SkillLevel(3, 2, "解锁 MACD 指标",
                   {"indicators": ["MACD"]}),
        SkillLevel(4, 2, "解锁 RSI 相对强弱指标",
                   {"indicators": ["RSI"]}),
        SkillLevel(5, 3, "解锁布林带 Bollinger Bands",
                   {"indicators": ["BOLL"]}),
    ],
    "network": [
        SkillLevel(1, 1, "手续费9折",
                   {"fee_discount": 0.10}),
        SkillLevel(2, 1, "新闻事件提前1分钟通知",
                   {"news_early_seconds": 60, "fee_discount": 0.15}),
        SkillLevel(3, 2, "手续费8折，提前3分钟",
                   {"news_early_seconds": 180, "fee_discount": 0.20}),
        SkillLevel(4, 2, "手续费7折，提前5分钟",
                   {"news_early_seconds": 300, "fee_discount": 0.30}),
        SkillLevel(5, 3, "手续费5折，提前10分钟",
                   {"news_early_seconds": 600, "fee_discount": 0.50}),
    ],
    "risk_mgmt": [
        SkillLevel(1, 1, "自动止损（最大亏损-3%）",
                   {"stop_loss_pct": 0.03}),
        SkillLevel(2, 1, "止损范围扩大至-5%",
                   {"stop_loss_pct": 0.05}),
        SkillLevel(3, 2, "解锁动态止损（追踪止损）",
                   {"trailing_stop": True}),
        SkillLevel(4, 2, "单仓位上限提醒",
                   {"position_limit_warning": True}),
        SkillLevel(5, 3, "组合风险分析（VaR）",
                   {"var_analysis": True}),
    ],
    "quant": [
        SkillLevel(1, 1, "解锁条件单（止损/止盈）",
                   {"conditional_orders": True}),
        SkillLevel(2, 1, "解锁网格交易策略",
                   {"grid_trading": True}),
        SkillLevel(3, 2, "解锁均值回归策略",
                   {"mean_reversion": True}),
        SkillLevel(4, 2, "解锁动量交易策略",
                   {"momentum": True}),
        SkillLevel(5, 3, "AI辅助决策推荐",
                   {"ai_recommendation": True}),
    ],
}


# ── 技能效果聚合 ──

def get_player_effects(skill_levels: dict[str, int]) -> dict:
    """
    根据玩家所有技能的等级，聚合所有效果

    Args:
        skill_levels: {"fundamental": 3, "technical": 1, ...}

    Returns:
        聚合后的效果字典，供交易系统读取
    """
    effects = {
        "fee_discount": 0.0,
        "news_early_seconds": 0,
        "indicators": [],
        "stop_loss_pct": 0.0,
        "value_accuracy": 1.0,
        "conditional_orders": False,
        "grid_trading": False,
        "trailing_stop": False,
        "ai_recommendation": False,
    }

    for skill_id, player_level in skill_levels.items():
        if skill_id not in SKILL_LEVELS:
            continue
        for sl in SKILL_LEVELS[skill_id]:
            if sl.level <= player_level:
                # 合并效果（数值取最大/最优，列表累加）
                for k, v in sl.effect_data.items():
                    if isinstance(v, bool):
                        effects[k] = effects.get(k, False) or v
                    elif isinstance(v, list):
                        existing = effects.get(k, [])
                        effects[k] = existing + [x for x in v if x not in existing]
                    elif isinstance(v, (int, float)):
                        if k == "fee_discount":
                            effects[k] = max(effects.get(k, 0), v)
                        else:
                            effects[k] = v  # 取最高等级的值
    return effects
