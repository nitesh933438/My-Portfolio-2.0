# My-Portfolio-2.0 implementation pass

This pass updates the supplied project archive while preserving its existing sections, bundled projects, 42 certificate images, Firebase/Supabase integrations and admin modules.

## Changes made

- Extracted individual verification URLs printed on the supplied certificate images and populated 23 certificate records.
- Removed generic issuer landing-page URLs from the bundled catalog; 19 records remain without an individual verification URL rather than receiving fabricated links.
- Added a shared verification URL validator for Coursera, Credly, Microsoft Learn achievement print pages and other credential-specific URL patterns.
- Public certificate cards now show a clear link-availability state and do not expose generic issuer pages as Verify links.
- Added original-file download action and expiry-date display to the certificate detail view.
- Added expiry date and credential ID fields to the certificate admin form; PDF uploads now save as PDF records so their preview uses the correct viewer.
- Admin certificate import now merges newly recovered individual verification links into matching existing Firestore records instead of skipping all duplicates. Existing certificate files and unrelated metadata are preserved.
- Bulk link suggestions no longer generate generic Microsoft or Henry Harvin pages. Admin cannot mark a generic URL as an approved credential verification link.
- Improved mobile navbar sizing/scrolling, active-section highlighting, Escape handling and background scroll locking.
- Improved mobile admin navigation scroll locking and Escape handling.
- Scroll reveal respects the device reduced-motion preference.
- Contact social buttons no longer render placeholder `#` links; clipboard failures receive feedback.
- Updated Node runtime documentation and GitHub Actions to use Node 24.12+ and `npm ci`, matching the Firebase dependency engine requirements.

## Verification performed in this environment

- Confirmed all 42 bundled certificate records remain in the catalog.
- Confirmed all 42 certificate image files exist in `public/certificates/`.
- Confirmed 23 bundled credential URLs pass the new credential-specific URL validator.
- Confirmed generic issuer homepage URLs fail the validator.
- Transpiled all 53 TypeScript/TSX source files with TypeScript 5.8.3; no syntax diagnostics were reported.

## Not verified here

A full `npm run lint` / production build and live browser testing could not be completed because dependency installation did not finish in this execution environment. The package engine is now documented as Node 24.12+; run `npm ci`, `npm run lint` and `npm run build` with Node 24.12+ before deployment. Firebase/Supabase production operations also require the project's real environment variables and deployed security rules.
