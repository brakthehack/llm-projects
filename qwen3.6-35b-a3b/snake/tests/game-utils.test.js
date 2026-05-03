const { createGame, isSnake, isFood, getCell, Direction } = require('../src/game');

describe('Utility Functions', () => {
  test('isSnake returns true for snake positions', () => {
    const g = createGame(20, 12);
    g.snake.forEach(s => {
      expect(isSnake(g, s.x, s.y)).toBe(true);
    });
  });

  test('isSnake returns false for empty cells', () => {
    const g = createGame(20, 12);
    expect(isSnake(g, 0, 0)).toBe(false);
  });

  test('isFood returns true for food position', () => {
    const g = createGame(20, 12);
    expect(isFood(g, g.food.x, g.food.y)).toBe(true);
  });

  test('isFood returns false for empty cells', () => {
    const g = createGame(20, 12);
    expect(isFood(g, 0, 0)).toBe(false);
  });

  test('getCell returns correct cell types', () => {
    const g = createGame(20, 12);
    expect(getCell(g, g.snake[0].x, g.snake[0].y)).toBe('head');
    expect(getCell(g, g.snake[1].x, g.snake[1].y)).toBe('body');
    expect(getCell(g, g.food.x, g.food.y)).toBe('food');
    expect(getCell(g, 0, 0)).toBe('empty');
  });
});
