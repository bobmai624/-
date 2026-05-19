export function setupPlayerCountButtons(onSelect) {
  document.querySelectorAll("[data-player-count]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-player-count]")
        .forEach((candidate) => candidate.classList.remove("selected"));
      button.classList.add("selected");
      onSelect(Number(button.dataset.playerCount));
    });
  });
}
