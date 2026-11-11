# My-Portfolio-2.0

A responsive React + TypeScript portfolio with a Firebase-backed Admin CMS and an Express API for protected AI and file-storage workflows.

## Requirements

- Node.js **24.12.0 or newer** (the current Firebase dependency tree requires Node 24.12+).
- npm 10 or newer.

```bash
npm ci
npm run dev
```

The local development server is started through `tsx server.ts`. Production build:

```bash
npm run lint
npm run build
npm start
```

## Portfolio sections

Hero, About, Education, Skills, Featured Projects, Projects Catalogue, Experience, Certifications, GitHub, Contact and Footer.

## Admin CMS

The authenticated admin area includes management for Projects, Certificates, Education/academic records, Profile/Settings, Skills, Experience and Messages, plus AI Assistant and AI Scanner workflows. CMS writes require the configured administrator account and Firebase security rules.

## Certificates

The bundled catalog contains 42 original certificate images. Individual verification URLs printed on the supplied certificate images are included where available. Generic issuer homepages are not treated as verification links. See [CERTIFICATE-VERIFICATION-AUDIT.md](./CERTIFICATE-VERIFICATION-AUDIT.md) for the per-catalog audit and the list of records that still need issuer-provided verification URLs.

Before using certificate uploads, deploy the included `storage.rules` and updated `firestore.rules`. The manager stores metadata in Firestore and files in Supabase Storage through the Express API. Keep private academic records and marksheets out of the public certificate collection.

## Deployment

This project is **not a static-only website**. The frontend is React/Vite, and the Express backend provides protected AI endpoints and secure Supabase upload/delete operations.

Two supported deployment patterns are documented in [DEPLOYMENT-AND-CMS-STATUS.md](./DEPLOYMENT-AND-CMS-STATUS.md):

1. Deploy the combined Node web service using the included `render.yaml` (recommended for the simplest setup).
2. Deploy the frontend to GitHub Pages and the API separately to Render. Configure the GitHub Actions secrets and exact backend CORS origin described in the deployment guide.

Never expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in browser code or `VITE_` variables. Configure all production secrets in the hosting provider dashboard.

## Important project notes

- Existing bundled project and certificate records are preserved.
- The public portfolio subscribes to published Firestore content where configured and retains bundled fallbacks where supported.
- Publish the matching Firestore and Storage security rules before relying on CMS writes or uploads.
- Build/runtime behavior still needs to be verified in the target hosting environment with its real Firebase and Supabase credentials.
