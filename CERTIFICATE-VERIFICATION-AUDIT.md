# Certificate verification-link audit

The bundled catalog contains 42 original certificate images. Each source image was inspected for a printed individual verification URL. The catalog now includes the 23 credential-specific URLs visible on the supplied certificates; their credential IDs are also copied from the URL path where applicable.

## Safety behavior

- Issuer homepages and generic account/transcript pages are not treated as credential verification links.
- The public portfolio shows a Verify Credential action only for a credential-specific HTTPS URL.
- Certificates without a printed or otherwise supplied individual verification URL retain their original certificate preview/download; the UI clearly indicates that no verification link was supplied.
- The bulk scanner only proposes known URL formats when a credential ID exists. Suggestions remain pending and require administrator review.
- An administrator cannot mark a generic homepage as Approved.

## Certificates with an individual URL in the supplied image

- 06, 08, 09, 15, 18, 19, 22, 26, 29, 31, 32, 33, 40, 41, 42 — Microsoft Learn achievement print pages.
- 10, 11, 23, 27, 34, 37, 39 — Coursera verification pages.
- 21 — Credly public badge page.

## Certificates without an individual verification URL in the supplied source

01, 02, 03, 04, 05, 07, 12, 13, 14, 16, 17, 20, 24, 25, 28, 30, 35, 36, 38.

For these 19 records, no verification URL has been fabricated. If the issuer account provides an individual credential URL later, an administrator can add it in Certificate CMS and review it before publication.

## Important

This audit records URLs printed in the provided certificate images. It does not claim that each remote issuer page was independently live-checked or that the issuing organization has separately re-confirmed each credential during this code audit.
