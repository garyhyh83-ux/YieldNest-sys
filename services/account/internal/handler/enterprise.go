package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/service"
)

type EnterpriseHandler struct {
	svc *service.EnterpriseService
}

func NewEnterpriseHandler(svc *service.EnterpriseService) *EnterpriseHandler {
	return &EnterpriseHandler{svc: svc}
}

func (h *EnterpriseHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{id}", h.GetByID)
	r.Get("/", h.List)
	r.Patch("/{id}", h.Update)
	r.Patch("/{id}/kyb", h.UpdateKYB)
	return r
}

func (h *EnterpriseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	e, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("NOT_FOUND", "Enterprise not found"))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(e))
}

func (h *EnterpriseHandler) List(w http.ResponseWriter, r *http.Request) {
	enterprises, err := h.svc.List(r.Context(), 20, 0)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(enterprises))
}

func (h *EnterpriseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		LegalName          *string `json:"legalName"`
		RegistrationNumber *string `json:"registrationNumber"`
		Country            *string `json:"country"`
		EntityType         *string `json:"entityType"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	e, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("NOT_FOUND", "Enterprise not found"))
		return
	}
	if body.LegalName != nil {
		e.LegalName = *body.LegalName
	}
	// ... other field updates (simplified for Phase 0)
	writeJSON(w, http.StatusOK, successResponse(e))
}

func (h *EnterpriseHandler) UpdateKYB(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var body struct {
		Status      string `json:"status"`
		ProviderRef string `json:"providerRef"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	if err := h.svc.UpdateKYBStatus(r.Context(), id, body.Status, body.ProviderRef, actorID); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "updated"}))
}
