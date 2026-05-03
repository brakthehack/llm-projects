/**
 * Snake Game - Terminal Rendering
 *
 * Uses ANSI escape codes to draw the game grid, score, and
 * status messages to the terminal.
 */

const { getCell } = require('./game');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgDark: '\x1b[40m',
};

const SYMBOLS = {
  head: '█',
  body: '▓',
  food: '●',
  wall: '█',
  empty: ' ',
  cornerTL: '╔',
  cornerTR: '╗',
  cornerBL: '╚',
  cornerBR: '╝',
  edgeH: '═',
  edgeV: '║',
};

/**
 * Renders the full game state to the terminal.
 * @param {object} game - The game object
 * @param {object} options - Rendering options
 * @param {boolean} options.showScore - Show score display
 * @param {boolean} options.showHelp - Show controls help
 */
function render(game, options = {}) {
  const { showScore = true, showHelp = true } = options;

  let output = '';

  // Clear screen and move cursor to top
  output += '\x1b[2J\x1b[H';

  // Title
  output += `${COLORS.bold}${COLORS.cyan}  🐍 SNAKE GAME ${COLORS.reset}\n`;
  output += `${COLORS.dim}─────────────────────────────${COLORS.reset}\n`;

  // Score display
  if (showScore) {
    output += `  Score: ${COLORS.bold}${COLORS.yellow}${String(game.score).padStart(4)}${COLORS.reset}`;
    output += `  |  High Score: ${COLORS.yellow}${String(game.highScore).padStart(4)}${COLORS.reset}\n`;
  }

  // Status message
  if (game.status === 'ready') {
    output += `  ${COLORS.green}Press any arrow key to start${COLORS.reset}\n`;
  } else if (game.status === 'paused') {
    output += `  ${COLORS.yellow}⏸ PAUSED - Press SPACE to resume${COLORS.reset}\n`;
  } else if (game.status === 'gameover') {
    output += `  ${COLORS.red}💀 GAME OVER - Press R to restart, Q to quit${COLORS.reset}\n`;
  }

  output += `${COLORS.dim}─────────────────────────────${COLORS.reset}\n`;

  // Render game grid
  output += renderGrid(game);

  // Controls help
  if (showHelp && game.status !== 'gameover') {
    output += `${COLORS.dim}─────────────────────────────${COLORS.reset}\n`;
    output += `  Controls: ${COLORS.white}WASD/Arrows${COLORS.reset} | ${COLORS.white}Space${COLORS.reset}=Pause | ${COLORS.white}R${COLORS.reset}=Restart | ${COLORS.white}Q${COLORS.reset}=Quit\n`;
  }

  process.stdout.write(output);
}

/**
 * Renders the game grid (walls + play area).
 */
function renderGrid(game) {
  let output = '';

  // Top border
  output += `${SYMBOLS.cornerTL}${SYMBOLS.edgeH.repeat(game.width * 2)}${SYMBOLS.cornerTR}\n`;

  // Grid rows
  for (let y = 0; y < game.height; y++) {
    output += `${SYMBOLS.edgeV}`;
    for (let x = 0; x < game.width; x++) {
      const cell = getCell(game, x, y);
      const color = getCellColor(cell);
      const sym = getCellSymbol(cell);
      output += `${color}${sym}${COLORS.reset} `;
    }
    output += `${SYMBOLS.edgeV}\n`;
  }

  // Bottom border
  output += `${SYMBOLS.cornerBL}${SYMBOLS.edgeH.repeat(game.width * 2)}${SYMBOLS.cornerBR}\n`;

  return output;
}

/**
 * Gets the ANSI color for a cell type.
 */
function getCellColor(cell) {
  switch (cell) {
    case 'head':
      return COLORS.brightGreen;
    case 'body':
      return COLORS.green;
    case 'food':
      return COLORS.red;
    default:
      return '';
  }
}

/**
 * Gets the display symbol for a cell type.
 */
function getCellSymbol(cell) {
  switch (cell) {
    case 'head':
      return SYMBOLS.head;
    case 'body':
      return SYMBOLS.body;
    case 'food':
      return SYMBOLS.food;
    default:
      return SYMBOLS.empty;
  }
}

/**
 * Shows a centered message overlay.
 */
function showOverlay(game, title, subtitle) {
  let output = '';
  output += '\x1b[2J\x1b[H';
  output += renderGrid(game);
  output += `\n`;
  output += `${COLORS.bold}${COLORS.red}  ${title}${COLORS.reset}\n`;
  if (subtitle) {
    output += `  ${COLORS.dim}${subtitle}${COLORS.reset}\n`;
  }
  output += `\n`;
  output += `${COLORS.dim}─────────────────────────────${COLORS.reset}\n`;
  process.stdout.write(output);
}

module.exports = {
  render,
  showOverlay,
  COLORS,
  SYMBOLS,
};
