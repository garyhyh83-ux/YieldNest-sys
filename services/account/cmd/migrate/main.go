package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run cmd/migrate/main.go [up|down|reset]")
		os.Exit(1)
	}
	cmd := os.Args[1]

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://yieldnest:yieldnest_dev@localhost:5432/yieldnest?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	migrationsDir := filepath.Join("..", "migrations")
	if _, err := os.Stat("migrations"); err == nil {
		migrationsDir = "migrations"
	}

	switch cmd {
	case "up":
		runMigrations(pool, migrationsDir, "up")
	case "down":
		runMigrations(pool, migrationsDir, "down")
	case "reset":
		runMigrations(pool, migrationsDir, "down")
		runMigrations(pool, migrationsDir, "up")
	default:
		fmt.Printf("Unknown command: %s\n", cmd)
		os.Exit(1)
	}
}

func runMigrations(pool *pgxpool.Pool, dir, direction string) {
	files, err := filepath.Glob(filepath.Join(dir, fmt.Sprintf("*.%s.sql", direction)))
	if err != nil {
		log.Fatalf("Failed to list migrations: %v", err)
	}

	sort.Strings(files)

	for _, file := range files {
		name := filepath.Base(file)
		log.Printf("Running migration: %s", name)

		content, err := os.ReadFile(file)
		if err != nil {
			log.Fatalf("Failed to read %s: %v", file, err)
		}

		statements := strings.Split(string(content), ";")
		for _, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if _, err := pool.Exec(context.Background(), stmt); err != nil {
				log.Fatalf("Migration %s failed: %v\nSQL: %s", name, err, stmt[:min(len(stmt), 200)])
			}
		}
		log.Printf("  ✓ %s", name)
	}

	log.Printf("All %s migrations complete.", direction)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
