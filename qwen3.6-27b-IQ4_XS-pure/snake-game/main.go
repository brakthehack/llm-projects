// snake - A terminal Snake game in Go (stdlib only)
package main

import (
	"fmt"
	"math/rand"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

type Direction int

const (
	UP Direction = iota
	DOWN
	LEFT
	RIGHT
)

type Point struct {
	X, Y int
}

type Snake struct {
	Body      []Point
	Direction Direction
}

type Game struct {
	Width   int
	Height  int
	Snake   Snake
	Food    Point
	Score   int
	Running bool
}

const (
	width  = 40
	height = 20
	speed  = 100 * time.Millisecond
)

// termState stores terminal settings for restoration.
type termState struct {
	oldTermios syscall.Termios
}

func setRawMode() (*termState, error) {
	var termios syscall.Termios
	if _, _, err := syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCGETS, uintptr(unsafe.Pointer(&termios)), 0, 0, 0); err != 0 {
		return nil, err
	}

	newTermios := termios
	newTermios.Lflag &^= syscall.ECHO | syscall.ICANON | syscall.ISIG
	newTermios.Cc[syscall.VMIN] = 1
	newTermios.Cc[syscall.VTIME] = 0

	if _, _, err := syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCSETS, uintptr(unsafe.Pointer(&newTermios)), 0, 0, 0); err != 0 {
		return nil, err
	}

	return &termState{oldTermios: termios}, nil
}

func (t *termState) restore() {
	syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCSETS, uintptr(unsafe.Pointer(&t.oldTermios)), 0, 0, 0)
}

func newGame() *Game {
	midX := width / 2
	midY := height / 2
	snake := Snake{
		Body: []Point{
			{midX, midY},
			{midX - 1, midY},
			{midX - 2, midY},
		},
		Direction: RIGHT,
	}
	return &Game{
		Width:   width,
		Height:  height,
		Snake:   snake,
		Score:   0,
		Running: true,
	}
}

func (g *Game) placeFood() {
	for {
		p := Point{
			X: rand.Intn(g.Width-2) + 1,
			Y: rand.Intn(g.Height-2) + 1,
		}
		onSnake := false
		for _, seg := range g.Snake.Body {
			if seg == p {
				onSnake = true
				break
			}
		}
		if !onSnake {
			g.Food = p
			return
		}
	}
}

func (g *Game) step() bool {
	head := g.Snake.Body[0]
	var newHead Point

	switch g.Snake.Direction {
	case UP:
		newHead = Point{head.X, head.Y - 1}
	case DOWN:
		newHead = Point{head.X, head.Y + 1}
	case LEFT:
		newHead = Point{head.X - 1, head.Y}
	case RIGHT:
		newHead = Point{head.X + 1, head.Y}
	}

	// Wall collision
	if newHead.X <= 0 || newHead.X >= g.Width-1 || newHead.Y <= 0 || newHead.Y >= g.Height-1 {
		return false
	}

	// Self collision — exclude the tail segment if we won't eat food,
	// since it will move away in this step.
	eating := newHead == g.Food
	bodyToCheck := g.Snake.Body
	if !eating && len(g.Snake.Body) > 1 {
		bodyToCheck = g.Snake.Body[:len(g.Snake.Body)-1]
	}
	for _, seg := range bodyToCheck {
		if seg == newHead {
			return false
		}
	}

	g.Snake.Body = append([]Point{newHead}, g.Snake.Body...)

	if eating {
		g.Score++
		g.placeFood()
	} else {
		g.Snake.Body = g.Snake.Body[:len(g.Snake.Body)-1]
	}

	return true
}

func (g *Game) render() string {
	var sb strings.Builder

	sb.WriteString("\033[2J\033[H\033[?25l")

	grid := make(map[Point]byte, g.Width*g.Height)
	for _, seg := range g.Snake.Body {
		grid[seg] = 'O'
	}
	head := g.Snake.Body[0]
	delete(grid, head)
	grid[g.Food] = '*'
	grid[head] = '@'

	sb.WriteString("\n  \033[1;36m ___  _   _ ___ _  __\n")
	sb.WriteString("  \033[1;36m|   \\| | | |   \\ |/ /\n")
	sb.WriteString("  \033[1;36m| |\\ \\| | | | |\\ '  /\n")
	sb.WriteString("  \033[1;36m| | \\\"| | | | | \\.  /\n")
	sb.WriteString("  \033[1;36m|_|  |_| |_|_|_\\_\\033[0m\n\n")

	sb.WriteString("  +")
	for i := 0; i < g.Width-2; i++ {
		sb.WriteString("-")
	}
	sb.WriteString("+\n")

	for y := 1; y < g.Height-1; y++ {
		sb.WriteString("  |")
		for x := 1; x <= g.Width-2; x++ {
			p := Point{x, y}
			ch, _ := grid[p]
			switch ch {
			case '@':
				sb.WriteString("\033[1;32m@\033[0m")
			case 'O':
				sb.WriteString("\033[0;32mO\033[0m")
			case '*':
				sb.WriteString("\033[1;31m*\033[0m")
			default:
				sb.WriteString(" ")
			}
		}
		sb.WriteString("|\n")
	}

	sb.WriteString("  +")
	for i := 0; i < g.Width-2; i++ {
		sb.WriteString("-")
	}
	sb.WriteString("+\n")

	sb.WriteString(fmt.Sprintf("\n  \033[1;33mScore: %d\033[0m   Length: %d\n", g.Score, len(g.Snake.Body)))
	sb.WriteString("  \033[2;37mArrows/WASD to move | Q to quit\033[0m\n")
	sb.WriteString("\033[?25h")

	return sb.String()
}

// inputEvent is sent from the input goroutine to the main loop.
type inputEvent int

const (
	quitInput inputEvent = iota
	upInput
	downInput
	leftInput
	rightInput
)

func readInput(done chan struct{}, events chan<- inputEvent) {
	buf := make([]byte, 1)
	for {
		select {
		case <-done:
			return
		default:
		}
		n, err := os.Stdin.Read(buf)
		if err != nil || n == 0 {
			continue
		}
		b := buf[0]
		switch b {
		case 'q', 'Q':
			select {
			case events <- quitInput:
			case <-done:
				return
			}
		case 'w', 'W', 'k', 'K':
			select {
			case events <- upInput:
			case <-done:
				return
			}
		case 's', 'S', 'j', 'J':
			select {
			case events <- downInput:
			case <-done:
				return
			}
		case 'a', 'A', 'h', 'H':
			select {
			case events <- leftInput:
			case <-done:
				return
			}
		case 'd', 'D', 'l', 'L':
			select {
			case events <- rightInput:
			case <-done:
				return
			}
		case '\x1b':
			// Arrow key escape sequence: read remaining 2 bytes with timeout
			extra := make([]byte, 2)
			for i := range extra {
				select {
				case <-time.After(10 * time.Millisecond):
					goto nextKey
				default:
				}
				n, _ := os.Stdin.Read(extra[i : i+1])
				if n == 0 {
					break
				}
			}
			switch string(extra) {
			case "[A":
				select {
				case events <- upInput:
				case <-done:
					return
				}
			case "[B":
				select {
				case events <- downInput:
				case <-done:
					return
				}
			case "[D":
				select {
				case events <- leftInput:
				case <-done:
					return
				}
			case "[C":
				select {
				case events <- rightInput:
				case <-done:
					return
				}
			}
		}
	nextKey:
	}
}

func applyDirection(game *Game, ev inputEvent) bool {
	switch ev {
	case quitInput:
		game.Running = false
		return false
	case upInput:
		if game.Snake.Direction != DOWN {
			game.Snake.Direction = UP
		}
	case downInput:
		if game.Snake.Direction != UP {
			game.Snake.Direction = DOWN
		}
	case leftInput:
		if game.Snake.Direction != RIGHT {
			game.Snake.Direction = LEFT
		}
	case rightInput:
		if game.Snake.Direction != LEFT {
			game.Snake.Direction = RIGHT
		}
	}
	return true
}

func main() {
	rand.Seed(time.Now().UnixNano())

	game := newGame()
	game.placeFood()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt)

	state, err := setRawMode()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to set raw mode: %v\n", err)
		os.Exit(1)
	}
	defer state.restore()

	fmt.Print("\033[?25l")
	defer fmt.Print("\033[?25h")

	fmt.Print(game.render())

	ticker := time.NewTicker(speed)
	defer ticker.Stop()

	// Input goroutine: reads stdin and sends direction events.
	done := make(chan struct{})
	events := make(chan inputEvent, 16)
	go readInput(done, events)

	for game.Running {
		select {
		case <-sigCh:
			game.Running = false

		case <-ticker.C:
			alive := game.step()
			if !alive {
				game.Running = false
			}
			fmt.Print(game.render())

		case ev, ok := <-events:
			if !ok {
				continue
			}
			if !applyDirection(game, ev) {
				continue
			}
			fmt.Print(game.render())
		}
	}

	close(done)

	fmt.Print("\033[2J\033[H\033[?25h")
	fmt.Print("\n  \033[1;31m       GAME OVER\033[0m\n")
	fmt.Printf("  Final Score: \033[1;33m%d\033[0m\n", game.Score)
	fmt.Printf("  Snake Length: \033[1;32m%d\033[0m\n\n", len(game.Snake.Body))
}
