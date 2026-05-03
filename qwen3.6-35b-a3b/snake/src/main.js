/**
 * Snake Game - Main Entry Point
 *
 * Ties together game logic, rendering, and input into a
 * playable terminal game loop.
 */

const {
  createGame,
  setDirection,
  tick,
  startGame,
  pauseGame,
  resetGame,
  Direction,
} = require('./game');
const { render } = require('./render');
const { setupInput, cleanupInput } = require('./input');

// Default grid size: 20 wide × 12 tall
const GRID_WIDTH = 20;
const GRID_HEIGHT = 12;

let game;
let gameLoop = null;

/**
 * Starts the game loop with a fixed tick rate.
 */
function startGameLoop() {
  stopGameLoop();
  gameLoop = setInterval(() => {
    const result = tick(game);
    render(game);

    if (game.status === 'gameover') {
      stopGameLoop();
      showGameOver();
    }
  }, game.speed);
}

function stopGameLoop() {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
}

function showGameOver() {
  const output =
    '\x1b[2J\x1b[H' +
    `\n\n${'  '.repeat(Math.floor((GRID_WIDTH * 2) / 4))}` +
    `\n  ${'\x1b[1m\x1b[31m'}💀 GAME OVER 💀\x1b[0m\n` +
    `  Final Score: \x1b[1m\x1b[33m${game.score}\x1b[0m\n` +
    `  High Score:  \x1b[1m\x1b[33m${game.highScore}\x1b[0m\n` +
    `\n  Press \x1b[1mR\x1b[0m to play again, \x1b[1mQ\x1b[0m to quit\n\n`;
  process.stdout.write(output);
}

/**
 * Main game loop that processes input and drives the game.
 */
async function run() {
  game = createGame(GRID_WIDTH, GRID_HEIGHT);
  render(game);

  try {
    while (true) {
      const action = await setupInput();

      switch (action.type) {
        case 'direction':
          if (game.status === 'ready') {
            startGame(game);
            startGameLoop();
          }
          setDirection(game, action.data);
          break;

        case 'pause':
          if (game.status === 'running') {
            pauseGame(game);
            stopGameLoop();
          } else if (game.status === 'paused') {
            startGame(game);
            startGameLoop();
          }
          render(game);
          break;

        case 'restart':
          stopGameLoop();
          resetGame(game);
          render(game);
          break;

        case 'start':
          if (game.status === 'ready') {
            startGame(game);
            startGameLoop();
          }
          break;

        case 'quit':
          stopGameLoop();
          throw new Error('Quit');
      }
    }
  } catch (err) {
    if (err.code !== 'EOF') {
      console.error('Game error:', err);
    }
  } finally {
    stopGameLoop();
    cleanupInput();
    // Reset terminal
    process.stdout.write('\x1b[2J\x1b[H\x1b[?25h');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  stopGameLoop();
  cleanupInput();
  process.stdout.write('\x1b[2J\x1b[H\x1b[?25h');
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopGameLoop();
  cleanupInput();
  process.stdout.write('\x1b[2J\x1b[H\x1b[?25h');
  process.exit(0);
});

run().catch((err) => {
  console.error('Failed to start game:', err);
  process.exit(1);
});
