const MAX_NUMBER = 40;
const PICK_COUNT = 6;
const HISTORY_LIMIT = 8;

const state = {
  ticket: [],
  latestDraw: [],
  luckyNumbers: [],
  history: [],
  stats: {
    totalDraws: 0,
    bestMatch: 0,
    matchCounts: [0, 0, 0, 0, 0, 0, 0],
  },
};

const ticketGrid = document.querySelector("#ticketGrid");
const drawNumbers = document.querySelector("#drawNumbers");
const luckyNumbers = document.querySelector("#luckyNumbers");
const matchBanner = document.querySelector("#matchBanner");
const historyList = document.querySelector("#historyList");
const drawCount = document.querySelector("#drawCount");

const totalDraws = document.querySelector("#totalDraws");
const bestMatch = document.querySelector("#bestMatch");
const jackpots = document.querySelector("#jackpots");
const match6 = document.querySelector("#match6");
const match5 = document.querySelector("#match5");
const match4 = document.querySelector("#match4");
const match3 = document.querySelector("#match3");
const matchLow = document.querySelector("#matchLow");

document.querySelector("#quickPickButton").addEventListener("click", quickPick);
document.querySelector("#clearButton").addEventListener("click", clearTicket);
document.querySelector("#drawButton").addEventListener("click", drawOnce);
document.querySelector("#generateLuckyButton").addEventListener("click", generateLuckyNumbers);
document.querySelector("#useLuckyButton").addEventListener("click", useLuckyNumbers);
document.querySelector("#simulateButton").addEventListener("click", simulateDraws);
document.querySelector("#resetStatsButton").addEventListener("click", resetStats);

function buildTicketGrid() {
  ticketGrid.innerHTML = "";

  for (let number = 1; number <= MAX_NUMBER; number += 1) {
    const button = document.createElement("button");
    button.className = "number-button";
    button.type = "button";
    button.textContent = number;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => toggleNumber(number));
    ticketGrid.append(button);
  }
}

function toggleNumber(number) {
  if (state.ticket.includes(number)) {
    state.ticket = state.ticket.filter((entry) => entry !== number);
  } else if (state.ticket.length < PICK_COUNT) {
    state.ticket = [...state.ticket, number].sort((a, b) => a - b);
  } else {
    showMessage("A ticket can only hold six numbers.");
  }

  render();
}

function quickPick() {
  state.ticket = randomTicket();
  showMessage("Quick pick is ready.");
  render();
}

function generateLuckyNumbers() {
  state.luckyNumbers = randomTicket();
  showMessage("Fresh lucky numbers generated.");
  render();
}

function useLuckyNumbers() {
  if (!state.luckyNumbers.length) {
    generateLuckyNumbers();
    return;
  }

  state.ticket = [...state.luckyNumbers];
  showMessage("Lucky numbers added to your ticket.");
  render();
}

function clearTicket() {
  state.ticket = [];
  state.latestDraw = [];
  showMessage("Pick a ticket and start a draw.");
  render();
}

function drawOnce() {
  if (!ensureTicket()) return;

  const draw = randomTicket();
  const matches = countMatches(draw, state.ticket);
  recordDraw(draw, matches);
  render();
}

function simulateDraws() {
  if (!ensureTicket()) return;

  const requestedDraws = Math.min(Math.max(Number(drawCount.value) || 1, 1), 100000);
  drawCount.value = requestedDraws;

  let finalDraw = [];
  let finalMatches = 0;

  for (let index = 0; index < requestedDraws; index += 1) {
    finalDraw = randomTicket();
    finalMatches = countMatches(finalDraw, state.ticket);
    recordDraw(finalDraw, finalMatches, index === requestedDraws - 1);
  }

  state.latestDraw = finalDraw;
  showMessage(
    `Simulated ${formatNumber(requestedDraws)} draws. Final draw matched ${finalMatches} ${pluralize("number", finalMatches)}.`
  );
  render();
}

function resetStats() {
  state.stats = {
    totalDraws: 0,
    bestMatch: 0,
    matchCounts: [0, 0, 0, 0, 0, 0, 0],
  };
  state.history = [];
  state.latestDraw = [];
  showMessage("Stats reset. Ready for a fresh run.");
  render();
}

function ensureTicket() {
  if (state.ticket.length === PICK_COUNT) return true;

  showMessage(`Choose ${PICK_COUNT - state.ticket.length} more ${pluralize("number", PICK_COUNT - state.ticket.length)} first.`);
  render();
  return false;
}

function recordDraw(draw, matches, keepHistory = true) {
  state.latestDraw = draw;
  state.stats.totalDraws += 1;
  state.stats.bestMatch = Math.max(state.stats.bestMatch, matches);
  state.stats.matchCounts[matches] += 1;

  if (keepHistory) {
    state.history = [{ draw, matches }, ...state.history].slice(0, HISTORY_LIMIT);
  }

  showMessage(
    matches === PICK_COUNT
      ? "Jackpot. All six numbers matched."
      : `Matched ${matches} of ${PICK_COUNT} numbers.`
  );
}

function randomTicket() {
  const numbers = new Set();

  while (numbers.size < PICK_COUNT) {
    numbers.add(Math.floor(Math.random() * MAX_NUMBER) + 1);
  }

  return [...numbers].sort((a, b) => a - b);
}

function countMatches(draw, ticket) {
  const drawSet = new Set(draw);
  return ticket.filter((number) => drawSet.has(number)).length;
}

function render() {
  renderTicket();
  renderDraw();
  renderLuckyNumbers();
  renderStats();
  renderHistory();
}

function renderTicket() {
  const matches = new Set(state.latestDraw.filter((number) => state.ticket.includes(number)));

  [...ticketGrid.children].forEach((button) => {
    const number = Number(button.textContent);
    const selected = state.ticket.includes(number);
    const matched = selected && matches.has(number);
    button.classList.toggle("selected", selected);
    button.classList.toggle("matched", matched);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderDraw() {
  const draw = state.latestDraw.length ? state.latestDraw : Array(PICK_COUNT).fill(null);

  drawNumbers.innerHTML = "";
  draw.forEach((number) => {
    const ball = document.createElement("span");
    const isMatch = number && state.ticket.includes(number);
    ball.className = `ball${isMatch ? " hit" : ""}${number ? "" : " placeholder"}`;
    ball.textContent = number || "-";
    drawNumbers.append(ball);
  });
}

function renderLuckyNumbers() {
  const numbers = state.luckyNumbers.length ? state.luckyNumbers : Array(PICK_COUNT).fill(null);

  luckyNumbers.innerHTML = "";
  numbers.forEach((number) => {
    const numberNode = document.createElement("span");
    numberNode.className = `lucky-number${number ? "" : " placeholder"}`;
    numberNode.textContent = number || "-";
    luckyNumbers.append(numberNode);
  });
}

function renderStats() {
  totalDraws.textContent = formatNumber(state.stats.totalDraws);
  bestMatch.textContent = state.stats.bestMatch;
  jackpots.textContent = formatNumber(state.stats.matchCounts[6]);
  match6.textContent = formatNumber(state.stats.matchCounts[6]);
  match5.textContent = formatNumber(state.stats.matchCounts[5]);
  match4.textContent = formatNumber(state.stats.matchCounts[4]);
  match3.textContent = formatNumber(state.stats.matchCounts[3]);
  matchLow.textContent = formatNumber(
    state.stats.matchCounts[0] + state.stats.matchCounts[1] + state.stats.matchCounts[2]
  );
}

function renderHistory() {
  historyList.innerHTML = "";

  if (!state.history.length) {
    const empty = document.createElement("li");
    empty.innerHTML = "<small>No draws yet.</small>";
    historyList.append(empty);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    const numbers = document.createElement("div");
    const detail = document.createElement("small");

    numbers.className = "history-numbers";
    entry.draw.forEach((number) => {
      const numberNode = document.createElement("span");
      numberNode.textContent = number;
      numbers.append(numberNode);
    });

    detail.textContent = `${entry.matches} ${pluralize("match", entry.matches)}`;
    item.append(numbers, detail);
    historyList.append(item);
  });
}

function showMessage(message) {
  matchBanner.textContent = message;
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-US").format(number);
}

function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}

buildTicketGrid();
render();
