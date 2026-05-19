# Signal Aftershock: Triangulation Race

A 2-3 player hotseat browser game about rebuilding emergency signal coverage after an earthquake.

Players roll a die to determine signal-line length, draw straight lines on a triangular city grid, and compete to complete triangles. Completed triangles become stable coverage zones. The highest coverage score wins.

## Run Locally

Open `mainpage.html` in a browser to play directly from VS Code. `index.html` is the same playable page and is kept for static hosting.

You can also run a static server from the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Choose 2 or 3 players.
- Roll the die on your turn.
- Click a highlighted legal signal line.
- Resolve completed triangles when prompted.
- The game ends after the fixed turn limit, 70 percent coverage, or no legal moves.

## Folder Guide

See `PROJECT_PARTS.md` for a named breakdown of the main page, visual assets, rules modules, scoring modules, and design notes.

## Debug Dice

Debug dice controls are hidden by default. Add `?debug=1` to the URL to show them during testing.

## Credits And Acknowledgement

Prototype created with AI coding assistance.

Game logo: custom local SVG created for this prototype in `assets/game-logo.svg`.

Emergency siren map icon: `Hidrological-emergency-siren-icon.png` by YouthMappersUFRJ, sourced from Wikimedia Commons and licensed under CC BY-SA 4.0. The file is retained in `assets/` for provenance from earlier visual iterations.

See `assets/CREDITS.md` for asset details.
