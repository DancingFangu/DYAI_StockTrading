import { FormEvent, useEffect, useMemo, useState } from "react";

type StockId = "tech" | "energy" | "medical" | "bank" | "consumer";
type Screen = "start" | "game" | "result";
type GamePhase = "speech" | "select-cards" | "action" | "review";
type CardId = "position" | "tone" | "followup" | "flow" | "news";
type Direction = "buy" | "sell" | "hold";
type Strength = "low" | "medium" | "high";
type SpeechMode = "truth" | "vague" | "half_truth" | "bluff";
type NewsImpact = "major_positive" | "minor_positive" | "neutral" | "minor_negative" | "major_negative";

type Stock = {
  id: StockId;
  code: string;
  name: string;
  sector: string;
  price: number;
  previousPrice: number;
  history: number[];
};

type Position = {
  quantity: number;
  avgCost: number;
};

type NewsEvent = {
  title: string;
  description: string;
  target: StockId;
  truth: boolean;
  effect: "positive" | "negative";
};

type Agent = {
  id: string;
  name: string;
  avatar: string;
  favorite: StockId;
  fallbackLine: string;
};

type AgentState = {
  agentId: string;
  publicMessage: string;
  targetStock: StockId;
  direction: Direction;
  strength: Strength;
  speechMode: SpeechMode;
  yesterdayReturn: number;
  rank: number;
};

type InfoCard = {
  id: CardId;
  name: string;
  icon: string;
  cost: number;
  effect: string;
};

type Investigation = {
  day: number;
  cardId: CardId;
  cardName: string;
  target: string;
  shownResult: string;
  truthful: boolean;
};

type StockMove = {
  stockId: StockId;
  baseDice: number;
  newsImpact: NewsImpact;
  successProbability: number;
  agentModifiers: Array<{ agentId: string; direction: Direction; strength: Strength; value: number }>;
  finalDice: number;
  rolls: number[];
  successes: number;
  change: number;
};

type ReviewSummary = {
  day: number;
  beforeAsset: number;
  afterAsset: number;
  newsResult: string;
  stockMoves: StockMove[];
  investigations: Investigation[];
  actions: string[];
};

const START_CASH = 100000;
const MAX_DAY = 7;
const ACTION_POINTS_PER_DAY = 4;
const MAX_HAND_CARDS = 2;
const API_BASE_URL = "http://127.0.0.1:8000";

const initialStocks: Stock[] = [
  { id: "tech", code: "KJ-01", name: "云启科技", sector: "算力与AI终端", price: 42.8, previousPrice: 42.8, history: [38, 39, 41, 40, 42, 41, 43] },
  { id: "energy", code: "NY-02", name: "西岭能源", sector: "储能与新能源车", price: 31.6, previousPrice: 31.6, history: [28, 29, 31, 30, 32, 33, 31] },
  { id: "medical", code: "YY-03", name: "星辉生物", sector: "创新药与器械", price: 26.4, previousPrice: 26.4, history: [25, 24, 25, 27, 26, 28, 26] },
  { id: "bank", code: "YH-04", name: "稳石银行", sector: "防守金融", price: 18.2, previousPrice: 18.2, history: [18, 18.3, 18.1, 18.4, 18.2, 18.5, 18.2] },
  { id: "consumer", code: "XF-05", name: "春潮消费", sector: "连锁零售", price: 23.9, previousPrice: 23.9, history: [22, 23, 24, 23.5, 25, 24.2, 23.9] },
];

const newsEvents: NewsEvent[] = [
  {
    title: "东海传闻",
    description: "据传，云启科技董事昨夜飞往深圳，与一家公司密谈新一代算力终端的独家供货。",
    target: "tech",
    truth: true,
    effect: "positive",
  },
  {
    title: "补贴风声",
    description: "市场传出储能补贴可能延续，西岭能源的渠道商开始提前锁货，但官方尚未确认。",
    target: "energy",
    truth: true,
    effect: "positive",
  },
  {
    title: "药审快报",
    description: "星辉生物一款在研药物被传进入快速审评名单，多个交易员都在等消息落地。",
    target: "medical",
    truth: false,
    effect: "positive",
  },
  {
    title: "避险潮",
    description: "外部市场突发波动，部分资金被传从高波动股票撤出，转向稳石银行一类防守资产。",
    target: "bank",
    truth: true,
    effect: "positive",
  },
  {
    title: "消费降温",
    description: "春潮消费的门店流水被传低于预期，供应商表示近期补货节奏明显放慢。",
    target: "consumer",
    truth: true,
    effect: "negative",
  },
  {
    title: "电池事故",
    description: "网传某新能源车型发生电池事故，西岭能源被市场牵连，但事故源头仍不清楚。",
    target: "energy",
    truth: false,
    effect: "negative",
  },
  {
    title: "集采松动",
    description: "医药集采价格传出边际改善，星辉生物的核心产品可能获得更高利润空间。",
    target: "medical",
    truth: true,
    effect: "positive",
  },
];

const agents: Agent[] = [
  { id: "trend", name: "牛大胆", avatar: "trend", favorite: "tech", fallbackLine: "强的还会更强。我今天只看有连续性的票。" },
  { id: "value", name: "稳健老哥", avatar: "value", favorite: "bank", fallbackLine: "热闹的地方不一定有钱赚，便宜和安全更重要。" },
  { id: "aggressive", name: "抄底小子", avatar: "aggressive", favorite: "energy", fallbackLine: "波动越大越好，今天不刺激就没意思。" },
  { id: "conservative", name: "价值少女", avatar: "conservative", favorite: "bank", fallbackLine: "我会先看风险，再决定要不要动手。" },
  { id: "news", name: "趋势诗人", avatar: "news", favorite: "medical", fallbackLine: "新闻的味道不对，话不能只听表面。" },
  { id: "contrarian", name: "佛系大叔", avatar: "contrarian", favorite: "consumer", fallbackLine: "大家都冲一个方向时，我反而想等一等。" },
];

const cardDeck: InfoCard[] = [
  { id: "position", name: "查仓", icon: "査", cost: 1, effect: "查看 1 名 AI 的真实目标股票与方向。" },
  { id: "tone", name: "识别语气", icon: "语", cost: 1, effect: "判断 1 名 AI 的发言模式。" },
  { id: "followup", name: "追问", icon: "问", cost: 1, effect: "让 1 名 AI 追加一句解释。" },
  { id: "flow", name: "看资金流", icon: "流", cost: 1, effect: "查看 1 名 AI 的真实行动力度。" },
  { id: "news", name: "对照新闻", icon: "闻", cost: 1, effect: "低概率受干扰，揭示新闻真假线索。" },
];

const directionText: Record<Direction, string> = { buy: "买入", sell: "卖出", hold: "观望" };
const strengthText: Record<Strength, string> = { low: "低", medium: "中", high: "高" };
const speechModeText: Record<SpeechMode, string> = {
  truth: "真实",
  vague: "模糊",
  half_truth: "半真",
  bluff: "误导",
};

const newsImpactText: Record<NewsImpact, string> = {
  major_positive: "大利好",
  minor_positive: "微利好",
  neutral: "无影响",
  minor_negative: "微利空",
  major_negative: "大利空",
};

const newsImpactProbability: Record<NewsImpact, number> = {
  major_positive: 0.8,
  minor_positive: 0.6,
  neutral: 0.5,
  minor_negative: 0.4,
  major_negative: 0.2,
};

function formatMoney(value: number) {
  return Math.round(value).toLocaleString("zh-CN");
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function stockName(stockId: StockId) {
  return initialStocks.find((stock) => stock.id === stockId)?.name ?? stockId;
}

function pseudoRandom(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function pickNews(excludeTitle?: string) {
  const pool = newsEvents.filter((event) => event.title !== excludeTitle);
  const source = pool.length > 0 ? pool : newsEvents;
  return source[Math.floor(Math.random() * source.length)];
}

function pickCandidateCards(day: number) {
  return Array.from({ length: 3 }, (_, index) => cardDeck[(day + index - 1) % cardDeck.length]);
}

function getSecondaryNewsStock(news: NewsEvent) {
  const candidates = initialStocks.filter((stock) => stock.id !== news.target);
  return candidates[Math.floor(pseudoRandom(`${news.title}-secondary-stock`) * candidates.length)].id;
}

function getNewsImpact(stockId: StockId, news: NewsEvent): NewsImpact {
  if (!news.truth) return "neutral";
  if (stockId === news.target) return news.effect === "positive" ? "major_positive" : "major_negative";
  if (stockId === getSecondaryNewsStock(news)) return news.effect === "positive" ? "minor_positive" : "minor_negative";
  return "neutral";
}

function getHoldingValue(stocks: Stock[], positions: Partial<Record<StockId, Position>>) {
  return stocks.reduce((sum, stock) => sum + (positions[stock.id]?.quantity ?? 0) * stock.price, 0);
}

function getAssetTotal(stocks: Stock[], positions: Partial<Record<StockId, Position>>, cash: number) {
  return cash + getHoldingValue(stocks, positions);
}

function scoreRank(scores: Record<string, number>, agentId: string) {
  return [...agents].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)).findIndex((agent) => agent.id === agentId) + 1;
}

function generateAgentStates(day: number, news: NewsEvent, scores: Record<string, number>, lastReturns: Record<string, number>): AgentState[] {
  const modes: SpeechMode[] = ["bluff", "truth", "half_truth", "vague", "bluff", "half_truth"];
  const strengths: Strength[] = ["low", "medium", "high"];

  return agents.map((agent, index) => {
    const targetStock = agent.id === "news" ? news.target : agent.favorite;
    const followsNews = targetStock === news.target;
    const direction: Direction =
      agent.id === "conservative"
        ? "hold"
        : agent.id === "contrarian"
          ? news.effect === "positive" ? "sell" : "buy"
          : followsNews
            ? news.effect === "positive" ? "buy" : "sell"
            : "buy";
    const speechMode = modes[(day + index) % modes.length];
    return {
      agentId: agent.id,
      publicMessage: buildPublicLine(agent, targetStock, direction, speechMode),
      targetStock,
      direction,
      strength: strengths[(day + index) % strengths.length],
      speechMode,
      yesterdayReturn: lastReturns[agent.id] ?? 0,
      rank: scoreRank(scores, agent.id),
    };
  });
}

function buildPublicLine(agent: Agent, targetStock: StockId, direction: Direction, mode: SpeechMode) {
  if (mode === "truth") return `${agent.fallbackLine} 我正在留意 ${stockName(targetStock)}。`;
  if (mode === "vague") return "盘面还没给出清楚答案，我会先等一个更确定的信号。";
  if (mode === "half_truth") return `${stockName(targetStock)} 有动静，但我不会说自己会不会跟。`;
  const fakeDirection = direction === "buy" ? "不想追高" : "可能会找机会接一点";
  return `${stockName(targetStock)} 这条线我${fakeDirection}，别太相信表面的热度。`;
}

function cardAccuracy(mode: SpeechMode, comboCount: number, cardId: CardId) {
  if (comboCount >= 1 && cardId !== "followup") return 1;
  if (cardId === "news") return 0.88;
  if (cardId === "followup") return 0.72;
  if (mode === "truth") return 0.95;
  if (mode === "vague") return 0.9;
  if (mode === "half_truth") return 0.84;
  return 0.76;
}

function misleadingDirection(direction: Direction): Direction {
  if (direction === "buy") return "sell";
  if (direction === "sell") return "buy";
  return "buy";
}

function misleadingStrength(strength: Strength): Strength {
  if (strength === "high") return "low";
  if (strength === "low") return "high";
  return "medium";
}

function buildCardResult(card: InfoCard, agent: Agent, state: AgentState, news: NewsEvent, truthful: boolean) {
  const target = truthful ? state.targetStock : agent.favorite === state.targetStock ? news.target : agent.favorite;
  const direction = truthful ? state.direction : misleadingDirection(state.direction);
  const strength = truthful ? state.strength : misleadingStrength(state.strength);
  const mode = truthful ? state.speechMode : "truth";

  if (card.id === "position") return `${agent.name} 的真实倾向：${directionText[direction]} ${stockName(target)}。`;
  if (card.id === "tone") return `${agent.name} 当前发言模式：${speechModeText[mode]}。`;
  if (card.id === "flow") return `${agent.name} 今日行动力度：${strengthText[strength]}。`;
  if (card.id === "followup") {
    return truthful
      ? `${agent.name}：我不会把话说满，但真正的资金方向在 ${stockName(state.targetStock)}。`
      : `${agent.name}：这盘面太乱，我现在说什么都可能被误解。`;
  }
  return "";
}

function resolveStockMoves(day: number, stocks: Stock[], news: NewsEvent, agentStates: AgentState[]): StockMove[] {
  return stocks.map((stock) => {
    const agentModifiers = agentStates
      .filter((state) => state.targetStock === stock.id)
      .map((state) => {
        const value = state.direction === "hold" ? 0 : state.strength === "high" ? 2 : 1;
        return {
          agentId: state.agentId,
          direction: state.direction,
          strength: state.strength,
          value: state.direction === "sell" ? -value : value,
        };
      });
    const newsImpact = getNewsImpact(stock.id, news);
    const successProbability = newsImpactProbability[newsImpact];
    const finalDice = Math.max(1, Math.min(6, 3 + agentModifiers.reduce((sum, item) => sum + item.value, 0)));
    const rolls = Array.from({ length: finalDice }, (_, index) => pseudoRandom(`${day}-${stock.id}-${index}`) < successProbability ? 1 : 0);
    const successes = rolls.reduce((sum, roll) => sum + roll, 0);
    const failures = finalDice - successes;
    const change = (successes - failures) * 0.04;
    return { stockId: stock.id, baseDice: 3, newsImpact, successProbability, agentModifiers, finalDice, rolls, successes, change };
  });
}

function resolveAiReturns(agentStates: AgentState[], moves: StockMove[]) {
  return agentStates.reduce<Record<string, number>>((result, state) => {
    const move = moves.find((item) => item.stockId === state.targetStock);
    const strength = state.strength === "high" ? 1.2 : state.strength === "medium" ? 1 : 0.7;
    const direction = state.direction === "buy" ? 1 : state.direction === "sell" ? -1 : 0.15;
    result[state.agentId] = (move?.change ?? 0) * strength * direction;
    return result;
  }, {});
}

function getRating(asset: number, beatenAgents: number) {
  if (asset < START_CASH) return "还没摸清牌桌";
  if (beatenAgents >= 6) return "股票大亨";
  if (beatenAgents >= 4) return "市场猎手";
  if (beatenAgents >= 2) return "合格操盘手";
  return "稳健交易员";
}

export function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [playerName, setPlayerName] = useState("");
  const [startedName, setStartedName] = useState("新手交易员");
  const [day, setDay] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("speech");
  const [cash, setCash] = useState(START_CASH);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [positions, setPositions] = useState<Partial<Record<StockId, Position>>>({});
  const [selectedStockId, setSelectedStockId] = useState<StockId>("tech");
  const [actionPoints, setActionPoints] = useState(ACTION_POINTS_PER_DAY);
  const [news, setNews] = useState<NewsEvent>(() => pickNews());
  const [candidateCards, setCandidateCards] = useState<InfoCard[]>([]);
  const [handCards, setHandCards] = useState<InfoCard[]>([]);
  const [usedCardIds, setUsedCardIds] = useState<CardId[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<CardId | null>(null);
  const [speakingAgentId, setSpeakingAgentId] = useState(agents[0].id);
  const [revealedInfo, setRevealedInfo] = useState<Record<string, string>>({});
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [dayActions, setDayActions] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [aiScores, setAiScores] = useState<Record<string, number>>({});
  const [aiLastReturns, setAiLastReturns] = useState<Record<string, number>>({});
  const [agentStates, setAgentStates] = useState<AgentState[]>(() => {
    const firstNews = pickNews();
    return generateAgentStates(1, firstNews, {}, {});
  });
  const [review, setReview] = useState<ReviewSummary | null>(null);

  const selectedStock = stocks.find((stock) => stock.id === selectedStockId) ?? stocks[0];
  const selectedPosition = positions[selectedStockId];
  const totalAsset = useMemo(() => getAssetTotal(stocks, positions, cash), [cash, positions, stocks]);
  const holdingValue = useMemo(() => getHoldingValue(stocks, positions), [positions, stocks]);
  const returnRate = (totalAsset - START_CASH) / START_CASH;
  const beatenAgents = agents.filter((agent) => returnRate > (aiScores[agent.id] ?? 0)).length;

  useEffect(() => {
    if (screen !== "game" || phase !== "speech") return;
    const timer = window.setInterval(() => {
      setSpeakingAgentId((current) => {
        const index = agents.findIndex((agent) => agent.id === current);
        return agents[(index + 1) % agents.length].id;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [phase, screen]);

  useEffect(() => {
    if (screen !== "game" || phase !== "speech") return;
    const timer = window.setTimeout(() => {
      enterCardSelection();
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [day, phase, screen]);

  function addLog(message: string) {
    setLogs((current) => [`D${day} ${message}`, ...current].slice(0, 8));
  }

  function startGame(name = playerName.trim() || "新手交易员") {
    const firstNews = pickNews();
    setStartedName(name);
    setDay(1);
    setPhase("speech");
    setCash(START_CASH);
    setStocks(initialStocks);
    setPositions({});
    setSelectedStockId("tech");
    setActionPoints(ACTION_POINTS_PER_DAY);
    setNews(firstNews);
    setCandidateCards([]);
    setHandCards([]);
    setUsedCardIds([]);
    setSelectedCardId(null);
    setSpeakingAgentId(agents[0].id);
    setRevealedInfo({});
    setInvestigations([]);
    setDayActions([]);
    setAiScores({});
    setAiLastReturns({});
    setAgentStates(generateAgentStates(1, firstNews, {}, {}));
    setReview(null);
    setLogs(["D1 开盘：阅读新闻，观察 AI 发言。"]);
    setScreen("game");
  }

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startGame();
  }

  function enterCardSelection() {
    if (handCards.length >= MAX_HAND_CARDS) {
      setCandidateCards([]);
      setPhase("action");
      addLog("上一日手牌已保留，直接进入行动阶段。");
      return;
    }
    setPhase("select-cards");
    setCandidateCards(pickCandidateCards(day));
    addLog(`进入选牌：从候选牌中补充 ${MAX_HAND_CARDS - handCards.length} 张。`);
  }

  function chooseCandidateCard(card: InfoCard) {
    if (phase !== "select-cards" || handCards.length >= MAX_HAND_CARDS || handCards.some((item) => item.id === card.id)) return;
    const nextHand = [...handCards, card];
    setHandCards(nextHand);
    if (nextHand.length >= MAX_HAND_CARDS) {
      setCandidateCards([]);
      setPhase("action");
      addLog("手牌已确认，进入行动阶段。");
    }
  }

  function selectHandCard(card: InfoCard) {
    if (phase !== "action" || usedCardIds.includes(card.id) || actionPoints < card.cost) return;
    if (card.id === "news") {
      useNewsCard(card);
      return;
    }
    setSelectedCardId(selectedCardId === card.id ? null : card.id);
  }

  function spendActionPoint(message: string) {
    setActionPoints((value) => Math.max(0, value - 1));
    setDayActions((current) => [message, ...current]);
    addLog(message);
  }

  function useNewsCard(card: InfoCard) {
    if (actionPoints <= 0 || usedCardIds.includes(card.id)) return;
    const truthful = pseudoRandom(`${day}-news-card`) <= cardAccuracy("vague", 0, "news");
    const result = truthful
      ? `新闻线索：这条消息${news.truth ? "更像真实消息" : "更像市场烟雾弹"}。`
      : "新闻线索：消息源混乱，短线资金可能误读了方向。";
    setUsedCardIds((current) => [...current, card.id]);
    setInvestigations((current) => [...current, { day, cardId: card.id, cardName: card.name, target: "今日新闻", shownResult: result, truthful }]);
    setRevealedInfo((current) => ({ ...current, news: result }));
    spendActionPoint(`使用【${card.name}】核对新闻。`);
  }

  async function useCardOnAgent(agent: Agent) {
    if (!selectedCardId || phase !== "action" || actionPoints <= 0) return;
    const card = handCards.find((item) => item.id === selectedCardId);
    const state = agentStates.find((item) => item.agentId === agent.id);
    if (!card || !state || usedCardIds.includes(card.id)) return;
    const comboCount = investigations.filter((item) => item.day === day && item.target === agent.id).length;
    const truthful = pseudoRandom(`${day}-${agent.id}-${card.id}-${comboCount}`) <= cardAccuracy(state.speechMode, comboCount, card.id);
    const result = card.id === "followup"
      ? await askAgentFollowup(agent, state, truthful)
      : buildCardResult(card, agent, state, news, truthful);
    setUsedCardIds((current) => [...current, card.id]);
    setSelectedCardId(null);
    setSpeakingAgentId(agent.id);
    setRevealedInfo((current) => ({ ...current, [agent.id]: result }));
    setInvestigations((current) => [...current, { day, cardId: card.id, cardName: card.name, target: agent.id, shownResult: result, truthful }]);
    spendActionPoint(`使用【${card.name}】调查 ${agent.name}。`);
  }

  async function askAgentFollowup(agent: Agent, state: AgentState, truthful: boolean) {
    const fallback = buildCardResult(cardDeck.find((card) => card.id === "followup")!, agent, state, news, truthful);
    if (!truthful) return fallback;
    try {
      const response = await fetch(`${API_BASE_URL}/game/ask-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "demo-session-001",
          agent_id: agent.id,
          agent_name: agent.name,
          role: "AI 交易员",
          favorite_stock: agent.favorite,
          day,
          event_title: news.title,
          event_description: news.description,
          market_shock: "",
          stocks: stocks.map((stock) => ({
            id: stock.id,
            name: stock.name,
            price: stock.price,
            change: (stock.price - stock.previousPrice) / stock.previousPrice,
          })),
        }),
      });
      if (!response.ok) return fallback;
      const data = (await response.json()) as { message?: string };
      return data.message || fallback;
    } catch {
      return fallback;
    }
  }

  function buyWithCashRatio(ratio: number, label: string) {
    if (phase !== "action" || actionPoints <= 0) return;
    const budget = cash * ratio;
    const quantity = Math.floor(budget / selectedStock.price);
    if (quantity <= 0) return;
    const cost = quantity * selectedStock.price;
    setCash((value) => value - cost);
    setPositions((current) => {
      const existing = current[selectedStock.id];
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      const nextCost = (existing?.avgCost ?? 0) * (existing?.quantity ?? 0) + cost;
      return { ...current, [selectedStock.id]: { quantity: nextQuantity, avgCost: nextCost / nextQuantity } };
    });
    spendActionPoint(`${label} ${selectedStock.name} ${quantity} 股。`);
  }

  function sellWithPositionRatio(ratio: number, label: string) {
    if (phase !== "action" || actionPoints <= 0 || !selectedPosition) return;
    const quantity = Math.min(selectedPosition.quantity, Math.max(1, Math.floor(selectedPosition.quantity * ratio)));
    setCash((value) => value + quantity * selectedStock.price);
    setPositions((current) => {
      const next = { ...current };
      const remaining = selectedPosition.quantity - quantity;
      if (remaining <= 0) delete next[selectedStock.id];
      else next[selectedStock.id] = { ...selectedPosition, quantity: remaining };
      return next;
    });
    spendActionPoint(`${label} ${selectedStock.name} ${quantity} 股。`);
  }

  function closeDay() {
    if (phase === "review") {
      if (day >= MAX_DAY) {
        setScreen("result");
        return;
      }
      const nextDay = day + 1;
      const nextNews = pickNews(news.title);
      const carriedHandCards = handCards.filter((card) => !usedCardIds.includes(card.id));
      setDay(nextDay);
      setPhase("speech");
      setNews(nextNews);
      setCandidateCards([]);
      setHandCards(carriedHandCards);
      setUsedCardIds([]);
      setSelectedCardId(null);
      setRevealedInfo({});
      setInvestigations([]);
      setDayActions([]);
      setActionPoints(ACTION_POINTS_PER_DAY);
      setAgentStates(generateAgentStates(nextDay, nextNews, aiScores, aiLastReturns));
      setReview(null);
      setSpeakingAgentId(agents[(nextDay - 1) % agents.length].id);
      addLog(carriedHandCards.length > 0 ? `进入第 ${nextDay} 个交易日，保留 ${carriedHandCards.length} 张未使用手牌。` : `进入第 ${nextDay} 个交易日。`);
      return;
    }

    const beforeAsset = totalAsset;
    const moves = resolveStockMoves(day, stocks, news, agentStates);
    const movedStocks = stocks.map((stock) => {
      const move = moves.find((item) => item.stockId === stock.id);
      const change = move?.change ?? 0;
      const nextPrice = Math.max(1, Math.round(stock.price * (1 + change) * 100) / 100);
      return { ...stock, previousPrice: stock.price, price: nextPrice, history: [...stock.history.slice(-9), nextPrice] };
    });
    const aiReturns = resolveAiReturns(agentStates, moves);
    const nextScores = agents.reduce<Record<string, number>>((result, agent) => {
      result[agent.id] = (aiScores[agent.id] ?? 0) + (aiReturns[agent.id] ?? 0);
      return result;
    }, {});
    const afterAsset = getAssetTotal(movedStocks, positions, cash);
    setStocks(movedStocks);
    setAiScores(nextScores);
    setAiLastReturns(aiReturns);
    setReview({
      day,
      beforeAsset,
      afterAsset,
      newsResult: news.truth ? `真实${news.effect === "positive" ? "利好" : "利空"}` : "假消息",
      stockMoves: moves,
      investigations,
      actions: dayActions,
    });
    setPhase("review");
    setCandidateCards([]);
    setSelectedCardId(null);
    setActionPoints(0);
    setSpeakingAgentId("review");
    addLog(`收盘：总资产 ${formatMoney(beforeAsset)} -> ${formatMoney(afterAsset)}。`);
  }

  if (screen === "result") {
    return (
      <main className="result-page">
        <section className="result-panel tavern-panel">
          <p className="eyebrow">七日结算</p>
          <h1>{getRating(totalAsset, beatenAgents)}</h1>
          <div className="result-grid">
            <Metric label="最终现金" value={`¥${formatMoney(cash)}`} />
            <Metric label="持仓市值" value={`¥${formatMoney(holdingValue)}`} />
            <Metric label="最终总资产" value={`¥${formatMoney(totalAsset)}`} />
            <Metric label="收益率" value={formatPercent(returnRate)} tone={returnRate >= 0 ? "up" : "down"} />
            <Metric label="跑赢 AI" value={`${beatenAgents} / 6`} />
            <Metric label="玩家排名" value={`${7 - beatenAgents} / 7`} />
          </div>
          <AIRanking aiScores={aiScores} />
          <button className="primary-button" type="button" onClick={() => startGame(startedName)}>
            再开一局
          </button>
        </section>
      </main>
    );
  }

  if (screen === "game") {
    return (
      <main className="game-page">
        <section className="game-layout">
          <TopBar
            day={day}
            phase={phase}
            cash={cash}
            actionPoints={actionPoints}
            rank={7 - beatenAgents}
            playerName={startedName}
          />

          <section className="tabletop">
            <AgentStage
              agentStates={agentStates}
              phase={phase}
              revealedInfo={revealedInfo}
              selectedCardId={selectedCardId}
              speakingAgentId={speakingAgentId}
              onAgentClick={useCardOnAgent}
            />

            <section className="center-board">
              <NewsCard news={news} revealedInfo={revealedInfo.news} />
              <StockTradeTable
                stocks={stocks}
                selectedStockId={selectedStockId}
                positions={positions}
                phase={phase}
                actionPoints={actionPoints}
                onSelect={setSelectedStockId}
                onBuy={buyWithCashRatio}
                onSell={sellWithPositionRatio}
              />
              <PortfolioPanel cash={cash} totalAsset={totalAsset} holdingValue={holdingValue} returnRate={returnRate} />
              <ReviewPanel review={null} news={news} agentStates={agentStates} />
              {phase !== "speech" && phase !== "review" && (
                <button className="close-day-button" disabled={phase === "select-cards"} type="button" onClick={closeDay}>
                  收盘结算
                </button>
              )}
            </section>

            <aside className="right-rail">
              <CandidateCardArea cards={candidateCards} handCards={handCards} phase={phase} onChoose={chooseCandidateCard} />
              <AIRanking aiScores={aiScores} />
            </aside>
          </section>
        </section>

        <HandDock
          cards={handCards}
          selectedCardId={selectedCardId}
          usedCardIds={usedCardIds}
          actionPoints={actionPoints}
          phase={phase}
          logs={logs}
          onSelect={selectHandCard}
        />
        {phase === "select-cards" && (
          <CardSelectionModal cards={candidateCards} handCards={handCards} onChoose={chooseCandidateCard} />
        )}
        {phase === "review" && review && (
          <DailySummaryModal
            review={review}
            news={news}
            agentStates={agentStates}
            onConfirm={closeDay}
            finalDay={day >= MAX_DAY}
          />
        )}
      </main>
    );
  }

  return (
    <main className="start-page">
      <section className="hero tavern-panel">
        <div className="hero-copy">
          <p className="eyebrow">AI 代理投资游戏</p>
          <h1>股票大亨</h1>
          <p className="summary">7 个交易日，5 只虚拟股票，6 个会说谎的 AI 交易员。读新闻、选信息卡、调查 AI，再用有限行动点下注。</p>
          <form className="start-form" onSubmit={handleStart}>
            <label htmlFor="playerName">交易员名字</label>
            <div className="start-row">
              <input id="playerName" placeholder="输入你的名字" value={playerName} onChange={(event) => setPlayerName(event.target.value)} />
              <button type="submit">开始游戏</button>
            </div>
          </form>
        </div>
        <div className="rule-board">
          <h2>今日牌桌规则</h2>
          <ul>
            <li>每天先看新闻，再听 6 个 AI 的公开发言。</li>
            <li>每日 3 张候选信息卡，只能选 2 张。</li>
            <li>出牌和交易都消耗行动点，每天 4 点。</li>
            <li>AI 的真实行动会改变骰子数量，收盘按骰子结算。</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function TopBar({ day, phase, cash, actionPoints, rank, playerName }: { day: number; phase: GamePhase; cash: number; actionPoints: number; rank: number; playerName: string }) {
  const phaseText: Record<GamePhase, string> = {
    speech: "AI 发言",
    "select-cards": "选牌",
    action: "行动",
    review: "复盘",
  };
  return (
    <header className="top-bar">
      <div className="brand">
        <strong>股票大亨</strong>
        <span>{playerName}</span>
      </div>
      <TopItem label="日期" value={`第 ${day} / ${MAX_DAY} 日`} />
      <TopItem label="阶段" value={phaseText[phase]} />
      <TopItem label="现金" value={`¥${formatMoney(cash)}`} tone="money" />
      <ActionPointBar points={actionPoints} />
      <TopItem label="排名" value={`${rank} / 7`} />
    </header>
  );
}

function TopItem({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`top-item ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function ActionPointBar({ points }: { points: number }) {
  return (
    <div className="ap-bar">
      <span>行动点</span>
      <div>
        {Array.from({ length: ACTION_POINTS_PER_DAY }, (_, index) => (
          <i className={index < points ? "filled" : ""} key={index} />
        ))}
      </div>
      <strong>{points}/{ACTION_POINTS_PER_DAY}</strong>
    </div>
  );
}

function NewsCard({ news, revealedInfo }: { news: NewsEvent; revealedInfo?: string }) {
  return (
    <section className="news-card paper-card">
      <span>今日新闻事件</span>
      <h2>{news.title}</h2>
      <p>{news.description}</p>
      {revealedInfo && <em>{revealedInfo}</em>}
    </section>
  );
}

function AgentStage({
  agentStates,
  phase,
  revealedInfo,
  selectedCardId,
  speakingAgentId,
  onAgentClick,
}: {
  agentStates: AgentState[];
  phase: GamePhase;
  revealedInfo: Record<string, string>;
  selectedCardId: CardId | null;
  speakingAgentId: string;
  onAgentClick: (agent: Agent) => void;
}) {
  return (
    <aside className="agent-stage tavern-panel">
      <div className="stage-title">
        <h2>AI 交易员剧场</h2>
        <span>{selectedCardId ? "选择调查目标" : "公开发言"}</span>
      </div>
      {agents.map((agent) => {
        const state = agentStates.find((item) => item.agentId === agent.id);
        const message = revealedInfo[agent.id] || state?.publicMessage || agent.fallbackLine;
        const active = speakingAgentId === agent.id || Boolean(selectedCardId);
        return (
          <button
            className={`agent-line ${speakingAgentId === agent.id ? "speaking" : ""} ${selectedCardId ? "selectable" : ""} ${revealedInfo[agent.id] ? "investigated" : ""}`}
            disabled={phase !== "action" || !selectedCardId}
            key={agent.id}
            onClick={() => onAgentClick(agent)}
            type="button"
          >
            <span className={`pet-sprite avatar-${agent.avatar}`} aria-hidden="true"><i /></span>
            <span className="agent-meta">
              <strong>{agent.name}</strong>
              <small>昨日 {formatPercent(state?.yesterdayReturn ?? 0)} / 排名 {state?.rank ?? "-"}</small>
            </span>
            <span className={`speech-bubble ${active ? "active" : ""}`}>
              {message}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

function StockTradeTable({
  stocks,
  selectedStockId,
  positions,
  phase,
  actionPoints,
  onSelect,
  onBuy,
  onSell,
}: {
  stocks: Stock[];
  selectedStockId: StockId;
  positions: Partial<Record<StockId, Position>>;
  phase: GamePhase;
  actionPoints: number;
  onSelect: (stockId: StockId) => void;
  onBuy: (ratio: number, label: string) => void;
  onSell: (ratio: number, label: string) => void;
}) {
  const selectedPosition = positions[selectedStockId];
  return (
    <section className="stock-table tavern-panel">
      <div className="panel-head">
        <h2>股票交易区</h2>
        <span>日内价格只是预演，收盘以骰子为准</span>
      </div>
      <div className="stock-header">
        <span>代码/名称</span>
        <span>当前价格</span>
        <span>涨跌幅</span>
        <span>我的持仓</span>
        <span>K线</span>
      </div>
      {stocks.map((stock) => {
        const change = (stock.price - stock.previousPrice) / stock.previousPrice;
        return (
          <button className={`stock-row ${stock.id === selectedStockId ? "active" : ""}`} key={stock.id} onClick={() => onSelect(stock.id)} type="button">
            <strong><b>{stock.code}</b>{stock.name}<small>{stock.sector}</small></strong>
            <span>¥{stock.price.toFixed(2)}</span>
            <span className={change >= 0 ? "up" : "down"}>{formatPercent(change)}</span>
            <span>{positions[stock.id]?.quantity ?? 0} 股</span>
            <MiniKLine values={stock.history} />
          </button>
        );
      })}
      <div className="trade-actions">
        <button disabled={phase !== "action" || actionPoints <= 0} onClick={() => onBuy(0.25, "小仓买入")} type="button">小仓 25%</button>
        <button disabled={phase !== "action" || actionPoints <= 0} onClick={() => onBuy(0.5, "半仓买入")} type="button">半仓 50%</button>
        <button disabled={phase !== "action" || actionPoints <= 0} onClick={() => onBuy(0.8, "重仓买入")} type="button">重仓 80%</button>
        <button disabled={phase !== "action" || actionPoints <= 0 || !selectedPosition} onClick={() => onSell(0.3, "减仓")} type="button">减仓 30%</button>
        <button disabled={phase !== "action" || actionPoints <= 0 || !selectedPosition} onClick={() => onSell(0.5, "半仓卖出")} type="button">半仓卖</button>
        <button disabled={phase !== "action" || actionPoints <= 0 || !selectedPosition} onClick={() => onSell(1, "清仓")} type="button">清仓</button>
      </div>
    </section>
  );
}

function MiniKLine({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <span className="mini-kline" aria-label="K线">
      {values.map((value, index) => {
        const height = max === min ? 45 : 20 + ((value - min) / (max - min)) * 34;
        const up = index === 0 || value >= values[index - 1];
        return <i className={up ? "up-stick" : "down-stick"} key={`${value}-${index}`} style={{ height }} />;
      })}
    </span>
  );
}

function PortfolioPanel({ cash, totalAsset, holdingValue, returnRate }: { cash: number; totalAsset: number; holdingValue: number; returnRate: number }) {
  return (
    <section className="portfolio-strip">
      <Metric label="现金" value={`¥${formatMoney(cash)}`} />
      <Metric label="持仓市值" value={`¥${formatMoney(holdingValue)}`} />
      <Metric label="总资产" value={`¥${formatMoney(totalAsset)}`} />
      <Metric label="收益率" value={formatPercent(returnRate)} tone={returnRate >= 0 ? "up" : "down"} />
    </section>
  );
}

function CandidateCardArea({ cards, handCards, phase, onChoose }: { cards: InfoCard[]; handCards: InfoCard[]; phase: GamePhase; onChoose: (card: InfoCard) => void }) {
  return (
    <section className="candidate-zone tavern-panel">
      <div className="panel-head">
        <h2>本日候选 3 选 2</h2>
        <span>{handCards.length}/2</span>
      </div>
      {phase === "select-cards" && cards.length > 0 ? (
        <div className="empty-zone">
          <strong>卡牌选择已弹出</strong>
          <p>请在中央弹窗里选择 2 张手牌。</p>
        </div>
      ) : phase === "action" && handCards.length > 0 ? (
        <div className="empty-zone">
          <strong>今日手牌已确认</strong>
          <p>候选卡消失，底部手牌可点击使用。</p>
        </div>
      ) : (
        <div className="empty-zone">
          <strong>AI 发言自动跳过</strong>
          <p>即将进入今日卡牌选择。</p>
        </div>
      )}
    </section>
  );
}

function CardSelectionModal({ cards, handCards, onChoose }: { cards: InfoCard[]; handCards: InfoCard[]; onChoose: (card: InfoCard) => void }) {
  const needCount = Math.max(0, MAX_HAND_CARDS - handCards.length);
  return (
    <div className="modal-backdrop">
      <section className="modal-panel card-modal tavern-panel">
        <div className="modal-head">
          <span>今日开盘</span>
          <h2>卡牌选择</h2>
          <p>{handCards.length > 0 ? `已保留 ${handCards.length} 张未使用手牌，再从候选牌里补 ${needCount} 张。` : "从 3 张候选信息卡里选择 2 张。选满后自动进入行动阶段。"}</p>
        </div>
        <div className="candidate-cards">
          {cards.map((card) => (
            <button className={`info-card modal-card ${handCards.some((item) => item.id === card.id) ? "chosen" : ""}`} key={card.id} onClick={() => onChoose(card)} type="button">
              <b>{card.icon}</b>
              <span>{card.cost} AP</span>
              <strong>{card.name}</strong>
              <p>{card.effect}</p>
            </button>
          ))}
        </div>
        <div className="modal-foot">
          <span>已选择 {handCards.length} / 2</span>
        </div>
      </section>
    </div>
  );
}

function HandDock({
  cards,
  selectedCardId,
  usedCardIds,
  actionPoints,
  phase,
  logs,
  onSelect,
}: {
  cards: InfoCard[];
  selectedCardId: CardId | null;
  usedCardIds: CardId[];
  actionPoints: number;
  phase: GamePhase;
  logs: string[];
  onSelect: (card: InfoCard) => void;
}) {
  return (
    <aside className="hand-dock">
      <div className="dock-label">你已选择</div>
      <div className="dock-cards">
        {cards.length === 0 ? (
          <div className="dock-placeholder">等待选牌</div>
        ) : (
          cards.map((card) => {
            const used = usedCardIds.includes(card.id);
            return (
              <button
                className={`hand-card ${selectedCardId === card.id ? "selected" : ""} ${used ? "used" : ""}`}
                disabled={phase !== "action" || used || actionPoints < card.cost}
                key={card.id}
                onClick={() => onSelect(card)}
                type="button"
              >
                <b>{card.icon}</b>
                <strong>{card.name}</strong>
                <span>{used ? "收盘后丢弃" : `${card.cost} AP`}</span>
              </button>
            );
          })
        )}
      </div>
      <div className="dock-log">
        <strong>状态日志</strong>
        {logs.slice(0, 3).map((log) => <span key={log}>{log}</span>)}
      </div>
    </aside>
  );
}

function AIRanking({ aiScores }: { aiScores: Record<string, number> }) {
  return (
    <section className="ai-ranking tavern-panel">
      <div className="panel-head">
        <h2>AI 排名</h2>
        <span>虚拟收益</span>
      </div>
      {[...agents].sort((a, b) => (aiScores[b.id] ?? 0) - (aiScores[a.id] ?? 0)).map((agent, index) => (
        <div className="rank-row" key={agent.id}>
          <strong>{index + 1}. {agent.name}</strong>
          <span className={(aiScores[agent.id] ?? 0) >= 0 ? "up" : "down"}>{formatPercent(aiScores[agent.id] ?? 0)}</span>
        </div>
      ))}
    </section>
  );
}

function DailySummaryModal({
  review,
  news,
  agentStates,
  onConfirm,
  finalDay,
}: {
  review: ReviewSummary;
  news: NewsEvent;
  agentStates: AgentState[];
  onConfirm: () => void;
  finalDay: boolean;
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal-panel summary-modal tavern-panel">
        <button className="modal-close" type="button" onClick={onConfirm} aria-label="关闭每日总结">
          ×
        </button>
        <div className="modal-head">
          <span>D{review.day} 收盘</span>
          <h2>每日总结</h2>
          <p>新闻、AI 真实行动和骰子结果已揭示。确认后{finalDay ? "进入七日结算" : "进入下一日卡牌选择"}。</p>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <h3>新闻真相</h3>
            <p>{news.title}：{review.newsResult}，实际影响 {stockName(news.target)}。</p>
          </div>
          <div className="summary-card">
            <h3>资产变化</h3>
            <p>¥{formatMoney(review.beforeAsset)} → ¥{formatMoney(review.afterAsset)}</p>
          </div>
        </div>

        <div className="modal-scroll">
          <h3>骰子结算</h3>
          <div className="dice-list">
            {review.stockMoves.map((move) => (
              <div className="dice-row" key={move.stockId}>
                <strong>{stockName(move.stockId)} {formatPercent(move.change)}</strong>
                <span>新闻：{newsImpactText[move.newsImpact]}，单骰成功率 {Math.round(move.successProbability * 100)}%</span>
                <span>基础 {move.baseDice} 骰 + AI {move.agentModifiers.reduce((sum, item) => sum + item.value, 0)} = {move.finalDice} 骰</span>
                <span>掷骰：{move.rolls.join(" / ")}，成功 {move.successes} 个，净成功 {move.successes - (move.finalDice - move.successes)} 个</span>
              </div>
            ))}
          </div>

          <h3>AI 真实行动</h3>
          <div className="review-list-compact">
            {agentStates.map((state) => {
              const agent = agents.find((item) => item.id === state.agentId);
              return (
                <div className="truth-row" key={state.agentId}>
                  <strong>{agent?.name}</strong>
                  <span>{directionText[state.direction]} {stockName(state.targetStock)} / {strengthText[state.strength]}力度 / {speechModeText[state.speechMode]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button className="primary-button modal-confirm" type="button" onClick={onConfirm}>
          确认
        </button>
      </section>
    </div>
  );
}

function ReviewPanel({ review, news, agentStates }: { review: ReviewSummary | null; news: NewsEvent; agentStates: AgentState[] }) {
  if (!review) {
    return (
      <section className="review-panel tavern-panel">
        <h2>收盘复盘</h2>
        <p>收盘后会揭示新闻真假、AI 真实行动、调查稳定性和完整骰子过程。</p>
      </section>
    );
  }

  return (
    <section className="review-panel active tavern-panel">
      <div className="panel-head">
        <h2>D{review.day} 收盘复盘</h2>
        <span>{review.newsResult}</span>
      </div>
      <p>新闻真相：{news.title} 实际影响 {stockName(news.target)}，方向为{news.effect === "positive" ? "利好" : "利空"}。</p>
      <div className="review-columns">
        <div>
          <h3>AI 真实行动</h3>
          {agentStates.map((state) => {
            const agent = agents.find((item) => item.id === state.agentId);
            return (
              <div className="truth-row" key={state.agentId}>
                <strong>{agent?.name}</strong>
                <span>{directionText[state.direction]} {stockName(state.targetStock)} / {strengthText[state.strength]}力度 / {speechModeText[state.speechMode]}</span>
              </div>
            );
          })}
        </div>
        <div>
          <h3>调查记录</h3>
          {review.investigations.length === 0 ? <p>今日没有使用信息卡。</p> : review.investigations.map((item, index) => (
            <div className="truth-row" key={`${item.cardId}-${index}`}>
              <strong>{item.cardName}</strong>
              <span>{item.shownResult} / 复盘校验：{item.truthful ? "稳定" : "受干扰"}</span>
            </div>
          ))}
        </div>
      </div>
      <h3>骰子结算</h3>
      <div className="dice-list">
        {review.stockMoves.map((move) => (
          <div className="dice-row" key={move.stockId}>
            <strong>{stockName(move.stockId)} {formatPercent(move.change)}</strong>
            <span>新闻：{newsImpactText[move.newsImpact]}，单骰成功率 {Math.round(move.successProbability * 100)}%</span>
            <span>基础 {move.baseDice} 骰 + AI {move.agentModifiers.reduce((sum, item) => sum + item.value, 0)} = {move.finalDice} 骰</span>
            <span>掷骰：{move.rolls.join(" / ")}，成功 {move.successes} 个，净成功 {move.successes - (move.finalDice - move.successes)} 个</span>
          </div>
        ))}
      </div>
      <div className="review-footer">
        <strong>资产变化：¥{formatMoney(review.beforeAsset)} → ¥{formatMoney(review.afterAsset)}</strong>
        <span>{review.actions.length === 0 ? "今日没有交易动作。" : review.actions.join(" ")}</span>
      </div>
    </section>
  );
}
