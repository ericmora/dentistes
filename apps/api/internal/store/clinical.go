package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

var ErrVersionConflict = errors.New("version conflict")

type ClinicalAttachment struct {
	ID          string `json:"id"`
	Kind        string `json:"kind"` // XRAY | PHOTO | DOCUMENT
	Name        string `json:"name"`
	MimeType    string `json:"mime_type"`
	DataURL     string `json:"data_url"`
	SizeBytes   int64  `json:"size_bytes,omitempty"`
	ToothNumber string `json:"tooth_number,omitempty"`
}

func NormalizeClinicalAttachments(in []ClinicalAttachment) ([]ClinicalAttachment, error) {
	if len(in) == 0 {
		return []ClinicalAttachment{}, nil
	}
	out := make([]ClinicalAttachment, 0, len(in))
	for i, a := range in {
		name := strings.TrimSpace(a.Name)
		if name == "" {
			name = fmt.Sprintf("adjunto-%d", i+1)
		}
		dataURL := strings.TrimSpace(a.DataURL)
		if dataURL == "" {
			return nil, errors.New("attachment data_url is required")
		}
		mime := strings.TrimSpace(a.MimeType)
		if mime == "" {
			if strings.HasPrefix(dataURL, "data:application/pdf") {
				mime = "application/pdf"
			} else if strings.HasPrefix(dataURL, "data:image/") {
				mime = "image/png"
			} else {
				mime = "application/octet-stream"
			}
		}
		kind := strings.ToUpper(strings.TrimSpace(a.Kind))
		switch kind {
		case "XRAY", "PHOTO", "DOCUMENT":
		default:
			lowerName := strings.ToLower(name)
			if strings.Contains(lowerName, "rx") || strings.Contains(lowerName, "radio") || strings.Contains(lowerName, "periapical") || strings.Contains(lowerName, "orto") {
				kind = "XRAY"
			} else if strings.HasPrefix(mime, "image/") {
				kind = "PHOTO"
			} else {
				kind = "DOCUMENT"
			}
		}
		id := strings.TrimSpace(a.ID)
		if id == "" {
			id = fmt.Sprintf("att-%d-%d", time.Now().UTC().UnixNano(), i+1)
		}
		out = append(out, ClinicalAttachment{
			ID:          id,
			Kind:        kind,
			Name:        name,
			MimeType:    mime,
			DataURL:     dataURL,
			SizeBytes:   a.SizeBytes,
			ToothNumber: strings.TrimSpace(a.ToothNumber),
		})
	}
	return out, nil
}

type PatientDetail struct {
	Patient
	Address       json.RawMessage `json:"address"`
	MedicalAlerts json.RawMessage `json:"medical_alerts"`
}

type UpdatePatientInput struct {
	FirstName     string
	LastName      string
	DNINIE        string
	BirthDate     string
	Gender        string
	Phone         string
	Email         string
	WhatsappOptIn bool
	AddressJSON   string
	AlertsJSON    *string
}

type ClinicalRecord struct {
	ID            string               `json:"id"`
	PatientID     string               `json:"patient_id"`
	DoctorID      string               `json:"doctor_id"`
	DoctorName    string               `json:"doctor_name"`
	AppointmentID *string              `json:"appointment_id,omitempty"`
	EntryType     string               `json:"entry_type"`
	Content       string               `json:"content"`
	AmendsEntryID *string              `json:"amends_entry_id,omitempty"`
	Attachments   []ClinicalAttachment `json:"attachments"`
	CreatedAt     time.Time            `json:"created_at"`
}

type Odontogram struct {
	ID        string          `json:"id"`
	PatientID string          `json:"patient_id"`
	DoctorID  string          `json:"doctor_id"`
	Type      string          `json:"type"`
	TeethData json.RawMessage `json:"teeth_data"`
	Version   int             `json:"version"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

func (s *Store) GetPatientByID(ctx context.Context, tx pgx.Tx, patientID string) (*PatientDetail, error) {
	var p PatientDetail
	var addrBytes, alertsBytes []byte
	err := tx.QueryRow(ctx, `select id, first_name, last_name, dni_nie, birth_date::text, gender, phone, email,
			whatsapp_opt_in, coalesce((medical_alerts->>'high_risk')::boolean, false), created_at,
			address, medical_alerts
		from patients where id = $1`, patientID).
		Scan(&p.ID, &p.FirstName, &p.LastName, &p.DNINIE, &p.BirthDate, &p.Gender, &p.Phone, &p.Email,
			&p.WhatsappOptIn, &p.HighRisk, &p.CreatedAt, &addrBytes, &alertsBytes)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Address = addrBytes
	p.MedicalAlerts = alertsBytes
	return &p, nil
}

func (s *Store) UpdatePatient(ctx context.Context, tx pgx.Tx, patientID string, in UpdatePatientInput) (*PatientDetail, error) {
	var p PatientDetail
	var addrBytes, alertsBytes []byte
	err := tx.QueryRow(ctx, `update patients set
			first_name = $2,
			last_name = $3,
			dni_nie = nullif($4, ''),
			birth_date = $5::date,
			gender = nullif($6, ''),
			phone = $7,
			email = nullif($8, ''),
			whatsapp_opt_in = $9,
			address = $10::jsonb,
			medical_alerts = coalesce($11::jsonb, medical_alerts)
		where id = $1
		returning id, first_name, last_name, dni_nie, birth_date::text, gender, phone, email,
			whatsapp_opt_in, coalesce((medical_alerts->>'high_risk')::boolean, false), created_at,
			address, medical_alerts`,
		patientID, in.FirstName, in.LastName, in.DNINIE, in.BirthDate, in.Gender, in.Phone, in.Email,
		in.WhatsappOptIn, in.AddressJSON, in.AlertsJSON).
		Scan(&p.ID, &p.FirstName, &p.LastName, &p.DNINIE, &p.BirthDate, &p.Gender, &p.Phone, &p.Email,
			&p.WhatsappOptIn, &p.HighRisk, &p.CreatedAt, &addrBytes, &alertsBytes)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	p.Address = addrBytes
	p.MedicalAlerts = alertsBytes
	return &p, nil
}

func (s *Store) LogClinicalAccess(ctx context.Context, tx pgx.Tx, tenantID, userID, patientID, resource string) error {
	_, err := tx.Exec(ctx, `insert into clinical_access_logs (tenant_id, user_id, patient_id, resource)
		values ($1, $2, $3, $4)`, tenantID, userID, patientID, resource)
	return err
}

func (s *Store) ListClinicalRecords(ctx context.Context, tx pgx.Tx, patientID string) ([]ClinicalRecord, error) {
	rows, err := tx.Query(ctx, `select cr.id, cr.patient_id, cr.doctor_id, u.full_name, cr.appointment_id,
			cr.entry_type, cr.content, cr.amends_entry_id, coalesce(cr.attachments, '[]'::jsonb), cr.created_at
		from clinical_records cr
		join users u on u.id = cr.doctor_id
		where cr.patient_id = $1
		order by cr.created_at desc`, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ClinicalRecord{}
	for rows.Next() {
		var r ClinicalRecord
		var attBytes []byte
		if err := rows.Scan(&r.ID, &r.PatientID, &r.DoctorID, &r.DoctorName, &r.AppointmentID,
			&r.EntryType, &r.Content, &r.AmendsEntryID, &attBytes, &r.CreatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(attBytes, &r.Attachments)
		if r.Attachments == nil {
			r.Attachments = []ClinicalAttachment{}
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) CreateClinicalRecord(ctx context.Context, tx pgx.Tx, tenantID, patientID, doctorID string, appointmentID *string, entryType, content string, amendsEntryID *string, attachments ...[]ClinicalAttachment) (*ClinicalRecord, error) {
	var rawAtts []ClinicalAttachment
	if len(attachments) > 0 {
		rawAtts = attachments[0]
	}
	normAtts, err := NormalizeClinicalAttachments(rawAtts)
	if err != nil {
		return nil, err
	}
	attJSON, err := json.Marshal(normAtts)
	if err != nil {
		return nil, err
	}

	var r ClinicalRecord
	var attOut []byte
	err = tx.QueryRow(ctx, `with inserted as (
			insert into clinical_records (tenant_id, patient_id, doctor_id, appointment_id, entry_type, content, amends_entry_id, attachments)
			values ($1, $2, $3, $4::uuid, $5, $6, $7::uuid, $8::jsonb)
			returning id, patient_id, doctor_id, appointment_id, entry_type, content, amends_entry_id, attachments, created_at
		)
		select i.id, i.patient_id, i.doctor_id, u.full_name, i.appointment_id, i.entry_type, i.content, i.amends_entry_id, i.attachments, i.created_at
		from inserted i
		join users u on u.id = i.doctor_id`,
		tenantID, patientID, doctorID, appointmentID, entryType, content, amendsEntryID, string(attJSON)).
		Scan(&r.ID, &r.PatientID, &r.DoctorID, &r.DoctorName, &r.AppointmentID, &r.EntryType, &r.Content, &r.AmendsEntryID, &attOut, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(attOut, &r.Attachments)
	if r.Attachments == nil {
		r.Attachments = []ClinicalAttachment{}
	}
	return &r, nil
}

func (s *Store) ListOdontograms(ctx context.Context, tx pgx.Tx, patientID string) ([]Odontogram, error) {
	rows, err := tx.Query(ctx, `select id, patient_id, doctor_id, type, teeth_data, version, created_at, updated_at
		from odontograms
		where patient_id = $1
		order by updated_at desc`, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Odontogram{}
	for rows.Next() {
		var o Odontogram
		var raw []byte
		if err := rows.Scan(&o.ID, &o.PatientID, &o.DoctorID, &o.Type, &raw, &o.Version, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		o.TeethData = raw
		out = append(out, o)
	}
	return out, rows.Err()
}

func (s *Store) UpsertOdontogram(ctx context.Context, tx pgx.Tx, tenantID, patientID, doctorID, odoType, teethJSON string, expectedVersion *int) (*Odontogram, error) {
	var existingID string
	var currentVersion int
	err := tx.QueryRow(ctx, `select id, version from odontograms
		where patient_id = $1 and type = $2
		order by updated_at desc limit 1`, patientID, odoType).
		Scan(&existingID, &currentVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		var o Odontogram
		var raw []byte
		err = tx.QueryRow(ctx, `insert into odontograms (tenant_id, patient_id, doctor_id, type, teeth_data)
			values ($1, $2, $3, $4, $5::jsonb)
			returning id, patient_id, doctor_id, type, teeth_data, version, created_at, updated_at`,
			tenantID, patientID, doctorID, odoType, teethJSON).
			Scan(&o.ID, &o.PatientID, &o.DoctorID, &o.Type, &raw, &o.Version, &o.CreatedAt, &o.UpdatedAt)
		if err != nil {
			return nil, err
		}
		o.TeethData = raw
		return &o, nil
	}
	if err != nil {
		return nil, err
	}

	if expectedVersion != nil && *expectedVersion != currentVersion {
		return nil, ErrVersionConflict
	}

	var o Odontogram
	var raw []byte
	err = tx.QueryRow(ctx, `update odontograms
		set doctor_id = $2, teeth_data = $3::jsonb, version = version + 1
		where id = $1
		returning id, patient_id, doctor_id, type, teeth_data, version, created_at, updated_at`,
		existingID, doctorID, teethJSON).
		Scan(&o.ID, &o.PatientID, &o.DoctorID, &o.Type, &raw, &o.Version, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}
	o.TeethData = raw
	return &o, nil
}
