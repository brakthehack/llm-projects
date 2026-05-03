/**
 * Snake Game - Input Handling
 *
 * Reads raw keypress events from stdin and maps them to game actions.
 */

const { Direction } = require('./game');

/**
 * Sets up stdin for raw keypress mode.
 * Returns a promise that resolves with key events.
 */
function setupInput() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const keyHandler = (data) => {
      // Handle escape sequences (arrow keys, etc.)
      if (data === '\x1b') {
        // Waiting for next byte
        process.stdin.once('data', (nextData) => {
          if (nextData === '[') {
            process.stdin.once('data', (finalData) => {
              const key = finalData;
              const action = parseKey(key);
              if (action) resolve(action);
              setupInput().then(resolve);
            });
          } else {
            const action = parseKey(data);
            if (action) resolve(action);
            setupInput().then(resolve);
          }
        });
      } else {
        const action = parseKey(data);
        if (action) resolve(action);
        setupInput().then(resolve);
      }
    };

    // Start the chain
    process.stdin.once('data', keyHandler);
  });
}

/**
 * Parses a key character into a game action.
 * @returns {object|null} - { type: 'direction'|'pause'|'restart'|'start', data? }
 */
function parseKey(key) {
  switch (key) {
    case 'w':
    case 'W':
      return { type: 'direction', data: Direction.UP };
    case 's':
    case 'S':
      return { type: 'direction', data: Direction.DOWN };
    case 'a':
    case 'A':
      return { type: 'direction', data: Direction.LEFT };
    case 'd':
    case 'D':
      return { type: 'direction', data: Direction.RIGHT };
    case '\x1b[A':
    case 'k':
      return { type: 'direction', data: Direction.UP };
    case '\x1b[B':
    case 'j':
      return { type: 'direction', data: Direction.DOWN };
    case '\x1b[D':
    case 'h':
      return { type: 'direction', data: Direction.LEFT };
    case '\x1b[C':
    case 'l':
      return { type: 'direction', data: Direction.RIGHT };
    case ' ':
      return { type: 'pause' };
    case 'r':
    case 'R':
      return { type: 'restart' };
    case 'q':
    case 'Q':
      return { type: 'quit' };
    default:
      // Any other key starts the game from 'ready' state
      if (key && key.length <= 2) {
        return { type: 'start' };
      }
      return null;
  }
}

/**
 * Cleans up stdin raw mode.
 */
function cleanupInput() {
  process.stdin.setRawMode(false);
  process.stdin.pause();
}

module.exports = { setupInput, cleanupInput, parseKey };
