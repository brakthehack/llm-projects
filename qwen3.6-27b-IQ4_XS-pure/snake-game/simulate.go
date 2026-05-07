//go:build ignore

// simulate - headless demo of the snake game logic
package main

import (
	"fmt"
	"math/rand"
	"os"
)

type Direction int

const (
	UP Direction = iota
	DOWN
	LEFT
	RIGHT
)

type Point struct{ X, Y int }

type Game struct {
	Width   int
	Height  int
	Snake   []Point
	Dir     Direction
	Food    Point
	Score   int
	Running bool
}

func newGame() *Game {
	w, h := 40, 20
	return &Game{
		Width:   w, Height: h,
		Snake:   []Point{{w/2, h/2}, {w/2 - 1, h/2}, {w/2 - 2, h/2}},
		Dir:     RIGHT, Running: true,
	}
}

func (g *Game) placeFood() {
	for {
		p := Point{rand.Intn(g.Width-2) + 1, rand.Intn(g.Height-2) + 1}
		onSnake := false
		for _, s := range g.Snake {
			if s == p {
				onSnake = true; break
			}
		}
		if !onSnake {
			g.Food = p; return
		}
	}
}

func (g *Game) step() bool {
	head := g.Snake[0]
	var nh Point
	switch g.Dir {
	case UP:    nh = Point{head.X, head.Y - 1}
	case DOWN:  nh = Point{head.X, head.Y + 1}
	case LEFT:  nh = Point{head.X - 1, head.Y}
	case RIGHT: nh = Point{head.X + 1, head.Y}
	}
	if nh.X <= 0 || nh.X >= g.Width-1 || nh.Y <= 0 || nh.Y >= g.Height-1 {
		return false
	}
	eating := nh == g.Food
	check := g.Snake
	if !eating && len(g.Snake) > 1 {
		check = g.Snake[:len(g.Snake)-1]
	}
	for _, s := range check {
		if s == nh { return false }
	}
	g.Snake = append([]Point{nh}, g.Snake...)
	if eating {
		g.Score++; g.placeFood()
	} else {
		g.Snake = g.Snake[:len(g.Snake)-1]
	}
	return true
}

func dirName(d Direction) string {
	switch d {
	case UP: return "UP"
	case DOWN: return "DOWN"
	case LEFT: return "LEFT"
	case RIGHT: return "RIGHT"
	}
	return "?"
}

func cellAt(g *Game, x, y int) (string, bool) {
	p := Point{x, y}
	if p == g.Snake[0] { return "H", true }
	for _, s := range g.Snake[1:] {
		if p == s { return "o", true }
	}
	if p == g.Food { return "F", true }
	return "", false
}

func main() {
	rand.Seed(42)
	game := newGame()
	game.placeFood()

	steps := 20
	fmt.Println("=== SNAKE GAME SIMULATION ===")
	fmt.Printf("Board: %dx%d | Snake starts length %d\n\n", game.Width, game.Height, len(game.Snake))

	// Simulate a realistic play session with varied input
	inputs := []Direction{RIGHT, RIGHT, UP, LEFT, DOWN, RIGHT, RIGHT, UP, UP, LEFT, DOWN, RIGHT, UP, RIGHT, RIGHT, DOWN, LEFT, LEFT, UP, RIGHT}

	for step := 1; step <= steps && game.Running; step++ {
		game.Dir = inputs[step-1]
		alive := game.step()
		if !alive {
			fmt.Printf("\n--- Step %2d: GAME OVER ---\n", step)
			break
		}
		printBoard(game, step)
	}

	fmt.Printf("\nFinal score: %d | Snake length: %d\n", game.Score, len(game.Snake))
	os.Exit(0)
}

func printBoard(g *Game, step int) {
	minX, maxX, minY, maxY := g.Width, 0, g.Height, 0
	for _, p := range g.Snake {
		if p.X < minX { minX = p.X }
		if p.X > maxX { maxX = p.X }
		if p.Y < minY { minY = p.Y }
		if p.Y > maxY { maxY = p.Y }
	}
	if g.Food.X < minX-1 { minX = g.Food.X - 1 }
	if g.Food.X > maxX+1 { maxX = g.Food.X + 1 }
	if g.Food.Y < minY-1 { minY = g.Food.Y - 1 }
	if g.Food.Y > maxY+1 { maxY = g.Food.Y + 1 }
	if minX < 1 { minX = 1 }
	if maxX >= g.Width-1 { maxX = g.Width - 2 }
	if minY < 1 { minY = 1 }
	if maxY >= g.Height-1 { maxY = g.Height - 2 }

	fmt.Printf("Step %2d | Score: %d | Length: %2d | Dir: %-4s\n", step, g.Score, len(g.Snake), dirName(g.Dir))
	fmt.Print("     ")
	for x := minX; x <= maxX; x++ { fmt.Printf("%d", x%10) }
	fmt.Println()

	for y := minY; y <= maxY; y++ {
		fmt.Printf("  %2d  ", y)
		for x := minX; x <= maxX; x++ {
			ch, ok := cellAt(g, x, y)
			if !ok { fmt.Print(" ") } else { fmt.Print(ch) }
		}
		fmt.Println()
	}
	fmt.Println()
}
