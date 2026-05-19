import { getActivePlayer, getPlayer } from "./state.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function render(state, actions) {
  renderBoard(state, actions);
  renderPanel(state);
}

export function renderBoard(state, actions) {
  const svg = document.querySelector("#board-svg");
  svg.innerHTML = "";
  svg.setAttribute("viewBox", state.grid.viewBox);

  const background = createSvg("rect", {
    x: 0,
    y: 0,
    width: "100%",
    height: "100%",
    fill: "#151713"
  });
  svg.append(background);

  const labelLayer = createSvg("g", {});
  addCityLabel(labelLayer, "NORTH RIDGE", 94, 48);
  addCityLabel(labelLayer, "HARBOR SUPPLY", 470, 514);
  addCityLabel(labelLayer, "MEDICAL CORRIDOR", 436, 112);
  addCityLabel(labelLayer, "OLD POWER LOOP", 132, 470);
  addMapNote(labelLayer, "collapsed exchange", 312, 336);
  addMapNote(labelLayer, "field relay route", 414, 232);
  labelLayer.append(
    createSvg("path", {
      d: "M155 160 L188 190 L174 232 L214 260 L198 304 L238 330",
      class: "hazard-line"
    })
  );
  labelLayer.append(
    createSvg("path", {
      d: "M430 122 L402 164 L430 202 L396 250 L424 292",
      class: "hazard-line"
    })
  );
  svg.append(labelLayer);

  const cellLayer = createSvg("g", {});
  for (const cell of state.grid.cells) {
    const ownerId = state.cellOwners.get(cell.id);
    const owner = ownerId ? getPlayer(state, ownerId) : null;
    const polygon = createSvg("polygon", {
      points: cell.points.map((point) => `${point.x},${point.y}`).join(" "),
      class: `cell-fill ${state.lastClaimedCells.has(cell.id) ? "claim-flash" : ""}`,
      fill: owner ? owner.color : "transparent",
      opacity: owner ? "0.38" : "0.16"
    });
    cellLayer.append(polygon);
  }
  svg.append(cellLayer);

  const potentialLayer = createSvg("g", {});
  for (const edge of state.grid.edges) {
    const a = state.grid.nodesById.get(edge.a);
    const b = state.grid.nodesById.get(edge.b);
    potentialLayer.append(
      createSvg("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "potential-edge"
      })
    );
  }
  svg.append(potentialLayer);

  const claimedLayer = createSvg("g", {});
  for (const edge of state.grid.edges) {
    const ownerId = state.edgeOwners.get(edge.id);
    if (!ownerId) {
      continue;
    }
    const owner = getPlayer(state, ownerId);
    const a = state.grid.nodesById.get(edge.a);
    const b = state.grid.nodesById.get(edge.b);
    claimedLayer.append(
      createSvg("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "claimed-edge",
        stroke: owner.color,
        style: `color: ${owner.color}`
      })
    );
  }
  svg.append(claimedLayer);

  const siteLayer = createSvg("g", {});
  for (const site of state.grid.sites) {
    const collected = state.collectedSites.has(site.id);
    const marker = createSvg("g", {
      class: `site-marker ${collected ? "collected" : ""}`
    });
    marker.append(
      createSvg("circle", {
        cx: site.x,
        cy: site.y,
        r: 18
      })
    );
    marker.append(createSiteIcon(site));
    siteLayer.append(marker);
  }
  svg.append(siteLayer);

  const legalLayer = createSvg("g", {});
  const activePlayer = getActivePlayer(state);
  for (const move of state.legalMoves) {
    const start = state.grid.nodesById.get(move.startId);
    const end = state.grid.nodesById.get(move.endId);
    const line = createSvg("line", {
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      class: "legal-line",
      stroke: activePlayer.color,
      tabindex: 0,
      "data-move-id": move.id
    });
    line.addEventListener("click", () => actions.onMoveSelected(move.id));
    line.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        actions.onMoveSelected(move.id);
      }
    });
    legalLayer.append(line);
  }
  svg.append(legalLayer);

  const nodeLayer = createSvg("g", {});
  for (const node of state.grid.nodes) {
    nodeLayer.append(
      createSvg("circle", {
        cx: node.x,
        cy: node.y,
        r: 3.2,
        class: "node-dot"
      })
    );
  }
  svg.append(nodeLayer);
}

export function renderPanel(state) {
  const activePlayer = getActivePlayer(state);
  const currentPlayer = document.querySelector("#current-player");
  currentPlayer.innerHTML = `
    <span class="team-dot" style="background:${activePlayer.color}; color:${activePlayer.color}"></span>
    <span>${activePlayer.name}</span>
  `;

  const instruction = document.querySelector("#instruction-text");
  if (state.gameOver) {
    instruction.textContent = "Game complete. Review the final coverage result.";
  } else if (state.awaitingTurnResult) {
    instruction.textContent = "Review the turn result, then continue to the next team.";
  } else if (state.pendingResolution) {
    instruction.textContent = "Resolve the completed coverage triangle.";
  } else if (!state.hasRolled) {
    instruction.textContent = "Roll the die to determine this turn's signal line length.";
  } else if (state.legalMoves.length === 0) {
    instruction.textContent = "No legal signal line is available. The turn will pass.";
  } else if (state.emergencyShortening) {
    instruction.textContent = `Emergency Shortening: no length-${state.diceValue} line exists. Choose a length-${state.activeLineLength} line.`;
  } else {
    instruction.textContent = `Choose a legal length-${state.diceValue} signal line.`;
  }

  const diceDisplay = document.querySelector("#dice-display");
  diceDisplay.textContent = state.diceValue ?? "-";

  const rollButton = document.querySelector("#roll-dice");
  rollButton.disabled =
    state.gameOver ||
    state.hasRolled ||
    state.awaitingTurnResult ||
    Boolean(state.pendingResolution);

  const scoreList = document.querySelector("#score-list");
  scoreList.innerHTML = state.players
    .map(
      (player) => `
        <div class="score-row">
          <span class="team-name">
            <span class="team-dot" style="background:${player.color}; color:${player.color}"></span>
            <span>${player.name}</span>
          </span>
          <span class="score-value">${player.score}</span>
        </div>
      `
    )
    .join("");

  const turnSummary = document.querySelector("#turn-summary");
  turnSummary.innerHTML = state.players
    .map(
      (player) => `
        <div class="turn-row">
          <span>${player.name}</span>
          <strong>${state.turnsTaken[player.id]} / ${state.maxTurnsPerPlayer}</strong>
        </div>
      `
    )
    .join("");

  const missionProgress = document.querySelector("#mission-progress");
  const claimedPercent = Math.round((state.cellOwners.size / state.grid.cells.length) * 100);
  const targetPercent = 70;
  const targetProgress = Math.min(100, Math.round((claimedPercent / targetPercent) * 100));
  missionProgress.innerHTML = `
    <div class="progress-bar" aria-hidden="true">
      <div class="progress-fill" style="width:${targetProgress}%"></div>
    </div>
    <div class="progress-meta">
      <span>${claimedPercent}% city coverage</span>
      <strong>${targetPercent}% early-end target</strong>
    </div>
  `;

  const log = document.querySelector("#game-log");
  log.innerHTML = state.gameLog.map((message) => `<li>${message}</li>`).join("");
}

export function renderEndScreen(state, winnerSummary) {
  const title = document.querySelector("#winner-title");
  if (winnerSummary.winners.length === 1) {
    title.textContent = `${winnerSummary.winners[0].name} wins`;
  } else {
    title.textContent = "Shared victory";
  }

  const endReason = document.querySelector("#end-reason");
  endReason.textContent = `End reason: ${state.endReason ?? "mission complete"}.`;

  const finalScores = document.querySelector("#final-scores");
  finalScores.innerHTML = winnerSummary.sorted
    .map(
      (player) => `
        <div class="final-row">
          <span class="team-name">
            <span class="team-dot" style="background:${player.color}; color:${player.color}"></span>
            <span>${player.name}</span>
          </span>
          <strong>${player.score} pts, ${player.claimedCells} area, ${player.collectedSites} sites</strong>
        </div>
      `
    )
    .join("");
}

function createSvg(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function createSiteIcon(site) {
  const group = createSvg("g", {
    class: `site-icon site-icon-${site.icon}`,
    transform: `translate(${site.x - 11} ${site.y - 11})`
  });

  if (site.icon === "shelter") {
    group.append(createSvg("path", { d: "M2 12 L11 4 L20 12" }));
    group.append(createSvg("path", { d: "M5 11 L5 20 L17 20 L17 11" }));
    group.append(createSvg("path", { d: "M9 20 L9 15 L13 15 L13 20" }));
    group.append(createSvg("circle", { cx: 11, cy: 11, r: 1.6 }));
    return group;
  }

  if (site.icon === "hospital") {
    group.append(createSvg("path", { d: "M11 3 L11 19" }));
    group.append(createSvg("path", { d: "M3 11 L19 11" }));
    return group;
  }

  if (site.icon === "relay") {
    group.append(createSvg("path", { d: "M11 19 L11 9" }));
    group.append(createSvg("path", { d: "M7 19 L15 19" }));
    group.append(createSvg("path", { d: "M8 9 L11 5 L14 9" }));
    group.append(createSvg("path", { d: "M4 8 Q11 1 18 8" }));
    group.append(createSvg("path", { d: "M6 12 Q11 7 16 12" }));
    return group;
  }

  if (site.icon === "power") {
    group.append(createSvg("path", { d: "M13 2 L5 13 L11 13 L9 20 L17 9 L11 9 Z" }));
    return group;
  }

  group.append(createSvg("path", { d: "M4 8 L11 4 L18 8 L18 18 L4 18 Z" }));
  group.append(createSvg("path", { d: "M4 8 L11 12 L18 8" }));
  group.append(createSvg("path", { d: "M11 12 L11 20" }));
  return group;
}

function addCityLabel(layer, text, x, y) {
  const label = createSvg("text", {
    x,
    y,
    class: "city-label"
  });
  label.textContent = text;
  layer.append(label);
}

function addMapNote(layer, text, x, y) {
  const label = createSvg("text", {
    x,
    y,
    class: "map-note"
  });
  label.textContent = text;
  layer.append(label);
}
