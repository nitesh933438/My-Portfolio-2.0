# Certificates & Academic Records — Updated Portfolio Setup

## Public portfolio placement

The `Certifications & Achievements` section is mounted after the Development Experience section and before GitHub. It includes certificate search, category filters, credential cards, image preview, descriptions, skills and optional credential verification links. It loads Firestore-published records when available and uses the bundled certificate set as a local fallback until the Admin import is completed.

## Imported certificate inventory

The supplied `Certificate.zip` contained 46 image files. This project includes **42 professional / learning / event certificate images** in `public/certificates/`, with metadata in `src/data/certificates.ts`. Categories include AI & Generative AI, AI Agents, Data Science, AWS & Cloud, GitHub & Developer Tools, Microsoft & Productivity, Professional Development and Events & Participation.

The following are intentionally excluded from public display: the Class 10 certificate, Class 12 certificate, AWS Networking ID card, and one duplicate Foundations of Data Science scan. The AWS Networking practitioner certificate itself is included. No missing credential IDs or verification links have been fabricated. Dates are populated only where they could be read from the supplied document; otherwise the date is left blank.

## Admin import and management

1. Run the project locally and open `/#admin-certificates`, or open `/#admin-academic` and choose **Certificates Manager**.
2. Sign in using the authorized administrator Google account (`nitesh933438@gmail.com`).
3. In Certificates Manager, choose **Import all bundled certificates**. This uploads the 42 bundled images to Firebase Storage and creates their metadata in Firestore. Existing matching title/issuer records are skipped. On successful completion, a Firestore catalog marker is written so that a deliberately empty published catalog does not fall back to the bundled public preview.
4. After import, use the same page to add, edit, publish/unpublish or delete certificates.
5. Deploy the updated `firestore.rules` and `storage.rules` in Firebase Console before relying on Firebase permissions.

Certificate files under `certifications/` are public-readable because published portfolio cards need to display them; only the administrator can upload, update or delete them. Never upload marksheets or identity documents to this public path.

## Academic records verified against supplied marksheets

See `ACADEMIC-RECORDS-VERIFICATION.md` for the cross-check. The supplied `Marksheet.zip` contains Class 10, Class 12, B.Tech Semester 1 and Semester 2 scans. The values already in `src/data/education.ts` match those scans: Class 10 399/500 (79.8%), Class 12 393/500 (78.6%), Semester 1 SGPA 7.91 (28-Feb-2026), and Semester 2 SGPA 9.23 (20-Jul-2026). Semesters 3–8 remain Upcoming and CGPA remains undeclared.

Original marksheets and the Class 10/12 certificate images are not copied into the public website or repository. They contain personal identifiers and must remain in private, access-controlled storage. Only the public-safe summary is displayed. `storage.rules` includes an administrator-only `academic-private/` path for a future private document upload workflow.

## Security and testing status

- `/api/academic/extract-marksheet` remains fail-closed with HTTP 503 until server-side Firebase ID-token verification and administrator authorization are implemented. Do not re-enable it before that work is completed and tested.
- The public health endpoint does not expose the administrator email.
- Firestore public academic reads are limited to documents containing only the approved public summary fields; writes remain admin-only.
- Certificate Firestore writes and Storage writes are admin-only.
- Local Firebase rule files must still be published in Firebase Console; changing these files does not automatically update the live project.
- `npm ci --ignore-scripts --no-audit --no-fund` did not complete in this environment. TypeScript syntax parsing passed for the modified TS/TSX files, but full type-check and production build remain unverified. Run `npm ci`, `npm run lint`, and `npm run build` locally before deployment.
