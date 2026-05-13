package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

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

	// Initialize services
	enterpriseSvc := service.NewEnterpriseService(enterpriseRepo, auditLogRepo)
	memberSvc := service.NewMemberService(userRepo, auditLogRepo)

	// Initialize handlers
	enterpriseH := handler.NewEnterpriseHandler(enterpriseSvc)
	memberH := handler.NewMemberHandler(memberSvc)
	accountH := handler.NewAccountHandler(accountRepo, whitelistRepo)

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
		})
		r.Mount("/accounts", accountH.Routes())
	})

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
