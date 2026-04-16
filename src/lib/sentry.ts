import * as Sentry from "@sentry/react";

const PII_KEY_PATTERN = /email|password|token|phone|cpf|cep|address|apikey|authorization/i;

function scrubRecord(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((v) => scrubRecord(v, depth + 1));
  if (typeof obj !== "object") return obj;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEY_PATTERN.test(key)) {
      out[key] = "[redacted]";
    } else {
      out[key] = scrubRecord(value, depth + 1);
    }
  }
  return out;
}

export function scrubPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : {};
  }
  if (event.request) {
    if (event.request.query_string) {
      event.request.query_string = "[redacted]";
    }
    if (event.request.headers) {
      const headers = { ...event.request.headers } as Record<string, string>;
      delete headers.authorization;
      delete headers.Authorization;
      delete headers.apikey;
      delete headers.ApiKey;
      event.request.headers = headers;
    }
    if (event.request.cookies) {
      event.request.cookies = "[redacted]" as unknown as typeof event.request.cookies;
    }
  }
  if (event.extra) {
    event.extra = scrubRecord(event.extra) as typeof event.extra;
  }
  if (event.contexts) {
    event.contexts = scrubRecord(event.contexts) as typeof event.contexts;
  }
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: ex.value ? ex.value.replace(PII_KEY_PATTERN, "[redacted]") : ex.value,
    }));
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((bc) => ({
      ...bc,
      message: bc.message ? bc.message.replace(PII_KEY_PATTERN, "[redacted]") : bc.message,
      data: bc.data ? (scrubRecord(bc.data) as Record<string, unknown>) : bc.data,
    }));
  }
  return event;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProd = import.meta.env.PROD;
  if (!isProd || !dsn) return;

  const environment =
    (import.meta.env.VITE_APP_ENV as string | undefined) ?? "production";
  const release = (import.meta.env.VITE_RELEASE as string | undefined) ?? "dev";

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend: scrubPii,
  });
}
