import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 0.2,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
});

export default Sentry;
