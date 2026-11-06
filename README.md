# Portfolio 2.0 - Documentation

This portfolio is built with a centralized, data-driven architecture. 

## 1. How to Add a New Project
To add a new project, follow these steps:

1.  **Add Images**: Place your project screenshots in a new folder at `/public/images/projects/your-project-id/`.
    *   `main.jpg` (Primary desktop screenshot)
    *   Additional screenshots can be added here.
2.  **Update Data**: Open `src/data/portfolio.ts` and add a new entry to the `PROJECTS` array following the `Project` interface structure.
    *   Ensure the `id` and `slug` are unique.
    *   Ensure the `mainScreenshot` path matches the file you added in Step 1, using the `getPath` helper.
3.  **Verification**: Start the development server. The project will automatically appear in the appropriate section (Completed/Upcoming) based on its `status` and `featured` setting. If there are any validation errors, check the browser console.

## 2. Architecture Overview
*   **Centralized Data**: All site content (Projects, Skills, Education, Experience, Nav, Socials) is managed in `src/data/portfolio.ts`.
*   **Reusable Components**: Components like `ProjectCard` in `ProjectsCatalogue.tsx` map over the centralized data automatically.
*   **Static Site**: No backend is required.

## 3. Deployment
The project is configured for deployment to GitHub Pages. It uses the `vite.config.ts` base path configuration (`/My-Portfolio-2.0/`). To build for production, run `npm run build`.

## Certifications & Achievements

The public portfolio includes a live Certifications section (`#certifications`). The private certificate manager is available from the Academic Admin Dashboard sidebar (`Certificates Manager`) or directly at `/#admin-certificates`.

Before using uploads, deploy the included `storage.rules` in Firebase Storage Rules and the updated `firestore.rules` in Firestore Rules. The manager stores certificate metadata in the `certifications` collection and files under `certifications/` in Firebase Storage. Only the configured administrator email can create, edit, publish or delete records. Public pages query published records only. Do not upload marksheets, identity documents or other private academic records into the public certificates collection.

The source archive did not contain original certificate files or original school/university marksheets. The public section therefore starts empty by design; add only genuine documents and verified metadata through the admin manager. Existing academic values in `src/data/education.ts` were retained and not independently verified against original marksheets.
