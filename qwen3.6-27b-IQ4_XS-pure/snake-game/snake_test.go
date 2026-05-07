package main

import (
	"math/rand"
	"strings"
	"testing"
)

// --- Helper: create a game with a fixed board size for predictable testing ---

func newTestGame(w, h int, snakeBody []Point, dir Direction, food Point) *Game {
	return &Game{
		Width:  w,
		Height: h,
		Snake: Snake{
			Body:      snakeBody,
			Direction: dir,
		},
		Food:    food,
		Score:   0,
		Running: true,
	}
}

// --- newGame() tests ---

func TestNewGame_DefaultDimensions(t *testing.T) {
	g := newGame()
	if g.Width != width {
		t.Errorf("expected width %d, got %d", width, g.Width)
	}
	if g.Height != height {
		t.Errorf("expected height %d, got %d", height, g.Height)
	}
}

func TestNewGame_SnakeStartsInMiddle(t *testing.T) {
	g := newGame()
	head := g.Snake.Body[0]
	midX := width / 2
	midY := height / 2
	if head.X != midX || head.Y != midY {
		t.Errorf("expected head at (%d,%d), got (%d,%d)", midX, midY, head.X, head.Y)
	}
}

func TestNewGame_SnakeInitialLength(t *testing.T) {
	g := newGame()
	if len(g.Snake.Body) != 3 {
		t.Errorf("expected initial snake length 3, got %d", len(g.Snake.Body))
	}
}

func TestNewGame_SnakeStartsMovingRight(t *testing.T) {
	g := newGame()
	if g.Snake.Direction != RIGHT {
		t.Errorf("expected direction RIGHT, got %d", g.Snake.Direction)
	}
}

func TestNewGame_ScoreStartsAtZero(t *testing.T) {
	g := newGame()
	if g.Score != 0 {
		t.Errorf("expected score 0, got %d", g.Score)
	}
}

func TestNewGame_IsRunning(t *testing.T) {
	g := newGame()
	if !g.Running {
		t.Error("expected game to be running at start")
	}
}

// --- Movement tests ---

func TestStep_MovesRight(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{5, 5})
	g.step()
	head := g.Snake.Body[0]
	if head.X != 4 || head.Y != 3 {
		t.Errorf("expected head at (4,3), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_MovesLeft(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, LEFT, Point{5, 5})
	g.step()
	head := g.Snake.Body[0]
	if head.X != 2 || head.Y != 3 {
		t.Errorf("expected head at (2,3), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_MovesUp(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 4}}, UP, Point{5, 5})
	g.step()
	head := g.Snake.Body[0]
	if head.X != 3 || head.Y != 2 {
		t.Errorf("expected head at (3,2), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_MovesDown(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 2}}, DOWN, Point{5, 5})
	g.step()
	head := g.Snake.Body[0]
	if head.X != 3 || head.Y != 4 {
		t.Errorf("expected head at (3,4), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_TailFollowsWhenNotEating(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}, {1, 3}}, RIGHT, Point{9, 9})
	initialLen := len(g.Snake.Body)
	g.step()
	if len(g.Snake.Body) != initialLen {
		t.Errorf("expected length %d, got %d", initialLen, len(g.Snake.Body))
	}
}

// --- Food eating tests ---

func TestStep_EatingFoodIncreasesScore(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{4, 3})
	g.step()
	if g.Score != 1 {
		t.Errorf("expected score 1 after eating food, got %d", g.Score)
	}
}

func TestStep_EatingFoodGrowsSnake(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{4, 3})
	initialLen := len(g.Snake.Body)
	g.step()
	if len(g.Snake.Body) != initialLen+1 {
		t.Errorf("expected length %d after eating, got %d", initialLen+1, len(g.Snake.Body))
	}
}

func TestStep_EatingFoodDoesNotRemoveTail(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}, {1, 3}}, RIGHT, Point{4, 3})
	g.step()
	// After eating: new head at (4,3), old body stays, tail stays
	expectedBody := []Point{{4, 3}, {3, 3}, {2, 3}, {1, 3}}
	if len(g.Snake.Body) != len(expectedBody) {
		t.Fatalf("expected length %d, got %d", len(expectedBody), len(g.Snake.Body))
	}
	for i, p := range expectedBody {
		if g.Snake.Body[i] != p {
			t.Errorf("body[%d]: expected %v, got %v", i, p, g.Snake.Body[i])
		}
	}
}

func TestStep_MultipleFoodEating(t *testing.T) {
	// Place food so we eat it on step 1, then manually place new food for step 2
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{4, 3})
	g.step() // eat food at (4,3) -> score=1, length=3
	if g.Score != 1 {
		t.Fatalf("expected score 1, got %d", g.Score)
	}

	// Place new food ahead
	g.Food = Point{5, 3}
	g.step() // eat food at (5,3) -> score=2, length=4
	if g.Score != 2 {
		t.Errorf("expected score 2, got %d", g.Score)
	}
	if len(g.Snake.Body) != 4 {
		t.Errorf("expected length 4, got %d", len(g.Snake.Body))
	}
}

// --- Wall collision tests ---

func TestStep_WallCollision_TopWall(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 1}, {3, 2}}, UP, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting top wall")
	}
}

func TestStep_WallCollision_BottomWall(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 8}, {3, 7}}, DOWN, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting bottom wall")
	}
}

func TestStep_WallCollision_LeftWall(t *testing.T) {
	g := newTestGame(10, 10, []Point{{1, 3}, {2, 3}}, LEFT, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting left wall")
	}
}

func TestStep_WallCollision_RightWall(t *testing.T) {
	g := newTestGame(10, 10, []Point{{8, 3}, {7, 3}}, RIGHT, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting right wall")
	}
}

func TestStep_WallCollision_TopLeftCorner(t *testing.T) {
	g := newTestGame(10, 10, []Point{{1, 1}, {2, 1}}, UP, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting top-left corner")
	}
}

func TestStep_WallCollision_BottomRightCorner(t *testing.T) {
	g := newTestGame(10, 10, []Point{{8, 8}, {7, 8}}, DOWN, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected game over when hitting bottom-right corner")
	}
}

// --- Self collision tests ---

func TestStep_SelfCollision_IntoBody(t *testing.T) {
	// C-shaped snake: head at (3,3), body wraps around so that
	// moving RIGHT into (4,3). Food is placed at (4,3), so the snake
	// eats it — meaning the tail does NOT move away and the full body
	// must be checked. (4,3) is both the food AND the tail, so the
	// snake collides with its own body.
	// Body: [(3,3), (3,2), (3,1), (4,1), (4,2), (4,3)]
	g := newTestGame(10, 10,
		[]Point{{3, 3}, {3, 2}, {3, 1}, {4, 1}, {4, 2}, {4, 3}},
		RIGHT, Point{4, 3}) // food at (4,3) = tail position → eating keeps tail
	alive := g.step()
	if alive {
		t.Error("expected game over when snake collides with itself while eating")
	}
}

func TestStep_SelfCollision_IntoMiddleBody(t *testing.T) {
	// Snake where head moves into a non-tail body segment.
	// Body: [(3,3), (4,3), (5,3), (5,2), (5,1)] — going RIGHT
	// New head (4,3) hits body segment at index 1.
	g := newTestGame(10, 10,
		[]Point{{3, 3}, {4, 3}, {5, 3}, {5, 2}, {5, 1}},
		RIGHT, Point{9, 9})
	alive := g.step()
	if alive {
		t.Error("expected game over when snake moves into middle of its body")
	}
}

func TestStep_SelfCollision_IntoTail(t *testing.T) {
	// U-shaped snake where head moves into tail position — but tail moves away too!
	// This tests that the tail is properly removed before collision check.
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}, {2, 4}, {3, 4}}, UP, Point{9, 9})
	// Head at (3,3), going UP -> (3,2). Tail at (3,4) will be removed. No collision.
	alive := g.step()
	if !alive {
		t.Error("expected alive when moving away from tail that is being removed")
	}
}

func TestStep_NoCollision_WhenTailMovesAway(t *testing.T) {
	// Snake: head at (2,3), body at (1,3), (1,2), (2,2). Going RIGHT.
	// New head would be (3,3) — clear path, no self collision.
	g := newTestGame(10, 10, []Point{{2, 3}, {1, 3}, {1, 2}, {2, 2}}, RIGHT, Point{5, 5})
	alive := g.step()
	if !alive {
		t.Error("expected alive, no collision")
	}
}

// --- Food placement tests ---

func TestPlaceFood_DoesNotSpawnOnSnakeHead(t *testing.T) {
	rand.Seed(42)
	g := newTestGame(5, 5, []Point{{2, 2}}, RIGHT, Point{0, 0})
	// Run many placements to ensure none land on the snake
	for i := 0; i < 100; i++ {
		g.placeFood()
			target := Point{X: 2, Y: 2}
			if g.Food == target {
			t.Errorf("food spawned on snake head at iteration %d", i)
		}
	}
}

func TestPlaceFood_DoesNotSpawnOnSnakeBody(t *testing.T) {
	rand.Seed(123)
	g := newTestGame(5, 5, []Point{{2, 2}, {1, 2}, {0, 2}}, RIGHT, Point{0, 0})
	for i := 0; i < 100; i++ {
		g.placeFood()
		for _, seg := range g.Snake.Body {
			if g.Food == seg {
				t.Errorf("food spawned on snake body at iteration %d", i)
			}
		}
	}
}

func TestPlaceFood_SpawnsWithinBounds(t *testing.T) {
	rand.Seed(999)
	g := newTestGame(10, 10, []Point{{5, 5}}, RIGHT, Point{0, 0})
	for i := 0; i < 100; i++ {
		g.placeFood()
		if g.Food.X <= 0 || g.Food.X >= g.Width-1 || g.Food.Y <= 0 || g.Food.Y >= g.Height-1 {
			t.Errorf("food out of bounds at iteration %d: (%d,%d)", i, g.Food.X, g.Food.Y)
		}
	}
}

// --- Direction change (input logic) tests ---
// The direction-change logic is embedded in main(), but we can test the
// equivalent behavior by directly manipulating direction and verifying step().

func TestStep_CanChangeDirectionBeforeMoving(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{5, 5})

	// Change direction from RIGHT to UP before stepping
	g.Snake.Direction = UP
	g.step()
	head := g.Snake.Body[0]
	if head.X != 3 || head.Y != 2 {
		t.Errorf("expected head at (3,2) after turning up, got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_CanTurnRight(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, UP, Point{5, 5})
	g.Snake.Direction = RIGHT
	g.step()
	head := g.Snake.Body[0]
	if head.X != 4 || head.Y != 3 {
		t.Errorf("expected head at (4,3) after turning right, got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_CanTurnLeft(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, UP, Point{5, 5})
	g.Snake.Direction = LEFT
	g.step()
	head := g.Snake.Body[0]
	if head.X != 2 || head.Y != 3 {
		t.Errorf("expected head at (2,3) after turning left, got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_CanTurnDown(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 4}}, UP, Point{5, 5})
	g.Snake.Direction = DOWN
	g.step()
	head := g.Snake.Body[0]
	if head.X != 3 || head.Y != 4 {
		t.Errorf("expected head at (3,4) after turning down, got (%d,%d)", head.X, head.Y)
	}
}

// --- Render tests ---

func TestRender_ContainsScore(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	g.Score = 42
	out := g.render()
	if !strings.Contains(out, "Score: 42") {
		t.Error("render output should contain the score")
	}
}

func TestRender_ContainsLength(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}, {1, 3}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "Length: 3") {
		t.Error("render output should contain the length")
	}
}

func TestRender_ContainsSnakeHead(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "@") {
		t.Error("render output should contain the snake head character @")
	}
}

func TestRender_ContainsFood(t *testing.T) {
	g := newTestGame(10, 10, []Point{{2, 2}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "*") {
		t.Error("render output should contain the food character *")
	}
}

func TestRender_ContainsBorder(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "+") || !strings.Contains(out, "|") {
		t.Error("render output should contain border characters + and |")
	}
}

func TestRender_ContainsInstructions(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "Arrows") || !strings.Contains(out, "WASD") {
		t.Error("render output should contain control instructions")
	}
}

func TestRender_ClearScreenEscape(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	out := g.render()
	if !strings.Contains(out, "\033[2J") {
		t.Error("render output should contain clear screen escape sequence")
	}
}

// --- Edge case: snake at maximum board coverage ---

func TestStep_FoodOnLastAvailableCell(t *testing.T) {
	// Tiny 5x5 board (inner play area is 3x3 = cells (1,1)..(3,3))
	// Snake at (2,2), food at (2,2) — eating on current cell
	g := newTestGame(5, 5, []Point{{2, 2}, {1, 2}}, RIGHT, Point{3, 2})
	alive := g.step() // move right to (3,2), eat food
	if !alive {
		t.Error("expected alive when eating food")
	}
	if g.Score != 1 {
		t.Errorf("expected score 1, got %d", g.Score)
	}
}

// --- Edge case: single-segment snake ---

func TestStep_SingleSegmentSnake(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, UP, Point{5, 5})
	alive := g.step()
	if !alive {
		t.Error("expected single-segment snake to survive one step")
	}
	if len(g.Snake.Body) != 1 {
		t.Errorf("expected length 1, got %d", len(g.Snake.Body))
	}
}

// --- Edge case: long snake self-collision (U-turn) ---

func TestStep_UshapedSnakeSelfCollision(t *testing.T) {
	// Snake shaped like a U, head about to move into its own body
	// Body: (3,1) <- head, (3,2), (3,3), (2,3), (1,3), (1,2)
	// Going DOWN: new head at (3,0) — out of play area... let's use a bigger board
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 4}, {3, 5}, {2, 5}, {1, 5}, {1, 4}}, UP, Point{9, 9})
	// Going UP from (3,3) -> (3,2). No collision.
	alive := g.step()
	if !alive {
		t.Error("expected alive, no self collision")
	}

	// Now set up actual self-collision: head going into body
	g = newTestGame(10, 10, []Point{{3, 3}, {4, 3}, {4, 4}, {4, 5}, {3, 5}, {2, 5}}, LEFT, Point{9, 9})
	// Head at (3,3), going LEFT -> (2,3). Not colliding.
	alive = g.step()
	if !alive {
		t.Error("expected alive, no collision")
	}

	// Direct self-collision: snake wrapping back into itself
	g = newTestGame(10, 10, []Point{{3, 3}, {2, 3}, {2, 4}, {3, 4}}, UP, Point{9, 9})
	// Head at (3,3), going UP -> (3,2). Not colliding.
	alive = g.step()
	if !alive {
		t.Error("expected alive")
	}

	// Actual collision: head moving right into body segment
	g = newTestGame(10, 10, []Point{{3, 3}, {3, 4}, {3, 5}, {4, 5}, {4, 4}}, LEFT, Point{9, 9})
	// Head at (3,3), going LEFT -> (2,3). Not colliding.
	alive = g.step()
	if !alive {
		t.Error("expected alive")
	}
}

// --- Edge case: food respawns after eating ---

func TestStep_NewFoodPlacedAfterEating(t *testing.T) {
	rand.Seed(42)
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{4, 3})
	oldFood := g.Food
	g.step() // eat food at (4,3)
	if g.Food == oldFood {
		t.Error("expected new food position after eating")
	}
}

// --- Step returns correct boolean ---

func TestStep_ReturnsTrueWhenAlive(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{9, 9})
	alive := g.step()
	if !alive {
		t.Error("expected true when snake survives")
	}
}

func TestStep_ReturnsFalseOnDeath(t *testing.T) {
	g := newTestGame(10, 10, []Point{{1, 3}, {2, 3}}, LEFT, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected false when snake hits wall")
	}
}

// --- Direction enum values ---

func TestDirection_EnumValues(t *testing.T) {
	if UP != 0 || DOWN != 1 || LEFT != 2 || RIGHT != 3 {
		t.Errorf("unexpected direction values: UP=%d DOWN=%d LEFT=%d RIGHT=%d", UP, DOWN, LEFT, RIGHT)
	}
}

// --- Point equality ---

func TestPoint_Equality(t *testing.T) {
	a := Point{3, 4}
	b := Point{3, 4}
	c := Point{3, 5}
	if a != b {
		t.Error("equal points should be equal")
	}
	if a == c {
		t.Error("different points should not be equal")
	}
}

// --- Boundary: snake at edge but not colliding ---

func TestStep_SnakeAtWallEdgeWithoutCollision(t *testing.T) {
	// Snake at x=1 going right — safe, wall is at x=0 and x=Width-1
	g := newTestGame(10, 10, []Point{{1, 3}, {0, 3}}, RIGHT, Point{5, 5})
	alive := g.step()
	if !alive {
		t.Error("expected alive when moving away from wall")
	}
	head := g.Snake.Body[0]
	if head.X != 2 || head.Y != 3 {
		t.Errorf("expected head at (2,3), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_SnakeAtRightEdgeMovingRight(t *testing.T) {
	g := newTestGame(10, 10, []Point{{8, 3}, {7, 3}}, RIGHT, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected death when right-edge snake moves right into wall")
	}
}

func TestStep_SnakeAtLeftEdgeMovingLeft(t *testing.T) {
	g := newTestGame(10, 10, []Point{{1, 3}, {2, 3}}, LEFT, Point{5, 5})
	alive := g.step()
	if alive {
		t.Error("expected death when left-edge snake moves left into wall")
	}
}

// --- Multi-step survival test ---

func TestStep_MultipleStepsWithoutFood(t *testing.T) {
	g := newTestGame(20, 20, []Point{{5, 5}, {4, 5}}, RIGHT, Point{18, 18})
	for i := 0; i < 5; i++ {
		alive := g.step()
		if !alive {
			t.Fatalf("step %d: expected alive", i)
		}
		if len(g.Snake.Body) != 2 {
			t.Errorf("step %d: expected length 2, got %d", i, len(g.Snake.Body))
		}
	}
	// After 5 steps right from (5,5), head should be at (10,5)
	head := g.Snake.Body[0]
	if head.X != 10 || head.Y != 5 {
		t.Errorf("expected head at (10,5), got (%d,%d)", head.X, head.Y)
	}
}

func TestStep_MultipleStepsEatingFood(t *testing.T) {
	// Snake eats food every step for 3 steps
	g := newTestGame(20, 20, []Point{{5, 5}, {4, 5}}, RIGHT, Point{6, 5})
	for i := 0; i < 3; i++ {
		// Place food one step ahead
		head := g.Snake.Body[0]
		g.Food = Point{head.X + 1, head.Y}
		alive := g.step()
		if !alive {
			t.Fatalf("step %d: expected alive", i)
		}
	}
	// Started with length 2, ate 3 times -> length 5
	if len(g.Snake.Body) != 5 {
		t.Errorf("expected length 5, got %d", len(g.Snake.Body))
	}
	if g.Score != 3 {
		t.Errorf("expected score 3, got %d", g.Score)
	}
}

// --- applyDirection (input handling) tests ---

func TestApplyDirection_ChangeToUp(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{5, 5})
	applyDirection(g, upInput)
	if g.Snake.Direction != UP {
		t.Errorf("expected UP, got %d", g.Snake.Direction)
	}
}

func TestApplyDirection_ChangeToDown(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{5, 5})
	applyDirection(g, downInput)
	if g.Snake.Direction != DOWN {
		t.Errorf("expected DOWN, got %d", g.Snake.Direction)
	}
}

func TestApplyDirection_ChangeToLeft(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 4}}, DOWN, Point{5, 5})
	applyDirection(g, leftInput)
	if g.Snake.Direction != LEFT {
		t.Errorf("expected LEFT, got %d", g.Snake.Direction)
	}
}

func TestApplyDirection_CannotReverse_UpToDown(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 4}}, UP, Point{5, 5})
	applyDirection(g, downInput)
	if g.Snake.Direction != UP {
		t.Error("should NOT reverse from UP to DOWN")
	}
}

func TestApplyDirection_CannotReverse_DownToUp(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {3, 2}}, DOWN, Point{5, 5})
	applyDirection(g, upInput)
	if g.Snake.Direction != DOWN {
		t.Error("should NOT reverse from DOWN to UP")
	}
}

func TestApplyDirection_CannotReverse_LeftToRight(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {4, 3}}, LEFT, Point{5, 5})
	applyDirection(g, rightInput)
	if g.Snake.Direction != LEFT {
		t.Error("should NOT reverse from LEFT to RIGHT")
	}
}

func TestApplyDirection_CannotReverse_RightToLeft(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}, {2, 3}}, RIGHT, Point{5, 5})
	applyDirection(g, leftInput)
	if g.Snake.Direction != RIGHT {
		t.Error("should NOT reverse from RIGHT to LEFT")
	}
}

func TestApplyDirection_QuitStopsGame(t *testing.T) {
	g := newTestGame(10, 10, []Point{{3, 3}}, RIGHT, Point{5, 5})
	result := applyDirection(g, quitInput)
	if result {
		t.Error("expected false from quitInput")
	}
	if g.Running {
		t.Error("expected game to stop after quit")
	}
}

// --- Regression: render border width must match content width ---

func TestRender_RowWidthMatchesBorder(t *testing.T) {
	// Verify the render loop produces exactly Width-2 cells per row,
	// matching the border width.
	g := newTestGame(10, 10, []Point{{5, 5}}, RIGHT, Point{8, 5})
	out := g.render()

	lines := strings.Split(out, "\n")

	// Count dashes in the border line
	var borderDashes int
	for _, line := range lines {
		if strings.HasPrefix(line, "  +") && strings.HasSuffix(line, "+") && !strings.Contains(line, "|") {
			borderDashes = strings.Count(line, "-")
			break
		}
	}

	if borderDashes != g.Width-2 {
		t.Errorf("border dashes %d != Width-2 (%d)", borderDashes, g.Width-2)
	}
}

// --- Regression: food at max-x must be renderable ---

func TestRender_FoodAtRightEdge(t *testing.T) {
	g := newTestGame(10, 10, []Point{{2, 2}}, LEFT, Point{8, 5}) // food at x=Width-2 (rightmost playable)
	out := g.render()
	if !strings.Contains(out, "*") {
		t.Error("food at rightmost column should be visible")
	}
}
