package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/service"
)

type ApprovalHandler struct {
	svc *service.ApprovalService
}

func NewApprovalHandler(svc *service.ApprovalService) *ApprovalHandler {
	return &ApprovalHandler{svc: svc}
}

func (h *ApprovalHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Get("/pending-my-vote", h.ListPendingForApprover)
	r.Post("/", h.Request)
	r.Get("/{approvalId}", h.GetByID)
	r.Post("/{approvalId}/vote", h.SubmitVote)
	r.Post("/{approvalId}/cancel", h.Cancel)
	return r
}

func (h *ApprovalHandler) getEnterpriseID(r *http.Request) string {
	return chi.URLParam(r, "id")
}

func (h *ApprovalHandler) getContextUser(r *http.Request) (userID, enterpriseID, role string) {
	userID, _ = r.Context().Value(middleware.UserIDKey).(string)
	enterpriseID = h.getEnterpriseID(r)
	role, _ = r.Context().Value(middleware.UserRoleKey).(string)
	return
}

func (h *ApprovalHandler) List(w http.ResponseWriter, r *http.Request) {
	_, enterpriseID, _ := h.getContextUser(r)

	status := r.URL.Query().Get("status")
	approvalType := r.URL.Query().Get("type")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 20
	}

	approvals, total, err := h.svc.ListApprovals(r.Context(), enterpriseID, status, approvalType, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    approvals,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
			"total":  total,
		},
	})
}

func (h *ApprovalHandler) ListPendingForApprover(w http.ResponseWriter, r *http.Request) {
	userID, enterpriseID, role := h.getContextUser(r)

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 20
	}

	approvals, err := h.svc.ListPendingForApprover(r.Context(), enterpriseID, userID, role, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(approvals))
}

func (h *ApprovalHandler) Request(w http.ResponseWriter, r *http.Request) {
	userID, enterpriseID, _ := h.getContextUser(r)

	var body struct {
		ApprovalType   string          `json:"approvalType"`
		Payload        json.RawMessage `json:"payload"`
		IdempotencyKey *string         `json:"idempotencyKey"`
		Amount         string          `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	if body.ApprovalType == "" {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", "approvalType is required"))
		return
	}

	approval, approvalRequired, err := h.svc.RequestApproval(
		r.Context(), enterpriseID, body.ApprovalType, userID,
		body.Payload, body.IdempotencyKey, body.Amount,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("APPROVAL_ERROR", err.Error()))
		return
	}

	if !approvalRequired {
		writeJSON(w, http.StatusOK, successResponse(map[string]interface{}{
			"approvalRequired": false,
			"message":          "Auto-approved per policy",
		}))
		return
	}

	writeJSON(w, http.StatusCreated, successResponse(approval))
}

func (h *ApprovalHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	_, enterpriseID, _ := h.getContextUser(r)
	approvalID := chi.URLParam(r, "approvalId")

	approval, votes, err := h.svc.GetApproval(r.Context(), approvalID, enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("NOT_FOUND", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(map[string]interface{}{
		"approval": approval,
		"votes":    votes,
	}))
}

func (h *ApprovalHandler) SubmitVote(w http.ResponseWriter, r *http.Request) {
	userID, enterpriseID, role := h.getContextUser(r)
	approvalID := chi.URLParam(r, "approvalId")

	var body struct {
		Vote    string `json:"vote"`
		Comment string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	if body.Vote != "approve" && body.Vote != "reject" {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", "vote must be 'approve' or 'reject'"))
		return
	}

	approval, err := h.svc.SubmitVote(r.Context(), approvalID, enterpriseID, userID, role, body.Vote, body.Comment)
	if err != nil {
		code := "APPROVAL_ERROR"
		switch err.Error() {
		case "approval is already approved", "approval is already rejected", "approval is already cancelled", "approval is already expired":
			code = "APPROVAL_ALREADY_RESOLVED"
		case "already voted on this approval":
			code = "APPROVAL_ALREADY_VOTED"
		case "approval has expired":
			code = "APPROVAL_EXPIRED"
		case "not an eligible approver for this request":
			code = "FORBIDDEN"
		}
		writeJSON(w, http.StatusBadRequest, errorResponse(code, err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(approval))
}

func (h *ApprovalHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID, enterpriseID, _ := h.getContextUser(r)
	approvalID := chi.URLParam(r, "approvalId")

	if err := h.svc.CancelApproval(r.Context(), approvalID, enterpriseID, userID); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("CANCEL_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "cancelled"}))
}
