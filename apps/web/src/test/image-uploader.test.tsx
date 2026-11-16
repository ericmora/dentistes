import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ImageUploader } from "@dentistes/ui";

describe("Design System - ImageUploader Component", () => {
  it("renders empty state with drag-and-drop dropzone when no image is set", () => {
    const onChange = vi.fn();
    render(
      <ImageUploader
        id="test-uploader"
        label="Logotipo de la clínica"
        value=""
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Logotipo de la clínica")).toBeInTheDocument();
    expect(screen.getByText(/Haz clic para subir/i)).toBeInTheDocument();
    expect(screen.getByText(/arrastra tu archivo aquí/i)).toBeInTheDocument();
    // Buttons for sample logo or quitar should not be present in empty state
    expect(screen.queryByText(/Usar logo dental de muestra/i)).toBeNull();
    expect(screen.queryByText("Quitar")).toBeNull();
  });

  it("renders image preview and action buttons when value is provided", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();

    render(
      <ImageUploader
        id="test-uploader"
        label="Logotipo de la clínica"
        value="https://example.com/logo.webp"
        onChange={onChange}
        onRemove={onRemove}
      />,
    );

    const img = screen.getByRole("img", { name: "Logotipo de la clínica" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.webp");

    expect(screen.getByRole("button", { name: /Cambiar/i })).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Quitar/i });
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith("");
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("handles image file upload and returns optimized image details via uploadFn", async () => {
    const onChange = vi.fn();
    const mockUploadFn = vi.fn().mockResolvedValue({
      id: "media-123",
      url: "https://api.example.com/api/v1/uploads/images/media-123",
      width: 400,
      height: 200,
      original_size_bytes: 500000,
      optimized_size_bytes: 45000,
      reduction_percentage: 91,
      original_filename: "logo.png",
    });

    const { container } = render(
      <ImageUploader
        id="test-uploader"
        value=""
        onChange={onChange}
        uploadFn={mockUploadFn}
      />,
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(["dummy content"], "logo.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadFn).toHaveBeenCalledWith(file);
    });

    expect(onChange).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/uploads/images/media-123",
      expect.objectContaining({
        id: "media-123",
        reduction_percentage: 91,
      }),
    );
  });

  it("rejects non-image files and displays error message", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader id="test-uploader" value="" onChange={onChange} />,
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["text data"], "notes.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecciona un archivo de imagen válido/i)).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
