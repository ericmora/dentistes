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
	ID                string                   `json:"id"`
	Name              string                   `json:"name"`
	ColorCode         string                   `json:"color_code"`
	Equipment         string                   `json:"equipment"`
	AllowedCategories []string                 `json:"allowed_categories"`
	AllowedTreatments []string                 `json:"allowed_treatments"`
	IsActive          bool                     `json:"is_active"`
	ChairID           *string                  `json:"chair_id,omitempty"`
	ChairName         *string                  `json:"chair_name,omitempty"`
	DoctorID          *string                  `json:"doctor_id,omitempty"`
	DoctorName        *string                  `json:"doctor_name,omitempty"`
	AssistantID       *string                  `json:"assistant_id,omitempty"`
	AssistantName     *string                  `json:"assistant_name,omitempty"`
	Availability      []CabinetDayAvailability `json:"availability"`
	CreatedAt         time.Time                `json:"created_at"`
}

type ClinicHoliday struct {
	ID        string    `json:"id"`
	Date      string    `json:"date"`
	Name      string    `json:"name"`
	IsFullDay bool      `json:"is_full_day"`
	StartTime string    `json:"start_time,omitempty"`
	EndTime   string    `json:"end_time,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type ServiceShift struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	CabinetID   string    `json:"cabinet_id"`
	CabinetName string    `json:"cabinet_name,omitempty"`
	DayOfWeek   int       `json:"day_of_week"` // 1 = Monday .. 7 = Sunday
	StartTime   string    `json:"start_time"`  // "09:00"
	EndTime     string    `json:"end_time"`    // "14:00"
	DoctorIDs   []string  `json:"doctor_ids"`
	Categories  []string  `json:"categories"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

type ShiftOverride struct {
	ID              string    `json:"id"`
	OverrideDate    string    `json:"override_date"`
	ShiftID         *string   `json:"shift_id,omitempty"`
	IsCancelled     bool      `json:"is_cancelled"`
	CustomStartTime string    `json:"custom_start_time,omitempty"`
	CustomEndTime   string    `json:"custom_end_time,omitempty"`
	CustomDoctorIDs []string  `json:"custom_doctor_ids,omitempty"`
	Notes           string    `json:"notes,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
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
	AssistantID        *string   `json:"assistant_id,omitempty"`
	AssistantName      string    `json:"assistant_name,omitempty"`
	ChairID            *string   `json:"chair_id,omitempty"`
	ChairName          string    `json:"chair_name,omitempty"`
}

type UpsertAppointmentInput struct {
	PatientID     string
	DoctorID      string
	CabinetID     string
	AssistantID   *string
	StartTime     time.Time
	EndTime       time.Time
	TreatmentType string
	Status        string
	IsForced      bool
	Notes         string
}

func (s *Store) ListCabinets(ctx context.Context, tx pgx.Tx) ([]Cabinet, error) {
	rows, err := tx.Query(ctx, `select c.id, c.name, coalesce(c.color_code, '#0D9488'), coalesce(c.equipment, ''),
		coalesce(c.allowed_categories, '[]'::jsonb), coalesce(c.allowed_treatments, '[]'::jsonb), c.is_active,
		coalesce(c.availability, '[]'::jsonb), c.created_at,
		c.chair_id::text, coalesce(ch.name, ''),
		c.doctor_id::text, coalesce(ud.full_name, ''),
		c.assistant_id::text, coalesce(ua.full_name, '')
		from cabinets c
		left join dental_chairs ch on ch.id = c.chair_id
		left join users ud on ud.id = c.doctor_id
		left join users ua on ua.id = c.assistant_id
		where c.is_active = true order by c.created_at, c.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Cabinet{}
	for rows.Next() {
		var c Cabinet
		var catBytes, treatBytes, availBytes []byte
		var chairID, chairName, docID, docName, asstID, asstName *string
		if err := rows.Scan(&c.ID, &c.Name, &c.ColorCode, &c.Equipment, &catBytes, &treatBytes, &c.IsActive, &availBytes, &c.CreatedAt,
			&chairID, &chairName, &docID, &docName, &asstID, &asstName); err != nil {
			return nil, err
		}
		if chairID != nil && *chairID != "" {
			c.ChairID = chairID
			c.ChairName = chairName
		}
		if docID != nil && *docID != "" {
			c.DoctorID = docID
			c.DoctorName = docName
		}
		if asstID != nil && *asstID != "" {
			c.AssistantID = asstID
			c.AssistantName = asstName
		}
		if len(catBytes) > 0 {
			_ = json.Unmarshal(catBytes, &c.AllowedCategories)
		}
		if len(treatBytes) > 0 {
			_ = json.Unmarshal(treatBytes, &c.AllowedTreatments)
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

func (s *Store) GetCabinetByID(ctx context.Context, tx pgx.Tx, cabinetID string) (*Cabinet, error) {
	row := tx.QueryRow(ctx, `select c.id, c.name, coalesce(c.color_code, '#0D9488'), coalesce(c.equipment, ''),
		coalesce(c.allowed_categories, '[]'::jsonb), coalesce(c.allowed_treatments, '[]'::jsonb), c.is_active,
		coalesce(c.availability, '[]'::jsonb), c.created_at,
		c.chair_id::text, coalesce(ch.name, ''),
		c.doctor_id::text, coalesce(ud.full_name, ''),
		c.assistant_id::text, coalesce(ua.full_name, '')
		from cabinets c
		left join dental_chairs ch on ch.id = c.chair_id
		left join users ud on ud.id = c.doctor_id
		left join users ua on ua.id = c.assistant_id
		where c.id = $1::uuid`, cabinetID)

	var c Cabinet
	var catBytes, treatBytes, availBytes []byte
	var chairID, chairName, docID, docName, asstID, asstName *string
	if err := row.Scan(&c.ID, &c.Name, &c.ColorCode, &c.Equipment, &catBytes, &treatBytes, &c.IsActive, &availBytes, &c.CreatedAt,
		&chairID, &chairName, &docID, &docName, &asstID, &asstName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if chairID != nil && *chairID != "" {
		c.ChairID = chairID
		c.ChairName = chairName
	}
	if docID != nil && *docID != "" {
		c.DoctorID = docID
		c.DoctorName = docName
	}
	if asstID != nil && *asstID != "" {
		c.AssistantID = asstID
		c.AssistantName = asstName
	}
	if len(catBytes) > 0 {
		_ = json.Unmarshal(catBytes, &c.AllowedCategories)
	}
	if len(treatBytes) > 0 {
		_ = json.Unmarshal(treatBytes, &c.AllowedTreatments)
	}
	if len(availBytes) > 0 {
		_ = json.Unmarshal(availBytes, &c.Availability)
	}
	if len(c.Availability) == 0 {
		c.Availability = DefaultCabinetAvailability()
	}
	return &c, nil
}

func (s *Store) CreateCabinet(ctx context.Context, tx pgx.Tx, tenantID, name, colorCode, equipment string, allowedCategories, allowedTreatments []string, availability []CabinetDayAvailability, chairID, doctorID, assistantID *string) (*Cabinet, error) {
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if len(availability) == 0 {
		availability = DefaultCabinetAvailability()
	}
	if allowedCategories == nil {
		allowedCategories = []string{}
	}
	if allowedTreatments == nil {
		allowedTreatments = []string{}
	}
	availBytes, err := json.Marshal(availability)
	if err != nil {
		return nil, err
	}
	catBytes, _ := json.Marshal(allowedCategories)
	treatBytes, _ := json.Marshal(allowedTreatments)

	var id string
	err = tx.QueryRow(ctx, `insert into cabinets (tenant_id, name, color_code, equipment, allowed_categories, allowed_treatments, availability, chair_id, doctor_id, assistant_id)
		values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::uuid, $9::uuid, $10::uuid)
		returning id`,
		tenantID, name, colorCode, equipment, catBytes, treatBytes, availBytes, chairID, doctorID, assistantID).
		Scan(&id)
	if err != nil {
		return nil, err
	}
	return s.GetCabinetByID(ctx, tx, id)
}

func (s *Store) UpdateCabinet(ctx context.Context, tx pgx.Tx, tenantID, cabinetID, name, colorCode, equipment string, allowedCategories, allowedTreatments []string, availability []CabinetDayAvailability, chairID, doctorID, assistantID *string) (*Cabinet, error) {
	if colorCode == "" {
		colorCode = "#0D9488"
	}
	if len(availability) == 0 {
		availability = DefaultCabinetAvailability()
	}
	if allowedCategories == nil {
		allowedCategories = []string{}
	}
	if allowedTreatments == nil {
		allowedTreatments = []string{}
	}
	availBytes, err := json.Marshal(availability)
	if err != nil {
		return nil, err
	}
	catBytes, _ := json.Marshal(allowedCategories)
	treatBytes, _ := json.Marshal(allowedTreatments)

	cmd, err := tx.Exec(ctx, `update cabinets
		set name = coalesce(nullif($3, ''), name),
			color_code = coalesce(nullif($4, ''), color_code),
			equipment = $5,
			allowed_categories = $6::jsonb,
			allowed_treatments = $7::jsonb,
			availability = $8::jsonb,
			chair_id = $9::uuid,
			doctor_id = $10::uuid,
			assistant_id = $11::uuid
		where id = $1::uuid and tenant_id = $2::uuid and is_active = true`,
		cabinetID, tenantID, name, colorCode, equipment, catBytes, treatBytes, availBytes, chairID, doctorID, assistantID)
	if err != nil {
		return nil, err
	}
	if cmd.RowsAffected() == 0 {
		return nil, ErrNotFound
	}
	return s.GetCabinetByID(ctx, tx, cabinetID)
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

func (s *Store) ListAssistants(ctx context.Context, tx pgx.Tx) ([]Doctor, error) {
	rows, err := tx.Query(ctx, `select u.id, u.full_name, m.role
		from memberships m
		join users u on u.id = m.user_id
		where m.is_active = true and u.is_active = true
		  and m.role in ('ASSISTANT', 'HYGIENIST', 'ADMIN', 'OWNER')
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
		a.version, a.created_at, a.updated_at,
		a.assistant_id::text, coalesce(ua.full_name, ''),
		c.chair_id::text, coalesce(ch.name, '')
	from appointments a
	join patients p on p.id = a.patient_id
	join users u on u.id = a.doctor_id
	join cabinets c on c.id = a.cabinet_id
	left join users ua on ua.id = a.assistant_id
	left join dental_chairs ch on ch.id = c.chair_id`

func scanAppointment(row pgx.Row) (*Appointment, error) {
	var a Appointment
	var asstID, chairID *string
	err := row.Scan(
		&a.ID, &a.PatientID, &a.PatientName, &a.PatientHighRisk,
		&a.DoctorID, &a.DoctorName, &a.CabinetID, &a.CabinetName,
		&a.StartTime, &a.EndTime, &a.TreatmentType, &a.Status, &a.CancellationReason,
		&a.IsForced, &a.Notes,
		&a.Version, &a.CreatedAt, &a.UpdatedAt,
		&asstID, &a.AssistantName,
		&chairID, &a.ChairName,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if asstID != nil && *asstID != "" {
		a.AssistantID = asstID
	}
	if chairID != nil && *chairID != "" {
		a.ChairID = chairID
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
		var asstID, chairID *string
		if err := rows.Scan(
			&a.ID, &a.PatientID, &a.PatientName, &a.PatientHighRisk,
			&a.DoctorID, &a.DoctorName, &a.CabinetID, &a.CabinetName,
			&a.StartTime, &a.EndTime, &a.TreatmentType, &a.Status, &a.CancellationReason,
			&a.IsForced, &a.Notes,
			&a.Version, &a.CreatedAt, &a.UpdatedAt,
			&asstID, &a.AssistantName,
			&chairID, &a.ChairName,
		); err != nil {
			return nil, err
		}
		if asstID != nil && *asstID != "" {
			a.AssistantID = asstID
		}
		if chairID != nil && *chairID != "" {
			a.ChairID = chairID
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) GetAppointmentByID(ctx context.Context, tx pgx.Tx, id string) (*Appointment, error) {
	return scanAppointment(tx.QueryRow(ctx, appointmentSelect+" where a.id = $1", id))
}

func (s *Store) hasAppointmentOverlap(ctx context.Context, tx pgx.Tx, cabinetID, doctorID string, start, end time.Time, excludeID string) (bool, error) {
	var exists bool
	err := tx.QueryRow(ctx, `select exists(
		select 1 from appointments
		where (cabinet_id = $1::uuid or doctor_id = $2::uuid)
		  and status <> 'CANCELLED'
		  and start_time < $4 and end_time > $3
		  and ($5 = '' or id::text <> $5)
	)`, cabinetID, doctorID, start, end, excludeID).Scan(&exists)
	if err != nil {
		return false, err
	}
	if exists {
		return true, nil
	}
	// Check if doctor has an APPROVED staff absence on that date
	startDateStr := start.Format("2006-01-02")
	endDateStr := end.Format("2006-01-02")
	var isAbsent bool
	err = tx.QueryRow(ctx, `select exists(
		select 1 from staff_absences
		where user_id = $1::uuid
		  and status = 'APPROVED'
		  and start_date <= $3::date and end_date >= $2::date
	)`, doctorID, startDateStr, endDateStr).Scan(&isAbsent)
	return isAbsent, err
}

func (s *Store) CreateAppointment(ctx context.Context, tx pgx.Tx, tenantID string, in UpsertAppointmentInput) (*Appointment, error) {
	docID := in.DoctorID
	asstID := in.AssistantID

	var cabDoc, cabAsst *string
	_ = tx.QueryRow(ctx, `select doctor_id::text, assistant_id::text from cabinets where id = $1::uuid`, in.CabinetID).Scan(&cabDoc, &cabAsst)
	if cabDoc != nil && *cabDoc != "" {
		docID = *cabDoc
	}
	if cabAsst != nil && *cabAsst != "" {
		asstID = cabAsst
	}

	if docID == "" {
		return nil, errors.New("cabinet has no assigned doctor and no doctor was specified")
	}

	if !in.IsForced {
		overlap, err := s.hasAppointmentOverlap(ctx, tx, in.CabinetID, docID, in.StartTime, in.EndTime, "")
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
			(tenant_id, patient_id, doctor_id, cabinet_id, assistant_id, start_time, end_time, treatment_type, status, is_forced, notes)
		values ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10, nullif($11, ''))
		returning id`,
		tenantID, in.PatientID, docID, in.CabinetID, asstID, in.StartTime, in.EndTime, in.TreatmentType, status, in.IsForced, in.Notes).
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

	docID := in.DoctorID
	asstID := in.AssistantID

	var cabDoc, cabAsst *string
	_ = tx.QueryRow(ctx, `select doctor_id::text, assistant_id::text from cabinets where id = $1::uuid`, in.CabinetID).Scan(&cabDoc, &cabAsst)
	if cabDoc != nil && *cabDoc != "" {
		docID = *cabDoc
	}
	if cabAsst != nil && *cabAsst != "" {
		asstID = cabAsst
	}

	if docID == "" {
		return nil, errors.New("cabinet has no assigned doctor and no doctor was specified")
	}

	if !in.IsForced {
		overlap, err := s.hasAppointmentOverlap(ctx, tx, in.CabinetID, docID, in.StartTime, in.EndTime, id)
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
			assistant_id = $4::uuid,
			start_time = $5,
			end_time = $6,
			treatment_type = $7,
			is_forced = $8,
			notes = nullif($9, ''),
			version = version + 1
		where id = $1`,
		id, docID, in.CabinetID, asstID, in.StartTime, in.EndTime, in.TreatmentType, in.IsForced, in.Notes)
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
	CabinetID         string
	DoctorID          string
	TreatmentType     string
	TreatmentCategory string
	DurationMinutes   int
	Shift             string // "morning", "afternoon", "all"
	StartDate         time.Time
	Days              int
	Limit             int
}

type AvailableSlot struct {
	CabinetID        string `json:"cabinet_id"`
	CabinetName      string `json:"cabinet_name"`
	CabinetColor     string `json:"cabinet_color"`
	CabinetEquipment string `json:"cabinet_equipment,omitempty"`
	DoctorID         string `json:"doctor_id,omitempty"`
	DoctorName       string `json:"doctor_name,omitempty"`
	ShiftID          string `json:"shift_id,omitempty"`
	ShiftName        string `json:"shift_name,omitempty"`
	Date             string `json:"date"`
	StartTime        string `json:"start_time"`
	EndTime          string `json:"end_time"`
	DurationMinutes  int    `json:"duration_minutes"`
	Shift            string `json:"shift"`
	FormattedDate    string `json:"formatted_date"`
}

type CalculateSlotsContext struct {
	Cabinets     []Cabinet
	Shifts       []ServiceShift
	Overrides    []ShiftOverride
	Holidays     []ClinicHoliday
	Appointments []Appointment
	Absences     []StaffAbsence
	DoctorNames  map[string]string
	Filter       AvailableSlotSearchFilter
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
	return CalculateAvailableSlotsWithContext(CalculateSlotsContext{
		Cabinets:     cabinets,
		Appointments: appointments,
		Filter:       filter,
	})
}

func CalculateAvailableSlotsWithContext(calcCtx CalculateSlotsContext) []AvailableSlot {
	filter := calcCtx.Filter
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

	cabMap := make(map[string]Cabinet)
	for _, c := range calcCtx.Cabinets {
		cabMap[c.ID] = c
	}

	results := []AvailableSlot{}

	// If shifts are defined, use shift-based slot generation
	if len(calcCtx.Shifts) > 0 {
		for d := 0; d < filter.Days; d++ {
			currentDate := filter.StartDate.AddDate(0, 0, d)
			dateStr := currentDate.Format("2006-01-02")
			dow := int(currentDate.Weekday())
			if dow == 0 {
				dow = 7 // 1 = Monday .. 7 = Sunday
			}

			// 1. Check holidays
			isFullDayHoliday := false
			holidayIntervals := []timeInterval{}
			for _, h := range calcCtx.Holidays {
				if h.Date == dateStr {
					if h.IsFullDay {
						isFullDayHoliday = true
						break
					}
					hStart := parseHHMMToMinutes(h.StartTime)
					hEnd := parseHHMMToMinutes(h.EndTime)
					if hEnd > hStart {
						holidayIntervals = append(holidayIntervals, timeInterval{start: hStart, end: hEnd})
					}
				}
			}
			if isFullDayHoliday {
				continue
			}

			// 2. Iterate matching shifts for this day of week
			for _, shift := range calcCtx.Shifts {
				if !shift.IsActive || shift.DayOfWeek != dow {
					continue
				}
				if filter.CabinetID != "" && shift.CabinetID != filter.CabinetID {
					continue
				}

				// Check category filter
				if filter.TreatmentCategory != "" && len(shift.Categories) > 0 {
					matchedCategory := false
					for _, cat := range shift.Categories {
						if strings.EqualFold(cat, filter.TreatmentCategory) {
							matchedCategory = true
							break
						}
					}
					if !matchedCategory {
						continue
					}
				}

				// Check overrides for this specific date
				var shiftOverride *ShiftOverride
				for _, ov := range calcCtx.Overrides {
					if ov.OverrideDate == dateStr && ov.ShiftID != nil && *ov.ShiftID == shift.ID {
						shiftOverride = &ov
						break
					}
				}
				if shiftOverride != nil && shiftOverride.IsCancelled {
					continue
				}

				cab := cabMap[shift.CabinetID]
				if filter.TreatmentCategory != "" && len(cab.AllowedCategories) > 0 {
					matchedCat := false
					for _, ac := range cab.AllowedCategories {
						if strings.EqualFold(ac, filter.TreatmentCategory) {
							matchedCat = true
							break
						}
					}
					if !matchedCat {
						continue
					}
				}
				if filter.TreatmentType != "" && len(cab.AllowedTreatments) > 0 {
					matchedTreat := false
					for _, at := range cab.AllowedTreatments {
						if strings.EqualFold(at, filter.TreatmentType) {
							matchedTreat = true
							break
						}
					}
					if !matchedTreat {
						continue
					}
				}

				cabName := cab.Name
				if cabName == "" {
					cabName = shift.CabinetName
				}
				cabColor := cab.ColorCode
				if cabColor == "" {
					cabColor = "#0D9488"
				}

				shiftStartTime := shift.StartTime
				shiftEndTime := shift.EndTime
				if shiftOverride != nil && shiftOverride.CustomStartTime != "" && shiftOverride.CustomEndTime != "" {
					shiftStartTime = shiftOverride.CustomStartTime
					shiftEndTime = shiftOverride.CustomEndTime
				}

				openStart := parseHHMMToMinutes(shiftStartTime)
				openEnd := parseHHMMToMinutes(shiftEndTime)
				if openEnd <= openStart {
					continue
				}

				windowStart := openStart
				windowEnd := openEnd
				if filter.Shift == "morning" {
					if windowStart >= 14*60 {
						continue
					}
					if windowEnd > 14*60 {
						windowEnd = 14 * 60
					}
				} else if filter.Shift == "afternoon" {
					if windowEnd <= 14*60 {
						continue
					}
					if windowStart < 14*60 {
						windowStart = 14 * 60
					}
				}
				if windowStart >= windowEnd || (windowEnd-windowStart) < filter.DurationMinutes {
					continue
				}

				doctors := shift.DoctorIDs
				if shiftOverride != nil && len(shiftOverride.CustomDoctorIDs) > 0 {
					doctors = shiftOverride.CustomDoctorIDs
				}
				if filter.DoctorID != "" {
					docMatches := false
					for _, docID := range doctors {
						if docID == filter.DoctorID {
							docMatches = true
							break
						}
					}
					if !docMatches {
						continue
					}
					doctors = []string{filter.DoctorID}
				}

				if len(doctors) == 0 {
					doctors = []string{""}
				}

				for _, docID := range doctors {
					if docID != "" && IsUserAbsentOnDate(calcCtx.Absences, docID, dateStr) {
						continue
					}
					// Gather busy intervals for this cabinet and this doctor
					busy := append([]timeInterval{}, holidayIntervals...)

					for _, a := range calcCtx.Appointments {
						if a.Status == "CANCELLED" {
							continue
						}
						aDateStr := a.StartTime.Format("2006-01-02")
						if aDateStr != dateStr {
							continue
						}
						// Appointment in same cabinet OR same doctor
						if a.CabinetID == shift.CabinetID || (docID != "" && a.DoctorID == docID) {
							aStart := a.StartTime.Hour()*60 + a.StartTime.Minute()
							aEnd := a.EndTime.Hour()*60 + a.EndTime.Minute()
							if aEnd > aStart {
								busy = append(busy, timeInterval{start: aStart, end: aEnd})
							}
						}
					}

					sort.Slice(busy, func(i, j int) bool {
						return busy[i].start < busy[j].start
					})

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
									docName := ""
									if docID != "" && calcCtx.DoctorNames != nil {
										docName = calcCtx.DoctorNames[docID]
									}
									results = append(results, AvailableSlot{
										CabinetID:        shift.CabinetID,
										CabinetName:      cabName,
										CabinetColor:     cabColor,
										CabinetEquipment: cab.Equipment,
										DoctorID:         docID,
										DoctorName:       docName,
										ShiftID:          shift.ID,
										ShiftName:        shift.Name,
										Date:             dateStr,
										StartTime:        formatMinutesToHHMM(t),
										EndTime:          formatMinutesToHHMM(t + filter.DurationMinutes),
										DurationMinutes:  filter.DurationMinutes,
										Shift:            shiftName,
										FormattedDate:    formatSpanishDate(currentDate),
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

					if cursor < windowEnd && windowEnd-cursor >= filter.DurationMinutes {
						for t := cursor; t+filter.DurationMinutes <= windowEnd; t += 15 {
							shiftName := "morning"
							if t >= 14*60 {
								shiftName = "afternoon"
							}
							docName := ""
							if docID != "" && calcCtx.DoctorNames != nil {
								docName = calcCtx.DoctorNames[docID]
							}
							results = append(results, AvailableSlot{
								CabinetID:        shift.CabinetID,
								CabinetName:      cabName,
								CabinetColor:     cabColor,
								CabinetEquipment: cab.Equipment,
								DoctorID:         docID,
								DoctorName:       docName,
								ShiftID:          shift.ID,
								ShiftName:        shift.Name,
								Date:             dateStr,
								StartTime:        formatMinutesToHHMM(t),
								EndTime:          formatMinutesToHHMM(t + filter.DurationMinutes),
								DurationMinutes:  filter.DurationMinutes,
								Shift:            shiftName,
								FormattedDate:    formatSpanishDate(currentDate),
							})
							if len(results) >= filter.Limit {
								return results
							}
						}
					}
				}
			}
		}
		return results
	}

	// Fallback to legacy cabinet availability if no shifts exist
	for d := 0; d < filter.Days; d++ {
		currentDate := filter.StartDate.AddDate(0, 0, d)
		dateStr := currentDate.Format("2006-01-02")
		dow := int(currentDate.Weekday())
		if dow == 0 {
			dow = 7 // 1 = Monday .. 7 = Sunday
		}

		for _, cab := range calcCtx.Cabinets {
			if filter.CabinetID != "" && cab.ID != filter.CabinetID {
				continue
			}
			if cab.DoctorID != nil && *cab.DoctorID != "" {
				if IsUserAbsentOnDate(calcCtx.Absences, *cab.DoctorID, dateStr) {
					continue
				}
				if filter.DoctorID != "" && *cab.DoctorID != filter.DoctorID {
					continue
				}
			} else if filter.DoctorID != "" {
				continue
			}

			if filter.TreatmentCategory != "" && len(cab.AllowedCategories) > 0 {
				matchedCat := false
				for _, ac := range cab.AllowedCategories {
					if strings.EqualFold(ac, filter.TreatmentCategory) {
						matchedCat = true
						break
					}
				}
				if !matchedCat {
					continue
				}
			}
			if filter.TreatmentType != "" && len(cab.AllowedTreatments) > 0 {
				matchedTreat := false
				for _, at := range cab.AllowedTreatments {
					if strings.EqualFold(at, filter.TreatmentType) {
						matchedTreat = true
						break
					}
				}
				if !matchedTreat {
					continue
				}
			}

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
				openStart = 9 * 60
			}
			openEnd := parseHHMMToMinutes(dayConfig.EndTime)
			if openEnd == 0 {
				openEnd = 20 * 60
			}

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

			busy := []timeInterval{}

			if dayConfig.BreakStart != "" && dayConfig.BreakEnd != "" {
				bStart := parseHHMMToMinutes(dayConfig.BreakStart)
				bEnd := parseHHMMToMinutes(dayConfig.BreakEnd)
				if bEnd > bStart {
					busy = append(busy, timeInterval{start: bStart, end: bEnd})
				}
			}

			for _, a := range calcCtx.Appointments {
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

			sort.Slice(busy, func(i, j int) bool {
				return busy[i].start < busy[j].start
			})

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
							docID := ""
							if cab.DoctorID != nil {
								docID = *cab.DoctorID
							}
							docName := ""
							if cab.DoctorName != nil {
								docName = *cab.DoctorName
							} else if docID != "" && calcCtx.DoctorNames != nil {
								docName = calcCtx.DoctorNames[docID]
							}
							results = append(results, AvailableSlot{
								CabinetID:        cab.ID,
								CabinetName:      cab.Name,
								CabinetColor:     cab.ColorCode,
								CabinetEquipment: cab.Equipment,
								DoctorID:         docID,
								DoctorName:       docName,
								Date:             dateStr,
								StartTime:        formatMinutesToHHMM(t),
								EndTime:          formatMinutesToHHMM(t + filter.DurationMinutes),
								DurationMinutes:  filter.DurationMinutes,
								Shift:            shiftName,
								FormattedDate:    formatSpanishDate(currentDate),
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
					docID := ""
					if cab.DoctorID != nil {
						docID = *cab.DoctorID
					}
					docName := ""
					if cab.DoctorName != nil {
						docName = *cab.DoctorName
					} else if docID != "" && calcCtx.DoctorNames != nil {
						docName = calcCtx.DoctorNames[docID]
					}
					results = append(results, AvailableSlot{
						CabinetID:        cab.ID,
						CabinetName:      cab.Name,
						CabinetColor:     cab.ColorCode,
						CabinetEquipment: cab.Equipment,
						DoctorID:         docID,
						DoctorName:       docName,
						Date:             dateStr,
						StartTime:        formatMinutesToHHMM(t),
						EndTime:          formatMinutesToHHMM(t + filter.DurationMinutes),
						DurationMinutes:  filter.DurationMinutes,
						Shift:            shiftName,
						FormattedDate:    formatSpanishDate(currentDate),
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

// Store Database Operations for Holidays, Shifts, and Overrides

func (s *Store) ListHolidays(ctx context.Context, tx pgx.Tx, year int) ([]ClinicHoliday, error) {
	query := `select id, date::text, name, is_full_day, coalesce(start_time::text, ''), coalesce(end_time::text, ''), created_at
		from clinic_holidays`
	var rows pgx.Rows
	var err error
	if year > 0 {
		query += ` where extract(year from date) = $1 order by date asc`
		rows, err = tx.Query(ctx, query, year)
	} else {
		query += ` order by date asc`
		rows, err = tx.Query(ctx, query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ClinicHoliday{}
	for rows.Next() {
		var h ClinicHoliday
		var st, et string
		if err := rows.Scan(&h.ID, &h.Date, &h.Name, &h.IsFullDay, &st, &et, &h.CreatedAt); err != nil {
			return nil, err
		}
		if len(st) >= 5 {
			h.StartTime = st[:5]
		}
		if len(et) >= 5 {
			h.EndTime = et[:5]
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

func (s *Store) CreateHoliday(ctx context.Context, tx pgx.Tx, tenantID string, date, name string, isFullDay bool, startTime, endTime string) (*ClinicHoliday, error) {
	var h ClinicHoliday
	var st, et string
	err := tx.QueryRow(ctx, `insert into clinic_holidays (tenant_id, date, name, is_full_day, start_time, end_time)
		values ($1, $2::date, $3, $4, nullif($5, '')::time, nullif($6, '')::time)
		returning id, date::text, name, is_full_day, coalesce(start_time::text, ''), coalesce(end_time::text, ''), created_at`,
		tenantID, date, name, isFullDay, startTime, endTime).
		Scan(&h.ID, &h.Date, &h.Name, &h.IsFullDay, &st, &et, &h.CreatedAt)
	if err != nil {
		return nil, err
	}
	if len(st) >= 5 {
		h.StartTime = st[:5]
	}
	if len(et) >= 5 {
		h.EndTime = et[:5]
	}
	return &h, nil
}

func (s *Store) DeleteHoliday(ctx context.Context, tx pgx.Tx, id string) error {
	_, err := tx.Exec(ctx, `delete from clinic_holidays where id = $1::uuid`, id)
	return err
}

func (s *Store) ListShifts(ctx context.Context, tx pgx.Tx) ([]ServiceShift, error) {
	rows, err := tx.Query(ctx, `select s.id, s.name, s.cabinet_id, c.name, s.day_of_week, s.start_time::text, s.end_time::text, s.doctor_ids, s.categories, s.is_active, s.created_at
		from service_shifts s
		join cabinets c on c.id = s.cabinet_id
		order by s.day_of_week asc, s.start_time asc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ServiceShift{}
	for rows.Next() {
		var sh ServiceShift
		var st, et string
		var docIDsRaw, catRaw []byte
		if err := rows.Scan(&sh.ID, &sh.Name, &sh.CabinetID, &sh.CabinetName, &sh.DayOfWeek, &st, &et, &docIDsRaw, &catRaw, &sh.IsActive, &sh.CreatedAt); err != nil {
			return nil, err
		}
		if len(st) >= 5 {
			sh.StartTime = st[:5]
		}
		if len(et) >= 5 {
			sh.EndTime = et[:5]
		}
		_ = json.Unmarshal(docIDsRaw, &sh.DoctorIDs)
		_ = json.Unmarshal(catRaw, &sh.Categories)
		out = append(out, sh)
	}
	return out, rows.Err()
}

func (s *Store) CreateShift(ctx context.Context, tx pgx.Tx, tenantID, name, cabinetID string, dayOfWeek int, startTime, endTime string, doctorIDs, categories []string) (*ServiceShift, error) {
	if doctorIDs == nil {
		doctorIDs = []string{}
	}
	if categories == nil {
		categories = []string{}
	}
	docBytes, _ := json.Marshal(doctorIDs)
	catBytes, _ := json.Marshal(categories)

	var sh ServiceShift
	var st, et string
	var docIDsRaw, catRaw []byte
	err := tx.QueryRow(ctx, `insert into service_shifts (tenant_id, name, cabinet_id, day_of_week, start_time, end_time, doctor_ids, categories)
		values ($1, $2, $3::uuid, $4, $5::time, $6::time, $7::jsonb, $8::jsonb)
		returning id, name, cabinet_id, day_of_week, start_time::text, end_time::text, doctor_ids, categories, is_active, created_at`,
		tenantID, name, cabinetID, dayOfWeek, startTime, endTime, docBytes, catBytes).
		Scan(&sh.ID, &sh.Name, &sh.CabinetID, &sh.DayOfWeek, &st, &et, &docIDsRaw, &catRaw, &sh.IsActive, &sh.CreatedAt)
	if err != nil {
		return nil, err
	}
	if len(st) >= 5 {
		sh.StartTime = st[:5]
	}
	if len(et) >= 5 {
		sh.EndTime = et[:5]
	}
	_ = json.Unmarshal(docIDsRaw, &sh.DoctorIDs)
	_ = json.Unmarshal(catRaw, &sh.Categories)
	return &sh, nil
}

func (s *Store) UpdateShift(ctx context.Context, tx pgx.Tx, tenantID, shiftID, name, cabinetID string, dayOfWeek int, startTime, endTime string, doctorIDs, categories []string, isActive bool) (*ServiceShift, error) {
	if doctorIDs == nil {
		doctorIDs = []string{}
	}
	if categories == nil {
		categories = []string{}
	}
	docBytes, _ := json.Marshal(doctorIDs)
	catBytes, _ := json.Marshal(categories)

	var sh ServiceShift
	var st, et string
	var docIDsRaw, catRaw []byte
	err := tx.QueryRow(ctx, `update service_shifts
		set name = $3,
		    cabinet_id = $4::uuid,
		    day_of_week = $5,
		    start_time = $6::time,
		    end_time = $7::time,
		    doctor_ids = $8::jsonb,
		    categories = $9::jsonb,
		    is_active = $10
		where id = $1::uuid and tenant_id = $2::uuid
		returning id, name, cabinet_id, day_of_week, start_time::text, end_time::text, doctor_ids, categories, is_active, created_at`,
		shiftID, tenantID, name, cabinetID, dayOfWeek, startTime, endTime, docBytes, catBytes, isActive).
		Scan(&sh.ID, &sh.Name, &sh.CabinetID, &sh.DayOfWeek, &st, &et, &docIDsRaw, &catRaw, &sh.IsActive, &sh.CreatedAt)
	if err != nil {
		return nil, err
	}
	if len(st) >= 5 {
		sh.StartTime = st[:5]
	}
	if len(et) >= 5 {
		sh.EndTime = et[:5]
	}
	_ = json.Unmarshal(docIDsRaw, &sh.DoctorIDs)
	_ = json.Unmarshal(catRaw, &sh.Categories)
	return &sh, nil
}

func (s *Store) DeleteShift(ctx context.Context, tx pgx.Tx, shiftID string) error {
	_, err := tx.Exec(ctx, `delete from service_shifts where id = $1::uuid`, shiftID)
	return err
}

func (s *Store) ListShiftOverrides(ctx context.Context, tx pgx.Tx, startDate, endDate string) ([]ShiftOverride, error) {
	query := `select id, override_date::text, shift_id, is_cancelled, coalesce(custom_start_time::text, ''), coalesce(custom_end_time::text, ''), coalesce(custom_doctor_ids, '[]'::jsonb), coalesce(notes, ''), created_at
		from shift_overrides`
	var rows pgx.Rows
	var err error
	if startDate != "" && endDate != "" {
		query += ` where override_date >= $1::date and override_date <= $2::date order by override_date asc`
		rows, err = tx.Query(ctx, query, startDate, endDate)
	} else {
		query += ` order by override_date asc`
		rows, err = tx.Query(ctx, query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []ShiftOverride{}
	for rows.Next() {
		var ov ShiftOverride
		var st, et string
		var docIDsRaw []byte
		if err := rows.Scan(&ov.ID, &ov.OverrideDate, &ov.ShiftID, &ov.IsCancelled, &st, &et, &docIDsRaw, &ov.Notes, &ov.CreatedAt); err != nil {
			return nil, err
		}
		if len(st) >= 5 {
			ov.CustomStartTime = st[:5]
		}
		if len(et) >= 5 {
			ov.CustomEndTime = et[:5]
		}
		_ = json.Unmarshal(docIDsRaw, &ov.CustomDoctorIDs)
		out = append(out, ov)
	}
	return out, rows.Err()
}

func (s *Store) CreateShiftOverride(ctx context.Context, tx pgx.Tx, tenantID, overrideDate string, shiftID *string, isCancelled bool, customStartTime, customEndTime string, customDoctorIDs []string, notes string) (*ShiftOverride, error) {
	if customDoctorIDs == nil {
		customDoctorIDs = []string{}
	}
	docBytes, _ := json.Marshal(customDoctorIDs)

	var ov ShiftOverride
	var st, et string
	var docIDsRaw []byte
	err := tx.QueryRow(ctx, `insert into shift_overrides (tenant_id, override_date, shift_id, is_cancelled, custom_start_time, custom_end_time, custom_doctor_ids, notes)
		values ($1, $2::date, $3::uuid, $4, nullif($5, '')::time, nullif($6, '')::time, $7::jsonb, nullif($8, ''))
		returning id, override_date::text, shift_id, is_cancelled, coalesce(custom_start_time::text, ''), coalesce(custom_end_time::text, ''), coalesce(custom_doctor_ids, '[]'::jsonb), coalesce(notes, ''), created_at`,
		tenantID, overrideDate, shiftID, isCancelled, customStartTime, customEndTime, docBytes, notes).
		Scan(&ov.ID, &ov.OverrideDate, &ov.ShiftID, &ov.IsCancelled, &st, &et, &docIDsRaw, &ov.Notes, &ov.CreatedAt)
	if err != nil {
		return nil, err
	}
	if len(st) >= 5 {
		ov.CustomStartTime = st[:5]
	}
	if len(et) >= 5 {
		ov.CustomEndTime = et[:5]
	}
	_ = json.Unmarshal(docIDsRaw, &ov.CustomDoctorIDs)
	return &ov, nil
}

func (s *Store) DeleteShiftOverride(ctx context.Context, tx pgx.Tx, id string) error {
	_, err := tx.Exec(ctx, `delete from shift_overrides where id = $1::uuid`, id)
	return err
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
	appointments, err := s.ListAppointments(ctx, tx, filter.StartDate, endDate, filter.CabinetID, filter.DoctorID)
	if err != nil {
		return nil, err
	}

	shifts, err := s.ListShifts(ctx, tx)
	if err != nil {
		return nil, err
	}

	holidays, err := s.ListHolidays(ctx, tx, 0)
	if err != nil {
		return nil, err
	}

	startDateStr := filter.StartDate.Format("2006-01-02")
	endDateStr := endDate.Format("2006-01-02")
	overrides, err := s.ListShiftOverrides(ctx, tx, startDateStr, endDateStr)
	if err != nil {
		return nil, err
	}

	doctors, err := s.ListDoctors(ctx, tx)
	if err != nil {
		return nil, err
	}
	docNames := make(map[string]string)
	for _, d := range doctors {
		docNames[d.ID] = d.FullName
	}

	absencesRows, err := tx.Query(ctx, `select a.id, a.user_id, coalesce(u.full_name, ''), coalesce(m.role, ''),
		a.absence_type, a.start_date::text, a.end_date::text, a.status,
		a.auto_rescheduled_count, coalesce(a.notes, ''), a.created_at, a.updated_at
		from staff_absences a
		join users u on u.id = a.user_id
		left join memberships m on m.user_id = u.id and m.tenant_id = a.tenant_id
		where a.status = 'APPROVED'
		  and a.end_date >= $1::date and a.start_date <= $2::date`, startDateStr, endDateStr)
	var absences []StaffAbsence
	if err == nil {
		defer absencesRows.Close()
		for absencesRows.Next() {
			var ab StaffAbsence
			if err := absencesRows.Scan(
				&ab.ID, &ab.UserID, &ab.UserName, &ab.UserRole,
				&ab.AbsenceType, &ab.StartDate, &ab.EndDate, &ab.Status,
				&ab.AutoRescheduledCount, &ab.Notes, &ab.CreatedAt, &ab.UpdatedAt,
			); err == nil {
				absences = append(absences, ab)
			}
		}
	}

	return CalculateAvailableSlotsWithContext(CalculateSlotsContext{
		Cabinets:     cabinets,
		Shifts:       shifts,
		Overrides:    overrides,
		Holidays:     holidays,
		Appointments: appointments,
		Absences:     absences,
		DoctorNames:  docNames,
		Filter:       filter,
	}), nil
}
