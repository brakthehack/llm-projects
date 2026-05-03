const { createGame, setDirection, tick, startGame, pauseGame, Direction } = require('../src/game');
const { eatFood } = require('./test-helpers');

describe('Collision Detection', () => {
  test('hitting the top wall causes game over', () => {
    const g = createGame(10, 5);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g); tick(g);
    const r = tick(g);
    expect(g.status).toBe('gameover');
    expect(r.hitWall).toBe(true);
  });

  test('hitting the bottom wall causes game over', () => {
    const g = createGame(10, 5);
    startGame(g);
    setDirection(g, Direction.DOWN);
    tick(g); tick(g);
    const r = tick(g);
    expect(g.status).toBe('gameover');
    expect(r.hitWall).toBe(true);
  });

  test('hitting the left wall causes game over', () => {
    const g = createGame(5, 10);
    startGame(g);
    setDirection(g, Direction.LEFT);
    tick(g); tick(g);
    const r = tick(g);
    expect(g.status).toBe('gameover');
    expect(r.hitWall).toBe(true);
  });

  test('hitting the right wall causes game over', () => {
    const g = createGame(5, 10);
    startGame(g);
    setDirection(g, Direction.RIGHT);
    tick(g); tick(g);
    const r = tick(g);
    expect(g.status).toBe('gameover');
    expect(r.hitWall).toBe(true);
  });

  test('hitting own body causes game over', () => {
    const g = createGame(10, 10);
    startGame(g);
    // Build a tight spiral manually: snake forms a loop
    // Head at (3,3), body spirals inward
    g.snake = [
      { x: 3, y: 3 }, // head, about to move RIGHT
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
    ];
    g.direction = Direction.RIGHT;
    // Next tick: head moves to (4,3) which is body segment at index 5
    const r = tick(g);
    expect(g.status).toBe('gameover');
    expect(r.hitSelf).toBe(true);
  });

  test('game over does not advance snake further', () => {
    const g = createGame(10, 5);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g); tick(g); tick(g);
    const len = g.snake.length;
    tick(g);
    expect(g.snake.length).toBe(len);
  });

  test('tick on paused game does nothing', () => {
    const g = createGame(20, 12);
    startGame(g);
    tick(g);
    pauseGame(g);
    const len = g.snake.length;
    tick(g);
    expect(g.snake.length).toBe(len);
  });

  test('tick on ready game does nothing', () => {
    const g = createGame(20, 12);
    const len = g.snake.length;
    tick(g);
    expect(g.snake.length).toBe(len);
  });
});
