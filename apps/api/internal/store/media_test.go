package store

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"testing"
)

func createTestPNG(width, height int, transparent bool) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	// Draw a background
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if transparent && (x < width/2 && y < height/2) {
				img.Set(x, y, color.RGBA{0, 0, 0, 0})
			} else {
				img.Set(x, y, color.RGBA{uint8(x % 255), uint8(y % 255), 180, 255})
			}
		}
	}

	var buf bytes.Buffer
	_ = png.Encode(&buf, img)
	return buf.Bytes()
}

func TestOptimizeImage_DownscalesLargeImages(t *testing.T) {
	// Create an unoptimized 2000x1000 PNG image
	largeImgBytes := createTestPNG(2000, 1000, false)

	// Optimize with maxDim 800
	res, err := OptimizeImage(largeImgBytes, 800)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Width != 800 {
		t.Errorf("expected width 800, got %d", res.Width)
	}
	if res.Height != 400 {
		t.Errorf("expected height 400, got %d", res.Height)
	}
	if res.OptimizedSizeBytes >= res.OriginalSizeBytes {
		t.Errorf("expected optimized size (%d) to be smaller than original (%d)", res.OptimizedSizeBytes, res.OriginalSizeBytes)
	}
	if res.DataURL == "" {
		t.Error("expected non-empty DataURL")
	}
}

func TestOptimizeImage_PreservesSmallImageDimensions(t *testing.T) {
	smallBytes := createTestPNG(300, 200, false)

	res, err := OptimizeImage(smallBytes, 800)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.Width != 300 || res.Height != 200 {
		t.Errorf("expected 300x200, got %dx%d", res.Width, res.Height)
	}
}

func TestOptimizeImage_PreservesTransparency(t *testing.T) {
	transBytes := createTestPNG(400, 400, true)

	res, err := OptimizeImage(transBytes, 800)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.MimeType != "image/png" {
		t.Errorf("expected image/png for transparent image, got %s", res.MimeType)
	}
}

func TestOptimizeImage_HandlesSVG(t *testing.T) {
	svg := `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50"/></svg>`
	res, err := OptimizeImage([]byte(svg), 800)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res.MimeType != "image/svg+xml" {
		t.Errorf("expected image/svg+xml, got %s", res.MimeType)
	}
}

func TestStore_SaveAndGetMediaUpload(t *testing.T) {
	st := &Store{}
	ctx := context.Background()

	testBytes := createTestPNG(100, 100, false)
	mu, err := st.SaveMediaUpload(ctx, nil, "tenant-test", nil, "logo.png", "image/png", 100, 100, testBytes)
	if err != nil {
		t.Fatalf("unexpected error saving: %v", err)
	}

	if mu.ID == "" {
		t.Error("expected non-empty ID")
	}
	if mu.TenantID != "tenant-test" {
		t.Errorf("expected tenant-test, got %s", mu.TenantID)
	}
	if mu.SizeBytes != int64(len(testBytes)) {
		t.Errorf("expected %d bytes, got %d", len(testBytes), mu.SizeBytes)
	}
}

// Suppress unused imports
var _ = draw.Over
