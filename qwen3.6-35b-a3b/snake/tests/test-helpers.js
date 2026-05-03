const { setDirection, tick, Direction } = require('../src/game');

/**
 * Calculate Manhattan distance from a point to the food.
 */
function getDistance(head, food) {
  return Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
}

/**
 * Check if a position is safe to move into:
 * - Within grid bounds
 * - Not on the snake's body (excluding head)
 * - Not a 180-degree reversal of current direction
 */
function isSafe(game, x, y) {
  if (x < 0 || x >= game.width || y < 0 || y >= game.height) return false;
  if (game.snake.slice(1).some(s => s.x === x && s.y === y)) return false;
  const head = game.snake[0];
  const dx = x - head.x, dy = y - head.y;
  // Use nextDirection if queued, otherwise current direction
  const dir = game.nextDirection || game.direction;
  // 180-degree reversal check
  if (dx === -dir.x && dy === -dir.y) return false;
  return true;
}

/**
 * Find the best direction to move toward the food.
 * Returns a Direction object or null if no safe direction exists.
 */
function findBestDirection(game, food) {
  const head = game.snake[0];
  const dirs = [Direction.RIGHT, Direction.LEFT, Direction.DOWN, Direction.UP];
  let best = null;
  let bestDist = Infinity;

  for (const d of dirs) {
    const nx = head.x + d.x;
    const ny = head.y + d.y;
    if (isSafe(game, nx, ny)) {
      const dist = getDistance({ x: nx, y: ny }, food);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
  }
  return best;
}

/**
 * Move the snake one step toward the food.
 * Returns true if a direction was set, false if stuck.
 */
function moveTowardFood(game) {
  const best = findBestDirection(game, game.food);
  if (best) {
    setDirection(game, best);
    return true;
  }
  return false;
}

/**
 * Navigate the snake to the food position by repeatedly moving toward it.
 * Includes a safety check to break out of infinite loops.
 * Returns the result of the tick that ate the food, or a default result if stuck.
 */
function eatFood(game) {
  let result = { ateFood: false, grew: false, hitWall: false, hitSelf: false };
  let steps = 0;
  const maxSteps = game.width * game.height * 3;
  let lastDist = getDistance(game.snake[0], game.food);
  let noProgressCount = 0;

  while (steps < maxSteps) {
    const head = game.snake[0];
    // If already on food (from previous tick), we're done
    if (head.x === game.food.x && head.y === game.food.y) break;

    const moved = moveTowardFood(game);
    if (!moved) {
      // Stuck - no safe direction
      break;
    }
    result = tick(game);
    steps++;

    if (result.ateFood) {
      // Food eaten, we're done
      break;
    }

    // Detect if we're stuck (no progress for 10 steps)
    const dist = getDistance(game.snake[0], game.food);
    if (dist >= lastDist) {
      noProgressCount++;
    } else {
      noProgressCount = 0;
    }
    lastDist = dist;

    if (noProgressCount > 10) {
      break;
    }
  }
  return result;
}

module.exports = { getDistance, isSafe, findBestDirection, moveTowardFood, eatFood };
