package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/yieldnest/account-service/internal/db"
)

type apiKeyContextKey string

const (
	APIKeyEnterpriseIDKey apiKeyContextKey = "apiKeyEnterpriseID"
	APIKeyScopesKey       apiKeyContextKey = "apiKeyScopes"
)

// APIKeyAuth validates X-API-Key header against api_keys table.
// Injects enterpriseID and scopes into context on success.
func APIKeyAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			apiKey = r.URL.Query().Get("api_key")
		}
		if apiKey == "" {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing API key")
			return
		}

		keyHash := hashAPIKey(apiKey)

		var enterpriseID string
		var scopes []byte
		var revokedAt *time.Time
		var expiresAt *time.Time

		err := db.Pool.QueryRow(r.Context(), `
			SELECT enterprise_id, scopes, revoked_at, expires_at
			FROM api_keys WHERE key_hash = $1
		`, keyHash).Scan(&enterpriseID, &scopes, &revokedAt, &expiresAt)

		if err == pgx.ErrNoRows {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid API key")
			return
		}
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Auth error")
			return
		}
		if revokedAt != nil {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "API key revoked")
			return
		}
		if expiresAt != nil && time.Now().After(*expiresAt) {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "API key expired")
			return
		}

		// Update last_used_at (best-effort)
		_, _ = db.Pool.Exec(r.Context(),
			`UPDATE api_keys SET last_used_at = $1 WHERE key_hash = $2`,
			time.Now(), keyHash,
		)

		ctx := context.WithValue(r.Context(), APIKeyEnterpriseIDKey, enterpriseID)
		ctx = context.WithValue(ctx, APIKeyScopesKey, string(scopes))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func hashAPIKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}

// APIKeyOrJWTAuth tries API key auth first, then falls back to JWT.
// Used for ERP endpoints that need to work for both external systems and dashboard users.
func APIKeyOrJWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			apiKey = r.URL.Query().Get("api_key")
		}
		if apiKey != "" {
			APIKeyAuth(next).ServeHTTP(w, r)
			return
		}
		AuthRequired(next).ServeHTTP(w, r)
	})
}
