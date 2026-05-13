package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL     string
	Port            int
	JwtPublicKey    string
	AuthServiceURL  string
	LogLevel        string
}

func Load() *Config {
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://yieldnest:yieldnest_dev@localhost:5432/yieldnest?sslmode=disable"),
		Port:           getEnvInt("PORT", 3200),
		JwtPublicKey:   getEnv("JWT_PUBLIC_KEY_PATH", "../../keys/jwt-public.pem"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:3100"),
		LogLevel:       getEnv("LOG_LEVEL", "debug"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
