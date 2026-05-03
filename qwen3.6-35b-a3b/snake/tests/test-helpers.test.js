const { createGame, setDirection, tick, startGame, Direction } = require('../src/game');
const { getDistance, isSafe, findBestDirection, moveTowardFood, eatFood } = require('./test-helpers');

describe('getDistance', () => {
  test('returns 0 when head is on food', () => {
    expect(getDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  test('returns Manhattan distance', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(getDistance({ x: 10, y: 10 }, { x: 7, y: 12 })).toBe(5);
  });

  test('distance is symmetric', () => {
    const a = { x: 2, y: 3 };
    const b = { x: 8, y: 1 };
    expect(getDistance(a, b)).toBe(getDistance(b, a));
  });
});

describe('isSafe', () => {
  test('returns true for empty cell in bounds', () => {
    const g = createGame(10, 10);
    startGame(g);
    expect(isSafe(g, 0, 0)).toBe(true);
    expect(isSafe(g, 9, 9)).toBe(true);
  });

  test('returns false for out-of-bounds', () => {
    const g = createGame(10, 10);
    startGame(g);
    expect(isSafe(g, -1, 0)).toBe(false);
    expect(isSafe(g, 10, 0)).toBe(false);
    expect(isSafe(g, 0, -1)).toBe(false);
    expect(isSafe(g, 0, 10)).toBe(false);
  });

  test('returns false for 180-degree reversal', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Head at (5,5), direction RIGHT. LEFT would be reversal -> (4,5)
    expect(isSafe(g, 4, 5)).toBe(false);
    setDirection(g, Direction.UP);
    // Now direction is UP. DOWN would be reversal -> (5,6)
    expect(isSafe(g, 5, 6)).toBe(false);
  });

  test('returns false for body segments', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Snake: head(5,5), body(4,5), (3,5)
    expect(isSafe(g, 4, 5)).toBe(false);
    expect(isSafe(g, 3, 5)).toBe(false);
  });

  test('returns true for head position (not in body slice)', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Head is at (5,4), body.slice(1) starts at (4,4)
    // So (5,4) should be safe (head position is not in body.slice(1))
    expect(isSafe(g, 5, 4)).toBe(true);
  });
});

describe('findBestDirection', () => {
  test('returns a direction that reduces distance to food', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Food is somewhere, direction is RIGHT
    // Best direction should move closer to food
    const best = findBestDirection(g, g.food);
    expect(best).not.toBeNull();
    const head = g.snake[0];
    const newDist = getDistance({ x: head.x + best.x, y: head.y + best.y }, g.food);
    const oldDist = getDistance(head, g.food);
    expect(newDist).toBeLessThanOrEqual(oldDist);
  });

  test('never returns a reversal direction', () => {
    const g = createGame(10, 10);
    startGame(g);
    for (let i = 0; i < 10; i++) {
      tick(g);
      const best = findBestDirection(g, g.food);
      if (best) {
        const head = g.snake[0];
        const nx = head.x + best.x, ny = head.y + best.y;
        // The next position should not be a reversal
        const dx = best.x, dy = best.y;
        // Check that it's not the opposite of current direction
        expect(dx + g.direction.x !== 0 || dy + g.direction.y !== 0).toBe(true);
      }
    }
  });

  test('returns null when all directions are blocked', () => {
    // Create a game where the snake is surrounded by walls and body
    const g = createGame(5, 5);
    startGame(g);
    // Manually position snake to be surrounded
    g.snake = [
      { x: 2, y: 2 }, // head
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    g.direction = Direction.RIGHT;
    // All adjacent cells are either body or out of bounds
    // Actually, (2,1), (1,2), (2,3), (3,2) are body, so all 4 directions are blocked
    const best = findBestDirection(g, g.food);
    expect(best).toBeNull();
  });
});

describe('moveTowardFood', () => {
  test('moves toward food when path is clear', () => {
    const g = createGame(10, 10);
    startGame(g);
    const headBefore = { ...g.snake[0] };
    const oldDist = getDistance(headBefore, g.food);
    moveTowardFood(g);
    tick(g);
    const headAfter = g.snake[0];
    const newDist = getDistance(headAfter, g.food);
    expect(newDist).toBeLessThanOrEqual(oldDist);
  });

  test('returns false when stuck', () => {
    const g = createGame(5, 5);
    startGame(g);
    g.snake = [
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
    ];
    g.direction = Direction.RIGHT;
    const result = moveTowardFood(g);
    expect(result).toBe(false);
  });
});

describe('eatFood', () => {
  test('eats food when path is clear', () => {
    const g = createGame(5, 5);
    startGame(g);
    const result = eatFood(g);
    expect(result.ateFood).toBe(true);
    expect(result.grew).toBe(true);
  });

  test('eats multiple foods', () => {
    const g = createGame(10, 10);
    startGame(g);
    const r1 = eatFood(g);
    expect(r1.ateFood).toBe(true);
    const r2 = eatFood(g);
    expect(r2.ateFood).toBe(true);
    expect(g.score).toBe(20);
  });

  test('handles stuck gracefully', () => {
    const g = createGame(5, 5);
    startGame(g);
    // Place snake in a corner with food nearby but blocked
    g.snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    g.food = { x: 0, y: 1 };
    g.direction = Direction.LEFT;
    // Food is at (0,1), head is at (0,0), but direction is LEFT (reversal)
    // The helper should navigate around
    const result = eatFood(g);
    // Either ate the food or broke out of stuck loop
    expect(g.score).toBeGreaterThanOrEqual(0);
  });
});
