package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/service"
)

type ApprovalPolicyHandler struct {
	svc *service.ApprovalPolicyService
}

func NewApprovalPolicyHandler(svc *service.ApprovalPolicyService) *ApprovalPolicyHandler {
	return &ApprovalPolicyHandler{svc: svc}
}

func (h *ApprovalPolicyHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{policyId}", h.Update)
	r.Delete("/{policyId}", h.Delete)
	return r
}

func (h *ApprovalPolicyHandler) getEnterpriseID(r *http.Request) string {
	return chi.URLParam(r, "id")
}

func (h *ApprovalPolicyHandler) List(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	policies, err := h.svc.List(r.Context(), enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	if policies == nil {
		policies = []model.ApprovalPolicy{}
	}
	writeJSON(w, http.StatusOK, successResponse(policies))
}

func (h *ApprovalPolicyHandler) Create(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var body struct {
		PolicyType string          `json:"policyType"`
		Rules      json.RawMessage `json:"rules"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	if body.PolicyType == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", "policyType is required"))
		return
	}

	policy, err := h.svc.Create(r.Context(), enterpriseID, body.PolicyType, actorID, body.Rules)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("POLICY_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusCreated, successResponse(policy))
}

func (h *ApprovalPolicyHandler) Update(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)
	policyID := chi.URLParam(r, "policyId")

	var body struct {
		Rules json.RawMessage `json:"rules"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	policy, err := h.svc.Update(r.Context(), policyID, enterpriseID, actorID, body.Rules)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("POLICY_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(policy))
}

func (h *ApprovalPolicyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)
	policyID := chi.URLParam(r, "policyId")

	if err := h.svc.Delete(r.Context(), policyID, enterpriseID, actorID); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("POLICY_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "deleted"}))
}
