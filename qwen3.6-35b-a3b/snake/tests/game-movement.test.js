const { createGame, setDirection, tick, startGame, Direction } = require('../src/game');

describe('Snake Movement', () => {
  test('snake moves one cell in current direction per tick', () => {
    const g = createGame(20, 12);
    startGame(g);
    const hx = g.snake[0].x;
    tick(g);
    expect(g.snake[0].x).toBe(hx + 1);
    expect(g.snake[0].y).toBe(g.snake[1].y);
  });

  test('snake body follows the head', () => {
    const g = createGame(20, 12);
    startGame(g);
    tick(g);
    expect(g.snake[1].x).toBe(10);
    expect(g.snake[1].y).toBe(6);
  });

  test('snake moves up when direction is UP', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g);
    expect(g.snake[0].y).toBe(5);
  });

  test('snake moves down when direction is DOWN', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.DOWN);
    tick(g);
    expect(g.snake[0].y).toBe(7);
  });

  test('snake moves left when direction is LEFT', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g);
    setDirection(g, Direction.LEFT);
    tick(g);
    expect(g.snake[0].x).toBe(9);
  });

  test('snake can change direction mid-movement', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g);
    setDirection(g, Direction.LEFT);
    tick(g);
    expect(g.snake[0].x).toBe(9);
    expect(g.snake[0].y).toBe(5);
  });

  test('snake maintains length when not eating food', () => {
    const g = createGame(20, 12);
    startGame(g);
    const len = g.snake.length;
    for (let i = 0; i < 10; i++) tick(g);
    expect(g.snake.length).toBe(len);
  });
});
