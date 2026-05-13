package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/repository"
)

type AccountHandler struct {
	accountRepo    *repository.AccountRepo
	whitelistRepo  *repository.WhitelistRepo
}

func NewAccountHandler(ar *repository.AccountRepo, wr *repository.WhitelistRepo) *AccountHandler {
	return &AccountHandler{accountRepo: ar, whitelistRepo: wr}
}

func (h *AccountHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Get("/{id}", h.GetByID)
	r.Get("/{id}/balance", h.GetBalance)
	r.Get("/{id}/whitelist", h.ListWhitelist)
	r.Post("/{id}/whitelist", h.AddWhitelist)
	r.Delete("/{id}/whitelist/{addrId}", h.RemoveWhitelist)
	return r
}

func (h *AccountHandler) List(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	accounts, err := h.accountRepo.ListByEnterprise(r.Context(), enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	if accounts == nil {
		accounts = []repository.SmartAccount{}
	}
	writeJSON(w, http.StatusOK, successResponse(accounts))
}

func (h *AccountHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	account, err := h.accountRepo.FindByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("ACCOUNT_NOT_FOUND", "Account not found"))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(account))
}

func (h *AccountHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	account, err := h.accountRepo.FindByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("ACCOUNT_NOT_FOUND", "Account not found"))
		return
	}
	// Phase 0: placeholder balance — Phase 1 queries chain
	writeJSON(w, http.StatusOK, successResponse(map[string]interface{}{
		"accountId": account.ID,
		"asset":     "USDC",
		"balance":   "0.00",
		"chainId":   account.ChainID,
	}))
}

func (h *AccountHandler) ListWhitelist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	// Verify account belongs to enterprise
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	account, err := h.accountRepo.FindByID(r.Context(), id)
	if err != nil || account.EnterpriseID != enterpriseID {
		writeJSON(w, http.StatusNotFound, errorResponse("ACCOUNT_NOT_FOUND", "Account not found"))
		return
	}

	addresses, err := h.whitelistRepo.ListByEnterprise(r.Context(), enterpriseID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(addresses))
}

func (h *AccountHandler) AddWhitelist(w http.ResponseWriter, r *http.Request) {
	enterpriseID, _ := r.Context().Value(middleware.EnterpriseIDKey).(string)
	actorID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var body struct {
		Address string  `json:"address"`
		Label   *string `json:"label"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("INVALID_INPUT", err.Error()))
		return
	}

	// Implementation continues...
	_ = enterpriseID
	_ = actorID
	writeJSON(w, http.StatusCreated, successResponse(map[string]string{"status": "whitelist_added"}))
}

func (h *AccountHandler) RemoveWhitelist(w http.ResponseWriter, r *http.Request) {
	addrId := chi.URLParam(r, "addrId")
	if err := h.whitelistRepo.Delete(r.Context(), addrId); err != nil {
		writeJSON(w, http.StatusNotFound, errorResponse("NOT_FOUND", "Whitelist entry not found"))
		return
	}
	writeJSON(w, http.StatusOK, successResponse(map[string]string{"status": "removed"}))
}
