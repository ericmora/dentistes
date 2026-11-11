package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/db"
	"github.com/ericmora/dentistes/apps/api/internal/httpapi"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
	"github.com/ericmora/dentistes/apps/api/internal/stripejobs"
)

func main() {
	_ = godotenv.Load()
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration error", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	command := "serve"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	switch command {
	case "migrate":
		if err := runMigrations(ctx, cfg.MigrationDatabaseURL); err != nil {
			slog.Error("migration failed", "error", err)
			os.Exit(1)
		}
		slog.Info("migrations applied")
		return
	case "serve", "stripe-sync":
		if err := runMigrations(ctx, cfg.MigrationDatabaseURL); err != nil {
			slog.Error("migration failed", "error", err)
			os.Exit(1)
		}
	default:
		slog.Error("unknown command", "command", command)
		os.Exit(1)
	}

	database, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	if command == "stripe-sync" {
		dryRun := false
		for _, arg := range os.Args[2:] {
			if arg == "--dry-run" {
				dryRun = true
			}
		}
		client := stripeapi.New(cfg.StripeSecretKey)
		if !dryRun && !client.Enabled() {
			slog.Error("STRIPE_SECRET_KEY is required (or use --dry-run)")
			os.Exit(1)
		}
		if err := stripejobs.SyncPlans(ctx, database, client, dryRun, os.Stdout); err != nil {
			slog.Error("stripe plan sync failed", "error", err)
			os.Exit(1)
		}
		return
	}

	if err := bootstrapAdmin(ctx, cfg, database); err != nil {
		slog.Error("bootstrap admin failed", "error", err)
		os.Exit(1)
	}

	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTTL)
	handler := httpapi.New(cfg, database, tokens).Router()

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       90 * time.Second,
	}

	go func() {
		slog.Info("api listening", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("http server failed", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}
}

func runMigrations(ctx context.Context, url string) error {
	mdb, err := db.Open(ctx, url)
	if err != nil {
		return err
	}
	defer mdb.Close()
	return db.Migrate(ctx, mdb)
}

func bootstrapAdmin(ctx context.Context, cfg *config.Config, database *db.DB) error {
	if cfg.BootstrapAdminEmail == "" || cfg.BootstrapAdminPassword == "" {
		return nil
	}
	return database.WithTx(ctx, func(tx pgx.Tx) error {
		s := store.New()
		count, err := s.CountPlatformAdmins(ctx, tx)
		if err != nil {
			return err
		}
		if count > 0 {
			return nil
		}
		hash, err := auth.HashPassword(cfg.BootstrapAdminPassword)
		if err != nil {
			return err
		}
		if err := s.EnsurePlatformAdmin(ctx, tx, cfg.BootstrapAdminEmail, hash, "Platform Admin"); err != nil {
			return err
		}
		slog.Info("platform admin bootstrapped", "email", cfg.BootstrapAdminEmail)
		return nil
	})
}
