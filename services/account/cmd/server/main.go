package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/yieldnest/account-service/internal/config"
	"github.com/yieldnest/account-service/internal/db"
	"github.com/yieldnest/account-service/internal/handler"
	"github.com/yieldnest/account-service/internal/middleware"
	"github.com/yieldnest/account-service/internal/repository"
	"github.com/yieldnest/account-service/internal/service"
)

func main() {
	cfg := config.Load()

	// Connect to database
	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	_ = pool

	// Initialize repositories
	enterpriseRepo := repository.NewEnterpriseRepo()
	userRepo := repository.NewUserRepo()
	accountRepo := repository.NewAccountRepo()
	whitelistRepo := repository.NewWhitelistRepo()
	auditLogRepo := repository.NewAuditLogRepo()
	approvalPolicyRepo := repository.NewApprovalPolicyRepo()
	approvalRepo := repository.NewApprovalRepo()

	// Initialize services
	enterpriseSvc := service.NewEnterpriseService(enterpriseRepo, auditLogRepo)
	memberSvc := service.NewMemberService(userRepo, auditLogRepo)
	approvalPolicySvc := service.NewApprovalPolicyService(approvalPolicyRepo, auditLogRepo)
	notificationSvc := service.NewNotificationService()
	approvalSvc := service.NewApprovalService(approvalRepo, approvalPolicySvc, auditLogRepo, notificationSvc)
	webhookSvc := service.NewWebhookService()

	// Initialize handlers
	enterpriseH := handler.NewEnterpriseHandler(enterpriseSvc)
	memberH := handler.NewMemberHandler(memberSvc)
	accountH := handler.NewAccountHandler(accountRepo, whitelistRepo)
	approvalH := handler.NewApprovalHandler(approvalSvc)
	approvalPolicyH := handler.NewApprovalPolicyHandler(approvalPolicySvc)
	reportSvc := service.NewReportService(auditLogRepo)
	reportH := handler.NewReportHandler(reportSvc, auditLogRepo)
	apiKeyH := handler.NewApiKeyHandler()
	webhookH := handler.NewWebhookHandler(webhookSvc)
	erpH := handler.NewERPHandler()

	// Build router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)
	r.Use(middleware.Recovery)
	r.Use(middleware.CORS)

	// Health check (public)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"account-service"}`))
	})

	// API v1 — protected routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.AuthRequired)

		r.Mount("/enterprises", enterpriseH.Routes())
		r.Route("/enterprises/{id}", func(r chi.Router) {
			r.Mount("/members", memberH.Routes())
			r.Mount("/approvals", approvalH.Routes())
			r.Mount("/policies", approvalPolicyH.Routes())
			r.Mount("/reports", reportH.Routes())
			r.Mount("/api-keys", apiKeyH.Routes())
			r.Mount("/webhooks", webhookH.Routes())
		})
		r.Mount("/accounts", accountH.Routes())
		r.Route("/enterprises/{id}", func(r chi.Router) {
			r.Mount("/erp", erpH.Routes())
		})
	})

	// API v1 — ERP endpoints (API key auth, no enterprise URL param)
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.APIKeyOrJWTAuth)
		r.Mount("/erp", erpH.Routes())
	})

	// Background: expire stale approvals every 60 seconds
	go func() {
		for {
			time.Sleep(60 * time.Second)
			expired, err := approvalSvc.CheckTimeout(context.Background())
			if err != nil {
				log.Printf("Approval timeout check error: %v", err)
			} else if expired > 0 {
				log.Printf("Expired %d stale approvals", expired)
			}
		}
	}()

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Account Service starting on %s", addr)

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Println("Shutting down...")
		srv.Close()
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}
