/**
 * Snake Game - Core Game Logic
 *
 * Handles all game state: snake body, food placement, movement,
 * collision detection, and scoring. Pure logic with no I/O.
 */

const Direction = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

/**
 * Creates a new Game instance.
 * @param {number} width - Grid width in cells
 * @param {number} height - Grid height in cells
 */
function createGame(width, height) {
  const initialSnake = [
    { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    { x: Math.floor(width / 2) - 1, y: Math.floor(height / 2) },
    { x: Math.floor(width / 2) - 2, y: Math.floor(height / 2) },
  ];

  const game = {
    width,
    height,
    snake: initialSnake,
    direction: Direction.RIGHT,
    nextDirection: Direction.RIGHT,
    food: null,
    score: 0,
    highScore: 0,
    status: 'ready', // 'ready' | 'running' | 'paused' | 'gameover'
    speed: 150, // ms per tick
    spawnFood() {
      const occupied = new Set(game.snake.map((s) => `${s.x},${s.y}`));
      let attempts = 0;
      while (attempts < width * height) {
        const fx = Math.floor(Math.random() * width);
        const fy = Math.floor(Math.random() * height);
        if (!occupied.has(`${fx},${fy}`)) {
          game.food = { x: fx, y: fy };
          return;
        }
        attempts++;
      }
      // If board is completely filled, game is won
      game.food = null;
    },
  };

  game.spawnFood();
  return game;
}

/**
 * Sets the direction for the next tick.
 * Prevents 180-degree turns.
 */
function setDirection(game, newDir) {
  // Prevent reversing direction
  if (
    newDir.x + game.direction.x === 0 &&
    newDir.y + game.direction.y === 0
  ) {
    return;
  }
  game.nextDirection = newDir;
}

/**
 * Advances the game by one tick.
 * Mutates the game state.
 * @returns {object} - { grew, hitWall, hitSelf, ateFood }
 */
function tick(game) {
  if (game.status !== 'running') {
    return { grew: false, hitWall: false, hitSelf: false, ateFood: false };
  }

  // Apply queued direction
  game.direction = game.nextDirection;

  const head = game.snake[0];
  const newHead = {
    x: head.x + game.direction.x,
    y: head.y + game.direction.y,
  };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= game.width || newHead.y < 0 || newHead.y >= game.height) {
    game.status = 'gameover';
    if (game.score > game.highScore) game.highScore = game.score;
    return { grew: false, hitWall: true, hitSelf: false, ateFood: false };
  }

  // Self collision (check against all body segments except head)
  for (let i = 1; i < game.snake.length; i++) {
    if (game.snake[i].x === newHead.x && game.snake[i].y === newHead.y) {
      game.status = 'gameover';
      if (game.score > game.highScore) game.highScore = game.score;
      return { grew: false, hitWall: false, hitSelf: true, ateFood: false };
    }
  }

  // Check food
  const ateFood =
    game.food && newHead.x === game.food.x && newHead.y === game.food.y;

  // Move snake
  game.snake.unshift(newHead);

  if (ateFood) {
    game.score += 10;
    game.spawnFood();
    return { grew: true, hitWall: false, hitSelf: false, ateFood: true };
  }

  game.snake.pop();
  return { grew: false, hitWall: false, hitSelf: false, ateFood: false };
}

/**
 * Starts or resumes the game.
 */
function startGame(game) {
  game.status = 'running';
}

/**
 * Pauses the game.
 */
function pauseGame(game) {
  if (game.status === 'running') {
    game.status = 'paused';
  }
}

/**
 * Resets the game to initial state.
 */
function resetGame(game) {
  game.snake = [
    { x: Math.floor(game.width / 2), y: Math.floor(game.height / 2) },
    { x: Math.floor(game.width / 2) - 1, y: Math.floor(game.height / 2) },
    { x: Math.floor(game.width / 2) - 2, y: Math.floor(game.height / 2) },
  ];
  game.direction = Direction.RIGHT;
  game.nextDirection = Direction.RIGHT;
  game.food = null;
  game.score = 0;
  game.status = 'ready';
  game.spawnFood();
}

/**
 * Checks if a position is occupied by the snake.
 */
function isSnake(game, x, y) {
  return game.snake.some((s) => s.x === x && s.y === y);
}

/**
 * Checks if a position is the food.
 */
function isFood(game, x, y) {
  return game.food !== null && game.food.x === x && game.food.y === y;
}

/**
 * Gets the cell content at a position for rendering.
 * @returns {string} - 'head', 'body', 'food', or 'empty'
 */
function getCell(game, x, y) {
  if (game.food && game.food.x === x && game.food.y === y) {
    return 'food';
  }
  for (let i = 0; i < game.snake.length; i++) {
    if (game.snake[i].x === x && game.snake[i].y === y) {
      return i === 0 ? 'head' : 'body';
    }
  }
  return 'empty';
}

module.exports = {
  Direction,
  createGame,
  setDirection,
  tick,
  startGame,
  pauseGame,
  resetGame,
  isSnake,
  isFood,
  getCell,
};
