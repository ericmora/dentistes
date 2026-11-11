package provisioner

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/db"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

type IngressEnsurer interface {
	EnsureTenantIngress(ctx context.Context, hostname, tlsSecret, service string, port int, issuer string) error
}

type Worker struct {
	db        *db.DB
	store     *store.Store
	ingresses IngressEnsurer
	cfg       *config.Config
	logger    *slog.Logger
}

func New(database *db.DB, ingresses IngressEnsurer, cfg *config.Config) *Worker {
	return &Worker{db: database, store: store.New(), ingresses: ingresses, cfg: cfg, logger: slog.Default()}
}

func (w *Worker) Run(ctx context.Context) {
	if err := w.RunOnce(ctx); err != nil {
		w.logger.Error("tenant provisioning pass failed", "error", err)
	}
	ticker := time.NewTicker(w.cfg.ProvisionInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := w.RunOnce(ctx); err != nil {
				w.logger.Error("tenant provisioning pass failed", "error", err)
			}
		}
	}
}

func (w *Worker) RunOnce(ctx context.Context) error {
	var domains []store.TenantDomain
	err := w.db.WithTx(ctx, func(tx pgx.Tx) error {
		var err error
		domains, err = w.store.ClaimPendingTenantDomains(ctx, tx, 10)
		return err
	})
	if err != nil {
		return err
	}
	for _, domain := range domains {
		ensureErr := w.ingresses.EnsureTenantIngress(ctx, domain.Hostname, domain.TLSSecretName, w.cfg.WebServiceName, w.cfg.WebServicePort, w.cfg.TLSIssuer)
		if ensureErr != nil {
			w.logger.Error("tenant ingress failed", "hostname", domain.Hostname, "attempt", domain.Attempts, "error", ensureErr)
			if err := w.db.WithTx(ctx, func(tx pgx.Tx) error {
				return w.store.MarkTenantDomainFailed(ctx, tx, domain.ID, ensureErr.Error())
			}); err != nil {
				return err
			}
			continue
		}
		if err := w.db.WithTx(ctx, func(tx pgx.Tx) error {
			return w.store.MarkTenantDomainReady(ctx, tx, domain.ID)
		}); err != nil {
			return err
		}
		w.logger.Info("tenant ingress ready", "hostname", domain.Hostname, "tls_secret", domain.TLSSecretName)
	}
	return nil
}
