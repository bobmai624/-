import { getPlayer } from "./state.js";

export function showScreen(screenName) {
  document.querySelector("#start-screen").classList.toggle("hidden", screenName !== "start");
  document.querySelector("#game-screen").classList.toggle("hidden", screenName !== "game");
  document.querySelector("#end-screen").classList.toggle("hidden", screenName !== "end");
}

export function showHelpModal() {
  showModal("How to Play", `
    <p><strong>Story:</strong> After the 04:17 aftershock, emergency teams rebuild a broken city signal web. A line is a temporary relay. A completed triangle is stable coverage.</p>
    <ol>
      <li>Choose 2 or 3 players.</li>
      <li>Roll the die. The result is the exact signal-line length for this turn. The game uses a balanced dice sequence so every team receives fair length opportunities.</li>
      <li>Click one highlighted straight line on the triangular grid.</li>
      <li>When all three sides of a triangle are occupied, it becomes a coverage zone.</li>
      <li>Triangle owner = the player with the most boundary edges. If tied, the closing player owns it.</li>
      <li>Bigger triangles claim every still-unclaimed small triangle cell inside them.</li>
      <li>After a line is placed, all completed triangles resolve automatically. Review the result, then press Next Turn.</li>
    </ol>
    <p><strong>Score:</strong> Coverage Score = newly claimed cells + critical-site bonuses + 1 bonus if a full dice-length line completes a scoring triangle.</p>
    <p><strong>Win:</strong> Highest Coverage Score wins. Ties go to more claimed area, then more collected sites. If still tied, the result is a shared victory.</p>
    <p><strong>End:</strong> 2-player games give each player 12 turns. 3-player games give each player 10 turns. The game can also end at 70% city coverage or when no legal lines remain.</p>
  `);
}

export function showTurnResultModal(state, summary, onNext) {
  const gainRows = state.players
    .map((player) => {
      const gain = summary.teamGains[player.id];
      return `
        <div class="gain-row" style="--team-color:${player.color}">
          <span>
            <span class="team-dot" style="background:${player.color}; color:${player.color}"></span>
            ${player.name}
          </span>
          <strong>+${gain.total}</strong>
        </div>
      `;
    })
    .join("");

  const details =
    summary.resolved.length > 0
      ? summary.resolved
          .map((result) => {
            const owner = getPlayer(state, result.ownerId);
            const siteText =
              result.sites.length > 0
                ? ` Sites: ${result.sites.map((site) => `${site.name} +${site.bonus}`).join(", ")}.`
                : "";
            const lengthText = result.lengthBonus > 0 ? " Full-length closure +1." : "";
            return `
              <li>
                <strong>${owner.name}</strong> secured a side-${result.sideLength} ${result.orientation} triangle:
                +${result.area} area, +${result.siteBonus} sites, +${result.lengthBonus} line bonus.
                <strong>Total +${result.total}</strong>.${siteText}${lengthText}
              </li>
            `;
          })
          .join("")
      : `<li>No stable coverage triangle was completed. All teams gain +0 this turn.</li>`;

  showModal(
    "Turn Result",
    `
      <p><strong>${summary.activePlayerName}</strong> placed a length-${summary.lineLength} signal line. Results are locked in.</p>
      <div class="turn-gains">${gainRows}</div>
      <ol class="result-details">${details}</ol>
      <button id="next-turn" data-testid="next-turn" class="primary-button full next-turn-button">Next Turn</button>
    `,
    { closable: false }
  );

  document.querySelector("#next-turn").addEventListener("click", onNext);
}

export function showModal(title, bodyHtml, options = {}) {
  const backdrop = document.querySelector("#modal-backdrop");
  const modalTitle = document.querySelector("#modal-title");
  const modalBody = document.querySelector("#modal-body");
  const closeButton = document.querySelector("#modal-close");

  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  closeButton.classList.toggle("hidden", options.closable === false);
  backdrop.classList.remove("hidden");
  backdrop.setAttribute("aria-hidden", "false");
}

export function closeModal() {
  const backdrop = document.querySelector("#modal-backdrop");
  backdrop.classList.add("hidden");
  backdrop.setAttribute("aria-hidden", "true");
}
