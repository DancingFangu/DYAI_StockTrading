const DAY_SECONDS = 15 * 60;
const AGENT_TICK_SECONDS = 15;
const START_CASH = 100000;

const stocksTemplate = [
  { id: "tech", name: "科技股", price: 42.8, risk: "高", trend: 0 },
  { id: "energy", name: "新能源股", price: 31.6, risk: "高", trend: 0 },
  { id: "medical", name: "医药股", price: 26.4, risk: "中", trend: 0 },
  { id: "bank", name: "银行股", price: 18.2, risk: "低", trend: 0 },
  { id: "consumer", name: "消费股", price: 23.9, risk: "中", trend: 0 },
];

const events = [
  {
    type: "利好",
    title: "政策支持新能源",
    desc: "补贴预期升温，新能源股受到关注。",
    impact: { energy: 0.07, tech: 0.025 },
  },
  {
    type: "利好",
    title: "科技板块订单增长",
    desc: "产业链需求回暖，科技股出现买盘。",
    impact: { tech: 0.065, consumer: 0.015 },
  },
  {
    type: "利空",
    title: "市场避险情绪升温",
    desc: "高风险资产承压，资金转向防御板块。",
    impact: { tech: -0.045, energy: -0.055, bank: 0.02 },
  },
  {
    type: "利空",
    title: "原材料价格上涨",
    desc: "成本压力影响新能源和消费板块。",
    impact: { energy: -0.05, consumer: -0.035 },
  },
  {
    type: "中性扰动",
    title: "市场分歧加大",
    desc: "投资者观点不一致，价格波动变快。",
    impact: { tech: 0.015, energy: -0.012, medical: 0.01, bank: -0.006 },
  },
  {
    type: "中性扰动",
    title: "资金轮动",
    desc: "热点切换，部分资金从成长股流向稳定板块。",
    impact: { tech: -0.012, energy: -0.008, bank: 0.018, consumer: 0.012 },
  },
  {
    type: "极端事件",
    title: "突发恐慌抛售",
    desc: "全市场短线下挫，但可能出现反弹机会。",
    impact: { tech: -0.08, energy: -0.09, medical: -0.055, bank: -0.025, consumer: -0.05 },
  },
  {
    type: "极端事件",
    title: "全面风险偏好回升",
    desc: "资金快速回流，成长板块涨幅领先。",
    impact: { tech: 0.075, energy: 0.085, medical: 0.035, consumer: 0.04 },
  },
  {
    type: "利好",
    title: "医药研发突破",
    desc: "医药股获得事件催化，市场关注度上升。",
    impact: { medical: 0.075 },
  },
  {
    type: "利空",
    title: "消费数据不及预期",
    desc: "消费股短线承压，防御板块相对稳定。",
    impact: { consumer: -0.055, bank: 0.01 },
  },
  {
    type: "中性扰动",
    title: "银行股分红预期",
    desc: "保守资金偏好银行股，市场整体波动有限。",
    impact: { bank: 0.035, tech: -0.006 },
  },
  {
    type: "极端事件",
    title: "监管传闻冲击",
    desc: "市场快速调整，AI 交易员反应分化。",
    impact: { tech: -0.07, energy: -0.04, medical: -0.03, bank: -0.015, consumer: -0.025 },
  },
];

const agents = [
  { name: "林澈", role: "趋势追随者", favorite: "tech", bias: 0.018 },
  { name: "许砚", role: "价值投资者", favorite: "bank", bias: 0.011 },
  { name: "周燃", role: "激进投机者", favorite: "energy", bias: 0.026 },
  { name: "沈宁", role: "保守交易员", favorite: "bank", bias: 0.008 },
  { name: "夏闻", role: "消息交易员", favorite: "medical", bias: 0.02 },
  { name: "顾回", role: "反向交易员", favorite: "consumer", bias: -0.012 },
];

let state = {};
let timerId = null;
let agentTickerId = null;
let selectedStockId = "tech";

const $ = (id) => document.getElementById(id);
const money = (value) => Math.round(value).toLocaleString("zh-CN");
const pct = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
const stockById = (id) => state.stocks.find((stock) => stock.id === id);

function createGame() {
  selectedStockId = "tech";
  state = {
    day: 1,
    secondsLeft: DAY_SECONDS,
    cash: START_CASH,
    stocks: stocksTemplate.map((stock) => ({ ...stock })),
    positions: {},
    logs: [],
    currentEvent: pickEvent(),
    finished: false,
  };
  applyEventToMarket();
  log("游戏开始：你获得 100,000 测试金。");
  startTimers();
  render();
}

function pickEvent() {
  return events[Math.floor(Math.random() * events.length)];
}

function applyEventToMarket() {
  for (const stock of state.stocks) {
    const eventImpact = state.currentEvent.impact[stock.id] || 0;
    stock.trend = eventImpact;
    stock.price = clampPrice(stock.price * (1 + eventImpact * 0.4));
  }
}

function startTimers() {
  clearInterval(timerId);
  clearInterval(agentTickerId);
  timerId = setInterval(() => {
    if (state.finished) return;
    state.secondsLeft -= 1;
    if (state.secondsLeft <= 0) {
      nextDay();
      return;
    }
    renderTimer();
  }, 1000);

  agentTickerId = setInterval(() => {
    if (!state.finished) {
      runAgents();
    }
  }, AGENT_TICK_SECONDS * 1000);
}

function runAgents() {
  const actions = agents.map((agent) => {
    const target = chooseAgentStock(agent);
    const direction = decideAgentDirection(agent, target);
    const impact = direction === "买入" ? agent.bias : -agent.bias;
    target.price = clampPrice(target.price * (1 + impact + randomRange(-0.009, 0.009)));
    target.trend = impact;
    return `${agent.name}（${agent.role}）倾向${direction}${target.name}`;
  });

  for (const stock of state.stocks) {
    if (!actions.some((line) => line.includes(stock.name))) {
      stock.price = clampPrice(stock.price * (1 + randomRange(-0.008, 0.008)));
      stock.trend = randomRange(-0.008, 0.008);
    }
  }

  log(actions.slice(0, 2).join("；") + "。");
  render();
}

function chooseAgentStock(agent) {
  const eventTargets = Object.keys(state.currentEvent.impact);
  if (eventTargets.length && Math.random() < 0.62) {
    return stockById(eventTargets[Math.floor(Math.random() * eventTargets.length)]);
  }
  if (Math.random() < 0.58) return stockById(agent.favorite);
  return state.stocks[Math.floor(Math.random() * state.stocks.length)];
}

function decideAgentDirection(agent, stock) {
  const eventImpact = state.currentEvent.impact[stock.id] || 0;
  if (agent.role === "反向交易员") return eventImpact < 0 ? "买入" : "卖出";
  if (agent.role === "保守交易员" && stock.risk === "高") return Math.random() < 0.65 ? "卖出" : "买入";
  return eventImpact >= 0 || Math.random() > 0.45 ? "买入" : "卖出";
}

function buyStock() {
  const stock = stockById(selectedStockId);
  const quantity = getQuantity();
  const cost = stock.price * quantity;
  if (cost > state.cash) {
    setHint("现金不足，无法买入。");
    return;
  }
  state.cash -= cost;
  const current = state.positions[stock.id] || { quantity: 0, avgCost: 0 };
  const totalCost = current.avgCost * current.quantity + cost;
  const newQuantity = current.quantity + quantity;
  state.positions[stock.id] = { quantity: newQuantity, avgCost: totalCost / newQuantity };
  stock.price = clampPrice(stock.price * 1.003);
  log(`你买入 ${stock.name} ${quantity} 股，成交价 ${stock.price.toFixed(2)}。`);
  setHint("买入成功，资金和持仓已更新。");
  render();
}

function sellStock() {
  const stock = stockById(selectedStockId);
  const quantity = getQuantity();
  const current = state.positions[stock.id];
  if (!current || current.quantity < quantity) {
    setHint("持仓不足，无法卖出。");
    return;
  }
  state.cash += stock.price * quantity;
  current.quantity -= quantity;
  if (current.quantity <= 0) delete state.positions[stock.id];
  stock.price = clampPrice(stock.price * 0.997);
  log(`你卖出 ${stock.name} ${quantity} 股，成交价 ${stock.price.toFixed(2)}。`);
  setHint("卖出成功，资金和持仓已更新。");
  render();
}

function nextDay() {
  if (state.finished) return;
  settleDayPrices();
  if (state.day >= 7) {
    finishGame();
    return;
  }
  state.day += 1;
  state.secondsLeft = DAY_SECONDS;
  state.currentEvent = pickEvent();
  applyEventToMarket();
  log(`进入第 ${state.day} 个交易日：${state.currentEvent.title}。`);
  render();
}

function settleDayPrices() {
  for (const stock of state.stocks) {
    const eventImpact = state.currentEvent.impact[stock.id] || 0;
    const noise = randomRange(-0.018, 0.018);
    stock.trend = eventImpact + noise;
    stock.price = clampPrice(stock.price * (1 + stock.trend));
  }
}

function finishGame() {
  state.finished = true;
  clearInterval(timerId);
  clearInterval(agentTickerId);
  render();
  const asset = getTotalAsset();
  const result = getResult(asset);
  $("resultTitle").textContent = result.title;
  $("resultDesc").textContent = `你的最终资产为 ${money(asset)} 测试金，收益率 ${pct((asset - START_CASH) / START_CASH)}。${result.desc}`;
  $("resultModal").hidden = false;
}

function getResult(asset) {
  if (asset >= 200000) return { title: "传奇交易员", desc: "你完成了一轮极高收益挑战。" };
  if (asset >= 150000) return { title: "明星交易员", desc: "你的策略明显跑赢市场。" };
  if (asset >= 120000) return { title: "优秀交易员", desc: "你抓住了主要机会。" };
  if (asset >= 100000) return { title: "稳健交易员", desc: "你守住本金并取得进展。" };
  return { title: "亏损交易员", desc: "下一轮需要更谨慎地控制仓位。" };
}

function getQuantity() {
  return Math.max(1, Number($("quantityInput").value) || 1);
}

function getTotalAsset() {
  return state.cash + Object.entries(state.positions).reduce((sum, [stockId, position]) => {
    return sum + stockById(stockId).price * position.quantity;
  }, 0);
}

function render() {
  renderTimer();
  $("dayLabel").textContent = state.day;
  $("cashLabel").textContent = money(state.cash);
  const asset = getTotalAsset();
  $("assetLabel").textContent = money(asset);
  const returnValue = (asset - START_CASH) / START_CASH;
  $("returnLabel").textContent = pct(returnValue);
  $("returnLabel").className = returnValue >= 0 ? "positive" : "negative";
  $("eventType").textContent = state.currentEvent.type;
  $("eventTitle").textContent = state.currentEvent.title;
  $("eventDesc").textContent = state.currentEvent.desc;
  $("selectedStockLabel").textContent = stockById(selectedStockId).name;
  renderStocks();
  renderPositions();
  renderAgents();
  renderLogs();
}

function renderTimer() {
  const minutes = String(Math.floor(state.secondsLeft / 60)).padStart(2, "0");
  const seconds = String(state.secondsLeft % 60).padStart(2, "0");
  $("timerLabel").textContent = `${minutes}:${seconds}`;
}

function renderStocks() {
  $("stockList").innerHTML = state.stocks.map((stock) => {
    const changeClass = stock.trend >= 0 ? "up" : "down";
    return `
      <button class="stock-card ${stock.id === selectedStockId ? "active" : ""}" data-stock-id="${stock.id}" type="button">
        <h3>${stock.name}</h3>
        <div class="price">${stock.price.toFixed(2)}</div>
        <div class="change ${changeClass}">${pct(stock.trend)}</div>
        <div class="stock-meta">风险：${stock.risk}</div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".stock-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedStockId = button.dataset.stockId;
      setHint(`已选择 ${stockById(selectedStockId).name}。`);
      render();
    });
  });
}

function renderPositions() {
  const rows = Object.entries(state.positions).map(([stockId, position]) => {
    const stock = stockById(stockId);
    const value = stock.price * position.quantity;
    return `
      <div class="position-row">
        <span>${stock.name} × ${position.quantity}</span>
        <strong>${money(value)}</strong>
      </div>
    `;
  });
  $("positionsList").innerHTML = rows.length ? rows.join("") : `<div class="position-row"><span>暂无持仓</span><strong>0</strong></div>`;
}

function renderAgents() {
  $("agentList").innerHTML = agents.map((agent) => {
    const favorite = stockById(agent.favorite).name;
    return `
      <div class="agent-card">
        <h3>${agent.name} · ${agent.role}</h3>
        <p>偏好：${favorite}。今日会根据事件和价格变化自动行动。</p>
      </div>
    `;
  }).join("");
}

function renderLogs() {
  $("logList").innerHTML = state.logs.map((item) => `<div class="log-item">${item}</div>`).join("");
}

function log(message) {
  state.logs.unshift(`第 ${state.day} 日｜${message}`);
  state.logs = state.logs.slice(0, 24);
}

function setHint(message) {
  $("tradeHint").textContent = message;
}

function clampPrice(value) {
  return Math.max(1, Math.round(value * 100) / 100);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

$("buyBtn").addEventListener("click", buyStock);
$("sellBtn").addEventListener("click", sellStock);
$("nextDayBtn").addEventListener("click", nextDay);
$("resetBtn").addEventListener("click", createGame);
$("playAgainBtn").addEventListener("click", () => {
  $("resultModal").hidden = true;
  createGame();
});

createGame();
