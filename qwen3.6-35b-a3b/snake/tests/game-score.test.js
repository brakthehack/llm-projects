const { createGame, setDirection, tick, startGame, resetGame, Direction } = require('../src/game');
const { eatFood } = require('./test-helpers');

describe('Score Tracking', () => {
  test('score starts at 0', () => {
    expect(createGame(20, 12).score).toBe(0);
  });

  test('score increases by 10 per food eaten', () => {
    const g = createGame(20, 20);
    startGame(g);
    eatFood(g); expect(g.score).toBe(10);
    eatFood(g); expect(g.score).toBe(20);
  });

  test('high score updates on game over', () => {
    const g = createGame(10, 10);
    startGame(g);
    eatFood(g); eatFood(g);
    expect(g.score).toBe(20);
    setDirection(g, Direction.UP);
    for (let i = 0; i < 8; i++) tick(g);
    expect(g.status).toBe('gameover');
    expect(g.highScore).toBe(20);
  });

  test('high score persists across restarts', () => {
    const g = createGame(5, 5);
    startGame(g);
    eatFood(g);
    setDirection(g, Direction.UP);
    tick(g); tick(g); tick(g);
    expect(g.status).toBe('gameover');
    expect(g.highScore).toBe(10);
    resetGame(g);
    expect(g.score).toBe(0);
    expect(g.highScore).toBe(10);
  });
});
