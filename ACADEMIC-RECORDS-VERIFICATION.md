# Academic records — private-source verification

The supplied `Marksheet.zip` was reviewed. Original scans are intentionally **not copied into the public website or repository** because they contain personal identifiers and family details. Keep the originals in a private, access-controlled storage location.

## Public-safe academic summary cross-check

| Record | Source document | Values read from supplied document | Existing portfolio data |
|---|---|---|---|
| BSEB Class 10 (2023) | `10th Marksheet.jpg` | Aggregate 399/500; First Division | 399/500; 79.8%; First Division |
| BSEB Class 12 (2025) | `12th Marksheet.jpg` | Aggregate 393; First Division; Science stream | 393/500; 78.6%; First Division; Science |
| B.Tech Semester 1 | `Marksheet 1st Sem.jpg` | SGPA 7.91; date 28-Feb-2026 | SGPA 7.91; 28 February 2026 |
| B.Tech Semester 2 | `Marksheet 2nd Sem.jpg` | SGPA 9.23; date 20-Jul-2026 | SGPA 9.23; 20 July 2026 |

The displayed portfolio values match the supplied scans. No CGPA is added because none is shown as officially declared in the supplied records. Semesters 3–8 remain Upcoming. Subject-wise marks, roll numbers, registration numbers, dates of birth, parent names, school codes and QR/barcodes are not copied into the public site.

## Private document handling

- Do not put original marksheets under `public/`, `src/assets/`, or any public static hosting directory.
- Do not commit original marksheet scans to Git.
- Store them only in a private Firebase Storage path with administrator-only read/write rules.
- Public Firestore academic documents must contain only the approved projection fields used by the Education UI.
- AI extraction output must remain pending until an administrator manually compares it with the original document.
