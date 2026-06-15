package handler

import (
	"bytes"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/model"
	"github.com/yieldnest/account-service/internal/repository"
	"github.com/yieldnest/account-service/internal/service"
)

type ReportHandler struct {
	reportSvc   *service.ReportService
	auditLogRepo *repository.AuditLogRepo
}

func NewReportHandler(rs *service.ReportService, alr *repository.AuditLogRepo) *ReportHandler {
	return &ReportHandler{reportSvc: rs, auditLogRepo: alr}
}

func (h *ReportHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/audit-logs", h.ListAuditLogs)
	r.Get("/audit-logs/export", h.ExportAuditLogCSV)
	r.Get("/monthly-statement", h.GetMonthlyStatement)
	r.Get("/monthly-statement/csv", h.ExportMonthlyCSV)
	r.Get("/activity-summary", h.GetActivitySummary)
	return r
}

func (h *ReportHandler) getEnterpriseID(r *http.Request) string {
	return chi.URLParam(r, "id")
}

func (h *ReportHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	q := r.URL.Query()

	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 50
	}

	filter := repository.AuditLogFilter{
		EnterpriseID: enterpriseID,
		Action:       q.Get("action"),
		ResourceType: q.Get("resourceType"),
		ResourceID:   q.Get("resourceId"),
		ActorID:      q.Get("actorId"),
		Limit:        limit,
		Offset:       offset,
	}

	if dateFrom := q.Get("dateFrom"); dateFrom != "" {
		t, err := time.Parse(time.RFC3339, dateFrom)
		if err == nil {
			filter.DateFrom = &t
		}
	}
	if dateTo := q.Get("dateTo"); dateTo != "" {
		t, err := time.Parse(time.RFC3339, dateTo)
		if err == nil {
			filter.DateTo = &t
		}
	}

	logs, err := h.auditLogRepo.List(r.Context(), filter)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	count, err := h.auditLogRepo.Count(r.Context(), filter)
	if err != nil {
		count = len(logs)
	}

	if logs == nil {
		logs = make([]model.AuditLog, 0)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    logs,
		"pagination": map[string]interface{}{
			"limit":  limit,
			"offset": offset,
			"total":  count,
		},
	})
}

func (h *ReportHandler) ExportAuditLogCSV(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	q := r.URL.Query()

	limit := 500 // CSV export gets up to 500 results
	filter := repository.AuditLogFilter{
		EnterpriseID: enterpriseID,
		Action:       q.Get("action"),
		ResourceType: q.Get("resourceType"),
		Limit:        limit,
		Offset:       0,
	}

	logs, err := h.auditLogRepo.List(r.Context(), filter)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	var buf bytes.Buffer
	buf.WriteString("ID,EnterpriseID,ActorID,Action,ResourceType,ResourceID,CreatedAt\n")
	for _, l := range logs {
		eid := ""
		if l.EnterpriseID != nil {
			eid = *l.EnterpriseID
		}
		aid := ""
		if l.ActorID != nil {
			aid = *l.ActorID
		}
		rt := ""
		if l.ResourceType != nil {
			rt = *l.ResourceType
		}
		rid := ""
		if l.ResourceID != nil {
			rid = *l.ResourceID
		}
		buf.WriteString(l.ID + "," + eid + "," + aid + "," + l.Action + "," + rt + "," + rid + "," + l.CreatedAt.Format(time.RFC3339) + "\n")
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=audit-logs.csv")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

func (h *ReportHandler) GetMonthlyStatement(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	yearMonth := r.URL.Query().Get("yearMonth")
	if yearMonth == "" {
		// Default to current month
		yearMonth = time.Now().UTC().Format("2006-01")
	}

	statement, err := h.reportSvc.GenerateMonthlyStatement(r.Context(), enterpriseID, yearMonth)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("REPORT_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(statement))
}

func (h *ReportHandler) ExportMonthlyCSV(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)
	yearMonth := r.URL.Query().Get("yearMonth")
	if yearMonth == "" {
		yearMonth = time.Now().UTC().Format("2006-01")
	}

	var buf bytes.Buffer
	if err := h.reportSvc.ExportMonthlyCSV(r.Context(), enterpriseID, yearMonth, &buf); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse("REPORT_ERROR", err.Error()))
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=monthly-statement-"+yearMonth+".csv")
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

func (h *ReportHandler) GetActivitySummary(w http.ResponseWriter, r *http.Request) {
	enterpriseID := h.getEnterpriseID(r)

	now := time.Now().UTC()
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	to := from.AddDate(0, 1, 0).Add(-time.Second)

	stats, err := h.auditLogRepo.GetActionStats(r.Context(), enterpriseID, from, to)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse("DATABASE_ERROR", err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, successResponse(stats))
}
