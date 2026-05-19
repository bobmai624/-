import { CONFIG } from "./config.js";
import { getBalancedDiceValue } from "./dice.js";
import { edgeId } from "./geometry.js";
import { getNodeAt, getPathEdges } from "./grid.js";
import { addLog, getActivePlayer } from "./state.js";

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollBalancedD6(state) {
  return getBalancedDiceValue(state, getActivePlayer(state).id);
}

export function computeLegalMovesForTurn(state) {
  if (!state.diceValue) {
    state.legalMoves = [];
    state.emergencyShortening = false;
    state.activeLineLength = null;
    return [];
  }

  const exactMoves = getLegalMoves(state, state.diceValue);

  if (exactMoves.length > 0) {
    state.legalMoves = exactMoves;
    state.emergencyShortening = false;
    state.activeLineLength = state.diceValue;
    return exactMoves;
  }

  for (let length = state.diceValue - 1; length >= 1; length -= 1) {
    const shorterMoves = getLegalMoves(state, length);
    if (shorterMoves.length > 0) {
      state.legalMoves = shorterMoves.map((move) => ({
        ...move,
        emergency: true
      }));
      state.emergencyShortening = true;
      state.activeLineLength = length;
      return state.legalMoves;
    }
  }

  state.legalMoves = [];
  state.emergencyShortening = true;
  state.activeLineLength = null;
  return [];
}

export function getLegalMoves(state, length) {
  const moves = new Map();

  for (const node of state.grid.nodes) {
    for (const direction of CONFIG.directions) {
      const end = getNodeAt(
        state.grid,
        node.q + direction.q * length,
        node.r + direction.r * length
      );

      if (!end) {
        continue;
      }

      const pathEdges = getPathEdges(state.grid, node.id, end.id);
      if (!pathEdges || pathEdges.length !== length) {
        continue;
      }

      const clear = pathEdges.every((unitEdgeId) => !state.edgeOwners.has(unitEdgeId));
      if (!clear) {
        continue;
      }

      const id = edgeId(node.id, end.id);
      if (!moves.has(id)) {
        moves.set(id, {
          id,
          startId: node.id,
          endId: end.id,
          length,
          pathEdges,
          emergency: false
        });
      }
    }
  }

  return Array.from(moves.values());
}

export function placeLine(state, moveId) {
  const move = state.legalMoves.find((candidate) => candidate.id === moveId);
  if (!move) {
    return null;
  }

  const activePlayer = getActivePlayer(state);

  for (const unitEdgeId of move.pathEdges) {
    state.edgeOwners.set(unitEdgeId, activePlayer.id);
  }

  state.drawnLines.push({
    id: `${activePlayer.id}-${state.drawnLines.length}`,
    ownerId: activePlayer.id,
    startId: move.startId,
    endId: move.endId,
    pathEdges: move.pathEdges,
    length: move.length,
    fullLength: !move.emergency && move.length === state.diceValue
  });

  state.legalMoves = [];

  addLog(
    state,
    `${activePlayer.name} drew a length-${move.length} signal line${
      move.emergency ? " with Emergency Shortening" : ""
    }.`
  );

  return move;
}

export function findCompletedTriangles(state, newEdges) {
  const newEdgeSet = new Set(newEdges);

  return state.grid.triangles
    .filter((triangle) => {
      if (state.resolvedTriangles.has(triangle.id)) {
        return false;
      }

      if (!triangle.boundaryEdges.some((unitEdgeId) => newEdgeSet.has(unitEdgeId))) {
        return false;
      }

      if (!triangle.boundaryEdges.every((unitEdgeId) => state.edgeOwners.has(unitEdgeId))) {
        return false;
      }

      return triangle.innerSmallCells.some((cellId) => !state.cellOwners.has(cellId));
    })
    .sort((a, b) => {
      if (b.sideLength !== a.sideLength) {
        return b.sideLength - a.sideLength;
      }
      return a.id.localeCompare(b.id);
    });
}

export function completeTurn(state) {
  const activePlayer = getActivePlayer(state);
  state.turnsTaken[activePlayer.id] += 1;
  state.totalTurnsCompleted += 1;
  state.diceValue = null;
  state.hasRolled = false;
  state.emergencyShortening = false;
  state.activeLineLength = null;
  state.legalMoves = [];
  state.awaitingTurnResult = false;
  state.pendingResolution = null;

  const endReason = getEndReason(state);
  if (endReason) {
    state.gameOver = true;
    state.endReason = endReason;
    addLog(state, `Game over: ${endReason}.`);
    return;
  }

  let guard = 0;
  do {
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
    guard += 1;
  } while (
    state.turnsTaken[getActivePlayer(state).id] >= state.maxTurnsPerPlayer &&
    guard <= state.players.length
  );

  addLog(state, `${getActivePlayer(state).name} is active.`);
}

export function getEndReason(state) {
  const allTurnsUsed = state.players.every(
    (player) => state.turnsTaken[player.id] >= state.maxTurnsPerPlayer
  );
  if (allTurnsUsed) {
    return "all scheduled turns are complete";
  }

  const claimedRatio = state.cellOwners.size / state.grid.cells.length;
  if (claimedRatio >= CONFIG.claimThreshold) {
    return "70 percent of the city map is covered";
  }

  const hasAnyMove = [1, 2, 3, 4, 5, 6].some((length) => getLegalMoves(state, length).length > 0);
  if (!hasAnyMove) {
    return "no legal signal lines remain";
  }

  return null;
}

export function getWinnerSummary(state) {
  const sorted = [...state.players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.claimedCells !== a.claimedCells) {
      return b.claimedCells - a.claimedCells;
    }
    return b.collectedSites - a.collectedSites;
  });

  const best = sorted[0];
  const tied = sorted.filter(
    (player) =>
      player.score === best.score &&
      player.claimedCells === best.claimedCells &&
      player.collectedSites === best.collectedSites
  );

  return {
    sorted,
    winners: tied
  };
}
