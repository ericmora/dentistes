package store

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
)

type WaitingListEntry struct {
	ID                       string     `json:"id"`
	PatientID                string     `json:"patient_id"`
	PatientName              string     `json:"patient_name"`
	PatientPhone             string     `json:"patient_phone"`
	DoctorID                 *string    `json:"doctor_id,omitempty"`
	DoctorName               *string    `json:"doctor_name,omitempty"`
	TreatmentType            string     `json:"treatment_type"`
	EstimatedDurationMinutes int        `json:"estimated_duration_minutes"`
	PreferredTimeSlot        string     `json:"preferred_time_slot"`
	PreferredDays            []int32    `json:"preferred_days"`
	UrgencyLevel             string     `json:"urgency_level"`
	Status                   string     `json:"status"`
	HoldExpiresAt            *time.Time `json:"hold_expires_at,omitempty"`
	Notes                    *string    `json:"notes,omitempty"`
	CreatedAt                time.Time  `json:"created_at"`
}

type WaitingCandidateMatch struct {
	Entry      WaitingListEntry `json:"entry"`
	MatchScore int              `json:"match_score"`
}

type NewWaitingListEntry struct {
	PatientID                string
	DoctorID                 *string
	TreatmentType            string
	EstimatedDurationMinutes int
	PreferredTimeSlot        string
	PreferredDays            []int32
	UrgencyLevel             string
	Notes                    string
}

func isoWeekday(t time.Time) int32 {
	wd := int32(t.Weekday())
	if wd == 0 {
		return 7
	}
	return wd
}

func ScoreWaitingCandidate(entry WaitingListEntry, slotStart, slotEnd time.Time, doctorID string) (int, bool) {
	slotMinutes := int(slotEnd.Sub(slotStart).Minutes())
	if slotMinutes <= 0 || entry.EstimatedDurationMinutes > slotMinutes {
		return 0, false
	}

	score := 40

	// Urgency priority
	switch entry.UrgencyLevel {
	case "URGENT":
		score += 30
	case "HIGH":
		score += 20
	case "NORMAL":
		score += 10
	case "LOW":
		score += 2
	}

	// Time slot match (MORNING < 14:00, AFTERNOON >= 14:00)
	hour := slotStart.Hour()
	switch entry.PreferredTimeSlot {
	case "ANY":
		score += 10
	case "MORNING":
		if hour < 14 {
			score += 15
		} else {
			score -= 10
		}
	case "AFTERNOON":
		if hour >= 14 {
			score += 15
		} else {
			score -= 10
		}
	}

	// Preferred day match
	wd := isoWeekday(slotStart)
	dayMatched := len(entry.PreferredDays) == 0
	for _, d := range entry.PreferredDays {
		if d == wd {
			dayMatched = true
			break
		}
	}
	if dayMatched {
		score += 10
	} else {
		score -= 10
	}

	// Doctor preference match
	if entry.DoctorID != nil && *entry.DoctorID != "" {
		if *entry.DoctorID == doctorID {
			score += 10
		} else {
			score -= 15
		}
	} else {
		score += 5
	}

	if score > 100 {
		score = 100
	}
	if score < 1 {
		score = 1
	}
	return score, true
}

const waitingSelect = `select w.id, w.patient_id, p.last_name || ', ' || p.first_name, p.phone,
		w.doctor_id, u.full_name, w.treatment_type, w.estimated_duration_minutes,
		w.preferred_time_slot, w.preferred_days, w.urgency_level, w.status,
		w.hold_expires_at, w.notes, w.created_at
	from waiting_list_entries w
	join patients p on p.id = w.patient_id
	left join users u on u.id = w.doctor_id`

func scanWaitingEntry(row pgx.Row) (*WaitingListEntry, error) {
	var e WaitingListEntry
	err := row.Scan(
		&e.ID, &e.PatientID, &e.PatientName, &e.PatientPhone,
		&e.DoctorID, &e.DoctorName, &e.TreatmentType, &e.EstimatedDurationMinutes,
		&e.PreferredTimeSlot, &e.PreferredDays, &e.UrgencyLevel, &e.Status,
		&e.HoldExpiresAt, &e.Notes, &e.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (s *Store) ListWaitingList(ctx context.Context, tx pgx.Tx, status string) ([]WaitingListEntry, error) {
	rows, err := tx.Query(ctx, waitingSelect+`
		where ($1 = '' or w.status = $1)
		order by case w.urgency_level
			when 'URGENT' then 1
			when 'HIGH' then 2
			when 'NORMAL' then 3
			else 4 end, w.created_at asc`, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []WaitingListEntry{}
	for rows.Next() {
		var e WaitingListEntry
		if err := rows.Scan(
			&e.ID, &e.PatientID, &e.PatientName, &e.PatientPhone,
			&e.DoctorID, &e.DoctorName, &e.TreatmentType, &e.EstimatedDurationMinutes,
			&e.PreferredTimeSlot, &e.PreferredDays, &e.UrgencyLevel, &e.Status,
			&e.HoldExpiresAt, &e.Notes, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Store) CreateWaitingListEntry(ctx context.Context, tx pgx.Tx, tenantID string, in NewWaitingListEntry) (*WaitingListEntry, error) {
	var id string
	err := tx.QueryRow(ctx, `insert into waiting_list_entries
			(tenant_id, patient_id, doctor_id, treatment_type, estimated_duration_minutes, preferred_time_slot, preferred_days, urgency_level, notes)
		values ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, nullif($9, ''))
		returning id`,
		tenantID, in.PatientID, in.DoctorID, in.TreatmentType, in.EstimatedDurationMinutes,
		in.PreferredTimeSlot, in.PreferredDays, in.UrgencyLevel, in.Notes).
		Scan(&id)
	if err != nil {
		return nil, err
	}
	return scanWaitingEntry(tx.QueryRow(ctx, waitingSelect+" where w.id = $1", id))
}

func (s *Store) FindMatchingWaitingCandidates(ctx context.Context, tx pgx.Tx, slotStart, slotEnd time.Time, doctorID string, limit int) ([]WaitingCandidateMatch, error) {
	// Expire stale holds first
	_, _ = tx.Exec(ctx, `update waiting_list_entries
		set status = 'WAITING', hold_expires_at = null
		where status = 'OFFERED' and hold_expires_at is not null and hold_expires_at < now()`)

	waiting, err := s.ListWaitingList(ctx, tx, "WAITING")
	if err != nil {
		return nil, err
	}
	matches := make([]WaitingCandidateMatch, 0, len(waiting))
	for _, entry := range waiting {
		if score, ok := ScoreWaitingCandidate(entry, slotStart, slotEnd, doctorID); ok {
			matches = append(matches, WaitingCandidateMatch{Entry: entry, MatchScore: score})
		}
	}
	sort.Slice(matches, func(i, j int) bool {
		if matches[i].MatchScore != matches[j].MatchScore {
			return matches[i].MatchScore > matches[j].MatchScore
		}
		return matches[i].Entry.CreatedAt.Before(matches[j].Entry.CreatedAt)
	})
	if limit > 0 && len(matches) > limit {
		matches = matches[:limit]
	}
	return matches, nil
}

func (s *Store) HoldWaitingListEntry(ctx context.Context, tx pgx.Tx, id string, minutes int) (*WaitingListEntry, error) {
	if minutes <= 0 {
		minutes = 15
	}
	holdUntil := time.Now().Add(time.Duration(minutes) * time.Minute)
	tag, err := tx.Exec(ctx, `update waiting_list_entries
		set status = 'OFFERED', hold_expires_at = $2
		where id = $1 and (status = 'WAITING' or (status = 'OFFERED' and hold_expires_at < now()))`,
		id, holdUntil)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrConflictState
	}
	return scanWaitingEntry(tx.QueryRow(ctx, waitingSelect+" where w.id = $1", id))
}

var ErrConflictState = errors.New("waiting list entry already offered or closed")

func (s *Store) UpdateWaitingListStatus(ctx context.Context, tx pgx.Tx, id, status string) (*WaitingListEntry, error) {
	tag, err := tx.Exec(ctx, `update waiting_list_entries
		set status = $2,
			hold_expires_at = case when $2 = 'OFFERED' then hold_expires_at else null end
		where id = $1`, id, status)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return scanWaitingEntry(tx.QueryRow(ctx, waitingSelect+" where w.id = $1", id))
}
