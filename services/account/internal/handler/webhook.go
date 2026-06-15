package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/service"
)

type WebhookHandler struct {
	svc *service.WebhookService
}

func NewWebhookHandler(svc *service.WebhookService) *WebhookHandler {
	return &WebhookHandler{svc: svc}
}

func (h *WebhookHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Delete("/{subId}", h.Delete)
	r.Post("/{subId}/test", h.Test)
	return r
}

func (h *WebhookHandler) getEnterpriseID(r *http.Request) string {
	return chi.URLParam(r, "id")
}

func (h *WebhookHandler) List(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	subs, err := h.svc.ListSubscriptions(r.Context(), enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	if subs == nil {
		subs = []service.WebhookSubscription{}
	}
	writeJSON(w, http.StatusOK, successResponse(subs))
}

func (h *WebhookHandler) Create(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)

	var body struct {
		URL    string   `json:"url"`
		Events []string `json:"events"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}
	if body.URL == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", "url is required"))
		return
	}

	secret := make([]byte, 32)
	rand.Read(secret)
	secretHex := hex.EncodeToString(secret)

	sub, err := h.svc.CreateSubscription(r.Context(), enterpriseID, body.URL, secretHex, body.Events)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	// Return secret once
	writeJSON(w, http.StatusCreated, successResponse(map[string]interface{}{
		"subscription": sub,
		"secret":        secretHex,
		"message":       "Store this secret securely. It will not be shown again.",
	}))
}

func (h *WebhookHandler) Delete(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	subID := chi.URLParam(r, "subId")

	if err := h.svc.DeleteSubscription(r.Context(), subID, enterpriseID); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "deleted"}))
}

func (h *WebhookHandler) Test(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	subID := chi.URLParam(r, "subId")

	// Send a test ping event
	h.svc.EmitEvent(r.Context(), enterpriseID, "ping", map[string]interface{}{
		"subscriptionId": subID,
		"message":        "Test webhook delivery from YieldNest",
	})

	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "test sent"}))
}
