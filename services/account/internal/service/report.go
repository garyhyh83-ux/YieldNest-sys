package service

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"time"

	"github.com/yieldnest/account-service/internal/repository"
)

// ReportService generates reports, monthly statements, and exports.
type ReportService struct {
	auditLogRepo *repository.AuditLogRepo
}

func NewReportService(alr *repository.AuditLogRepo) *ReportService {
	return &ReportService{auditLogRepo: alr}
}

// MonthlyStatement represents a monthly financial summary.
type MonthlyStatement struct {
	EnterpriseID   string            `json:"enterpriseId"`
	YearMonth      string            `json:"yearMonth"`
	OpeningBalance string            `json:"openingBalance"`
	TotalDeposits  string            `json:"totalDeposits"`
	TotalWithdrawals string          `json:"totalWithdrawals"`
	YieldEarned    string            `json:"yieldEarned"`
	FeesPaid       string            `json:"feesPaid"`
	ClosingBalance string            `json:"closingBalance"`
	ActivitySummary map[string]int   `json:"activitySummary"`
	GeneratedAt    string            `json:"generatedAt"`
}

// GenerateMonthlyStatement creates a monthly statement from stored data.
// Phase 2 provides a skeleton — real amounts come from Phase 3 analytics.
func (s *ReportService) GenerateMonthlyStatement(
	ctx context.Context,
	enterpriseID, yearMonth string,
) (*MonthlyStatement, error) {
	// Parse yearMonth (format: "2026-05")
	t, err := time.Parse("2006-01", yearMonth)
	if err != nil {
		return nil, fmt.Errorf("invalid yearMonth format, expected YYYY-MM: %w", err)
	}
	from := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.UTC)
	to := from.AddDate(0, 1, 0).Add(-time.Second)

	// Get activity summary for the month
	activitySummary, err := s.auditLogRepo.GetActionStats(ctx, enterpriseID, from, to)
	if err != nil {
		activitySummary = make(map[string]int)
	}

	statement := &MonthlyStatement{
		EnterpriseID:    enterpriseID,
		YearMonth:       yearMonth,
		OpeningBalance:  "0.00",
		TotalDeposits:   "0.00",
		TotalWithdrawals: "0.00",
		YieldEarned:     "0.00",
		FeesPaid:        "0.00",
		ClosingBalance:  "0.00",
		ActivitySummary: activitySummary,
		GeneratedAt:     time.Now().UTC().Format(time.RFC3339),
	}

	return statement, nil
}

// ExportMonthlyCSV writes the monthly statement as CSV to the given writer.
func (s *ReportService) ExportMonthlyCSV(
	ctx context.Context,
	enterpriseID, yearMonth string,
	w io.Writer,
) error {
	statement, err := s.GenerateMonthlyStatement(ctx, enterpriseID, yearMonth)
	if err != nil {
		return err
	}

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Header
	writer.Write([]string{"Field", "Value"})
	writer.Write([]string{"Enterprise ID", statement.EnterpriseID})
	writer.Write([]string{"Period", statement.YearMonth})
	writer.Write([]string{"Opening Balance (USDC)", statement.OpeningBalance})
	writer.Write([]string{"Total Deposits (USDC)", statement.TotalDeposits})
	writer.Write([]string{"Total Withdrawals (USDC)", statement.TotalWithdrawals})
	writer.Write([]string{"Yield Earned (USDC)", statement.YieldEarned})
	writer.Write([]string{"Fees Paid (USDC)", statement.FeesPaid})
	writer.Write([]string{"Closing Balance (USDC)", statement.ClosingBalance})
	writer.Write([]string{})
	writer.Write([]string{"Activity", "Count"})
	for action, count := range statement.ActivitySummary {
		writer.Write([]string{action, fmt.Sprintf("%d", count)})
	}
	writer.Write([]string{})
	writer.Write([]string{"Generated At", statement.GeneratedAt})

	return nil
}
