import { CONFIG } from "./config.js";
import { createGrid } from "./grid.js";
import { createBalancedDiceSequence } from "./dice.js";

export function createGameState(playerCount = 2) {
  const grid = createGrid();
  const players = CONFIG.players.slice(0, playerCount).map((player) => ({
    ...player,
    score: 0,
    claimedCells: 0,
    collectedSites: 0,
    sitePoints: 0
  }));

  return {
    grid,
    players,
    playerCount,
    activePlayerIndex: 0,
    maxTurnsPerPlayer: playerCount === 2 ? 12 : 10,
    diceSequence: createBalancedDiceSequence(playerCount === 2 ? 12 : 10),
    turnsTaken: Object.fromEntries(players.map((player) => [player.id, 0])),
    totalTurnsCompleted: 0,
    diceValue: null,
    hasRolled: false,
    emergencyShortening: false,
    activeLineLength: null,
    legalMoves: [],
    edgeOwners: new Map(),
    drawnLines: [],
    cellOwners: new Map(),
    resolvedTriangles: new Set(),
    collectedSites: new Map(),
    gameLog: [
      "Command channel open. Roll the die to deploy the first signal link."
    ],
    awaitingTurnResult: false,
    pendingResolution: null,
    lastClaimedCells: new Set(),
    gameOver: false,
    endReason: null
  };
}

export function getActivePlayer(state) {
  return state.players[state.activePlayerIndex];
}

export function getPlayer(state, playerId) {
  return state.players.find((player) => player.id === playerId);
}

export function addLog(state, message) {
  state.gameLog.unshift(message);
  state.gameLog = state.gameLog.slice(0, 12);
}
