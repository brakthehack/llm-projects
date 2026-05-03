const { createGame, setDirection, tick, startGame, Direction } = require('../src/game');

describe('Direction Handling', () => {
  test('cannot reverse direction 180 degrees', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.LEFT);
    tick(g);
    expect(g.direction).toBe(Direction.RIGHT);
  });

  test('can turn 90 degrees right', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.DOWN);
    tick(g);
    expect(g.direction).toBe(Direction.DOWN);
  });

  test('can turn 90 degrees left', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g);
    expect(g.direction).toBe(Direction.UP);
  });

  test('queued direction is applied on next tick', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    expect(g.nextDirection).toBe(Direction.UP);
    tick(g);
    expect(g.direction).toBe(Direction.UP);
  });

  test('invalid direction is ignored, valid one is used', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);   // valid from RIGHT
    setDirection(g, Direction.LEFT); // invalid from RIGHT (reverse)
    tick(g);
    expect(g.direction).toBe(Direction.UP);
  });

  test('reverse direction attempt is ignored but does not crash', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);   // valid from RIGHT
    tick(g);                          // now going UP
    setDirection(g, Direction.DOWN); // invalid from UP (reverse)
    tick(g);
    expect(g.direction).toBe(Direction.UP);
  });

  test('can chain valid turns: RIGHT -> UP -> LEFT', () => {
    const g = createGame(20, 12);
    startGame(g);
    setDirection(g, Direction.UP);
    tick(g);
    expect(g.direction).toBe(Direction.UP);
    setDirection(g, Direction.LEFT);
    tick(g);
    expect(g.direction).toBe(Direction.LEFT);
  });
});
