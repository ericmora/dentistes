import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  INACTIVITY_TIMEOUT_MS,
  WORKDAY_MAX_DURATION_MS,
  STORAGE_KEY_LAST_ACTIVITY,
  STORAGE_KEY_SESSION_START,
  initSessionTimers,
  clearSessionTimers,
  isSessionExpiredByInactivity,
  isSessionExpiredByWorkday,
  recordActivity,
} from "../lib/session";
import { LoginPage } from "../pages/Login";

const mockLogin = vi.fn();

vi.mock("../lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/session")>();
  return {
    ...actual,
    useSession: () => ({
      login: mockLogin,
      logout: vi.fn(),
      me: null,
      loading: false,
      sdk: {} as any,
      signup: vi.fn(),
      onboarding: vi.fn(),
      reload: vi.fn(),
    }),
  };
});

describe("Session Lifecycle, Inactivity and Workday Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes and clears session timers properly", () => {
    expect(localStorage.getItem(STORAGE_KEY_SESSION_START)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY)).toBeNull();

    initSessionTimers();

    const start = localStorage.getItem(STORAGE_KEY_SESSION_START);
    const last = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);

    expect(start).not.toBeNull();
    expect(last).not.toBeNull();
    expect(Number(start)).toBeGreaterThan(0);
    expect(Number(last)).toBeGreaterThan(0);

    clearSessionTimers();
    expect(localStorage.getItem(STORAGE_KEY_SESSION_START)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY)).toBeNull();
  });

  it("detects inactivity expiration after 30 minutes without activity", () => {
    const now = Date.now();
    // Activity 15 minutes ago -> NOT expired
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now - 15 * 60 * 1000));
    expect(isSessionExpiredByInactivity()).toBe(false);

    // Activity 31 minutes ago -> EXPIRED
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now - (INACTIVITY_TIMEOUT_MS + 1000)));
    expect(isSessionExpiredByInactivity()).toBe(true);
  });

  it("detects workday expiration after 12 hours from initial login", () => {
    const now = Date.now();
    // Session started 6 hours ago -> NOT expired
    localStorage.setItem(STORAGE_KEY_SESSION_START, String(now - 6 * 60 * 60 * 1000));
    expect(isSessionExpiredByWorkday()).toBe(false);

    // Session started 12 hours and 1 minute ago -> EXPIRED
    localStorage.setItem(STORAGE_KEY_SESSION_START, String(now - (WORKDAY_MAX_DURATION_MS + 60_000)));
    expect(isSessionExpiredByWorkday()).toBe(true);
  });

  it("renews activity timestamp on recordActivity()", () => {
    const past = Date.now() - 20 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(past));

    recordActivity();

    const renewed = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY));
    expect(renewed).toBeGreaterThanOrEqual(past + 19 * 60 * 1000);
  });

  it("renders inactivity explanation notice on LoginPage when redirected with ?reason=inactivity", () => {
    render(
      <MemoryRouter initialEntries={["/login?reason=inactivity"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/La sesión se ha cerrado por 30 minutos de inactividad por seguridad/i),
    ).toBeInTheDocument();
  });

  it("renders workday completion notice on LoginPage when redirected with ?reason=workday", () => {
    render(
      <MemoryRouter initialEntries={["/login?reason=workday"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/La sesión ha finalizado al completarse la jornada laboral/i),
    ).toBeInTheDocument();
  });

  it("renders unauthorized expiration notice on LoginPage when redirected with ?reason=unauthorized", () => {
    render(
      <MemoryRouter initialEntries={["/login?reason=unauthorized"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Tu sesión ha expirado o no es válida/i),
    ).toBeInTheDocument();
  });
});
