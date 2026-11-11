package stripejobs

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/db"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

func SyncPlans(ctx context.Context, database *db.DB, client *stripeapi.Client, dryRun bool, out io.Writer) error {
	s := store.New()
	var plans []store.Plan
	if err := database.WithTx(ctx, func(tx pgx.Tx) error {
		var err error
		plans, err = s.ListPlans(ctx, tx, false)
		return err
	}); err != nil {
		return err
	}
	if len(plans) == 0 {
		return fmt.Errorf("no hay planes en la base de datos")
	}

	for _, plan := range plans {
		if dryRun {
			fmt.Fprintf(out, "plan %-12s %7d %s/mes  product=%s price=%s\n", plan.Key, plan.PriceMonthlyCents, plan.Currency, orDash(plan.StripeProductID), orDash(plan.StripePriceID))
			continue
		}

		updateIDs := func(productID, priceID string) error {
			return database.WithTx(ctx, func(tx pgx.Tx) error {
				return s.UpdatePlanStripeIDs(ctx, tx, plan.Key, productID, priceID)
			})
		}

		productID := plan.StripeProductID
		if productID == "" {
			id, err := client.CreateProduct(ctx, "Dentistes "+plan.Name, plan.Description, plan.Key, plan.IsActive)
			if err != nil {
				return fmt.Errorf("create product %s: %w", plan.Key, err)
			}
			productID = id
			if err := updateIDs(productID, plan.StripePriceID); err != nil {
				return err
			}
		} else if err := client.UpdateProduct(ctx, productID, "Dentistes "+plan.Name, plan.Description, plan.IsActive); err != nil {
			return fmt.Errorf("update product %s: %w", plan.Key, err)
		}

		priceID := plan.StripePriceID
		needsPrice := priceID == ""
		if !needsPrice {
			current, err := client.GetPrice(ctx, priceID)
			if err != nil || !current.Active || current.UnitAmount != int64(plan.PriceMonthlyCents) ||
				!strings.EqualFold(current.Currency, plan.Currency) || current.Product != productID ||
				current.Recurring == nil || current.Recurring.Interval != "month" {
				needsPrice = true
			}
		}
		if needsPrice {
			newPrice, err := client.CreatePrice(ctx, productID, strings.ToLower(plan.Currency), plan.Key, int64(plan.PriceMonthlyCents))
			if err != nil {
				return fmt.Errorf("create price %s: %w", plan.Key, err)
			}
			if priceID != "" {
				if err := client.DeactivatePrice(ctx, priceID); err != nil {
					fmt.Fprintf(out, "aviso: no se pudo desactivar el price antiguo %s: %v\n", priceID, err)
				}
			}
			priceID = newPrice
		}
		if err := updateIDs(productID, priceID); err != nil {
			return err
		}
		fmt.Fprintf(out, "plan %-12s product=%s price=%s (%d %s/mes)\n", plan.Key, productID, priceID, plan.PriceMonthlyCents, plan.Currency)
	}
	return nil
}

func orDash(value string) string {
	if value == "" {
		return "-"
	}
	return value
}
