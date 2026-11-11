> Runtime requirement: use Node.js 24.12.0 or newer. The current Firebase dependency versions declare this minimum.

# Portfolio CMS deployment and control status

## Important hosting requirement

This project is a React/Vite frontend **and** an Express backend. The AI endpoints and secure Supabase upload/delete proxy run in Express (`server.ts`). A static-only host (GitHub Pages, Netlify static publish, or a Vercel rewrite to `index.html`) cannot execute these Express routes. If the frontend is deployed statically, `/api/*` will return the SPA HTML and the browser may show `Unexpected token '<'`.

The included `render.yaml` is configured as a Node web service that builds the frontend and runs Express (`npm start`). Deploy the service and configure its environment variables in the hosting dashboard. Attach the production domain to this service only after checking DNS and existing hosting configuration.

For a separate frontend and backend deployment, set `VITE_API_BASE_URL` at frontend build time to the backend origin (for example `https://your-api-service.onrender.com`) and set `CORS_ORIGIN` on the backend to the exact frontend origin(s), comma-separated. Do not put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in any `VITE_` variable.

## Required server environment

- `GEMINI_API_KEY` (server secret)
- `GEMINI_MODEL` (optional; default `gemini-2.5-flash`)
- `VITE_SUPABASE_URL` (public project URL)
- `VITE_SUPABASE_ANON_KEY` (public/publishable browser key)
- `SUPABASE_SERVICE_ROLE_KEY` (server secret only)
- `SUPABASE_BUCKET` (default `portfolio-assets`)
- `VITE_FIREBASE_PROJECT_ID` (defaults to this project's Firebase project ID)
- `CORS_ORIGIN` (exact frontend origins if API is cross-origin)

## Current CMS scope in the supplied source

Firestore-backed management exists for Projects, Certificates, Education/academic records, Profile/Settings, and Messages. Screenshot management is available through the project workflow. Skills and Experience now have Admin CRUD screens backed by Firestore `site_content` documents and public real-time subscriptions. Other content types not present in the current website (such as Blog, Services and Testimonials) do not have management screens and are not advertised as available menu items.

## Security note

The Express admin middleware now requires Firebase Admin `verifyIdToken` to validate the token signature and claims. It no longer accepts a JWT merely because its decoded payload contains an email or user ID. Configure the Firebase project correctly on the server before using admin APIs. Publish the updated `firestore.rules` file to Firebase before using Skills and Experience managers; the new `/site_content/{contentId}` rule is required for public reads and admin writes.


## GitHub Pages frontend + Render API option

If you keep the existing GitHub Pages workflow for the frontend, create these GitHub Actions repository secrets before deploying:

- `VITE_API_BASE_URL`: the HTTPS origin of the deployed Render API service (no trailing slash).
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase publishable/anon key.

On the Render API service, set `CORS_ORIGIN` to the exact public site origin, for example `https://nitesh.me` (include `https://www.nitesh.me` only if that host is actually used). Do not use a wildcard in production. The API service must have `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` set as server secrets.


## AI Scanner scope after the repair

The current scanner can extract into the existing Project, Certificate, Education and Profile/Settings form schemas. Public GitHub repository analysis reads repository metadata and README through the GitHub public API. It does not yet provide automatic multi-destination resume splitting, screenshot-to-existing-project matching, profile-photo upload routing, or bulk multi-file processing. Those workflows require additional UI and data mapping and are intentionally not routed to the wrong forms.

## What the current Admin can control

- Projects: create, edit, delete, publish/feature and manage screenshots.
- Certificates: create, edit, delete and publication/verification metadata.
- Education: edit existing school records and university semester results; academic rollback is available. Creating/deleting school or university records is not part of this patch.
- Profile/Settings: profile details, social links, photo and resume.
- Skills: add/edit/remove categories and skills, then Save All.
- Experience: add/edit/remove experience entries, then Save All.
- Messages: review and manage submitted contact messages.

The public Projects catalogue, featured projects, school records, university records, certificates, profile settings, Skills and Experience now subscribe to Firestore-backed data. Section headings, descriptive marketing copy and the main navigation definitions remain code-defined rather than editable CMS fields.

The AI Assistant chat is a content/workflow helper only; it cannot directly execute database mutations. AI Scanner can route supported extractions to the corresponding form and keeps the original certificate/resume/project-screenshot file attached as a pending upload where that form supports it. It does not yet batch multiple files, split one resume into several module writes, or automatically identify profile portraits for profile-photo replacement.

## Certificate verification metadata repair

The bundled certificate images were inspected for individual verification URLs. The catalog now includes 23 credential-specific URLs visible on the supplied images. Generic issuer landing pages are not treated as verification URLs. Existing Firestore records can receive these recovered links by using the Certificate CMS bulk catalog migration; matching records are updated only with the recovered credential URL and credential ID, while existing files and other metadata are retained. See `CERTIFICATE-VERIFICATION-AUDIT.md`.
