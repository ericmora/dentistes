package httpapi

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/go-chi/chi/v5"
)

type ImageUploadResponse struct {
	ID                  string  `json:"id"`
	URL                 string  `json:"url"`
	DataURL             string  `json:"data_url"`
	OriginalFilename    string  `json:"original_filename"`
	MimeType            string  `json:"mime_type"`
	Width               int     `json:"width"`
	Height              int     `json:"height"`
	OriginalSizeBytes   int64   `json:"original_size_bytes"`
	OptimizedSizeBytes  int64   `json:"optimized_size_bytes"`
	ReductionPercentage float64 `json:"reduction_percentage"`
}

func (s *Server) handleUploadImage(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	if claims == nil || claims.TenantID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	maxDim := 1200
	if rawMax := r.URL.Query().Get("max_dim"); rawMax != "" {
		if parsed, err := strconv.Atoi(rawMax); err == nil && parsed > 0 && parsed <= 4096 {
			maxDim = parsed
		}
	}

	var rawBytes []byte
	var filename string
	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		// Limit to 15MB
		if err := r.ParseMultipartForm(15 << 20); err != nil {
			writeError(w, http.StatusBadRequest, "BAD_REQUEST", "could not parse multipart form", nil)
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			// Also check "image"
			file, header, err = r.FormFile("image")
			if err != nil {
				writeError(w, http.StatusBadRequest, "BAD_REQUEST", "missing 'file' or 'image' field in form", nil)
				return
			}
		}
		defer file.Close()

		filename = header.Filename
		rawBytes, err = io.ReadAll(file)
		if err != nil {
			writeError(w, http.StatusBadRequest, "BAD_REQUEST", "could not read file", nil)
			return
		}
	} else if strings.HasPrefix(contentType, "application/json") {
		var req struct {
			DataURL  string `json:"data_url"`
			Base64   string `json:"base64"`
			Filename string `json:"filename"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid json body", nil)
			return
		}

		filename = req.Filename
		dataStr := req.DataURL
		if dataStr == "" {
			dataStr = req.Base64
		}

		if idx := strings.Index(dataStr, ","); idx != -1 {
			dataStr = dataStr[idx+1:]
		}

		var err error
		rawBytes, err = base64.StdEncoding.DecodeString(strings.TrimSpace(dataStr))
		if err != nil {
			writeError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid base64 image data", nil)
			return
		}
	} else {
		// Raw binary body
		var err error
		rawBytes, err = io.ReadAll(r.Body)
		if err != nil || len(rawBytes) == 0 {
			writeError(w, http.StatusBadRequest, "BAD_REQUEST", "empty or unreadable request body", nil)
			return
		}
		filename = "upload.jpg"
	}

	if len(rawBytes) == 0 {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "image content is empty", nil)
		return
	}

	// Optimize image: downsample to maxDim, strip EXIF, compress into optimal format
	opt, err := store.OptimizeImage(rawBytes, maxDim)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "INVALID_IMAGE", fmt.Sprintf("invalid image: %v", err), nil)
		return
	}

	if filename == "" {
		ext := ".jpg"
		if opt.MimeType == "image/png" {
			ext = ".png"
		} else if opt.MimeType == "image/svg+xml" {
			ext = ".svg"
		}
		filename = "image" + ext
	}

	var dbExec store.DBExecutor
	if s.db != nil && s.db.Pool != nil {
		dbExec = s.db.Pool
	}

	uploaderID := &claims.Subject
	mu, err := s.store.SaveMediaUpload(r.Context(), dbExec, claims.TenantID, uploaderID, filename, opt.MimeType, opt.Width, opt.Height, opt.Data)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to save image", nil)
		return
	}

	var reduction float64
	if opt.OriginalSizeBytes > 0 && opt.OriginalSizeBytes > opt.OptimizedSizeBytes {
		reduction = float64(opt.OriginalSizeBytes-opt.OptimizedSizeBytes) / float64(opt.OriginalSizeBytes) * 100
	}

	resp := ImageUploadResponse{
		ID:                  mu.ID,
		URL:                 "/api/v1/uploads/images/" + mu.ID,
		DataURL:             opt.DataURL,
		OriginalFilename:    mu.OriginalFilename,
		MimeType:            opt.MimeType,
		Width:               opt.Width,
		Height:              opt.Height,
		OriginalSizeBytes:   opt.OriginalSizeBytes,
		OptimizedSizeBytes:  opt.OptimizedSizeBytes,
		ReductionPercentage: reduction,
	}

	writeJSON(w, http.StatusCreated, resp)
}

func (s *Server) handleGetUploadedImage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if strings.TrimSpace(id) == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "missing image id", nil)
		return
	}

	var dbExec store.DBExecutor
	if s.db != nil && s.db.Pool != nil {
		dbExec = s.db.Pool
	}

	mu, err := s.store.GetMediaUpload(r.Context(), dbExec, id)
	if err != nil {
		if errors.Is(err, store.ErrMediaNotFound) {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "image not found", nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to load image", nil)
		return
	}

	etag := fmt.Sprintf("\"%s\"", mu.ID)
	if match := r.Header.Get("If-None-Match"); match == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Content-Type", mu.MimeType)
	w.Header().Set("Content-Length", strconv.Itoa(len(mu.Data)))
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	w.Header().Set("ETag", etag)

	_, _ = w.Write(mu.Data)
}
