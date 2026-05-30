"""
游戏全局参数配置

所有可调数值集中在这里，方便平衡性调整。
不要在其他文件里硬编码游戏参数！
"""

GAME_CONFIG = {
    # ── 经验值 ──
    "xp_per_trade": 10,              # 每笔交易（无论盈亏）基础经验
    "xp_per_profit_trade": 50,       # 盈利交易额外经验
    "xp_per_loss_trade": 5,          # 亏损交易额外经验（至少尝试了）
    "xp_daily_login": 20,            # 每日登录签到经验
    "xp_achievement_bonus": 50,      # 每解锁一个成就的基础奖励（会被成就自身覆盖）

    # ── 等级阈值 (累计经验到达即升级) ──
    "level_thresholds": [
        0,      # Lv.1  初出茅庐
        100,    # Lv.2
        250,    # Lv.3  解锁价格提醒
        500,    # Lv.4
        800,    # Lv.5  解锁条件单
        1200,   # Lv.6
        1700,   # Lv.7
        2300,   # Lv.8  解锁深度行情（前20档）
        3000,   # Lv.9
        4000,   # Lv.10 解锁2x杠杆
        5000,   # Lv.11
        6500,   # Lv.12 解锁做空
        8000,   # Lv.13
        10000,  # Lv.14
        12000,  # Lv.15 解锁高级K线指标
    ],

    # ── 资金 ──
    "initial_balance": 100_000.0,     # 新人初始资金（元）
    "bankruptcy_threshold": 0.50,     # 亏损超过50%视为破产
    "broker_fee_rate": 0.0003,        # 手续费率（万分之三）

    # ── 交易 ──
    "min_trade_quantity": 100,        # 最小交易单位（1手=100股）
    "default_limit_ratio_normal": 0.10,  # 普通股涨跌幅
    "default_limit_ratio_st": 0.05,      # ST股涨跌幅

    # ── 每日挑战 ──
    "daily_challenge_count": 3,       # 每天随机推送几个挑战

    # ── 随机事件 ──
    "event_check_interval_minutes": 10,   # 每10分钟检查是否触发随机事件
}
