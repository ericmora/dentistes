package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

var ErrOverlap = errors.New("appointment overlap")

type CabinetDayAvailability struct {
	DayOfWeek  int    `json:"day_of_week"` // 1 = Monday .. 7 = Sunday
	DayName    string `json:"day_name,omitempty"`
	IsOpen     bool   `json:"is_open"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	BreakStart string `json:"break_start,omitempty"`
	BreakEnd   string `json:"break_end,omitempty"`
}

func DefaultCabinetAvailability() []CabinetDayAvailability {
	days := []struct {
		d int
		n string
	}{
		{1, "Lunes"},
		{2, "Martes"},
		{3, "Miércoles"},
		{4, "Jueves"},
		{5, "Viernes"},
		{6, "Sábado"},
		{7, "Domingo"},
	}
	out := make([]CabinetDayAvailability, 7)
	for i, day := range days {
		isOpen := day.d <= 5
		startTime := "09:00"
		endTime := "20:00"
		breakStart := "14:00"
		breakEnd := "15:00"
		if day.d == 6 {
			isOpen = true
			startTime = "09:00"
			endTime = "14:00"
			breakStart = ""
			breakEnd = ""
		} else if day.d == 7 {
			isOpen = false
			startTime = "09:00"
			endTime = "14:00"
			breakStart = ""
			breakEnd = ""
		}
		out[i] = CabinetDayAvailability{
			DayOfWeek:  day.d,
			DayName:    day.n,
			IsOpen:     isOpen,
			StartTime:  startTime,
			EndTime:    endTime,
			BreakStart: breakStart,
			BreakEnd:   breakEnd,
		}
	}
	return out
}

type Cabinet struct {
	ID           string                   `json:"id"`
	Name         string                   `json:"name"`
	ColorCode    string                   `json:"color_code"`
	IsActive     bool                     `json:"is_active"`
	Availability []CabinetDayAvailability `json:"availability"`
	CreatedAt    time.Time                `json:"created_at"`
}

type Doctor struct {
	ID       string `json:"id"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type Appointment struct {
	ID                 string    `json:"id"`
	PatientID          string    `json:"patient_id"`
	PatientName        string    `json:"patient_name"`
	PatientHighRisk    bool      `json:"patient_high_risk"`
	DoctorID           string    `json:"doctor_id"`
	DoctorName         string    `json:"doctor_name"`
	CabinetID          string    `json:"cabinet_id"`
	CabinetName        string    `json:"cabinet_name"`
	StartTime          time.Time `json:"start_time"`
	EndTime            time.Time `json:"end_time"`
	TreatmentType      string    `json:"treatment_type"`
	Status             string    `json:"status"`
	CancellationReason *string   `json:"cancellation_reason,omitempty"`
	IsForced           bool      `json:"is_forced"`
	Notes              *string   `json:"notes,omitempty"`
	Version            int       `json:"version"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type UpsertAppointmentInput struct {
	PatientID     string
	DoctorID      string
	CabinetID     string
	StartTime     time.Time
	EndTime       time.Time
	TreatmentType string
	Status        string
	IsForced      bool
	Notes         string
}

func (s *Store) ListCabinets(ctx context.Context, tx pgx.Tx) ([]Cabinet, error) {
	rows, err := tx.Query(ctx, `select id, name, coalesce(color_code, '#0D9488'), is_active, coalesce(availability, '[]'::jsonb), created_at
		from cabinets where is_active = true order by created_at, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Cabinet{}
	for rows.Next() {
		var c Cabinet
		var availBytes []byte
		if err := rows.Scan(&c.ID, &c.Name, &c.ColorCode, &c.IsActive, &availBytes, &c.CreatedAt); err != nil {
			return nil, err
		}
		if len(availBytes) > 0 {
			_ = json.Unmarshal(availBytes, &c.Availability)
		}
		if len(c.Availability) == 0 {
			c.Availability = DefaultCabinetAvailability()
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateCabinet(ctx context.Context, tx pgx.Tx, tenantID, name, colorCode string, availability []CabinetDayAvailability) (*Cabinet, error) {
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if len(availability) == 0 {
		availability = DefaultCabinetAvailability()
	}
	availBytes, err := json.Marshal(availability)
	if err != nil {
		return nil, err
	}
	var c Cabinet
	var rawAvail []byte
	err = tx.QueryRow(ctx, `insert into cabinets (tenant_id, name, color_code, availability)
		values ($1, $2, $3, $4::jsonb)
		returning id, name, color_code, is_active, availability, created_at`,
		tenantID, name, colorCode, availBytes).
		Scan(&c.ID, &c.Name, &c.ColorCode, &c.IsActive, &rawAvail, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	if len(rawAvail) > 0 {
		_ = json.Unmarshal(rawAvail, &c.Availability)
	} else {
		c.Availability = availability
	}
	return &c, nil
}

func (s *Store) UpdateCabinet(ctx context.Context, tx pgx.Tx, tenantID, cabinetID, name, colorCode string, availability []CabinetDayAvailability) (*Cabinet, error) {
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if len(availability) == 0 {
		availability = DefaultCabinetAvailability()
	}
	availBytes, err := json.Marshal(availability)
	if err != nil {
		return nil, err
	}
	var c Cabinet
	var rawAvail []byte
	err = tx.QueryRow(ctx, `update cabinets
		set name = coalesce(nullif($3, ''), name),
			color_code = coalesce(nullif($4, ''), color_code),
			availability = $5::jsonb
		where id = $1::uuid and tenant_id = $2::uuid and is_active = true
		returning id, name, color_code, is_active, availability, created_at`,
		cabinetID, tenantID, name, colorCode, availBytes).
		Scan(&c.ID, &c.Name, &c.ColorCode, &c.IsActive, &rawAvail, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if len(rawAvail) > 0 {
		_ = json.Unmarshal(rawAvail, &c.Availability)
	} else {
		c.Availability = availability
	}
	return &c, nil
}

func (s *Store) DeleteCabinet(ctx context.Context, tx pgx.Tx, tenantID, cabinetID string) error {
	cmd, err := tx.Exec(ctx, `update cabinets set is_active = false where id = $1 and tenant_id = $2`, cabinetID, tenantID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListDoctors(ctx context.Context, tx pgx.Tx) ([]Doctor, error) {
	rows, err := tx.Query(ctx, `select u.id, u.full_name, m.role
		from memberships m
		join users u on u.id = m.user_id
		where m.is_active = true and u.is_active = true
		  and m.role in ('OWNER', 'ADMIN', 'DENTIST', 'HYGIENIST')
		order by u.full_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Doctor{}
	for rows.Next() {
		var d Doctor
		if err := rows.Scan(&d.ID, &d.FullName, &d.Role); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

const appointmentSelect = `select a.id, a.patient_id, p.last_name || ', ' || p.first_name,
		coalesce((p.medical_alerts->>'high_risk')::boolean, false),
		a.doctor_id, u.full_name, a.cabinet_id, c.name,
		a.start_time, a.end_time, a.treatment_type, a.status, a.cancellation_reason,
		coalesce(a.is_forced, false), a.notes,
		a.version, a.created_at, a.updated_at
	from appointments a
	join patients p on p.id = a.patient_id
	join users u on u.id = a.doctor_id
	join cabinets c on c.id = a.cabinet_id`

func scanAppointment(row pgx.Row) (*Appointment, error) {
	var a Appointment
	err := row.Scan(
		&a.ID, &a.PatientID, &a.PatientName, &a.PatientHighRisk,
		&a.DoctorID, &a.DoctorName, &a.CabinetID, &a.CabinetName,
		&a.StartTime, &a.EndTime, &a.TreatmentType, &a.Status, &a.CancellationReason,
		&a.IsForced, &a.Notes,
		&a.Version, &a.CreatedAt, &a.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Store) ListAppointments(ctx context.Context, tx pgx.Tx, start, end time.Time, cabinetID, doctorID string) ([]Appointment, error) {
	rows, err := tx.Query(ctx, appointmentSelect+`
		where a.start_time < $2 and a.end_time > $1
		  and ($3 = '' or a.cabinet_id::text = $3)
		  and ($4 = '' or a.doctor_id::text = $4)
		order by a.start_time`,
		start, end, cabinetID, doctorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Appointment{}
	for rows.Next() {
		var a Appointment
		if err := rows.Scan(
			&a.ID, &a.PatientID, &a.PatientName, &a.PatientHighRisk,
			&a.DoctorID, &a.DoctorName, &a.CabinetID, &a.CabinetName,
			&a.StartTime, &a.EndTime, &a.TreatmentType, &a.Status, &a.CancellationReason,
			&a.IsForced, &a.Notes,
			&a.Version, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) GetAppointmentByID(ctx context.Context, tx pgx.Tx, id string) (*Appointment, error) {
	return scanAppointment(tx.QueryRow(ctx, appointmentSelect+" where a.id = $1", id))
}

func (s *Store) hasAppointmentOverlap(ctx context.Context, tx pgx.Tx, cabinetID string, start, end time.Time, excludeID string) (bool, error) {
	var exists bool
	err := tx.QueryRow(ctx, `select exists(
		select 1 from appointments
		where cabinet_id = $1::uuid
		  and status <> 'CANCELLED'
		  and start_time < $3 and end_time > $2
		  and ($4 = '' or id::text <> $4)
	)`, cabinetID, start, end, excludeID).Scan(&exists)
	return exists, err
}

func (s *Store) CreateAppointment(ctx context.Context, tx pgx.Tx, tenantID string, in UpsertAppointmentInput) (*Appointment, error) {
	if !in.IsForced {
		overlap, err := s.hasAppointmentOverlap(ctx, tx, in.CabinetID, in.StartTime, in.EndTime, "")
		if err != nil {
			return nil, err
		}
		if overlap {
			return nil, ErrOverlap
		}
	}
	status := in.Status
	if status == "" {
		status = "SCHEDULED"
	}
	var id string
	err := tx.QueryRow(ctx, `insert into appointments
			(tenant_id, patient_id, doctor_id, cabinet_id, start_time, end_time, treatment_type, status, is_forced, notes)
		values ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, nullif($10, ''))
		returning id`,
		tenantID, in.PatientID, in.DoctorID, in.CabinetID, in.StartTime, in.EndTime, in.TreatmentType, status, in.IsForced, in.Notes).
		Scan(&id)
	if err != nil {
		return nil, err
	}
	return s.GetAppointmentByID(ctx, tx, id)
}

func (s *Store) UpdateAppointment(ctx context.Context, tx pgx.Tx, id string, in UpsertAppointmentInput, expectedVersion *int) (*Appointment, error) {
	var currentVersion int
	err := tx.QueryRow(ctx, `select version from appointments where id = $1`, id).Scan(&currentVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if expectedVersion != nil && *expectedVersion != currentVersion {
		return nil, ErrVersionConflict
	}

	if !in.IsForced {
		overlap, err := s.hasAppointmentOverlap(ctx, tx, in.CabinetID, in.StartTime, in.EndTime, id)
		if err != nil {
			return nil, err
		}
		if overlap {
			return nil, ErrOverlap
		}
	}

	_, err = tx.Exec(ctx, `update appointments
		set doctor_id = $2::uuid,
			cabinet_id = $3::uuid,
			start_time = $4,
			end_time = $5,
			treatment_type = $6,
			is_forced = $7,
			notes = nullif($8, ''),
			version = version + 1
		where id = $1`,
		id, in.DoctorID, in.CabinetID, in.StartTime, in.EndTime, in.TreatmentType, in.IsForced, in.Notes)
	if err != nil {
		return nil, err
	}
	return s.GetAppointmentByID(ctx, tx, id)
}

func (s *Store) UpdateAppointmentStatus(ctx context.Context, tx pgx.Tx, id, status, reason string) (*Appointment, error) {
	tag, err := tx.Exec(ctx, `update appointments
		set status = $2,
			cancellation_reason = nullif($3, ''),
			version = version + 1
		where id = $1`,
		id, status, reason)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.GetAppointmentByID(ctx, tx, id)
}

type AvailableSlotSearchFilter struct {
	CabinetID       string
	DurationMinutes int
	Shift           string // "morning", "afternoon", "all"
	StartDate       time.Time
	Days            int
	Limit           int
}

type AvailableSlot struct {
	CabinetID       string `json:"cabinet_id"`
	CabinetName     string `json:"cabinet_name"`
	CabinetColor    string `json:"cabinet_color"`
	Date            string `json:"date"`
	StartTime       string `json:"start_time"`
	EndTime         string `json:"end_time"`
	DurationMinutes int    `json:"duration_minutes"`
	Shift           string `json:"shift"`
	FormattedDate   string `json:"formatted_date"`
}

var spanishDayNames = map[time.Weekday]string{
	time.Monday:    "Lunes",
	time.Tuesday:   "Martes",
	time.Wednesday: "Miércoles",
	time.Thursday:  "Jueves",
	time.Friday:    "Viernes",
	time.Saturday:  "Sábado",
	time.Sunday:    "Domingo",
}

var spanishMonthNames = map[time.Month]string{
	time.January:   "enero",
	time.February:  "febrero",
	time.March:     "marzo",
	time.April:     "abril",
	time.May:       "mayo",
	time.June:      "junio",
	time.July:      "julio",
	time.August:    "agosto",
	time.September: "septiembre",
	time.October:   "octubre",
	time.November:  "noviembre",
	time.December:  "diciembre",
}

func parseHHMMToMinutes(hhmm string) int {
	parts := strings.Split(strings.TrimSpace(hhmm), ":")
	if len(parts) != 2 {
		return 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h*60 + m
}

func formatMinutesToHHMM(minutes int) string {
	h := minutes / 60
	m := minutes % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

func formatSpanishDate(t time.Time) string {
	dayName := spanishDayNames[t.Weekday()]
	monthName := spanishMonthNames[t.Month()]
	return fmt.Sprintf("%s, %d de %s", dayName, t.Day(), monthName)
}

type timeInterval struct {
	start int
	end   int
}

func CalculateAvailableSlots(cabinets []Cabinet, appointments []Appointment, filter AvailableSlotSearchFilter) []AvailableSlot {
	if filter.DurationMinutes <= 0 {
		filter.DurationMinutes = 30
	}
	if filter.Days <= 0 {
		filter.Days = 14
	}
	if filter.Limit <= 0 {
		filter.Limit = 30
	}
	if filter.StartDate.IsZero() {
		now := time.Now().UTC()
		filter.StartDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	}

	results := []AvailableSlot{}

	for d := 0; d < filter.Days; d++ {
		currentDate := filter.StartDate.AddDate(0, 0, d)
		dateStr := currentDate.Format("2006-01-02")
		dow := int(currentDate.Weekday())
		if dow == 0 {
			dow = 7 // 1 = Monday .. 7 = Sunday
		}

		for _, cab := range cabinets {
			if filter.CabinetID != "" && cab.ID != filter.CabinetID {
				continue
			}

			// Find day availability
			var dayConfig *CabinetDayAvailability
			for _, av := range cab.Availability {
				if av.DayOfWeek == dow {
					dayConfig = &av
					break
				}
			}
			if dayConfig == nil {
				defaults := DefaultCabinetAvailability()
				for _, av := range defaults {
					if av.DayOfWeek == dow {
						dayConfig = &av
						break
					}
				}
			}

			if dayConfig == nil || !dayConfig.IsOpen {
				continue
			}

			openStart := parseHHMMToMinutes(dayConfig.StartTime)
			if openStart == 0 {
				openStart = 9 * 60 // default 09:00
			}
			openEnd := parseHHMMToMinutes(dayConfig.EndTime)
			if openEnd == 0 {
				openEnd = 20 * 60 // default 20:00
			}

			// Determine search window for this shift
			windowStart := openStart
			windowEnd := openEnd

			if filter.Shift == "morning" {
				if windowStart > 14*60 {
					continue
				}
				if windowEnd > 14*60 {
					windowEnd = 14 * 60
				}
			} else if filter.Shift == "afternoon" {
				if windowEnd < 14*60 {
					continue
				}
				if windowStart < 14*60 {
					windowStart = 14 * 60
				}
			}

			if windowStart >= windowEnd || (windowEnd-windowStart) < filter.DurationMinutes {
				continue
			}

			// Gather busy intervals
			busy := []timeInterval{}

			// 1. Pauses / Breaks
			if dayConfig.BreakStart != "" && dayConfig.BreakEnd != "" {
				bStart := parseHHMMToMinutes(dayConfig.BreakStart)
				bEnd := parseHHMMToMinutes(dayConfig.BreakEnd)
				if bEnd > bStart {
					busy = append(busy, timeInterval{start: bStart, end: bEnd})
				}
			}

			// 2. Existing appointments for this cabinet on this date
			for _, a := range appointments {
				if a.CabinetID != cab.ID || a.Status == "CANCELLED" {
					continue
				}
				aDateStr := a.StartTime.Format("2006-01-02")
				if aDateStr != dateStr {
					continue
				}
				aStart := a.StartTime.Hour()*60 + a.StartTime.Minute()
				aEnd := a.EndTime.Hour()*60 + a.EndTime.Minute()
				if aEnd > aStart {
					busy = append(busy, timeInterval{start: aStart, end: aEnd})
				}
			}

			// Sort busy intervals by start asc
			sort.Slice(busy, func(i, j int) bool {
				return busy[i].start < busy[j].start
			})

			// Merge overlapping busy intervals
			mergedBusy := []timeInterval{}
			for _, b := range busy {
				if len(mergedBusy) == 0 {
					mergedBusy = append(mergedBusy, b)
				} else {
					last := &mergedBusy[len(mergedBusy)-1]
					if b.start <= last.end {
						if b.end > last.end {
							last.end = b.end
						}
					} else {
						mergedBusy = append(mergedBusy, b)
					}
				}
			}

			// Find gaps inside [windowStart, windowEnd]
			cursor := windowStart
			for _, b := range mergedBusy {
				if b.end <= cursor {
					continue
				}
				if b.start > cursor {
					gapEnd := b.start
					if gapEnd > windowEnd {
						gapEnd = windowEnd
					}
					if gapEnd-cursor >= filter.DurationMinutes {
						for t := cursor; t+filter.DurationMinutes <= gapEnd; t += 15 {
							shiftName := "morning"
							if t >= 14*60 {
								shiftName = "afternoon"
							}
							results = append(results, AvailableSlot{
								CabinetID:       cab.ID,
								CabinetName:     cab.Name,
								CabinetColor:    cab.ColorCode,
								Date:            dateStr,
								StartTime:       formatMinutesToHHMM(t),
								EndTime:         formatMinutesToHHMM(t + filter.DurationMinutes),
								DurationMinutes: filter.DurationMinutes,
								Shift:           shiftName,
								FormattedDate:   formatSpanishDate(currentDate),
							})
							if len(results) >= filter.Limit {
								return results
							}
						}
					}
				}
				if b.end > cursor {
					cursor = b.end
				}
				if cursor >= windowEnd {
					break
				}
			}

			// Residual gap between cursor and windowEnd
			if cursor < windowEnd && (windowEnd-cursor) >= filter.DurationMinutes {
				for t := cursor; t+filter.DurationMinutes <= windowEnd; t += 15 {
					shiftName := "morning"
					if t >= 14*60 {
						shiftName = "afternoon"
					}
					results = append(results, AvailableSlot{
						CabinetID:       cab.ID,
						CabinetName:     cab.Name,
						CabinetColor:    cab.ColorCode,
						Date:            dateStr,
						StartTime:       formatMinutesToHHMM(t),
						EndTime:         formatMinutesToHHMM(t + filter.DurationMinutes),
						DurationMinutes: filter.DurationMinutes,
						Shift:           shiftName,
						FormattedDate:   formatSpanishDate(currentDate),
					})
					if len(results) >= filter.Limit {
						return results
					}
				}
			}
		}
	}

	return results
}

func (s *Store) FindAvailableSlots(ctx context.Context, tx pgx.Tx, filter AvailableSlotSearchFilter) ([]AvailableSlot, error) {
	cabinets, err := s.ListCabinets(ctx, tx)
	if err != nil {
		return nil, err
	}

	if filter.StartDate.IsZero() {
		now := time.Now().UTC()
		filter.StartDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	}
	if filter.Days <= 0 {
		filter.Days = 14
	}

	endDate := filter.StartDate.AddDate(0, 0, filter.Days+1)
	appointments, err := s.ListAppointments(ctx, tx, filter.StartDate, endDate, filter.CabinetID, "")
	if err != nil {
		return nil, err
	}

	return CalculateAvailableSlots(cabinets, appointments, filter), nil
}
