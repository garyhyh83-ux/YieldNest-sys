package handler

import (
	"bytes"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/middleware"
)

type ERPHandler struct{}

func NewERPHandler() *ERPHandler { return &ERPHandler{} }

func (h *ERPHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/transactions/export", h.ExportTransactions)
	r.Get("/yield/export", h.ExportYield)
	return r
}

func (h *ERPHandler) getEnterpriseID(r *http.Request) string {
	// ERP routes may be mounted under /enterprises/{id}/erp (JWT) or /erp (API key)
	if id := chi.URLParam(r, "id"); id != "" {
		return id
	}
	if id, ok := r.Context().Value(middleware.APIKeyEnterpriseIDKey).(string); ok {
		return id
	}
	return ""
}

func (h *ERPHandler) ExportTransactions(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	q := r.URL.Query()

	// Default: last 90 days
	to := time.Now().UTC()
	from := to.AddDate(0, 0, -90)
	if df := q.Get("dateFrom"); df != "" {
		if t, err := time.Parse("2006-01-02", df); err == nil {
			from = t
		}
	}
	if dt := q.Get("dateTo"); dt != "" {
		if t, err := time.Parse("2006-01-02", dt); err == nil {
			to = t.Add(24 * time.Hour).Add(-time.Second)
		}
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 1000
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, tx_type, asset, amount, direction, status, chain_tx_hash, created_at, confirmed_at
		FROM transactions
		WHERE enterprise_id = $1 AND created_at >= $2 AND created_at <= $3
		ORDER BY created_at DESC
		LIMIT $4
	`, enterpriseID, from, to, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	defer rows.Close()

	var buf bytes.Buffer
	buf.WriteString("ID,Type,Asset,Amount,Direction,Status,ChainTxHash,CreatedAt,ConfirmedAt\n")
	for rows.Next() {
		var id, txType, asset, amount, direction, status string
		var chainTxHash *string
		var createdAt time.Time
		var confirmedAt *time.Time
		if err := rows.Scan(&id, &txType, &asset, &amount, &direction, &status, &chainTxHash, &createdAt, &confirmedAt); err != nil {
			continue
		}
		hash := ""
		if chainTxHash != nil {
			hash = *chainTxHash
		}
		confirmed := ""
		if confirmedAt != nil {
			confirmed = confirmedAt.Format(time.RFC3339)
		}
		buf.WriteString(id + "," + txType + "," + asset + "," + amount + "," + direction + "," + status + "," + hash + "," + createdAt.Format(time.RFC3339) + "," + confirmed + "\n")
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=transactions-export.csv")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

func (h *ERPHandler) ExportYield(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	q := r.URL.Query()

	to := time.Now().UTC()
	from := to.AddDate(0, 0, -365)
	if df := q.Get("dateFrom"); df != "" {
		if t, err := time.Parse("2006-01-02", df); err == nil {
			from = t
		}
	}
	if dt := q.Get("dateTo"); dt != "" {
		if t, err := time.Parse("2006-01-02", dt); err == nil {
			to = t.Add(24 * time.Hour).Add(-time.Second)
		}
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, strategy_id, snapshot_amount, gross_yield, fee_amount, net_yield, apy_bps, record_date
		FROM yield_records
		WHERE enterprise_id = $1 AND record_date >= $2::date AND record_date <= $3::date
		ORDER BY record_date DESC
	`, enterpriseID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}
	defer rows.Close()

	var buf bytes.Buffer
	buf.WriteString("ID,StrategyID,SnapshotAmount,GrossYield,FeeAmount,NetYield,APYBps,RecordDate\n")
	for rows.Next() {
		var id, strategyID, snapshotAmount, grossYield, feeAmount, netYield string
		var apyBps int
		var recordDate time.Time
		if err := rows.Scan(&id, &strategyID, &snapshotAmount, &grossYield, &feeAmount, &netYield, &apyBps, &recordDate); err != nil {
			continue
		}
		buf.WriteString(id + "," + strategyID + "," + snapshotAmount + "," + grossYield + "," + feeAmount + "," + netYield + "," + strconv.Itoa(apyBps) + "," + recordDate.Format("2006-01-02") + "\n")
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=yield-export.csv")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}
