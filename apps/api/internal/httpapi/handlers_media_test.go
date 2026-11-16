package httpapi

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

func createTestPNGBytes(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.RGBA{uint8(x % 255), uint8(y % 255), 120, 255})
		}
	}
	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

func TestHandleUploadImage_Unauthorized(t *testing.T) {
	srv := &Server{store: store.New()}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", bytes.NewBufferString("{}"))
	rec := httptest.NewRecorder()

	srv.handleUploadImage(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthenticated request, got %d", rec.Code)
	}
}

func TestHandleUploadImage_JSONBase64(t *testing.T) {
	srv := &Server{store: store.New()}

	pngBytes := createTestPNGBytes(1600, 800)
	base64Data := base64.StdEncoding.EncodeToString(pngBytes)
	reqBody, _ := json.Marshal(map[string]string{
		"data_url": "data:image/png;base64," + base64Data,
		"filename": "clinic-logo.png",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images?max_dim=800", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// Inject authenticated claims
	ctx := context.WithValue(req.Context(), ctxClaims, &auth.Claims{
		TenantID: "tenant-test-1",
		Role:     "OWNER",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: "user-test-1",
		},
	})
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	srv.handleUploadImage(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp ImageUploadResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.ID == "" {
		t.Error("expected non-empty image ID")
	}
	if resp.Width != 800 {
		t.Errorf("expected downscaled width 800, got %d", resp.Width)
	}
	if resp.Height != 400 {
		t.Errorf("expected downscaled height 400, got %d", resp.Height)
	}
	if resp.DataURL == "" {
		t.Error("expected non-empty data_url")
	}
	if resp.URL != "/api/v1/uploads/images/"+resp.ID {
		t.Errorf("unexpected url format: %s", resp.URL)
	}
}

func TestHandleUploadImage_MultipartForm(t *testing.T) {
	srv := &Server{store: store.New()}

	pngBytes := createTestPNGBytes(400, 300)

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	fw, err := w.CreateFormFile("file", "test-xray.png")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	if _, err := fw.Write(pngBytes); err != nil {
		t.Fatalf("failed to write png bytes: %v", err)
	}
	_ = w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/uploads/images", &b)
	req.Header.Set("Content-Type", w.FormDataContentType())

	ctx := context.WithValue(req.Context(), ctxClaims, &auth.Claims{
		TenantID: "tenant-test-1",
		Role:     "DENTIST",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: "user-test-1",
		},
	})
	req = req.WithContext(ctx)

	rec := httptest.NewRecorder()
	srv.handleUploadImage(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp ImageUploadResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Width != 400 || resp.Height != 300 {
		t.Errorf("expected 400x300, got %dx%d", resp.Width, resp.Height)
	}
}

func TestHandleGetUploadedImage_NotFound(t *testing.T) {
	srv := &Server{store: store.New()}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/uploads/images/non-existent", nil)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "non-existent")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rec := httptest.NewRecorder()
	srv.handleGetUploadedImage(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for non-existent image, got %d", rec.Code)
	}
}
