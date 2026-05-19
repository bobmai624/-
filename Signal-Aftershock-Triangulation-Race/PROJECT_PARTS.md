# Project Parts

This folder is the playable game prototype for **Signal Aftershock: Triangulation Race**.

## Open This First

- `mainpage.html`: main playable page for opening directly from VS Code or a browser.
- `index.html`: same playable page, kept for static hosting and GitHub Pages.

## Visual Files

- `styles.css`: layout, colors, emergency-map styling, animations, and responsive design.
- `assets/game-logo.svg`: custom game logo.
- `assets/emergency-siren.png`: credited emergency icon asset retained for provenance.
- `assets/CREDITS.md`: asset credit notes.

## Game Code

- `src/main.js`: starts the app and connects UI, state, dice, rules, and rendering.
- `src/state.js`: creates and stores the current game state.
- `src/config.js`: player colors, map settings, site bonuses, and turn limits.
- `src/grid.js`: triangular grid, edges, cells, and candidate triangle generation.
- `src/geometry.js`: geometric helpers for lines, cells, and triangle boundaries.
- `src/dice.js`: balanced dice sequence logic for fair 2-player and 3-player games.
- `src/rules.js`: legal move detection, turn rules, line placement, and end conditions.
- `src/scoring.js`: triangle ownership, area scoring, site bonuses, and winner ranking.
- `src/render.js`: SVG board rendering, icons, claimed areas, lines, and score panel updates.
- `src/input.js`: player count selection and start-screen input.
- `src/ui.js`: modals, result summaries, logs, and end-game screen.

## Design Notes

- `GAME_SPEC.md`: formal game rules and theme specification.
- `README.md`: short run instructions and credits.
