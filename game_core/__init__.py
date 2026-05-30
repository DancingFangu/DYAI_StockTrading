"""
Game Core — 股票交易游戏核心共享包

所有子系统 (CLIENT / TRADE / ACCOUNT / INFO / ADMIN) 都 import 这个包，
确保游戏机制在架构底层统一。

模块:
    events.py       — 游戏事件枚举与事件总线
    config.py       — 游戏全局参数配置
    achievements.py — 成就定义与检测引擎
    levels.py       — 经验值与等级计算
    challenges.py   — 每日挑战定义
    skills.py       — 技能树定义
"""

__version__ = "0.1.0"
