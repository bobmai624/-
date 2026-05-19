# Signal Aftershock: Triangulation Race

## Project Boundary

Signal Aftershock: Triangulation Race is a 2-3 player hotseat web game about rebuilding emergency signal coverage across a damaged city after an earthquake.

The game must stay pure and geometric. Do not add cards, character skills, attack abilities, inventories, RPG systems, event decks, or asymmetric player powers. Players differ only by name, color, and score.

The core mechanics are:

- Roll a die to determine this turn's signal line length.
- Draw a straight signal line on a triangular grid.
- Complete triangles to claim stable coverage territory.
- Score based on the amount of newly covered area and fixed critical-site bonuses.
- Win by having the highest coverage score at the end of the game.

## Theme

After an earthquake, emergency communication teams enter a damaged city to rebuild temporary signal coverage.

The theme maps directly onto the rules:

- A dice result represents the available cable length, drone relay range, or signal deployment window for the turn.
- A drawn line represents a temporary signal link.
- A completed triangle represents a stable communication coverage zone.
- Claimed area represents restored city coverage.
- Critical sites represent urgent infrastructure and rescue priorities.
- Player competition represents multiple response teams racing to establish the most useful coverage.

## Players

The game supports 2 or 3 hotseat players sharing one browser.

Player identities are cosmetic only:

- Player 1: Blue Team / SkyLink Unit, cyan-blue.
- Player 2: Orange Team / Ground Relay Unit, rescue-orange.
- Player 3: Green Team / Civic Signal Unit, medical-green.

Players have:

- Name.
- Color.
- Score.
- Claimed area count.
- Collected critical-site count.

Players do not have:

- Skills.
- Special actions.
- Attack abilities.
- Cards.
- Decks.
- Inventories.
- Asymmetric powers.

## Board

The game board is an SVG triangular lattice city map.

The grid should use approximately a 7 by 7 node layout and support three line directions:

- Horizontal.
- Down-right diagonal.
- Down-left diagonal.

The board contains:

- Nodes.
- Empty unit edges.
- Small triangular cells.
- Candidate larger triangles.
- Fixed critical-site markers.

Unoccupied potential edges should appear as subtle grey dashed lines. Claimed player lines should glow in that player's color. Claimed cells should be filled with the owning player's color at low opacity.

## Turn Structure

On each turn:

1. The active player rolls a d6.
2. The dice result becomes the required signal line length for the turn.
3. The player chooses a legal straight line on the triangular grid.
4. The game claims every unit edge along that line for the active player.
5. The game checks for completed triangles.
6. Completed triangles are resolved and scored.
7. The turn passes to the next player.

The active player must roll before drawing a line.

## Dice And Line Length

The game uses a balanced dice sequence for fairness:

- At the start of each game, the system generates one shuffled dice sequence for the whole match.
- Every player uses the same sequence by turn number.
- For example, if turn 1 in the sequence is 5, every player receives 5 on their first turn.
- This keeps randomness in the order of lengths while preventing one team from consistently receiving higher or lower dice values.

The standard line rule is exact length:

- If the player rolls 1, they must draw a length-1 line.
- If the player rolls 2, they must draw a length-2 line.
- If the player rolls 3, they must draw a length-3 line.
- If the player rolls 4, they must draw a length-4 line.
- If the player rolls 5, they must draw a length-5 line.
- If the player rolls 6, they must draw a length-6 line.

If no legal line exists for the exact dice value, Emergency Shortening triggers:

- The player may draw a shorter legal line.
- The chosen line must be one of the longest legal shorter lines currently available.
- The move can still complete and score triangles.
- The move does not receive a full-length bonus.

## Legal Line

A legal line must satisfy all of these conditions:

- The start and end points are valid grid nodes.
- The start and end points are aligned along one legal triangular-grid direction.
- The line length equals the dice value unless Emergency Shortening is active.
- Every unit edge along the path exists inside the board.
- Every unit edge along the path is unoccupied.
- The line does not overlap an existing player line.
- The line does not pass outside the board.

Lines may pass through intermediate nodes. Lines may connect to endpoints of existing lines.

## Edge Ownership

Each unit edge can be owned by only one player.

When a player draws a line longer than one unit, the line is decomposed into unit edges. Every unit edge in that path becomes owned by the active player.

Use a stable edge id so the same edge has the same id regardless of direction:

```js
function edgeId(a, b) {
  return [a, b].sort().join("-");
}
```

## Candidate Triangles

The game should precompute candidate triangles before play begins.

Supported triangle side lengths:

- 1.
- 2.
- 3.
- 4.

Each candidate triangle stores:

- `id`.
- `sideLength`.
- `orientation`.
- `boundaryUnitEdges`.
- `innerSmallCells`.
- `claimed` or equivalent resolution state.

A candidate triangle is completed when:

- All of its boundary unit edges are occupied.
- At least one of its inner small triangular cells is still unclaimed.

## Triangle Ownership

Triangle ownership is decided by perimeter majority.

To resolve a completed triangle:

1. Count how many boundary unit edges each player owns.
2. The player with the most boundary unit edges owns the triangle.
3. If there is a tie, the player who drew the closing line owns the triangle.

The closing player does not automatically own the triangle unless the perimeter count is tied.

## Triangle Scoring

When a player owns a completed triangle, they claim only the unclaimed small triangular cells inside that triangle.

Scoring:

- Each newly claimed small triangular cell gives +1 point.
- Already claimed cells do not score again.
- Already claimed cells do not change owner.

This prevents double counting and makes overlapping small and large triangles strategically meaningful.

## Multiple Completed Triangles

A single drawn line may complete multiple candidate triangles.

Resolution rules:

- Completed triangles resolve automatically after the player places a line.
- The system uses a fixed order: larger triangles first, then a stable triangle id order.
- After resolving one triangle, recompute remaining completed triangles because claimed cells may change the score value of overlapping triangles.
- Continue until no completed triangle with unclaimed cells remains.
- Show a turn result popup summarizing how many points each team gained.
- The player presses Next Turn to continue.

The automatic resolution order can affect scoring, but it must never allow duplicate scoring of the same small cell.

## Critical Sites

Critical sites are fixed board markers, not cards or powers.

Recommended site types:

| Site | Display | Bonus |
| --- | --- | ---: |
| Shelter | SOS | +2 |
| Hospital | Cross | +3 |
| Relay Tower | Signal | +2 |
| Power Station | Lightning | +3 |
| Supply Point | Crate | +2 |

Critical-site scoring:

- Each site is placed inside one selected small triangular cell.
- When a player claims that cell, they collect the site bonus if the site is still unclaimed.
- A site can score only once.
- Site bonuses should appear in the game log and triangle resolution UI.

## Full-Length Bonus

If a player uses the full dice length and that line completes at least one scoring triangle, award +1 bonus point to the relevant scoring result.

Emergency Shortening moves do not receive this bonus.

## End Game

The game ends when any of these conditions occurs:

- In a 2-player game, each player has completed 12 turns.
- In a 3-player game, each player has completed 10 turns.
- At least 70% of small triangular cells have been claimed.
- No player has any legal move for any dice value from 1 to 6.

## Winner

The player with the highest score wins.

Tie-breakers:

1. More claimed small triangular cells.
2. More collected critical sites.
3. If still tied, show a shared victory.

## Required Screens

### Start Screen

The start screen should include:

- Game title.
- Short thematic subtitle.
- 2-player and 3-player selection.
- Start Game button.
- How to Play button.

### Game Screen

The game screen should include:

- SVG board area.
- Current player display.
- Dice value.
- Roll Dice button.
- Scores.
- Remaining turns.
- Current instruction text.
- Compact game log.

### Triangle Resolution Popup

The popup should show:

- Completed triangle side length.
- Predicted or resolved owner.
- Area gained.
- Site bonus gained.
- Full-length bonus, if any.
- Total gained.

If multiple triangles are completed, the popup should allow the active player to choose the resolution order.

### End Screen

The end screen should show:

- Winner or shared victory.
- Final scores.
- Area claimed by each player.
- Critical sites collected by each player.
- Play Again button.

## How To Play Copy

Keep in-game instructions concise. This is the playable prototype, not the written report.

Suggested How to Play steps:

1. Choose 2 or 3 players.
2. Roll the die to get this turn's signal line length.
3. Choose a legal straight line on the triangular city grid.
4. Complete triangles to create stable signal coverage zones.
5. Bigger triangles can claim more area, but ownership depends on perimeter majority.
6. The highest coverage score wins.

Theme sentence:

"After an earthquake, each line represents a temporary signal link. A completed triangle represents stable communication coverage."

## Technical Constraints

Use:

- Vanilla HTML.
- CSS.
- Vanilla JavaScript.
- SVG for the board.

Do not use:

- React.
- External frameworks.
- Build tooling.
- Server-only features.
- Card systems.
- Character ability systems.

The prototype should be runnable by opening `index.html` directly or by using a simple local static server.

## Suggested File Structure

```text
signal-aftershock/
  index.html
  styles.css
  README.md
  GAME_SPEC.md
  src/
    main.js
    config.js
    grid.js
    geometry.js
    state.js
    dice.js
    rules.js
    scoring.js
    render.js
    input.js
    ui.js
  assets/
    logo.svg
    icons/
      shelter.svg
      hospital.svg
      relay.svg
      power.svg
      supply.svg
```

The first implementation should prioritize a working prototype over complex effects. Polish, animation, and visual refinements should come after the core turn loop and scoring are reliable.
