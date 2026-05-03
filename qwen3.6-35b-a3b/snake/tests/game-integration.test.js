const { createGame, setDirection, tick, startGame, pauseGame, resetGame, Direction } = require('../src/game');
const { eatFood } = require('./test-helpers');

describe('Edge Cases', () => {
  test('small grid (3x3) works', () => {
    const g = createGame(3, 3);
    expect(g.width).toBe(3);
    expect(g.height).toBe(3);
    expect(g.snake[0].x).toBe(1);
    expect(g.snake[0].y).toBe(1);
  });

  test('tick returns result object with all fields', () => {
    const g = createGame(20, 12);
    startGame(g);
    const r = tick(g);
    expect(r).toHaveProperty('grew');
    expect(r).toHaveProperty('hitWall');
    expect(r).toHaveProperty('hitSelf');
    expect(r).toHaveProperty('ateFood');
  });

  test('eating food returns ateFood and grew true', () => {
    const g = createGame(10, 10);
    startGame(g);
    const r = eatFood(g);
    expect(r.ateFood).toBe(true);
    expect(r.grew).toBe(true);
  });

  test('normal movement returns all false', () => {
    const g = createGame(20, 12);
    startGame(g);
    const r = tick(g);
    expect(r.hitWall).toBe(false);
    expect(r.hitSelf).toBe(false);
    expect(r.ateFood).toBe(false);
    expect(r.grew).toBe(false);
  });
});

describe('Simulated Playthrough', () => {
  test('snake can eat multiple foods and grow', () => {
    const g = createGame(30, 30);
    startGame(g);
    const initialLen = g.snake.length;
    const initialScore = g.score;
    eatFood(g);
    eatFood(g);
    eatFood(g);
    expect(g.snake.length).toBe(initialLen + 3);
    expect(g.score).toBe(initialScore + 30);
  });

  test('pause and resume works correctly', () => {
    const g = createGame(20, 12);
    startGame(g);
    tick(g);
    pauseGame(g);
    expect(g.status).toBe('paused');
    const len1 = g.snake.length;
    tick(g);
    expect(g.snake.length).toBe(len1);
    startGame(g);
    expect(g.status).toBe('running');
    tick(g);
    expect(g.snake.length).toBe(len1);
  });

  test('full game: start, play, eat food, die, restart', () => {
    const g = createGame(8, 4);
    expect(g.status).toBe('ready');
    startGame(g);
    expect(g.status).toBe('running');
    eatFood(g);
    expect(g.score).toBe(10);
    setDirection(g, Direction.UP);
    // On a 4-row grid, 3 ticks UP is guaranteed to hit the wall
    // (snake starts at y=1, after eating food it's at most y=0 or y=3)
    for (let i = 0; i < 5; i++) {
      tick(g);
      if (g.status === 'gameover') break;
    }
    expect(g.status).toBe('gameover');
    expect(g.highScore).toBe(10);
    resetGame(g);
    expect(g.status).toBe('ready');
    expect(g.score).toBe(0);
    expect(g.highScore).toBe(10);
  });
});
