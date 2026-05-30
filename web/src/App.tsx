import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";

type StockId = "tech" | "energy" | "medical" | "bank" | "consumer";
type Screen = "start" | "game" | "result";

type Stock = {
  id: StockId;
  name: string;
  price: number;
  previousPrice: number;
  risk: string;
  baseVolume: number;
};

type Position = {
  quantity: number;
  avgCost: number;
};

type EventCard = {
  title: string;
  description: string;
  impact: Partial<Record<StockId, number>>;
};

type Agent = {
  id: string;
  name: string;
  role: string;
  favorite: StockId;
  avatar: string;
  line: string;
};

type AssetRow = {
  label: string;
  quantity?: number;
  price?: number;
  value: number;
};

type DaySummary = {
  day: number;
  beforeAsset: number;
  afterAsset: number;
  rows: AssetRow[];
};

type Prediction = {
  stockId: StockId;
  direction: "up" | "down";
} | null;

const START_CASH = 100000;
const MAX_DAY = 7;
const DAY_SECONDS = 120;
const TICK_SECONDS = 5;
const API_BASE_URL = "http://127.0.0.1:8000";
const PREDICTION_REWARD = 3000;
const PREDICTION_PENALTY = 2000;

const t = {
  eyebrow: "AI Agent Trading Game",
  title: "\u0037 \u65e5\u4ea4\u6613\u6311\u6218",
  summary:
    "\u626e\u6f14\u4ea4\u6613\u5458\uff0c\u7528\u6d4b\u8bd5\u8d44\u91d1\u5728 7 \u4e2a\u4ea4\u6613\u65e5\u5185\u4e70\u5356 5 \u53ea\u865a\u62df\u80a1\u7968\u3002\u89c2\u5bdf\u968f\u673a\u4e8b\u4ef6\u548c AI \u4ea4\u6613\u5458\u52a8\u5411\uff0c\u8ba9\u6700\u7ec8\u8d44\u4ea7\u5c3d\u53ef\u80fd\u589e\u957f\u3002",
  playerName: "\u4ea4\u6613\u5458\u540d\u79f0",
  placeholder: "\u8f93\u5165\u4f60\u7684\u540d\u5b57",
  start: "\u5f00\u59cb\u6e38\u620f",
  defaultName: "\u65b0\u624b\u4ea4\u6613\u5458",
  rules: "\u8bd5\u73a9\u89c4\u5219",
  cash: "\u73b0\u91d1",
  asset: "\u603b\u8d44\u4ea7",
  returnRate: "\u6536\u76ca\u7387",
  event: "\u4eca\u65e5\u4e8b\u4ef6",
  stocks: "\u80a1\u7968\u884c\u60c5",
  kline: "K \u7ebf",
  open: "\u5f00\u76d8",
  high: "\u6700\u9ad8",
  low: "\u6700\u4f4e",
  volume: "\u6210\u4ea4\u91cf",
  currentPrice: "\u73b0\u4ef7",
  trade: "\u4ea4\u6613\u9762\u677f",
  positions: "\u6211\u7684\u6301\u4ed3",
  agents: "AI \u4ea4\u6613\u5458",
  log: "\u4ea4\u6613\u65e5\u5fd7",
  quantity: "\u6570\u91cf",
  buy: "\u4e70\u5165",
  sell: "\u5356\u51fa",
  nextDay: "\u7ed3\u675f\u4eca\u65e5\u4ea4\u6613",
  ask: "\u6253\u63a2",
  asked: "\u4eca\u65e5\u5df2\u6253\u63a2",
  askLimit: "\u6bcf\u4e2a\u4ea4\u6613\u65e5\u53ea\u80fd\u6253\u63a2 1 \u4f4d AI \u4ea4\u6613\u5458\u3002",
  restart: "\u91cd\u65b0\u5f00\u59cb",
  noPosition: "\u6682\u65e0\u6301\u4ed3",
  result: "\u7ed3\u7b97\u7ed3\u679c",
  settlement: "\u65e5\u7ec8\u7ed3\u7b97",
  beforeAsset: "\u7ed3\u7b97\u524d\u8d44\u4ea7",
  afterAsset: "\u7ed3\u7b97\u540e\u8d44\u4ea7",
  assetChange: "\u8d44\u4ea7\u53d8\u52a8",
  assetList: "\u8d44\u4ea7\u6e05\u5355",
  marketTitle: "A\u80a1\u5e02\u573a",
  breadth: "\u6da8\u8dcc\u5206\u5e03",
  marketRating: "\u5927\u76d8\u8bc4\u7ea7",
  suggestion: "\u6295\u8d44\u5efa\u8bae",
  stockTable: "\u4e2a\u80a1\u884c\u60c5",
  rise: "\u4e0a\u6da8",
  fall: "\u4e0b\u8dcc",
  limitUp: "\u6da8\u505c",
  limitDown: "\u8dcc\u505c",
  todayReturn: "\u4eca\u6536\u76ca",
  code: "\u4ee3\u7801",
  name: "\u540d\u79f0",
  turnover: "\u6210\u4ea4\u989d",
  marketValue: "\u6d41\u901a\u5e02\u503c",
  challenge: "\u4eca\u65e5\u6311\u6218",
  challengeDesc: "\u6bcf\u4e2a\u4ea4\u6613\u65e5\u53ef\u5bf9\u5f53\u524d\u9009\u4e2d\u80a1\u7968\u9884\u6d4b 1 \u6b21\u3002\u731c\u5bf9 +3,000\uff0c\u731c\u9519 -2,000\u3002",
  predictUp: "\u770b\u6da8",
  predictDown: "\u770b\u8dcc",
  predicted: "\u5df2\u9884\u6d4b",
  rewardHit: "\u9884\u6d4b\u6210\u529f",
  rewardMiss: "\u9884\u6d4b\u5931\u8d25",
  liveTrading: "\u5b9e\u65f6\u4ea4\u6613",
  timer: "\u4ea4\u6613\u5012\u8ba1\u65f6",
  marketShock: "\u5e02\u573a\u51b2\u51fb",
  pause: "\u6682\u505c",
  resume: "\u7ee7\u7eed",
  volatilityStrike: "\u9ad8\u6ce2\u52a8\u51b2\u51fb",
  calm: "\u5e02\u573a\u6b63\u5728\u8fde\u7eed\u6ce2\u52a8",
  aiThinking: "DeepSeek \u6b63\u5728\u5206\u6790\u5e02\u573a...",
};

const startRules = [
  "\u5355\u4eba\u6a21\u5f0f\uff0c\u4e00\u8f6e 7 \u4e2a\u4ea4\u6613\u65e5",
  "\u7b2c\u4e00\u7248\u56fa\u5b9a 5 \u53ea\u865a\u62df\u80a1\u7968",
  "\u4e70\u5165\u548c\u5356\u51fa\u6309\u5f53\u524d\u4ef7\u7acb\u5373\u6210\u4ea4",
  "AI \u4ee3\u7406\u4f1a\u6839\u636e\u4e8b\u4ef6\u81ea\u52a8\u884c\u52a8",
  "\u7b2c 7 \u65e5\u7ed3\u675f\u540e\u6309\u603b\u8d44\u4ea7\u8bc4\u7ea7",
];

const initialStocks: Stock[] = [
  { id: "tech", name: "\u79d1\u6280\u80a1", price: 42.8, previousPrice: 42.8, risk: "\u9ad8", baseVolume: 182000 },
  { id: "energy", name: "\u65b0\u80fd\u6e90\u80a1", price: 31.6, previousPrice: 31.6, risk: "\u9ad8", baseVolume: 216000 },
  { id: "medical", name: "\u533b\u836f\u80a1", price: 26.4, previousPrice: 26.4, risk: "\u4e2d", baseVolume: 128000 },
  { id: "bank", name: "\u94f6\u884c\u80a1", price: 18.2, previousPrice: 18.2, risk: "\u4f4e", baseVolume: 94000 },
  { id: "consumer", name: "\u6d88\u8d39\u80a1", price: 23.9, previousPrice: 23.9, risk: "\u4e2d", baseVolume: 112000 },
];

const events: EventCard[] = [
  {
    title: "\u653f\u7b56\u652f\u6301\u65b0\u80fd\u6e90",
    description: "\u8865\u8d34\u9884\u671f\u5347\u6e29\uff0c\u65b0\u80fd\u6e90\u80a1\u53d7\u5230\u8d44\u91d1\u5173\u6ce8\u3002",
    impact: { energy: 0.08, tech: 0.02 },
  },
  {
    title: "\u5e02\u573a\u6050\u614c\u629b\u552e",
    description: "\u9ad8\u98ce\u9669\u677f\u5757\u77ed\u7ebf\u627f\u538b\uff0c\u9632\u5fa1\u8d44\u4ea7\u76f8\u5bf9\u7a33\u5b9a\u3002",
    impact: { tech: -0.07, energy: -0.08, medical: -0.04, bank: 0.01, consumer: -0.03 },
  },
  {
    title: "\u533b\u836f\u7814\u53d1\u7a81\u7834",
    description: "\u533b\u836f\u80a1\u83b7\u5f97\u4e8b\u4ef6\u50ac\u5316\uff0c\u5e02\u573a\u5173\u6ce8\u5ea6\u4e0a\u5347\u3002",
    impact: { medical: 0.07 },
  },
  {
    title: "\u8d44\u91d1\u8f6e\u52a8",
    description: "\u70ed\u70b9\u4ece\u6210\u957f\u677f\u5757\u5207\u6362\u5230\u7a33\u5b9a\u677f\u5757\u3002",
    impact: { tech: -0.02, energy: -0.01, bank: 0.04, consumer: 0.02 },
  },
  {
    title: "\u6d88\u8d39\u590d\u82cf",
    description: "\u9700\u6c42\u56de\u6696\uff0c\u6d88\u8d39\u80a1\u51fa\u73b0\u660e\u663e\u4e70\u76d8\u3002",
    impact: { consumer: 0.06, bank: 0.01 },
  },
];

const agents: Agent[] = [
  {
    id: "trend",
    name: "\u6797\u6f88",
    role: "\u8d8b\u52bf\u8ffd\u968f\u8005",
    favorite: "tech",
    avatar: "trend",
    line: "\u6211\u53ea\u5173\u5fc3\u8d8b\u52bf\u662f\u5426\u8fde\u7eed\u3002\u5982\u679c\u5f3a\u52bf\u80a1\u7ee7\u7eed\u4e0a\u6da8\uff0c\u6211\u4f1a\u52a0\u4ed3\u3002",
  },
  {
    id: "value",
    name: "\u8bb8\u781a",
    role: "\u4ef7\u503c\u6295\u8d44\u8005",
    favorite: "bank",
    avatar: "value",
    line: "\u6211\u66f4\u559c\u6b22\u4f4e\u98ce\u9669\u548c\u4ef7\u683c\u4e0d\u8d35\u7684\u673a\u4f1a\u3002\u4eca\u5929\u6211\u4f1a\u5c11\u505a\u51b2\u52a8\u4ea4\u6613\u3002",
  },
  {
    id: "aggressive",
    name: "\u5468\u71c3",
    role: "\u6fc0\u8fdb\u6295\u673a\u8005",
    favorite: "energy",
    avatar: "aggressive",
    line: "\u4eca\u5929\u6709\u6ce2\u52a8\u624d\u6709\u673a\u4f1a\u3002\u6211\u4f1a\u76ef\u7740\u6700\u5bb9\u6613\u88ab\u4e8b\u4ef6\u70b9\u71c3\u7684\u80a1\u3002",
  },
  {
    id: "conservative",
    name: "\u6c88\u5b81",
    role: "\u4fdd\u5b88\u4ea4\u6613\u5458",
    favorite: "bank",
    avatar: "conservative",
    line: "\u6211\u5148\u770b\u98ce\u9669\uff0c\u518d\u770b\u6536\u76ca\u3002\u5982\u679c\u5e02\u573a\u592a\u4e71\uff0c\u6211\u4f1a\u7559\u66f4\u591a\u73b0\u91d1\u3002",
  },
  {
    id: "news",
    name: "\u590f\u95fb",
    role: "\u6d88\u606f\u4ea4\u6613\u5458",
    favorite: "medical",
    avatar: "news",
    line: "\u4eca\u65e5\u4e8b\u4ef6\u5f88\u91cd\u8981\u3002\u6211\u4f1a\u4f18\u5148\u770b\u5b83\u5f71\u54cd\u6700\u76f4\u63a5\u7684\u80a1\u3002",
  },
  {
    id: "contrarian",
    name: "\u987e\u56de",
    role: "\u53cd\u5411\u4ea4\u6613\u5458",
    favorite: "consumer",
    avatar: "contrarian",
    line: "\u5927\u5bb6\u90fd\u5728\u8ffd\u7684\u65f6\u5019\uff0c\u6211\u4f1a\u5c0f\u5fc3\u3002\u5927\u5bb6\u90fd\u5728\u5356\u7684\u65f6\u5019\uff0c\u6211\u4f1a\u770b\u673a\u4f1a\u3002",
  },
];

function formatMoney(value: number) {
  return Math.round(value).toLocaleString("zh-CN");
}

function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function clampPrice(value: number) {
  return Math.max(1, Math.round(value * 100) / 100);
}

function pickEvent(day: number) {
  return events[(day - 1) % events.length];
}

function applyDailyMove(stocks: Stock[], event: EventCard) {
  return stocks.map((stock, index) => {
    const eventImpact = event.impact[stock.id] ?? 0;
    const agentNudge = index % 2 === 0 ? 0.026 : -0.018;
    const nextPrice = clampPrice(stock.price * (1 + eventImpact * 1.35 + agentNudge));
    return { ...stock, previousPrice: stock.price, price: nextPrice };
  });
}

function getRating(asset: number) {
  if (asset >= 200000) return "\u4f20\u5947\u4ea4\u6613\u5458";
  if (asset >= 150000) return "\u660e\u661f\u4ea4\u6613\u5458";
  if (asset >= 120000) return "\u4f18\u79c0\u4ea4\u6613\u5458";
  if (asset >= START_CASH) return "\u7a33\u5065\u4ea4\u6613\u5458";
  return "\u4e8f\u635f\u4ea4\u6613\u5458";
}

function getAssetRows(stocks: Stock[], positions: Partial<Record<StockId, Position>>, cash: number) {
  const rows: AssetRow[] = [{ label: t.cash, value: cash }];
  for (const stock of stocks) {
    const position = positions[stock.id];
    if (!position || position.quantity <= 0) continue;
    rows.push({
      label: stock.name,
      quantity: position.quantity,
      price: stock.price,
      value: position.quantity * stock.price,
    });
  }
  return rows;
}

function getAssetTotal(stocks: Stock[], positions: Partial<Record<StockId, Position>>, cash: number) {
  return getAssetRows(stocks, positions, cash).reduce((sum, row) => sum + row.value, 0);
}

function getStockStats(stock: Stock, day: number) {
  const change = (stock.price - stock.previousPrice) / stock.previousPrice;
  const open = stock.previousPrice;
  const high = Math.max(open, stock.price) * (1 + 0.012 + day * 0.001);
  const low = Math.min(open, stock.price) * (1 - 0.01);
  const volume = Math.round(stock.baseVolume * (1 + Math.abs(change) * 6 + day * 0.08));
  return {
    change,
    open: clampPrice(open),
    high: clampPrice(high),
    low: clampPrice(low),
    volume,
  };
}

function getKline(stock: Stock, day: number) {
  const seed = stock.id.length + day;
  return Array.from({ length: 18 }, (_, index) => {
    const progress = index / 17;
    const base = stock.previousPrice + (stock.price - stock.previousPrice) * progress;
    const wave = Math.sin((index + seed) * 1.35) * stock.price * 0.012;
    const open = clampPrice(base + wave);
    const close = clampPrice(base - wave * 0.55 + (index % 3 - 1) * 0.04);
    const high = clampPrice(Math.max(open, close) + stock.price * (0.012 + (index % 4) * 0.002));
    const low = clampPrice(Math.min(open, close) - stock.price * (0.01 + (index % 5) * 0.0015));
    return { open, close, high, low };
  });
}

function getMarketStats(stocks: Stock[], day: number) {
  const changes = stocks.map((stock) => getStockStats(stock, day).change);
  const rise = changes.filter((change) => change > 0).length;
  const fall = changes.filter((change) => change < 0).length;
  const limitUp = changes.filter((change) => change >= 0.07).length;
  const limitDown = changes.filter((change) => change <= -0.07).length;
  const average = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const rating = Math.max(1, Math.min(9.5, 5 + average * 18 + (rise - fall) * 0.28));
  const labels = ["\u8dcc\u505c", "-8%", "-6%", "-4%", "-2%", "0", "2%", "4%", "6%", "8%", "\u6da8\u505c"];
  const distribution = labels.map((label, index) => {
    const center = index - 5;
    const value = Math.round(80 + Math.abs(Math.sin(day + index) * 420) + Math.max(0, center) * 36 + rise * 28);
    return { label, value, positive: index >= 6 };
  });
  return { rise, fall, limitUp, limitDown, average, rating, distribution };
}

function resolvePrediction(prediction: Prediction, beforeStocks: Stock[], afterStocks: Stock[], day: number) {
  if (!prediction) return { cashDelta: 0, log: "" };
  const before = beforeStocks.find((stock) => stock.id === prediction.stockId);
  const after = afterStocks.find((stock) => stock.id === prediction.stockId);
  if (!before || !after) return { cashDelta: 0, log: "" };
  const movedUp = after.price >= before.price;
  const hit = prediction.direction === "up" ? movedUp : !movedUp;
  const cashDelta = hit ? PREDICTION_REWARD : -PREDICTION_PENALTY;
  const label = hit ? t.rewardHit : t.rewardMiss;
  const amount = hit ? `+${formatMoney(PREDICTION_REWARD)}` : `-${formatMoney(PREDICTION_PENALTY)}`;
  return { cashDelta, log: `D${day} ${label}: ${after.name} ${amount}` };
}

export function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [playerName, setPlayerName] = useState("");
  const [startedName, setStartedName] = useState("");
  const [day, setDay] = useState(1);
  const [cash, setCash] = useState(START_CASH);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [positions, setPositions] = useState<Partial<Record<StockId, Position>>>({});
  const [selectedStockId, setSelectedStockId] = useState<StockId>("tech");
  const [quantity, setQuantity] = useState(100);
  const [currentEvent, setCurrentEvent] = useState<EventCard>(events[0]);
  const [agentMessage, setAgentMessage] = useState(agents[0].line);
  const [askedAgentId, setAskedAgentId] = useState("");
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [prediction, setPrediction] = useState<Prediction>(null);
  const [secondsLeft, setSecondsLeft] = useState(DAY_SECONDS);
  const [isLive, setIsLive] = useState(true);
  const [marketShock, setMarketShock] = useState(t.calm);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const selectedStock = stocks.find((stock) => stock.id === selectedStockId) ?? stocks[0];
  const selectedStats = getStockStats(selectedStock, day);
  const selectedKline = getKline(selectedStock, day);
  const marketStats = getMarketStats(stocks, day);

  const totalAsset = useMemo(() => {
    return getAssetTotal(stocks, positions, cash);
  }, [cash, positions, stocks]);

  const returnRate = (totalAsset - START_CASH) / START_CASH;

  useEffect(() => {
    if (screen !== "game" || !isLive) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isLive, screen]);

  useEffect(() => {
    if (screen === "game" && secondsLeft === 0) {
      nextDay();
    }
  }, [screen, secondsLeft]);

  useEffect(() => {
    if (screen !== "game" || !isLive) return;
    const id = window.setInterval(() => {
      runRealtimeTick();
    }, TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [currentEvent, day, isLive, screen, selectedStockId, stocks]);

  function addLog(message: string) {
    setLogs((current) => [`D${day} ${message}`, ...current].slice(0, 8));
  }

  function resetGame(name = startedName || copyName()) {
    setStartedName(name);
    setDay(1);
    setCash(START_CASH);
    setStocks(initialStocks);
    setPositions({});
    setSelectedStockId("tech");
    setQuantity(100);
    setCurrentEvent(events[0]);
    setAgentMessage(agents[0].line);
    setAskedAgentId("");
    setDaySummary(null);
    setPrediction(null);
    setSecondsLeft(DAY_SECONDS);
    setIsLive(true);
    setMarketShock(t.calm);
    setIsAgentLoading(false);
    setLogs(["D1 \u6e38\u620f\u5f00\u59cb\uff0c\u521d\u59cb\u6d4b\u8bd5\u91d1 100,000\u3002"]);
    setScreen("game");
  }

  function copyName() {
    return playerName.trim() || t.defaultName;
  }

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetGame(copyName());
  }

  function buyStock() {
    const qty = Math.max(1, quantity);
    const cost = selectedStock.price * qty;
    if (cost > cash) {
      addLog("\u73b0\u91d1\u4e0d\u8db3\uff0c\u4e70\u5165\u5931\u8d25\u3002");
      return;
    }
    const current = positions[selectedStock.id] ?? { quantity: 0, avgCost: 0 };
    const newQuantity = current.quantity + qty;
    const avgCost = (current.avgCost * current.quantity + cost) / newQuantity;
    setCash((value) => value - cost);
    setPositions((currentPositions) => ({
      ...currentPositions,
      [selectedStock.id]: { quantity: newQuantity, avgCost },
    }));
    addLog(`\u4e70\u5165 ${selectedStock.name} ${qty} \u80a1\u3002`);
  }

  function sellStock() {
    const qty = Math.max(1, quantity);
    const current = positions[selectedStock.id];
    if (!current || current.quantity < qty) {
      addLog("\u6301\u4ed3\u4e0d\u8db3\uff0c\u5356\u51fa\u5931\u8d25\u3002");
      return;
    }
    const nextQuantity = current.quantity - qty;
    setCash((value) => value + selectedStock.price * qty);
    setPositions((currentPositions) => {
      const next = { ...currentPositions };
      if (nextQuantity <= 0) {
        delete next[selectedStock.id];
      } else {
        next[selectedStock.id] = { ...current, quantity: nextQuantity };
      }
      return next;
    });
    addLog(`\u5356\u51fa ${selectedStock.name} ${qty} \u80a1\u3002`);
  }

  function runRealtimeTick(forceBurst = false) {
    const burstTarget = forceBurst
      ? selectedStockId
      : stocks[Math.floor(Math.random() * stocks.length)]?.id ?? selectedStockId;
    let shockMessage = "";
    const movedStocks = stocks.map((stock, index) => {
      const eventBias = currentEvent.impact[stock.id] ?? 0;
      const randomMove = (Math.random() - 0.5) * (forceBurst ? 0.09 : 0.022);
      const aiPressure = index % 2 === 0 ? 0.004 : -0.003;
      const burstMove = stock.id === burstTarget ? (Math.random() > 0.5 ? 0.085 : -0.078) : 0;
      const move = eventBias * 0.1 + aiPressure + randomMove + burstMove;
      const nextPrice = clampPrice(stock.price * (1 + move));
      if (Math.abs(move) >= 0.045) {
        shockMessage = `${stock.name} ${move >= 0 ? "\u6025\u62c9" : "\u6025\u8dcc"} ${formatPercent(move)}`;
      }
      return { ...stock, previousPrice: stock.price, price: nextPrice };
    });
    setStocks(movedStocks);
    if (shockMessage) {
      setMarketShock(shockMessage);
      setLogs((current) => [`D${day} ${shockMessage}`, ...current].slice(0, 8));
    } else {
      setMarketShock(t.calm);
    }
  }

  function nextDay() {
    const beforeAsset = getAssetTotal(stocks, positions, cash);
    const movedStocks = applyDailyMove(stocks, currentEvent);
    const predictionResult = resolvePrediction(prediction, stocks, movedStocks, day);
    const nextCash = cash + predictionResult.cashDelta;
    const afterAsset = getAssetTotal(movedStocks, positions, nextCash);
    setDaySummary({
      day,
      beforeAsset,
      afterAsset,
      rows: getAssetRows(movedStocks, positions, nextCash),
    });
    setCash(nextCash);
    setStocks(movedStocks);
    setSecondsLeft(DAY_SECONDS);
    if (day >= MAX_DAY) {
      setIsLive(false);
      setScreen("result");
      return;
    }
    const next = day + 1;
    const nextEvent = pickEvent(next);
    setDay(next);
    setCurrentEvent(nextEvent);
    setAgentMessage(agents[next % agents.length].line);
    setAskedAgentId("");
    setPrediction(null);
    setIsLive(true);
    setMarketShock(nextEvent.title);
    setIsAgentLoading(false);
    setLogs((current) => [predictionResult.log, `D${next} ${nextEvent.title}`, ...current].filter(Boolean).slice(0, 8));
  }

  async function askAgent(agent: Agent) {
    if (askedAgentId || isAgentLoading) return;
    const stock = stocks.find((item) => item.id === agent.favorite);
    const name = stock?.name ?? "";
    setAskedAgentId(agent.id);
    setIsAgentLoading(true);
    setAgentMessage(`${agent.name}\uff1a${t.aiThinking}`);
    try {
      const response = await fetch(`${API_BASE_URL}/game/ask-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "demo-session-001",
          agent_id: agent.id,
          agent_name: agent.name,
          role: agent.role,
          favorite_stock: agent.favorite,
          day,
          event_title: currentEvent.title,
          event_description: currentEvent.description,
          market_shock: marketShock,
          stocks: stocks.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            change: getStockStats(item, day).change,
          })),
        }),
      });
      if (!response.ok) throw new Error("agent request failed");
      const data = (await response.json()) as { message?: string; source?: string };
      setAgentMessage(data.message || `${agent.name}\uff1a${agent.line} \u6211\u6b63\u5728\u7559\u610f ${name}\u3002`);
      addLog(`\u6253\u63a2 ${agent.name}\uff1a${data.source === "deepseek" ? "DeepSeek \u5df2\u56de\u590d" : "\u672c\u5730\u5907\u7528\u56de\u590d"}\u3002`);
    } catch {
      setAgentMessage(`${agent.name}\uff1a${agent.line} \u6211\u6b63\u5728\u7559\u610f ${name}\u3002`);
      addLog(`\u6253\u63a2 ${agent.name}\uff1aDeepSeek \u6682\u672a\u8fde\u63a5\uff0c\u5df2\u4f7f\u7528\u672c\u5730\u53f0\u8bcd\u3002`);
    } finally {
      setIsAgentLoading(false);
    }
  }

  if (screen === "result") {
    return (
      <main className="game-page">
        <section className="result-panel">
          <p className="eyebrow">{t.result}</p>
          <h1>{getRating(totalAsset)}</h1>
          <div className="result-grid">
            <Metric label={t.asset} value={formatMoney(totalAsset)} />
            <Metric label={t.returnRate} value={formatPercent(returnRate)} tone={returnRate >= 0 ? "up" : "down"} />
            <Metric label={t.cash} value={formatMoney(cash)} />
          </div>
          <AssetSummary summary={daySummary} />
          <button className="primary-button" type="button" onClick={() => resetGame(copyName())}>
            {t.restart}
          </button>
        </section>
      </main>
    );
  }

  if (screen === "game") {
    return (
      <main className="game-page">
        <section className="game-layout">
          <header className="game-top">
            <div>
              <p className="eyebrow">{t.eyebrow}</p>
              <h1>{startedName}</h1>
              <p className="subtle">
                {"\u7b2c"} {day} / {MAX_DAY} {"\u4e2a\u4ea4\u6613\u65e5"}
              </p>
            </div>
            <button className="primary-button" type="button" onClick={nextDay}>
              {t.nextDay}
            </button>
          </header>

          <section className="live-strip">
            <div>
              <span>{t.liveTrading}</span>
              <strong>{marketShock}</strong>
            </div>
            <div className="live-actions">
              <span className="timer-pill">
                {t.timer} {formatClock(secondsLeft)}
              </span>
              <button className="ghost-button" type="button" onClick={() => setIsLive((value) => !value)}>
                {isLive ? t.pause : t.resume}
              </button>
              <button className="shock-button" type="button" onClick={() => runRealtimeTick(true)}>
                {t.volatilityStrike}
              </button>
            </div>
          </section>

          <MarketOverview stats={marketStats} stocks={stocks} day={day} />

          <section className="metrics">
            <Metric label={t.cash} value={formatMoney(cash)} />
            <Metric label={t.asset} value={formatMoney(totalAsset)} />
            <Metric label={t.returnRate} value={formatPercent(returnRate)} tone={returnRate >= 0 ? "up" : "down"} />
          </section>

          <section className="event-card">
            <span>{t.event}</span>
            <h2>{currentEvent.title}</h2>
            <p>{currentEvent.description}</p>
          </section>

          <section className="challenge-card">
            <div>
              <span>{t.challenge}</span>
              <h2>{selectedStock.name}</h2>
              <p>{prediction ? `${t.predicted}: ${prediction.direction === "up" ? t.predictUp : t.predictDown}` : t.challengeDesc}</p>
            </div>
            <div className="challenge-actions">
              <button
                className="buy-button"
                disabled={Boolean(prediction)}
                type="button"
                onClick={() => setPrediction({ stockId: selectedStock.id, direction: "up" })}
              >
                {t.predictUp}
              </button>
              <button
                className="sell-button"
                disabled={Boolean(prediction)}
                type="button"
                onClick={() => setPrediction({ stockId: selectedStock.id, direction: "down" })}
              >
                {t.predictDown}
              </button>
            </div>
          </section>

          <AssetSummary summary={daySummary} />

          <section className="main-grid">
            <div className="panel agent-panel">
              <div className="panel-head">
                <h2>{t.stocks}</h2>
                <span>{selectedStock.name}</span>
              </div>
              <div className="quote-board">
                <div className="quote-main">
                  <span>{t.currentPrice}</span>
                  <strong>{selectedStock.price.toFixed(2)}</strong>
                  <b className={selectedStats.change >= 0 ? "up" : "down"}>{formatPercent(selectedStats.change)}</b>
                </div>
                <div className="quote-stats">
                  <QuoteItem label={t.open} value={selectedStats.open.toFixed(2)} />
                  <QuoteItem label={t.high} value={selectedStats.high.toFixed(2)} />
                  <QuoteItem label={t.low} value={selectedStats.low.toFixed(2)} />
                  <QuoteItem label={t.volume} value={formatMoney(selectedStats.volume)} />
                </div>
              </div>
              <KlineChart candles={selectedKline} />
              <div className="stock-grid">
                {stocks.map((stock) => {
                  const stats = getStockStats(stock, day);
                  return (
                    <button
                      className={`stock-card ${stock.id === selectedStockId ? "active" : ""}`}
                      key={stock.id}
                      type="button"
                      onClick={() => setSelectedStockId(stock.id)}
                    >
                      <strong>{stock.name}</strong>
                      <b>{stock.price.toFixed(2)}</b>
                      <span className={stats.change >= 0 ? "up" : "down"}>{formatPercent(stats.change)}</span>
                      <small>
                        {t.open} {stats.open.toFixed(2)} / {t.high} {stats.high.toFixed(2)}
                      </small>
                      <small>
                        {t.low} {stats.low.toFixed(2)} / {t.volume} {formatMoney(stats.volume)}
                      </small>
                      <small>{"\u98ce\u9669"} {stock.risk}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="side-panel">
              <div className="panel">
                <div className="panel-head">
                  <h2>{t.trade}</h2>
                </div>
                <label className="field">
                  <span>{t.quantity}</span>
                  <input
                    min={1}
                    step={10}
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
                <div className="trade-actions">
                  <button className="buy-button" type="button" onClick={buyStock}>
                    {t.buy}
                  </button>
                  <button className="sell-button" type="button" onClick={sellStock}>
                    {t.sell}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>{t.positions}</h2>
                </div>
                <div className="list">
                  {Object.entries(positions).length === 0 ? (
                    <p className="subtle">{t.noPosition}</p>
                  ) : (
                    Object.entries(positions).map(([stockId, position]) => {
                      const stock = stocks.find((item) => item.id === stockId);
                      if (!stock || !position) return null;
                      return (
                        <div className="row" key={stockId}>
                          <span>
                            {stock.name} x {position.quantity}
                          </span>
                          <strong>{formatMoney(stock.price * position.quantity)}</strong>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          </section>

          <section className="main-grid lower-grid">
            <div className="panel">
              <div className="panel-head">
                <h2>{t.agents}</h2>
                <span>{askedAgentId ? t.asked : t.askLimit}</span>
              </div>
              <p className="agent-message">{agentMessage}</p>
              <div className="agent-grid">
                {agents.map((agent) => {
                  const isLocked = isAgentLoading || (Boolean(askedAgentId) && askedAgentId !== agent.id);
                  const isAsked = askedAgentId === agent.id;
                  return (
                  <button
                    className={`agent-card ${isAsked ? "active" : ""}`}
                    disabled={isLocked || (isAsked && !isAgentLoading)}
                    key={agent.id}
                    type="button"
                    onClick={() => askAgent(agent)}
                  >
                    <span className={`agent-avatar avatar-${agent.avatar}`} aria-hidden="true">
                      <i />
                    </span>
                    <span className="agent-info">
                      <strong>{agent.name}</strong>
                      <small>{isAsked && isAgentLoading ? t.aiThinking : isAsked ? t.asked : t.ask}</small>
                    </span>
                  </button>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>{t.log}</h2>
              </div>
              <div className="list">
                {logs.map((item) => (
                  <div className="log-row" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <StockTable stocks={stocks} day={day} onSelect={setSelectedStockId} selectedStockId={selectedStockId} />
        </section>
      </main>
    );
  }

  return (
    <main className="start-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="summary">{t.summary}</p>
          <form className="start-form" onSubmit={handleStart}>
            <label htmlFor="playerName">{t.playerName}</label>
            <div className="start-row">
              <input
                id="playerName"
                name="playerName"
                placeholder={t.placeholder}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
              />
              <button type="submit">{t.start}</button>
            </div>
          </form>
        </div>

        <div className="market-preview" aria-label={t.rules}>
          <div className="preview-header">
            <span>{t.rules}</span>
            <strong>Demo</strong>
          </div>
          <ul>
            {startRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

function MarketOverview({ stats, stocks, day }: { stats: ReturnType<typeof getMarketStats>; stocks: Stock[]; day: number }) {
  const maxBar = Math.max(...stats.distribution.map((item) => item.value));
  const indexCards = [
    { name: "\u4e0a\u8bc1\u6a21\u62df", value: 4068.57, change: stats.average - 0.004 },
    { name: "\u6df1\u8bc1\u6a21\u62df", value: 15575.13, change: stats.average - 0.011 },
    { name: "\u521b\u4e1a\u677f", value: 4037.95, change: stats.average - 0.008 },
    { name: "\u79d1\u521b\u677f", value: 1244.1, change: stats.average + 0.006 },
  ];
  return (
    <section className="market-overview">
      <div className="section-title">
        <span />
        <h2>{t.marketTitle}</h2>
      </div>
      <div className="market-board">
        <div className="market-left">
          <div className="mini-stat accent-red">
            <strong>{t.breadth}</strong>
            <p>
              {t.rise}: <b className="red-text">{stats.rise}</b> / {t.fall}: <b className="green-text">{stats.fall}</b>
            </p>
          </div>
          <div className="mini-stat">
            <strong>{t.limitUp}</strong>
            <p>
              {t.limitUp}: <b className="red-text">{stats.limitUp}</b> / {t.limitDown}: <b className="green-text">{stats.limitDown}</b>
            </p>
          </div>
          <div className="mini-stat">
            <strong>{t.todayReturn}</strong>
            <p className={stats.average >= 0 ? "red-text" : "green-text"}>{formatPercent(stats.average)}</p>
          </div>
        </div>
        <div className="breadth-chart">
          <div className="chart-title">{t.breadth}</div>
          <div className="bar-stage">
            {stats.distribution.map((item) => (
              <div className="bar-cell" key={item.label}>
                <span>{item.value}</span>
                <i className={item.positive ? "red-bar" : "green-bar"} style={{ height: `${(item.value / maxBar) * 86}%` }} />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="rating-card">
          <h2>{t.marketRating}</h2>
          <div className="rating-ring" style={{ "--score": `${stats.rating * 10}%` } as CSSProperties}>
            <strong>{stats.rating.toFixed(1)}</strong>
            <span>{"\u5206"}</span>
          </div>
          <b>{t.suggestion}</b>
          <p>{stats.rating >= 5 ? "\u5927\u76d8\u9707\u8361\uff0c\u9002\u5f53\u53c2\u4e0e" : "\u98ce\u9669\u504f\u9ad8\uff0c\u63a7\u5236\u4ed3\u4f4d"}</p>
        </div>
      </div>
      <div className="index-grid">
        {indexCards.map((card, index) => (
          <div className="index-card" key={card.name}>
            <div>
              <strong>{card.name}</strong>
              <span className={card.change >= 0 ? "red-text" : "green-text"}>
                {card.value.toFixed(2)} {formatPercent(card.change)}
              </span>
            </div>
            <Sparkline stock={stocks[index % stocks.length]} day={day + index} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Sparkline({ stock, day }: { stock: Stock; day: number }) {
  const points = getKline(stock, day).map((item) => item.close);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(0.01, max - min);
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 180;
      const y = 72 - ((value - min) / range) * 58;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 180 80" aria-hidden="true">
      <path d={path} />
      <line x1="0" x2="180" y1="38" y2="38" />
    </svg>
  );
}

function StockTable({
  stocks,
  day,
  selectedStockId,
  onSelect,
}: {
  stocks: Stock[];
  day: number;
  selectedStockId: StockId;
  onSelect: (id: StockId) => void;
}) {
  return (
    <section className="stock-table-section">
      <div className="section-title">
        <span />
        <h2>{t.stockTable}</h2>
      </div>
      <div className="stock-tabs">
        <button type="button">{"\u5168\u90e8\u80a1\u7968"}</button>
        <button type="button">{"\u6caa\u6df1A\u80a1"}</button>
        <button type="button">{"\u521b\u4e1a\u677f"}</button>
        <button type="button">{"\u79d1\u521b\u677f"}</button>
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th>{"\u5e8f\u53f7"}</th>
              <th>{t.code}</th>
              <th>{t.name}</th>
              <th>{t.currentPrice}</th>
              <th>{"\u6da8\u8dcc\u5e45(%)"}</th>
              <th>{t.high}</th>
              <th>{t.low}</th>
              <th>{t.volume}</th>
              <th>{t.turnover}</th>
              <th>{t.marketValue}</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => {
              const stats = getStockStats(stock, day);
              const code = `${index < 2 ? "30" : "60"}0${index + 218}`;
              return (
                <tr className={stock.id === selectedStockId ? "selected-row" : ""} key={stock.id} onClick={() => onSelect(stock.id)}>
                  <td>{index + 1}</td>
                  <td className="blue-text">{code}</td>
                  <td className="blue-text">{stock.name}</td>
                  <td className={stats.change >= 0 ? "red-text" : "green-text"}>{stock.price.toFixed(2)}</td>
                  <td className={stats.change >= 0 ? "red-text" : "green-text"}>{(stats.change * 100).toFixed(2)}</td>
                  <td>{stats.high.toFixed(2)}</td>
                  <td>{stats.low.toFixed(2)}</td>
                  <td>{formatMoney(stats.volume)}</td>
                  <td>{(stats.volume * stock.price / 100000000).toFixed(2)}{"\u4ebf"}</td>
                  <td>{(stats.volume * stock.price / 10000000).toFixed(2)}{"\u4ebf"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssetSummary({ summary }: { summary: DaySummary | null }) {
  if (!summary) return null;
  const change = summary.afterAsset - summary.beforeAsset;
  return (
    <section className="settlement-panel">
      <div className="panel-head">
        <div>
          <h2>{t.settlement}</h2>
          <p className="subtle">
            {"\u7b2c"} {summary.day} {"\u4e2a\u4ea4\u6613\u65e5"}
          </p>
        </div>
        <strong className={change >= 0 ? "up" : "down"}>
          {change >= 0 ? "+" : ""}{formatMoney(change)}
        </strong>
      </div>
      <div className="settlement-metrics">
        <Metric label={t.beforeAsset} value={formatMoney(summary.beforeAsset)} />
        <Metric label={t.afterAsset} value={formatMoney(summary.afterAsset)} />
        <Metric label={t.assetChange} value={`${change >= 0 ? "+" : ""}${formatMoney(change)}`} tone={change >= 0 ? "up" : "down"} />
      </div>
      <div className="asset-list">
        <h3>{t.assetList}</h3>
        {summary.rows.map((row) => (
          <div className="asset-row" key={`${row.label}-${row.quantity ?? 0}`}>
            <span>
              {row.label}
              {row.quantity ? ` x ${row.quantity} @ ${row.price?.toFixed(2)}` : ""}
            </span>
            <strong>{formatMoney(row.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuoteItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="quote-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KlineChart({ candles }: { candles: Array<{ open: number; close: number; high: number; low: number }> }) {
  const values = candles.flatMap((candle) => [candle.high, candle.low]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.01, max - min);
  const width = 640;
  const height = 220;
  const top = 20;
  const bottom = 26;
  const chartHeight = height - top - bottom;
  const step = width / candles.length;
  const candleWidth = Math.max(8, step * 0.46);
  const y = (value: number) => top + ((max - value) / range) * chartHeight;

  return (
    <div className="kline-panel">
      <div className="kline-header">
        <span>{t.kline}</span>
        <strong>{min.toFixed(2)} - {max.toFixed(2)}</strong>
      </div>
      <svg className="kline-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t.kline}>
        <line className="grid-line" x1="0" x2={width} y1={top} y2={top} />
        <line className="grid-line" x1="0" x2={width} y1={top + chartHeight / 2} y2={top + chartHeight / 2} />
        <line className="grid-line" x1="0" x2={width} y1={top + chartHeight} y2={top + chartHeight} />
        {candles.map((candle, index) => {
          const center = step * index + step / 2;
          const isUp = candle.close >= candle.open;
          const bodyTop = y(Math.max(candle.open, candle.close));
          const bodyHeight = Math.max(3, Math.abs(y(candle.open) - y(candle.close)));
          return (
            <g key={`${candle.open}-${index}`}>
              <line
                className={isUp ? "candle-up" : "candle-down"}
                x1={center}
                x2={center}
                y1={y(candle.high)}
                y2={y(candle.low)}
              />
              <rect
                className={isUp ? "candle-up" : "candle-down"}
                height={bodyHeight}
                width={candleWidth}
                x={center - candleWidth / 2}
                y={bodyTop}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
