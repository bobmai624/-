import { createGameState, addLog, getActivePlayer } from "./state.js";
import {
  completeTurn,
  computeLegalMovesForTurn,
  findCompletedTriangles,
  getWinnerSummary,
  placeLine,
  rollBalancedD6
} from "./rules.js";
import { resolveTriangle } from "./scoring.js";
import { render, renderEndScreen } from "./render.js";
import { closeModal, showHelpModal, showScreen, showTurnResultModal } from "./ui.js";
import { setupPlayerCountButtons } from "./input.js";

let selectedPlayerCount = 2;
let state = null;

const debugEnabled = new URLSearchParams(window.location.search).has("debug");
document.querySelector("#debug-dice-wrap").classList.toggle("hidden", !debugEnabled);

setupPlayerCountButtons((count) => {
  selectedPlayerCount = count;
});

document.querySelector("#start-game").addEventListener("click", () => {
  startGame(selectedPlayerCount);
});

document.querySelector("#restart-game").addEventListener("click", () => {
  startGame(selectedPlayerCount);
});

document.querySelector("#play-again").addEventListener("click", () => {
  showScreen("start");
});

document.querySelectorAll("[data-open-help]").forEach((button) => {
  button.addEventListener("click", showHelpModal);
});

document.querySelector("#modal-close").addEventListener("click", closeModal);

document.querySelector("#roll-dice").addEventListener("click", () => {
  if (!state || state.hasRolled || state.gameOver) {
    return;
  }

  const debugValue = document.querySelector("#debug-dice").value;
  state.diceValue = debugEnabled && debugValue ? Number(debugValue) : rollBalancedD6(state);
  state.hasRolled = true;

  const diceDisplay = document.querySelector("#dice-display");
  diceDisplay.classList.remove("rolling");
  void diceDisplay.offsetWidth;
  diceDisplay.classList.add("rolling");

  const moves = computeLegalMovesForTurn(state);
  if (moves.length === 0) {
    addLog(state, `${getActivePlayer(state).name} has no legal signal line and must pass.`);
    completeTurn(state);
    afterTurnChange();
    return;
  }

  render(state, actions);
});

const actions = {
  onMoveSelected(moveId) {
    if (!state || state.gameOver || state.pendingResolution || state.awaitingTurnResult) {
      return;
    }

    const closingPlayer = getActivePlayer(state);
    const move = placeLine(state, moveId);
    if (!move) {
      return;
    }

    const summary = resolveMoveAutomatically(move, closingPlayer.id, closingPlayer.name);
    state.awaitingTurnResult = true;
    render(state, actions);
    showTurnResultModal(state, summary, () => {
      closeModal();
      completeTurn(state);
      afterTurnChange();
    });
  }
};

function startGame(playerCount) {
  selectedPlayerCount = playerCount;
  state = createGameState(playerCount);
  closeModal();
  showScreen("game");
  render(state, actions);
}

function resolveMoveAutomatically(move, closingPlayerId, activePlayerName) {
  const resolved = [];
  const teamGains = Object.fromEntries(
    state.players.map((player) => [
      player.id,
      {
        total: 0,
        area: 0,
        siteBonus: 0,
        lengthBonus: 0,
        triangles: 0
      }
    ])
  );

  let fullLengthBonusAvailable = move.fullLength;
  let pending = findCompletedTriangles(state, move.pathEdges);

  while (pending.length > 0) {
    const triangle = pending[0];
    const result = resolveTriangle(state, triangle, closingPlayerId, fullLengthBonusAvailable);
    const gain = teamGains[result.ownerId];

    gain.total += result.total;
    gain.area += result.area;
    gain.siteBonus += result.siteBonus;
    gain.lengthBonus += result.lengthBonus;
    gain.triangles += 1;
    resolved.push(result);

    fullLengthBonusAvailable = false;
    pending = findCompletedTriangles(state, move.pathEdges);
  }

  if (resolved.length === 0) {
    addLog(state, "No stable coverage triangle completed this turn.");
  }

  return {
    activePlayerName,
    lineLength: move.length,
    emergency: move.emergency,
    resolved,
    teamGains
  };
}

function afterTurnChange() {
  render(state, actions);
  if (state.gameOver) {
    const summary = getWinnerSummary(state);
    renderEndScreen(state, summary);
    showScreen("end");
  }
}

showScreen("start");
