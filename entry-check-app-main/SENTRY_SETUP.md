Sentry setup for this project

1) Create a Sentry organization and project
   - Go to https://sentry.io and create an organization (or use an existing one)
   - Create a project (JavaScript / Next.js)

2) Environment variables (add to `.env.local`)
   - `SENTRY_DSN` (server-side) = the project DSN
   - `NEXT_PUBLIC_SENTRY_DSN` (client-side) = the same DSN
   - `NEXT_PUBLIC_SENTRY_PROJECT_URL` = URL to your Sentry project dashboard (used by Reports page)
     e.g. https://sentry.io/organizations/<org-slug>/projects/<project-slug>/

3) Files added
   - `sentry.client.config.js` - client-side initialization
   - `sentry.server.config.js` - server-side initialization

4) Installation
   - The repo already includes `@sentry/nextjs` in `package.json`. Run:

```bash
npm install
```

5) Optional Sentry CLI / Source maps (recommended for release tracking)
   - Configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` and add build-time upload steps.

6) Usage
   - The Reports page links to the project dashboard using `NEXT_PUBLIC_SENTRY_PROJECT_URL`.
   - To capture exceptions manually import the exported Sentry instance from `sentry.server.config.js` or `sentry.client.config.js`.
