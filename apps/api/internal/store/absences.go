package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type StaffAbsence struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"user_id"`
	UserName             string    `json:"user_name,omitempty"`
	UserRole             string    `json:"user_role,omitempty"`
	AbsenceType          string    `json:"absence_type"` // VACATION, SICK_LEAVE, PERSONAL
	StartDate            string    `json:"start_date"`   // YYYY-MM-DD
	EndDate              string    `json:"end_date"`     // YYYY-MM-DD
	Status               string    `json:"status"`       // PENDING, APPROVED, REJECTED
	AutoRescheduledCount int       `json:"auto_rescheduled_count"`
	Notes                string    `json:"notes,omitempty"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func ValidateAbsenceRange(startDate, endDate string) (bool, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return false, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return false, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
	}
	if end.Before(start) {
		return false, errors.New("end_date must be on or after start_date")
	}
	return true, nil
}

func IsUserAbsentOnDate(absences []StaffAbsence, userID, dateStr string) bool {
	if len(absences) == 0 || userID == "" || dateStr == "" {
		return false
	}
	for _, a := range absences {
		if a.UserID == userID && a.Status == "APPROVED" {
			if dateStr >= a.StartDate && dateStr <= a.EndDate {
				return true
			}
		}
	}
	return false
}

func ShouldRescheduleAppointmentsForRole(role string) bool {
	norm := strings.ToUpper(strings.TrimSpace(role))
	switch norm {
	case "DENTIST", "HYGIENIST", "OWNER", "ADMIN":
		return true
	default:
		return false
	}
}

const absenceSelect = `select a.id, a.user_id, coalesce(u.full_name, ''), coalesce(m.role, ''),
		a.absence_type, a.start_date::text, a.end_date::text, a.status,
		a.auto_rescheduled_count, coalesce(a.notes, ''), a.created_at, a.updated_at
	from staff_absences a
	join users u on u.id = a.user_id
	left join memberships m on m.user_id = u.id and m.tenant_id = a.tenant_id`

func scanStaffAbsence(row pgx.Row) (*StaffAbsence, error) {
	var a StaffAbsence
	err := row.Scan(
		&a.ID, &a.UserID, &a.UserName, &a.UserRole,
		&a.AbsenceType, &a.StartDate, &a.EndDate, &a.Status,
		&a.AutoRescheduledCount, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Store) ListStaffAbsences(ctx context.Context, tx pgx.Tx, tenantID, status, userID, startDate, endDate string) ([]StaffAbsence, error) {
	query := absenceSelect + ` where a.tenant_id = $1`
	args := []any{tenantID}

	if status != "" {
		args = append(args, status)
		query += fmt.Sprintf(" and a.status = $%d", len(args))
	}
	if userID != "" {
		args = append(args, userID)
		query += fmt.Sprintf(" and a.user_id = $%d::uuid", len(args))
	}
	if startDate != "" {
		args = append(args, startDate)
		query += fmt.Sprintf(" and a.end_date >= $%d::date", len(args))
	}
	if endDate != "" {
		args = append(args, endDate)
		query += fmt.Sprintf(" and a.start_date <= $%d::date", len(args))
	}

	query += ` order by a.start_date desc, a.created_at desc`

	rows, err := tx.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []StaffAbsence{}
	for rows.Next() {
		var a StaffAbsence
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.UserName, &a.UserRole,
			&a.AbsenceType, &a.StartDate, &a.EndDate, &a.Status,
			&a.AutoRescheduledCount, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) GetStaffAbsenceByID(ctx context.Context, tx pgx.Tx, id string) (*StaffAbsence, error) {
	return scanStaffAbsence(tx.QueryRow(ctx, absenceSelect+` where a.id = $1`, id))
}

func (s *Store) CreateStaffAbsence(ctx context.Context, tx pgx.Tx, tenantID, userID, absenceType, startDate, endDate, notes string, autoApprove bool) (*StaffAbsence, error) {
	if _, err := ValidateAbsenceRange(startDate, endDate); err != nil {
		return nil, err
	}
	absenceType = strings.ToUpper(strings.TrimSpace(absenceType))
	if absenceType != "VACATION" && absenceType != "SICK_LEAVE" && absenceType != "PERSONAL" {
		return nil, errors.New("invalid absence_type (must be VACATION, SICK_LEAVE, or PERSONAL)")
	}

	status := "PENDING"
	if autoApprove {
		status = "APPROVED"
	}

	var id string
	err := tx.QueryRow(ctx, `insert into staff_absences (tenant_id, user_id, absence_type, start_date, end_date, status, notes)
		values ($1, $2::uuid, $3, $4::date, $5::date, $6, nullif($7, ''))
		returning id`, tenantID, userID, absenceType, startDate, endDate, status, strings.TrimSpace(notes)).Scan(&id)
	if err != nil {
		return nil, err
	}

	rescheduled := 0
	if status == "APPROVED" {
		// Look up user role to check if appointment rescheduling is needed
		var role string
		_ = tx.QueryRow(ctx, `select coalesce(role, '') from memberships where user_id = $1::uuid and tenant_id = $2::uuid`, userID, tenantID).Scan(&role)
		if ShouldRescheduleAppointmentsForRole(role) {
			rescheduled, _ = s.AutoRescheduleDoctorAppointments(ctx, tx, tenantID, userID, startDate, endDate)
			if rescheduled > 0 {
				_, _ = tx.Exec(ctx, `update staff_absences set auto_rescheduled_count = $2 where id = $1`, id, rescheduled)
			}
		}
	}

	return s.GetStaffAbsenceByID(ctx, tx, id)
}

func (s *Store) UpdateStaffAbsenceStatus(ctx context.Context, tx pgx.Tx, tenantID, id, newStatus string) (*StaffAbsence, error) {
	newStatus = strings.ToUpper(strings.TrimSpace(newStatus))
	if newStatus != "APPROVED" && newStatus != "REJECTED" && newStatus != "PENDING" {
		return nil, errors.New("invalid status (must be APPROVED, REJECTED, or PENDING)")
	}

	current, err := s.GetStaffAbsenceByID(ctx, tx, id)
	if err != nil {
		return nil, err
	}

	rescheduled := 0
	if newStatus == "APPROVED" && current.Status != "APPROVED" {
		if ShouldRescheduleAppointmentsForRole(current.UserRole) {
			rescheduled, _ = s.AutoRescheduleDoctorAppointments(ctx, tx, tenantID, current.UserID, current.StartDate, current.EndDate)
		}
	}

	_, err = tx.Exec(ctx, `update staff_absences
		set status = $2, auto_rescheduled_count = $3, updated_at = now()
		where id = $1`, id, newStatus, rescheduled)
	if err != nil {
		return nil, err
	}

	return s.GetStaffAbsenceByID(ctx, tx, id)
}

func (s *Store) AutoRescheduleDoctorAppointments(ctx context.Context, tx pgx.Tx, tenantID, doctorID, startDate, endDate string) (int, error) {
	// Parse range
	startRange, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return 0, err
	}
	endRange, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return 0, err
	}
	// Add 23:59:59 to endRange
	endRange = endRange.Add(24*time.Hour - time.Second)

	// Query doctor appointments in that date range
	rows, err := tx.Query(ctx, `select id, start_time, end_time, duration_minutes from (
		select id, start_time, end_time, extract(epoch from (end_time - start_time))/60 as duration_minutes
		from appointments
		where tenant_id = $1
		  and doctor_id = $2::uuid
		  and status not in ('CANCELLED', 'COMPLETED')
		  and start_time >= $3 and start_time <= $4
		order by start_time
	) sub`, tenantID, doctorID, startRange, endRange)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	type apptItem struct {
		id       string
		start    time.Time
		end      time.Time
		duration int
	}
	affected := []apptItem{}
	for rows.Next() {
		var a apptItem
		var dur float64
		if err := rows.Scan(&a.id, &a.start, &a.end, &dur); err != nil {
			return 0, err
		}
		a.duration = int(dur)
		if a.duration <= 0 {
			a.duration = 30
		}
		affected = append(affected, a)
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}

	if len(affected) == 0 {
		return 0, nil
	}

	// Reschedule to subsequent days after endDate
	dayAfter := endRange.Add(1 * time.Second)
	rescheduledCount := 0

	for i, appt := range affected {
		// Offset by business days after endDate: each gets a safe future slot
		targetDay := dayAfter.AddDate(0, 0, 1+(i/8))
		// Keep same time of day if possible, or shift
		newStart := time.Date(targetDay.Year(), targetDay.Month(), targetDay.Day(), appt.start.Hour(), appt.start.Minute(), 0, 0, time.UTC)
		newEnd := newStart.Add(time.Duration(appt.duration) * time.Minute)

		_, updateErr := tx.Exec(ctx, `update appointments
			set start_time = $2, end_time = $3,
			    notes = coalesce(notes || ' ', '') || '[Reagendada por ausencia de doctor]',
			    updated_at = now()
			where id = $1`, appt.id, newStart, newEnd)
		if updateErr == nil {
			rescheduledCount++
		}
	}

	return rescheduledCount, nil
}
