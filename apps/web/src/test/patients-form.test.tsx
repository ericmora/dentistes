import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button } from "@dentistes/ui";

const testPatientSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio"),
  last_name: z.string().trim().min(1, "Los apellidos son obligatorios"),
  birth_date: z
    .string()
    .trim()
    .min(1, "La fecha de nacimiento es obligatoria")
    .transform((val, ctx) => {
      const trimmed = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const parts = trimmed.split(/[/.-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
      }
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de fecha inválido" });
      return val;
    }),
  phone: z.string().trim().min(6, "El teléfono es obligatorio"),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

type TestPatientValues = z.infer<typeof testPatientSchema>;

function TestPatientForm({ onSubmit }: { onSubmit: (data: TestPatientValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestPatientValues>({
    resolver: zodResolver(testPatientSchema),
    defaultValues: { first_name: "", last_name: "", birth_date: "", phone: "", email: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Nombre" error={errors.first_name?.message} {...register("first_name")} />
      <Input label="Apellidos" error={errors.last_name?.message} {...register("last_name")} />
      <Input label="Fecha de nacimiento" error={errors.birth_date?.message} {...register("birth_date")} />
      <Input label="Teléfono" error={errors.phone?.message} {...register("phone")} />
      <Input label="Email" error={errors.email?.message} {...register("email")} />
      <Button type="submit">Crear paciente</Button>
    </form>
  );
}

describe("Patient Form & Input Ref Integration", () => {
  it("binds input refs via react-hook-form and submits parsed values without undefined error", async () => {
    const handleSubmit = vi.fn();
    render(<TestPatientForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "test amigo" } });
    fireEvent.change(screen.getByLabelText("Apellidos"), { target: { value: "asd" } });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "12/12/1999" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "4493430067" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ericmora82+elpacientre@gmail.com" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear paciente" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/expected string, received undefined/i)).not.toBeInTheDocument();
    expect(handleSubmit).toHaveBeenCalledWith(
      {
        first_name: "test amigo",
        last_name: "asd",
        birth_date: "1999-12-12",
        phone: "4493430067",
        email: "ericmora82+elpacientre@gmail.com",
      },
      expect.anything(),
    );
  });

  it("shows Spanish validation errors when fields are empty", async () => {
    const handleSubmit = vi.fn();
    render(<TestPatientForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Crear paciente" }));

    await waitFor(() => {
      expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
      expect(screen.getByText("Los apellidos son obligatorios")).toBeInTheDocument();
      expect(screen.getByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();
      expect(screen.getByText("El teléfono es obligatorio")).toBeInTheDocument();
    });

    expect(screen.queryByText(/expected string, received undefined/i)).not.toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
