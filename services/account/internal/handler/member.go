package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/service"
)

type MemberHandler struct {
	svc *service.MemberService
}

func NewMemberHandler(svc *service.MemberService) *MemberHandler {
	return &MemberHandler{svc: svc}
}

func (h *MemberHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Invite)
	r.Patch("/{uid}", h.UpdateRole)
	r.Delete("/{uid}", h.Remove)
	return r
}

func (h *MemberHandler) List(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	members, err := h.svc.ListByEnterprise(r.Context(), enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(members))
}

func (h *MemberHandler) Invite(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var body struct {
		Email       string `json:"email"`
		Role        string `json:"role"`
		DisplayName string `json:"displayName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	user, err := h.svc.Invite(r.Context(), enterpriseID, body.Email, body.Role, body.DisplayName, actorID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusCreated, successResponse(user))
}

func (h *MemberHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)
	uid := chi.URLParam(r, "uid")

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	if err := h.svc.UpdateRole(r.Context(), uid, enterpriseID, body.Role, actorID); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "updated"}))
}

func (h *MemberHandler) Remove(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)
	uid := chi.URLParam(r, "uid")

	if err := h.svc.Remove(r.Context(), uid, enterpriseID, actorID); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "removed"}))
}
