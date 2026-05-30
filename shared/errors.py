"""
统一错误码定义

所有子系统使用同一套错误码，方便前端统一处理。
命名规范: <模块代号>_E<序号>
"""

from enum import Enum


class ErrorCode(str, Enum):
    """统一错误码"""

    # ── 通用 ──
    OK = "OK"
    COMMON_BAD_REQUEST = "COMMON_E01"
    COMMON_UNAUTHORIZED = "COMMON_E02"
    COMMON_FORBIDDEN = "COMMON_E03"
    COMMON_NOT_FOUND = "COMMON_E04"
    COMMON_CONFLICT = "COMMON_E05"
    COMMON_INTERNAL_ERROR = "COMMON_E06"
    COMMON_VALIDATION_ERROR = "COMMON_E07"
    COMMON_RATE_LIMITED = "COMMON_E08"

    # ── 认证 (ACCOUNT) ──
    AUTH_INVALID_CREDENTIALS = "AUTH_E01"
    AUTH_ACCOUNT_LOCKED = "AUTH_E02"
    AUTH_ACCOUNT_DISABLED = "AUTH_E03"
    AUTH_TOKEN_EXPIRED = "AUTH_E04"
    AUTH_WEAK_PASSWORD = "AUTH_E05"
    AUTH_CERT_REQUIRED = "AUTH_E06"

    # ── 账户 (ACCOUNT) ──
    ACCOUNT_NOT_FOUND = "ACCOUNT_E01"
    ACCOUNT_INSUFFICIENT_FUNDS = "ACCOUNT_E02"
    ACCOUNT_INSUFFICIENT_POSITION = "ACCOUNT_E03"
    ACCOUNT_FREEZE_FAILED = "ACCOUNT_E04"
    ACCOUNT_RELEASE_FAILED = "ACCOUNT_E05"
    ACCOUNT_SETTLE_FAILED = "ACCOUNT_E06"

    # ── 交易 (TRADE) ──
    TRADE_FIELD_MISSING = "TRADE_E01"
    TRADE_STOCK_NOT_FOUND = "TRADE_E02"
    TRADE_STOCK_NOT_TRADABLE = "TRADE_E03"
    TRADE_ORDER_NOT_FOUND = "TRADE_E04"
    TRADE_PRICE_OUT_OF_BOUNDS = "TRADE_E05"
    TRADE_PRICE_BELOW_LIMIT = "TRADE_E06"
    TRADE_PRICE_INVALID = "TRADE_E07"
    TRADE_QUANTITY_INVALID = "TRADE_E08"
    TRADE_CANNOT_CANCEL = "TRADE_E09"
    TRADE_DUPLICATE_ORDER = "TRADE_E10"

    # ── 行情 (INFO) ──
    INFO_STOCK_NOT_FOUND = "INFO_E01"
    INFO_DATA_UNAVAILABLE = "INFO_E02"

    # ── 游戏 ──
    GAME_LEVEL_TOO_LOW = "GAME_E01"
    GAME_SKILL_MAXED = "GAME_E02"
    GAME_NOT_ENOUGH_SKILL_POINTS = "GAME_E03"


# ── 错误码对应的中文消息 ──
ERROR_MESSAGES = {
    ErrorCode.COMMON_BAD_REQUEST: "请求参数有误",
    ErrorCode.COMMON_UNAUTHORIZED: "请先登录",
    ErrorCode.COMMON_FORBIDDEN: "没有操作权限",
    ErrorCode.COMMON_NOT_FOUND: "资源不存在",
    ErrorCode.COMMON_CONFLICT: "资源冲突",
    ErrorCode.COMMON_INTERNAL_ERROR: "服务器内部错误",
    ErrorCode.COMMON_VALIDATION_ERROR: "数据校验失败",
    ErrorCode.COMMON_RATE_LIMITED: "请求过于频繁，请稍后再试",

    ErrorCode.AUTH_INVALID_CREDENTIALS: "卡号或密码错误",
    ErrorCode.AUTH_ACCOUNT_LOCKED: "账户已锁定，请稍后再试",
    ErrorCode.AUTH_ACCOUNT_DISABLED: "账户已被禁用，请联系管理员",
    ErrorCode.AUTH_TOKEN_EXPIRED: "登录已过期，请重新登录",
    ErrorCode.AUTH_WEAK_PASSWORD: "密码强度不足",

    ErrorCode.ACCOUNT_INSUFFICIENT_FUNDS: "可用资金不足",
    ErrorCode.ACCOUNT_INSUFFICIENT_POSITION: "持仓数量不足",
    ErrorCode.ACCOUNT_FREEZE_FAILED: "资金冻结失败",
    ErrorCode.ACCOUNT_RELEASE_FAILED: "资金释放失败",

    ErrorCode.TRADE_STOCK_NOT_FOUND: "股票代码不存在",
    ErrorCode.TRADE_STOCK_NOT_TRADABLE: "该股票暂不可交易",
    ErrorCode.TRADE_PRICE_OUT_OF_BOUNDS: "价格超出涨跌停范围",
    ErrorCode.TRADE_CANNOT_CANCEL: "该指令已成交，无法撤销",

    ErrorCode.GAME_LEVEL_TOO_LOW: "等级不足，继续交易来升级吧！",
    ErrorCode.GAME_SKILL_MAXED: "该技能已达到最高等级",
    ErrorCode.GAME_NOT_ENOUGH_SKILL_POINTS: "技能点不足",
}


def get_message(code: ErrorCode) -> str:
    """获取错误码对应的中文消息"""
    return ERROR_MESSAGES.get(code, "未知错误")
