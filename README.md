# 🌟 Nitesh Kumar — Developer Portfolio & Admin CMS 2.0

<div align="center">

![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24.12+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.8_Flash-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

<p align="center">
  A state-of-the-art, high-performance personal developer portfolio and full-featured Admin CMS built for <strong>Nitesh Kumar</strong> (Full-Stack MERN Developer & AI Explorer).
  <br />
  Featuring live academic transcript verification, 42+ verified certifications, automated PDF resume generation, hidden Google-authenticated CMS, and server-side <strong>Google Gemini 3.8 Flash AI document scanning</strong>.
</p>

[✨ Live Preview](https://ais-dev-oe6qbjz4s6oqsk3b5ppqce-378684240832.asia-southeast1.run.app) • [📋 Report Issue](https://github.com/niteshkumar/my-portfolio-2.0/issues) • [📬 Contact Developer](mailto:nitesh933438@gmail.com)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Public Portfolio Showcase](#1-public-portfolio-showcase)
  - [Interactive Resume & PDF Export](#2-interactive-resume--pdf-export)
  - [Private Admin CMS](#3-private-admin-cms)
  - [AI Document Scanner (Gemini 3.8 Flash)](#4-ai-document-scanner-gemini-38-flash)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running Locally](#running-locally)
- [Security & Authentication](#-security--authentication)
  - [Admin Access & Privacy](#admin-access--privacy)
  - [Firebase Security Rules](#firebase-security-rules)
- [Deployment Guide](#-deployment-guide)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Author & Credits](#-author--credits)

---

## 🚀 Overview

**Portfolio 2.0** is engineered to be more than a static personal site. It represents an integrated developer platform combining:
1. **Interactive Client UI**: Built with React 19, Motion (Framer Motion), Tailwind CSS v4, Lucide Icons, and responsive PWA standards.
2. **Robust Backend API**: Full-stack Express server providing secure backend AI proxy routes, Supabase file storage management, and admin token verification.
3. **Cloud Persistence**: Real-time Firebase Firestore database for dynamic project, skill, and certification updates with client-side fallback caching.
4. **Intelligent Automation**: Server-side Gemini 3.8 Flash vision models that inspect marksheet & certificate images and auto-populate all CMS metadata fields in seconds.

---

## 💎 Key Features

### 1. Public Portfolio Showcase
- **Hero & Intro**: Dynamic role typewriter effect, interactive call-to-actions, social media badges, live availability status, and smooth scroll anchors.
- **Academic Records & University Transcripts**:
  - Live semester-by-semester SGPA / CGPA score tracking.
  - Official marksheet viewer with security verification badges.
  - Real-time updates synced directly from Firebase Firestore.
- **Skills Matrix**: Categorized tech stack (Frontend, Backend, Databases, AI, Cloud/DevOps, Tools) with proficiency ratings and animated interactive cards.
- **Projects Catalogue**:
  - Filter by category: *All, Full-Stack MERN, AI / ML, Frontend, Mobile*.
  - Comprehensive modal popups with screenshots, feature lists, tech stack tags, GitHub repositories, and live deployment links.
- **Certifications & Audit Hub**:
  - Complete catalog of 42 original certificates.
  - Built-in instant search and issuer filter (Coursera, HackerRank, Google, Udemy, Great Learning, etc.).
  - Dedicated QR code verification landing route (`/#/verify-certificate/:id`) with issuer verification URL detection.
- **Smart Navigation**:
  - Zero-flicker routing using hash-based navigation (`/#/projects`, `/#/certifications`, etc.).
  - Session-aware intro screen (only displays once per browser session; back navigation instantly preserves scroll state).

### 2. Interactive Resume & PDF Export
- **Live In-App Modal**: Clean preview of academic highlights, skills, core competencies, and project history.
- **Instant PDF Download & Print**:
  - Powered by `jsPDF` for high-fidelity vector PDF generation.
  - Optimized `@media print` CSS ensuring print jobs and PDF exports render crisp typography without page-break glitches.

### 3. Private Admin CMS
- **Discrete & Secure**: Hidden from public visitors (removed from navbar and footer text).
- **Google OAuth Guard**: Protected via Firebase Authentication; only authorized administrator accounts are permitted access.
- **Full Content Control**:
  - **Projects Management**: Add new projects, update live URLs, reorder priorities, or edit markdown descriptions.
  - **Certificates Management**: Upload certificate assets to Supabase Storage, auto-detect verification links, and publish to Firestore.
  - **Academic CMS**: Publish new semester results, update credit hours, and upload official marksheets.
  - **Messages Inbox**: Review and manage inquiries sent through the public contact form.

### 4. AI Document Scanner (Gemini 3.8 Flash)
- **Zero-Key Leak Architecture**: Uses server-side `@google/genai` TypeScript SDK via Express proxy route (`/api/ai/scan-certificate`).
- **Vision-Driven Metadata Extraction**: Upload any image file (`.png`, `.jpg`, `.jpeg`, `.webp`), and Gemini AI automatically extracts:
  - Certificate / Degree Name
  - Issuing Organization / University
  - Issue Date
  - Credential ID / Roll Number
  - Direct Verification URL (scanned from printed text / QR code)
  - Key Skills & Topics Covered
- **One-Click Auto-Fill**: Injects all extracted data directly into the CMS form for rapid publishing.

---

## 🛠 Tech Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
│  React 19 + TypeScript • Tailwind CSS v4 • Motion (Motion)  │
│      Vite 8 • PWA Manifest • Lucide Icons • jsPDF           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (Real-Time Reads & UI)          (Protected Operations)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│      Firebase Firestore      │ │     Express Backend API     │
│   Auth • Security Rules      │ │      (Node.js 24 / tsx)     │
└──────────────────────────────┘ └───────┬─────────────┬───────┘
                                         │             │
                             (Gemini Vision)   (Storage Proxy)
                                         │             │
                                         ▼             ▼
                         ┌───────────────────┐ ┌───────────────┐
                         │ Google Gemini AI  │ │   Supabase    │
                         │    (3.8 Flash)    │ │    Storage    │
                         └───────────────────┘ └───────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19 (`react`, `react-dom`, `react-router-dom` v7) |
| **Language & Tooling** | TypeScript 7, Vite 8, ESBuild, PostCSS, Autoprefixer |
| **Styling & Motion** | Tailwind CSS v4 (`@import "tailwindcss";`), Motion (`motion/react`) |
| **Backend & Runtime** | Node.js (>=24.12.0), Express 4.x, `tsx` (TypeScript Execution) |
| **Database & Auth** | Google Firebase (Firestore Database, Firebase Auth with Google Provider) |
| **Object Storage** | Supabase Storage (Certificate & Marksheet assets uploaded via backend proxy) |
| **Artificial Intelligence** | Google Gemini 3.8 Flash (`@google/genai` SDK) for OCR & description generation |
| **Icons & Utilities** | Lucide React, Sharp, Multer, jsPDF, Dotenv, Cors |

---

## 📂 Project Directory Structure

```text
my-portfolio-2.0/
├── public/                       # Static public assets
│   ├── certificates/             # 42 bundled high-res certificate images
│   ├── favicon.svg               # Vector brand icon
│   ├── icon-192x192.png          # PWA 192px mobile icon
│   ├── icon-512x512.png          # PWA 512px desktop & splash icon
│   └── manifest.json             # Web App Manifest
├── src/
│   ├── components/               # Reusable UI & CMS Components
│   │   ├── AcademicAdminDashboard.tsx  # Academic marksheet CMS modal
│   │   ├── AdminAuthGuard.tsx          # Google Auth RBAC security guard
│   │   ├── AIScanner.tsx               # Gemini 3.8 Flash document scanner
│   │   ├── CertificateModal.tsx        # High-res certificate viewer
│   │   ├── CertificateVerifyPage.tsx   # QR code verification landing view
│   │   ├── LoadingScreen.tsx           # Session-aware initial loader
│   │   ├── Navbar.tsx                  # Responsive header & drawer navigation
│   │   ├── ResumeModal.tsx             # Interactive resume & PDF export modal
│   │   └── ...
│   ├── data/                     # Local fallback data & catalog definitions
│   │   ├── certificates.ts       # 42 verified certificate records
│   │   ├── education.ts          # University & semester records
│   │   ├── projects.ts           # Project catalog & tech stacks
│   │   └── skills.ts             # Skills categories & ratings
│   ├── services/                 # Cloud & API Service Clients
│   │   ├── academicFirebase.ts   # Firebase client initialization & auth
│   │   ├── certificateFirebase.ts# Firestore certificate CRUD & search
│   │   └── supabaseStorage.ts    # Secure file proxy upload helper
│   ├── types/                    # Shared TypeScript interfaces & types
│   ├── App.tsx                   # Main router & root application component
│   ├── index.css                 # Global CSS & Tailwind CSS v4 rules
│   └── main.tsx                  # React DOM entry point
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Cloud storage security rules
├── server.ts                     # Full-stack Express server (API & dev server)
├── vite.config.ts                # Vite 8 configuration
└── package.json                  # Dependencies & scripts
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `24.12.0` or higher (`node -v`)
- **npm**: `10.0.0` or higher (`npm -v`)
- A Firebase project with Firestore and Google Authentication enabled.
- A Supabase project with a public or authenticated Storage bucket.
- A Google Gemini API Key (`GEMINI_API_KEY`).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/niteshkumar/my-portfolio-2.0.git
   cd my-portfolio-2.0
   ```

2. **Install all dependencies**:
   ```bash
   npm ci
   ```

### Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Server-Side Secrets (Never expose to client or prefix with VITE_)
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_STORAGE_BUCKET=certificates

# Client-Side Configuration (Public Firebase config)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running Locally

Start the full-stack development server (Express + Vite middlewares):

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔒 Security & Authentication

### Admin Access & Privacy
- **Public Concealment**: No visible "Admin" buttons exist on the navbar or mobile menu to protect administrative privacy.
- **How to Open the Admin Console**:
  1. **Direct URL**: Navigate to `/#/admin` in your browser.
  2. **Keyboard Shortcut**: Press `Ctrl + Shift + Z` (Windows/Linux) or `Cmd + Shift + Z` (macOS). Also supports `Ctrl + Shift + A`.
  3. **Discreet Footer Dot**: Click the subtle separator bullet (`•`) beside the copyright notice in the footer.
- **Role-Based Access Control (RBAC)**:
  - Users sign in using the official Google Sign-In prompt.
  - The app strictly checks against authorized administrator emails (`src/services/academicFirebase.ts`).
  - Unauthorized users are immediately presented with an "Unauthorized Account" notice with zero access to CMS operations.

### Firebase Security Rules
Deploy the included `firestore.rules` to protect your database in production:

```bash
firebase deploy --only firestore:rules
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public can read portfolio items; only admin can write
    match /certifications/{certId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.email == 'nitesh933438@gmail.com' || request.auth.token.email == 'niteshkumarbaliyakothi@gmail.com');
    }
    match /academic_records/{recordId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.email == 'nitesh933438@gmail.com' || request.auth.token.email == 'niteshkumarbaliyakothi@gmail.com');
    }
  }
}
```

---

## 🚢 Deployment Guide

### Recommended: Combined Node.js Web Service (Render / Railway / Cloud Run)

Because this application includes server-side AI endpoints and Supabase storage upload proxies, it runs as a unified full-stack Node service.

1. **Build the application**:
   ```bash
   npm run build
   ```
   This compiles the Vite frontend into `/dist` and bundles `server.ts` into a standalone `server.js` via esbuild.

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Deploy with `render.yaml`**:
   The repository includes a ready-to-use `render.yaml` specification for 1-click continuous deployment from GitHub.

---

## ⌨ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + Shift + Z` / `Cmd + Shift + Z` | Open Secret Admin CMS (also `Ctrl + Shift + A`) | Anywhere |
| `Esc` | Close any active modal (Resume, Certificate, Marksheet) | Modal Open |
| `Alt + Home` | Return to top of portfolio | Anywhere |

---

## 👨‍💻 Author & Credits

**Nitesh Kumar**  
Full-Stack Developer & Problem Solver  
📍 Rohtas, Bihar, India  
- **GitHub**: [@niteshkumar](https://github.com/niteshkumar)  
- **LinkedIn**: [Nitesh Kumar](https://linkedin.com/in/nitesh-kumar-dev)  
- **Email**: [nitesh933438@gmail.com](mailto:nitesh933438@gmail.com)  

---

<div align="center">
  <sub>Built with ❤️ by Nitesh Kumar. All rights reserved.</sub>
</div>
