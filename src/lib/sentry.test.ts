import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type * as Sentry from "@sentry/react";

import { scrubPii } from "./sentry";

const { initMock } = vi.hoisted(() => ({ initMock: vi.fn() }));

vi.mock("@sentry/react", async () => {
  const actual = await vi.importActual<typeof Sentry>("@sentry/react");
  return { ...actual, init: initMock };
});

describe("scrubPii", () => {
  it("reduz event.user a apenas { id }", () => {
    const event = {
      user: { id: "u1", email: "a@b.com", username: "x" },
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    expect(out.user).toEqual({ id: "u1" });
  });

  it("redige query_string", () => {
    const event = {
      request: { query_string: "token=abc&foo=bar" },
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    expect(out.request?.query_string).toBe("[redacted]");
  });

  it("remove headers authorization/apikey", () => {
    const event = {
      request: {
        headers: {
          authorization: "Bearer xyz",
          apikey: "sk-123",
          "content-type": "application/json",
        },
      },
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    const headers = out.request?.headers as Record<string, string>;
    expect(headers.authorization).toBeUndefined();
    expect(headers.apikey).toBeUndefined();
    expect(headers["content-type"]).toBe("application/json");
  });

  it("scruba PII em exception.values[].value", () => {
    const event = {
      exception: {
        values: [
          { type: "Error", value: "Failed for email user@example.com" },
          { type: "Error", value: "No PII here" },
        ],
      },
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    expect(out.exception?.values?.[0].value).toBe("Failed for [redacted] user@example.com");
    expect(out.exception?.values?.[1].value).toBe("No PII here");
  });

  it("scruba PII em breadcrumbs message e data", () => {
    const event = {
      breadcrumbs: [
        { message: "fetching email endpoint", data: { token: "abc", safe: "ok" } },
        { message: "no pii here" },
      ],
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    expect(out.breadcrumbs?.[0].message).toBe("fetching [redacted] endpoint");
    expect((out.breadcrumbs?.[0].data as Record<string, unknown>).token).toBe("[redacted]");
    expect((out.breadcrumbs?.[0].data as Record<string, unknown>).safe).toBe("ok");
    expect(out.breadcrumbs?.[1].message).toBe("no pii here");
  });

  it("redige chaves PII recursivas em extra", () => {
    const event = {
      extra: {
        safe: "ok",
        nested: { email: "a@b.com", phone: "11", deeper: { cpf: "123" } },
      },
    } as unknown as Sentry.ErrorEvent;
    const out = scrubPii(event);
    const extra = out.extra as Record<string, unknown>;
    expect(extra.safe).toBe("ok");
    const nested = extra.nested as Record<string, unknown>;
    expect(nested.email).toBe("[redacted]");
    expect(nested.phone).toBe("[redacted]");
    expect((nested.deeper as Record<string, unknown>).cpf).toBe("[redacted]");
  });
});

describe("initSentry", () => {
  beforeEach(() => {
    initMock.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("é no-op em dev (PROD=false)", async () => {
    (vi.stubEnv as (k: string, v: unknown) => void)("PROD", false);
    vi.stubEnv("VITE_SENTRY_DSN", "https://fake@sentry.io/1");
    const { initSentry } = await import("./sentry");
    initSentry();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("é no-op em prod sem DSN", async () => {
    (vi.stubEnv as (k: string, v: unknown) => void)("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const { initSentry } = await import("./sentry");
    initSentry();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("inicializa em prod com DSN", async () => {
    (vi.stubEnv as (k: string, v: unknown) => void)("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://fake@sentry.io/1");
    vi.stubEnv("VITE_APP_ENV", "production");
    const { initSentry } = await import("./sentry");
    initSentry();
    expect(initMock).toHaveBeenCalledTimes(1);
    const cfg = initMock.mock.calls[0][0];
    expect(cfg.dsn).toBe("https://fake@sentry.io/1");
    expect(cfg.environment).toBe("production");
    expect(cfg.tracesSampleRate).toBe(0.1);
  });
});
