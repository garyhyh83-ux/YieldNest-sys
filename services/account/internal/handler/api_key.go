package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/yieldnest/account-service/internal/db"
)

type ApiKeyHandler struct{}

func NewApiKeyHandler() *ApiKeyHandler { return &ApiKeyHandler{} }

func (h *ApiKeyHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Delete("/{keyId}", h.Revoke)
	return r
}

func (h *ApiKeyHandler) getEnterpriseID(r *http.Request) string {
	return chi.URLParam(r, "id")
}

func (h *ApiKeyHandler) List(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at
		FROM api_keys
		WHERE enterprise_id = $1 AND revoked_at IS NULL
		ORDER BY created_at DESC
	`, enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	defer rows.Close()

	var keys []map[string]interface{}
	for rows.Next() {
		var id, name, keyPrefix string
		var scopes []byte
		var lastUsedAt, expiresAt, revokedAt *time.Time
		var createdAt time.Time
		if err := rows.Scan(&id, &name, &keyPrefix, &scopes, &lastUsedAt, &expiresAt, &revokedAt, &createdAt); err != nil {
			continue
		}
		keys = append(keys, map[string]interface{}{
			"id":         id,
			"name":       name,
			"keyPrefix":  keyPrefix,
			"scopes":     json.RawMessage(scopes),
			"lastUsedAt": lastUsedAt,
			"expiresAt":  expiresAt,
			"createdAt":  createdAt,
		})
	}
	if keys == nil {
		keys = []map[string]interface{}{}
	}

	writeJSON(w, http.StatusOK, successResponse(keys))
}

func (h *ApiKeyHandler) Create(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)

	var body struct {
		Name   string   `json:"name"`
		Scopes []string `json:"scopes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}
	if body.Name == "" {
		body.Name = "API Key"
	}
	if len(body.Scopes) == 0 {
		body.Scopes = []string{"read", "write"}
	}

	rawKey := "yn_sk_" + generateRandom(32)
	keyHash := hashKey(rawKey)
	keyPrefix := rawKey[:12]
	scopesJSON, _ := json.Marshal(body.Scopes)

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO api_keys (id, enterprise_id, name, key_hash, key_prefix, scopes)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, uuid.New().String(), enterpriseID, body.Name, keyHash, keyPrefix, scopesJSON)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	// Return the raw key — only time it's visible
	writeJSON(w, http.StatusCreated, successResponse(map[string]interface{}{
		"apiKey":    rawKey,
		"keyPrefix": keyPrefix,
		"name":      body.Name,
		"scopes":    body.Scopes,
		"message":   "Store this key securely. It will not be shown again.",
	}))
}

func (h *ApiKeyHandler) Revoke(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	keyID := chi.URLParam(r, "keyId")

	now := time.Now()
	_, err := db.Pool.Exec(r.Context(), `
		UPDATE api_keys SET revoked_at = $1 WHERE id = $2 AND enterprise_id = $3
	`, now, keyID, enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "revoked"}))
}

func hashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}

func generateRandom(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}
