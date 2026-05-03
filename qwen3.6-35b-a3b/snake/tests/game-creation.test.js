const { createGame, Direction } = require('../src/game');

describe('Game Creation', () => {
  test('creates a game with correct grid dimensions', () => {
    const g = createGame(20, 12);
    expect(g.width).toBe(20);
    expect(g.height).toBe(12);
  });

  test('initializes snake at center of grid', () => {
    const g = createGame(20, 12);
    expect(g.snake[0].x).toBe(10);
    expect(g.snake[0].y).toBe(6);
  });

  test('snake starts with 3 segments', () => {
    const g = createGame(20, 12);
    expect(g.snake.length).toBe(3);
  });

  test('snake body segments are adjacent', () => {
    const g = createGame(20, 12);
    const s = g.snake;
    expect(s[1].x).toBe(s[0].x - 1);
    expect(s[1].y).toBe(s[0].y);
    expect(s[2].x).toBe(s[0].x - 2);
    expect(s[2].y).toBe(s[0].y);
  });

  test('initial direction is RIGHT', () => {
    expect(createGame(20, 12).direction).toBe(Direction.RIGHT);
  });

  test('initial status is ready', () => {
    expect(createGame(20, 12).status).toBe('ready');
  });

  test('initial score is 0', () => {
    expect(createGame(20, 12).score).toBe(0);
  });

  test('high score starts at 0', () => {
    expect(createGame(20, 12).highScore).toBe(0);
  });

  test('food is spawned at creation', () => {
    expect(createGame(20, 12).food).not.toBeNull();
  });

  test('food is not on the snake at creation', () => {
    const g = createGame(20, 12);
    const onSnake = g.snake.some(s => s.x === g.food.x && s.y === g.food.y);
    expect(onSnake).toBe(false);
  });
});
