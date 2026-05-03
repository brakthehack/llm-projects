const { createGame, startGame, Direction } = require('../src/game');
const { eatFood } = require('./test-helpers');

describe('Food and Growth', () => {
  test('eating food increases score by 10', () => {
    const g = createGame(5, 5);
    startGame(g);
    const sb = g.score;
    eatFood(g);
    expect(g.score).toBe(sb + 10);
  });

  test('snake grows by 1 when eating food', () => {
    const g = createGame(5, 5);
    startGame(g);
    const lb = g.snake.length;
    eatFood(g);
    expect(g.snake.length).toBe(lb + 1);
  });

  test('new food spawns after eating', () => {
    const g = createGame(5, 5);
    startGame(g);
    const old = { ...g.food };
    eatFood(g);
    expect(g.food).not.toBeNull();
  });

  test('new food does not spawn on snake', () => {
    const g = createGame(5, 5);
    startGame(g);
    eatFood(g);
    const onSnake = g.snake.some(s => s.x === g.food.x && s.y === g.food.y);
    expect(onSnake).toBe(false);
  });

  test('eating food multiple times increases score cumulatively', () => {
    const g = createGame(20, 20);
    startGame(g);
    const is = g.score;
    eatFood(g); expect(g.score).toBe(is + 10);
    eatFood(g); expect(g.score).toBe(is + 20);
    eatFood(g); expect(g.score).toBe(is + 30);
  });
});
