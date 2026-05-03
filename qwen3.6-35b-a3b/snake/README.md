# 🐍 Snake Game

A terminal-based Snake game built with Node.js. No external UI dependencies — just raw ANSI escape codes.

## Setup

```bash
cd code/test-project
npm install
```

## Play

```bash
npm start
```

### Controls

| Key       | Action          |
|-----------|-----------------|
| `W` / `↑` | Move Up         |
| `A` / `←` | Move Left       |
| `S` / `↓` | Move Down       |
| `D` / `→` | Move Right      |
| `Space`   | Pause / Resume  |
| `R`       | Restart (after game over) |
| `Q`       | Quit                |
| `Ctrl+C`  | Quit            |

## Tests

```bash
npm test           # Run all 76 tests
npm run test:watch # Watch mode
```

### Test coverage

| Suite               | Tests | What it verifies |
|---------------------|-------|------------------|
| `test-helpers`      | 16    | Navigation helpers (distance, safety, direction-finding, food-eating) |
| `game-creation`     | 10    | Grid dimensions, snake spawn, initial state |
| `game-movement`     | 7     | Snake movement in all directions, body following |
| `game-direction`    | 7     | Direction changes, 180° reversal prevention, direction queuing |
| `game-food`         | 5     | Food spawning, eating, growth, score increase |
| `game-score`        | 4     | Score tracking, high score persistence |
| `game-collision`    | 8     | Wall collisions, self-collision, paused/ready no-ops |
| `game-state`        | 7     | Start, pause, resume, reset lifecycle |
| `game-utils`        | 5     | `isSnake`, `isFood`, `getCell` helpers |
| `game-integration`  | 7     | End-to-end: eating multiple foods, pause/resume, full game loop |
