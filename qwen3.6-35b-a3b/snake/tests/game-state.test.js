const { createGame, startGame, pauseGame, resetGame, setDirection, tick, Direction } = require('../src/game');

describe('Game State Management', () => {
  test('startGame sets status to running', () => {
    const g = createGame(20, 12);
    startGame(g);
    expect(g.status).toBe('running');
  });

  test('pauseGame sets status to paused', () => {
    const g = createGame(20, 12);
    startGame(g);
    pauseGame(g);
    expect(g.status).toBe('paused');
  });

  test('pauseGame on non-running game does nothing', () => {
    const g = createGame(20, 12);
    pauseGame(g);
    expect(g.status).toBe('ready');
  });

  test('resetGame resets score to 0', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Move without eating food
    setDirection(g, Direction.UP);
    for (let i = 0; i < 5; i++) tick(g);
    resetGame(g);
    expect(g.score).toBe(0);
  });

  test('resetGame resets snake to initial position', () => {
    const g = createGame(10, 10);
    startGame(g);
    for (let i = 0; i < 5; i++) tick(g);
    resetGame(g);
    expect(g.snake[0].x).toBe(5);
    expect(g.snake[0].y).toBe(5);
  });

  test('resetGame resets status to ready', () => {
    const g = createGame(10, 10);
    startGame(g);
    for (let i = 0; i < 5; i++) tick(g);
    resetGame(g);
    expect(g.status).toBe('ready');
  });

  test('resetGame resets direction to RIGHT', () => {
    const g = createGame(10, 10);
    startGame(g);
    setDirection(g, Direction.UP);
    for (let i = 0; i < 3; i++) tick(g);
    resetGame(g);
    expect(g.direction).toBe(Direction.RIGHT);
  });
});
