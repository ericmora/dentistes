package store

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	"image/color"
	_ "image/gif"
	"image/jpeg"
	"image/png"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

var ErrMediaNotFound = errors.New("media upload not found")

type DBExecutor interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type MediaUpload struct {
	ID               string    `json:"id"`
	TenantID         string    `json:"tenant_id"`
	UploaderID       *string   `json:"uploader_id,omitempty"`
	OriginalFilename string    `json:"original_filename"`
	MimeType         string    `json:"mime_type"`
	Width            int       `json:"width"`
	Height           int       `json:"height"`
	SizeBytes        int64     `json:"size_bytes"`
	Data             []byte    `json:"-"`
	DataURL          string    `json:"data_url,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

type OptimizeImageResult struct {
	Data               []byte
	MimeType           string
	Width              int
	Height             int
	OriginalSizeBytes  int64
	OptimizedSizeBytes int64
	DataURL            string
}

// hasTransparency checks if any pixel in the image has an alpha channel less than 255.
func hasTransparency(img image.Image) bool {
	bounds := img.Bounds()
	stepX := 1
	stepY := 1
	if bounds.Dx() > 100 {
		stepX = bounds.Dx() / 100
	}
	if bounds.Dy() > 100 {
		stepY = bounds.Dy() / 100
	}

	for y := bounds.Min.Y; y < bounds.Max.Y; y += stepY {
		for x := bounds.Min.X; x < bounds.Max.X; x += stepX {
			_, _, _, a := img.At(x, y).RGBA()
			if a < 0xffff {
				return true
			}
		}
	}
	return false
}

// OptimizeImage resizes an image to fit within maxDim maintaining aspect ratio,
// strips unnecessary metadata, and encodes to the most compact optimal format (JPEG 82 or PNG BestCompression).
func OptimizeImage(rawBytes []byte, maxDim int) (*OptimizeImageResult, error) {
	if len(rawBytes) == 0 {
		return nil, errors.New("image data is empty")
	}
	if maxDim <= 0 {
		maxDim = 1200
	}

	trimmed := bytes.TrimSpace(rawBytes)
	// Check if input is SVG
	if (bytes.HasPrefix(trimmed, []byte("<?xml")) || bytes.HasPrefix(trimmed, []byte("<svg"))) && bytes.Contains(trimmed, []byte("</svg>")) {
		dataURL := fmt.Sprintf("data:image/svg+xml;base64,%s", base64.StdEncoding.EncodeToString(rawBytes))
		return &OptimizeImageResult{
			Data:               rawBytes,
			MimeType:           "image/svg+xml",
			Width:              maxDim,
			Height:             maxDim,
			OriginalSizeBytes:  int64(len(rawBytes)),
			OptimizedSizeBytes: int64(len(rawBytes)),
			DataURL:            dataURL,
		}, nil
	}

	src, _, err := image.Decode(bytes.NewReader(rawBytes))
	if err != nil {
		return nil, fmt.Errorf("decode image: %w", err)
	}

	bounds := src.Bounds()
	origW := bounds.Dx()
	origH := bounds.Dy()
	if origW <= 0 || origH <= 0 {
		return nil, errors.New("invalid image dimensions")
	}

	targetW := origW
	targetH := origH

	if origW > maxDim || origH > maxDim {
		if origW >= origH {
			targetW = maxDim
			targetH = int(float64(origH) * float64(maxDim) / float64(origW))
		} else {
			targetH = maxDim
			targetW = int(float64(origW) * float64(maxDim) / float64(origH))
		}
		if targetW < 1 {
			targetW = 1
		}
		if targetH < 1 {
			targetH = 1
		}
	}

	var processed image.Image
	if targetW != origW || targetH != origH {
		dst := image.NewRGBA(image.Rect(0, 0, targetW, targetH))
		xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Over, nil)
		processed = dst
	} else {
		processed = src
	}

	transparent := hasTransparency(processed)

	var optBytes []byte
	var mimeType string

	if transparent {
		// Preserve alpha channel with best PNG compression
		var buf bytes.Buffer
		enc := png.Encoder{CompressionLevel: png.BestCompression}
		if err := enc.Encode(&buf, processed); err != nil {
			return nil, fmt.Errorf("encode png: %w", err)
		}
		optBytes = buf.Bytes()
		mimeType = "image/png"
	} else {
		// Opaque image: test JPEG vs PNG to choose whichever is smaller
		var jpegBuf bytes.Buffer
		opaqueDst := image.NewRGBA(image.Rect(0, 0, targetW, targetH))
		xdraw.Draw(opaqueDst, opaqueDst.Bounds(), &image.Uniform{C: color.White}, image.Point{}, xdraw.Src)
		xdraw.Draw(opaqueDst, opaqueDst.Bounds(), processed, image.Point{}, xdraw.Over)

		if err := jpeg.Encode(&jpegBuf, opaqueDst, &jpeg.Options{Quality: 82}); err != nil {
			return nil, fmt.Errorf("encode jpeg: %w", err)
		}

		var pngBuf bytes.Buffer
		enc := png.Encoder{CompressionLevel: png.BestCompression}
		if err := enc.Encode(&pngBuf, opaqueDst); err == nil && pngBuf.Len() < jpegBuf.Len() {
			optBytes = pngBuf.Bytes()
			mimeType = "image/png"
		} else {
			optBytes = jpegBuf.Bytes()
			mimeType = "image/jpeg"
		}
	}

	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(optBytes))

	return &OptimizeImageResult{
		Data:               optBytes,
		MimeType:           mimeType,
		Width:              targetW,
		Height:             targetH,
		OriginalSizeBytes:  int64(len(rawBytes)),
		OptimizedSizeBytes: int64(len(optBytes)),
		DataURL:            dataURL,
	}, nil
}

func (s *Store) SaveMediaUpload(ctx context.Context, db DBExecutor, tenantID string, uploaderID *string, filename string, mimeType string, width, height int, data []byte) (*MediaUpload, error) {
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("tenant_id is required")
	}
	cleanFilename := strings.TrimSpace(filename)
	if cleanFilename == "" {
		cleanFilename = "image.jpg"
	}

	randomSuffix := make([]byte, 8)
	if _, err := rand.Read(randomSuffix); err != nil {
		return nil, fmt.Errorf("random id: %w", err)
	}
	id := fmt.Sprintf("media-%d-%s", time.Now().UTC().UnixMilli(), hex.EncodeToString(randomSuffix))

	mu := &MediaUpload{
		ID:               id,
		TenantID:         tenantID,
		UploaderID:       uploaderID,
		OriginalFilename: cleanFilename,
		MimeType:         mimeType,
		Width:            width,
		Height:           height,
		SizeBytes:        int64(len(data)),
		Data:             data,
		DataURL:          fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(data)),
		CreatedAt:        time.Now().UTC(),
	}

	if db == nil {
		return mu, nil
	}

	query := `
		INSERT INTO media_uploads (id, tenant_id, uploader_id, original_filename, mime_type, width, height, size_bytes, data, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at
	`
	err := db.QueryRow(ctx, query,
		mu.ID, mu.TenantID, mu.UploaderID, mu.OriginalFilename, mu.MimeType, mu.Width, mu.Height, mu.SizeBytes, mu.Data, mu.CreatedAt,
	).Scan(&mu.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert media_upload: %w", err)
	}

	return mu, nil
}

func (s *Store) GetMediaUpload(ctx context.Context, db DBExecutor, id string) (*MediaUpload, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return nil, ErrMediaNotFound
	}

	if db == nil {
		return nil, ErrMediaNotFound
	}

	query := `
		SELECT id, tenant_id, uploader_id, original_filename, mime_type, width, height, size_bytes, data, created_at
		FROM media_uploads
		WHERE id = $1
	`

	var mu MediaUpload
	err := db.QueryRow(ctx, query, cleanID).Scan(
		&mu.ID, &mu.TenantID, &mu.UploaderID, &mu.OriginalFilename, &mu.MimeType, &mu.Width, &mu.Height, &mu.SizeBytes, &mu.Data, &mu.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMediaNotFound
		}
		return nil, fmt.Errorf("query media_upload: %w", err)
	}

	mu.DataURL = fmt.Sprintf("data:%s;base64,%s", mu.MimeType, base64.StdEncoding.EncodeToString(mu.Data))
	return &mu, nil
}
