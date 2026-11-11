# Portfolio implementation update — November 2026

## Included in this update
- Added the supplied NPTEL Programming in Java Elite certificate as the first bundled certificate (display order 0).
- Preserved the original PDF in `public/certificates/nptel-programming-in-java.pdf`.
- Read the official verification URL from the QR code printed on the supplied certificate: `https://nptel.ac.in/verify/NOC-TYQF-10FH-WWG48`.
- Recorded the printed roll number as the credential ID, and the printed Elite grade, 78% score, course period, marks, and recommended credits in the description. No exact issue date or expiry date was invented.
- Public certificate cards now sort by display order and identify PDF certificates clearly.
- Certificate CMS now supports numeric display order and move-up/move-down controls; the ordering is saved to Firestore and reflected on the public certificate list.
- Bulk certificate import now detects PDF assets and uploads them with the correct MIME type rather than treating every bundled asset as a JPEG.
- Bulk import falls back to the bundled local public asset when Supabase Storage is not configured, so the certificate catalog can still be added to Firestore without a Supabase upload.
- The bundled certificate import count is now derived from the actual catalog length.

## Verification performed
- Confirmed both uploaded ZIP files were readable.
- Confirmed the supplied PDF is a one-page A4 PDF and decoded the QR code printed on it.
- TypeScript transpile/syntax checks passed for the three modified TypeScript/TSX files.
- A full application build and live Firebase/Supabase checks were not completed in this environment. The project declares Node.js >=24.12.0; the available environment was Node.js 22.16.0 and dependency installation did not finish.

## Important setup note
After extracting this ZIP and starting the app, sign in to Admin → Certificates and use the bundled import/sync action once to add the new NPTEL record to Firestore/Supabase. If the certificate catalog has already been imported remotely, the new bundled record will not appear remotely until this sync is run. Keep the original PDF in `public/certificates/` when deploying.
