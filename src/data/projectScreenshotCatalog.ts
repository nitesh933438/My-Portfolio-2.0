export interface ScreenshotCatalogEntry {
  filenameMatch: string;
  title: string;
  category: string;
  caption: string;
}

export const EXCLUDED_SCREENSHOT_FILENAMES = [
  '05-screenshot-2026-09-23-163001.png', // Accidental LinkedIn post compose screenshot in worksphere-hrms
  'project_money_details_banner_1793535140541.jpg',
  'project_whatsapp_ai_banner_1793535138238.jpg',
  'project_worksphere_hrms_banner_1793535140106.jpg',
  'images/projects/money-details/main.jpg',
  'images/projects/whatsapp-personal-ai-bot/main.jpg',
  'images/projects/worksphere-hrms/main.jpg',
  'images/projects/digital-vault/main.jpg',
  'images/projects/golden-road-safety/main.jpg',
  'images/projects/attendx-ai/main.jpg',
  'images/projects/road-safety/main.jpg',
];

export const PROJECT_SCREENSHOT_CATALOG: Record<string, ScreenshotCatalogEntry[]> = {
  'money-details': [
    // 01 – Official Project Poster Cover
    {
      filenameMatch: 'money_details_banner_1793870364321.jpg',
      title: 'Money Details – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing Money Details (Premium Finance Tracker – Track. Plan. Grow.) with smart budgeting and expense insights.'
    },
    // Desktop Web Application Views (14)
    {
      filenameMatch: '05-screenshot-2026-11-01-160007.png',
      title: 'Desktop – Secure Sign In & Google OAuth',
      category: 'Desktop Web',
      caption: 'Firebase 256-bit encrypted sign-in portal with email/password and Google OAuth authentication.'
    },
    {
      filenameMatch: '14-screenshot-2026-11-01-160639.png',
      title: 'Desktop – Create Account & Registration',
      category: 'Desktop Web',
      caption: 'New user onboarding screen for creating a personal finance account.'
    },
    {
      filenameMatch: '06-screenshot-2026-11-01-160257.png',
      title: 'Desktop – Financial Command Center Dashboard',
      category: 'Desktop Web',
      caption: 'Live overview of total income, total expenses, net balance, savings rate, Udhaar net, and advanced filters.'
    },
    {
      filenameMatch: '07-screenshot-2026-11-01-160313.png',
      title: 'Desktop – Expense Tracker & UPI Transaction Feed',
      category: 'Desktop Web',
      caption: 'Searchable expense ledger with category tags, payment mode filters, batch selection, and one-click export.'
    },
    {
      filenameMatch: '08-screenshot-2026-11-01-160326.png',
      title: 'Desktop – Monthly Budgets & Spending Guardrails',
      category: 'Desktop Web',
      caption: 'Budget threshold tracking with daily, weekly, and monthly limits plus real-time breach alerts.'
    },
    {
      filenameMatch: '09-screenshot-2026-11-01-160337.png',
      title: 'Desktop – Udhaar / Lending & Borrowing Ledger',
      category: 'Desktop Web',
      caption: 'Person-wise lending and borrowing tracker showing net amounts to get and to give.'
    },
    {
      filenameMatch: '10-screenshot-2026-11-01-160347.png',
      title: 'Desktop – College Fees Analytics & Breakdown',
      category: 'Desktop Web',
      caption: 'Academic fee tracker with interactive donut charts for fee-type and funding-source distribution.'
    },
    {
      filenameMatch: '11-screenshot-2026-11-01-160406.png',
      title: 'Desktop – Consolidated Single-Month Reports',
      category: 'Desktop Web',
      caption: 'Single-month activity overview combining income, expenses, Udhaar, and fee records.'
    },
    {
      filenameMatch: '12-screenshot-2026-11-01-160418.png',
      title: 'Desktop – Multi-Month Consolidated Analytics',
      category: 'Desktop Web',
      caption: 'Interactive multi-month selector comparing income, expenses, and Udhaar activity across selected months.'
    },
    {
      filenameMatch: '13-screenshot-2026-11-01-160433.png',
      title: 'Desktop – Custom Date-Range Financial Reports',
      category: 'Desktop Web',
      caption: 'Custom start and end date filtering for granular financial audit and export.'
    },
    {
      filenameMatch: '01-screenshot-2026-11-01-115228.png',
      title: 'Desktop – Activity History Audit Log',
      category: 'Desktop Web',
      caption: 'Complete chronological audit trail of logins, transaction edits, budget updates, and PDF exports.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-01-122319.png',
      title: 'Desktop – Recycle Bin & Deleted Record Recovery',
      category: 'Desktop Web',
      caption: 'Soft-delete recovery modal allowing instant restoration of deleted Udhaar or expense entries.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-01-122344.png',
      title: 'Desktop – Real-Time Notifications Popover',
      category: 'Desktop Web',
      caption: 'Instant system notifications for transaction updates, Google logins, and PDF report exports.'
    },
    {
      filenameMatch: '04-screenshot-2026-11-01-122512.png',
      title: 'Desktop – Quick Navigation & System Status Footer',
      category: 'Desktop Web',
      caption: 'Application footer with module links, legal policies, version status, and developer contact card.'
    },

    // Mobile Responsive Views (14)
    {
      filenameMatch: '01-screenshot-2026-11-01-16-09-26-91-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Secure Sign In Screen',
      category: 'Mobile App',
      caption: 'Mobile-first authentication interface with Google OAuth and dark mode toggle.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-01-16-09-31-48-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Create Account Screen',
      category: 'Mobile App',
      caption: 'Responsive mobile registration card for new users.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-01-16-10-21-43-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Financial Command Center Dashboard',
      category: 'Mobile App',
      caption: 'Stacked KPI cards and sticky bottom navigation bar optimized for mobile screens.'
    },
    {
      filenameMatch: '04-screenshot-2026-11-01-16-10-26-58-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Expenses & UPI Transactions Feed',
      category: 'Mobile App',
      caption: 'Mobile transaction list with quick filters, search bar, and one-tap edit/delete controls.'
    },
    {
      filenameMatch: '05-screenshot-2026-11-01-16-10-32-70-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Monthly Budgets & Spending Limits',
      category: 'Mobile App',
      caption: 'Mobile budget progress tracking and limit monitoring.'
    },
    {
      filenameMatch: '06-screenshot-2026-11-01-16-10-37-44-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Udhaar Lending & Borrowing Book',
      category: 'Mobile App',
      caption: 'Mobile Udhaar ledger with person-wise balances and transaction history.'
    },
    {
      filenameMatch: '07-screenshot-2026-11-01-16-10-45-64-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – College Fees & Donut Analytics',
      category: 'Mobile App',
      caption: 'Mobile view of university semester and exam fee payments with breakdown charts.'
    },
    {
      filenameMatch: '08-screenshot-2026-11-01-16-10-50-73-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Single-Month Consolidated Report',
      category: 'Mobile App',
      caption: 'Mobile consolidated monthly report view with quick export button.'
    },
    {
      filenameMatch: '09-screenshot-2026-11-01-16-11-02-41-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Multi-Month Consolidated Report',
      category: 'Mobile App',
      caption: 'Mobile multi-month financial comparison and transaction feed.'
    },
    {
      filenameMatch: '10-screenshot-2026-11-01-16-11-17-70-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Custom Date-Range Report',
      category: 'Mobile App',
      caption: 'Mobile date-range report filtering across all financial modules.'
    },
    {
      filenameMatch: '11-screenshot-2026-11-01-16-11-27-66-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Activity History Audit Log',
      category: 'Mobile App',
      caption: 'Full-screen mobile audit log tracking every user action and data export.'
    },
    {
      filenameMatch: '12-screenshot-2026-11-01-16-11-34-05-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Recycle Bin Recovery Modal',
      category: 'Mobile App',
      caption: 'Mobile recycle bin dialog for restoring deleted financial records.'
    },
    {
      filenameMatch: '13-screenshot-2026-11-01-16-11-51-44-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Live Notifications Popover',
      category: 'Mobile App',
      caption: 'Mobile notifications dropdown showing session logins and activity alerts.'
    },
    {
      filenameMatch: '14-screenshot-2026-11-01-16-12-37-30-40deb401b9ffe8e1df2f1cc5ba480b12.jpg',
      title: 'Mobile – Bottom Navigation Dock & Footer',
      category: 'Mobile App',
      caption: 'Floating mobile navigation bar with quick module switching.'
    },

    // PDF Financial Reports (9)
    {
      filenameMatch: '01-screenshot-2026-11-01-162131.png',
      title: 'PDF Export – Udhaar / Lending Financial Ledger',
      category: 'PDF Report',
      caption: 'Generated PDF statement of all Udhaar lending and borrowing records with running balances.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-01-162222.png',
      title: 'PDF Export – Financial Transactions Report',
      category: 'PDF Report',
      caption: 'Exported PDF ledger of 159 income and expense transactions with net savings summary.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-01-162241.png',
      title: 'PDF Export – Monthly Consolidated Report',
      category: 'PDF Report',
      caption: 'Single-month consolidated PDF statement combining Expense Tracker and Udhaar records.'
    },
    {
      filenameMatch: '04-screenshot-2026-11-01-162302.png',
      title: 'PDF Export – 3-Month Consolidated Statement',
      category: 'PDF Report',
      caption: 'Multi-month PDF financial report aggregating quarterly income, expenses, and lending.'
    },
    {
      filenameMatch: '05-screenshot-2026-11-01-162321.png',
      title: 'PDF Export – Custom Date-Range Statement',
      category: 'PDF Report',
      caption: 'Custom period PDF financial statement with filtered totals and module sources.'
    },
    {
      filenameMatch: '06-screenshot-2026-11-01-162341.png',
      title: 'PDF Export – Full Financial Activity Master Report',
      category: 'PDF Report',
      caption: 'Comprehensive 299-record master PDF export covering all transactions, Udhaar, and college fees.'
    },
    {
      filenameMatch: '07-screenshot-2026-11-01-162403.png',
      title: 'PDF Export – College Fees Payment Report',
      category: 'PDF Report',
      caption: 'Official academic fee payment PDF statement listing semester fees, exam fees, and funding sources.'
    },
    {
      filenameMatch: '08-screenshot-2026-11-01-162419.png',
      title: 'PDF Export – Monthly Budgets Compliance Report',
      category: 'PDF Report',
      caption: 'Exported PDF summary of allocated budgets, spent amounts, remaining balances, and usage percentages.'
    },
    {
      filenameMatch: '09-screenshot-2026-11-01-162439.png',
      title: 'PDF Export – Personal Expense Breakdown',
      category: 'PDF Report',
      caption: 'Category-filtered PDF expense breakdown report.'
    }
  ],

  'whatsapp-personal-ai-bot': [
    {
      filenameMatch: 'whatsapp_ai_banner_1793870364243.jpg',
      title: 'WhatsApp Personal AI Bot – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing WhatsApp Personal AI Bot – AI-Powered Automation for WhatsApp chat and dashboard overview.'
    },
    {
      filenameMatch: '01-desktop-01.png',
      title: 'Desktop – Personal WhatsApp AI Home & QR Pairing',
      category: 'Desktop Web',
      caption: 'Main dashboard for connecting a WhatsApp number via QR code and managing live AI auto-reply status.'
    },
    {
      filenameMatch: '02-desktop-02.png',
      title: 'Desktop – Live AI Chat & Conversation Inbox',
      category: 'Desktop Web',
      caption: 'Real-time WhatsApp message inbox with unread filtering and automated Hinglish/English AI replies.'
    },
    {
      filenameMatch: '03-desktop-03.png',
      title: 'Desktop – Synced WhatsApp Contacts Directory',
      category: 'Desktop Web',
      caption: 'Searchable list of synced WhatsApp contacts with last message preview and one-click chat launch.'
    },
    {
      filenameMatch: '04-desktop-04.png',
      title: 'Desktop – Activity Center & Notification Logs',
      category: 'Desktop Web',
      caption: 'Centralized notification hub tracking incoming messages, AI replies, and WhatsApp pairing events.'
    },
    {
      filenameMatch: '05-desktop-05.png',
      title: 'Desktop – AI Auto-Reply & Away Mode Settings',
      category: 'Desktop Web',
      caption: 'Control panel for toggling AI auto-reply, configuring away mode, and reconnecting WhatsApp sessions.'
    },
    {
      filenameMatch: '06-desktop-06.png',
      title: 'Desktop – Admin Workspace Control Center Login',
      category: 'Desktop Web',
      caption: 'Protected self-hosted admin console login with light/dark theme switcher.'
    },
    {
      filenameMatch: '07-mobile-01.jpg',
      title: 'Mobile – Personal WhatsApp AI Home & Connection',
      category: 'Mobile App',
      caption: 'Responsive mobile home screen for pairing WhatsApp and checking live AI status.'
    },
    {
      filenameMatch: '08-mobile-02.jpg',
      title: 'Mobile – Live WhatsApp Chat List & Search',
      category: 'Mobile App',
      caption: 'Mobile conversation list with All/Unread tabs and instant chat search.'
    },
    {
      filenameMatch: '09-mobile-03.jpg',
      title: 'Mobile – Contacts Directory & Quick Actions',
      category: 'Mobile App',
      caption: 'Mobile contact cards with direct Open Chat and Delete controls.'
    },
    {
      filenameMatch: '10-mobile-04.jpg',
      title: 'Mobile – Activity Center & Unread Alerts',
      category: 'Mobile App',
      caption: 'Mobile notification center summarizing total and unread system events.'
    },
    {
      filenameMatch: '11-mobile-05.jpg',
      title: 'Mobile – AI Assistant & Account Settings',
      category: 'Mobile App',
      caption: 'Mobile settings panel for toggling AI auto-reply and managing connected numbers.'
    },
    {
      filenameMatch: '12-mobile-06.jpg',
      title: 'Mobile – Admin Control Center Login',
      category: 'Mobile App',
      caption: 'Mobile sign-in view for the protected WhatsApp AI admin console.'
    }
  ],

  'worksphere-hrms': [
    {
      filenameMatch: 'worksphere_hrms_banner_1793870364647.jpg',
      title: 'WorkSphere HRMS – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing WorkSphere HRMS enterprise analytics dashboard, headcount growth, attendance, and performance metrics.'
    },
    {
      filenameMatch: '01-admin.png',
      title: 'Admin Portal – Business Overview & Quick Actions',
      category: 'Role Dashboards',
      caption: 'Executive administrator dashboard featuring headcount metrics, attendance trends, and quick HR actions.'
    },
    {
      filenameMatch: '02-employee.png',
      title: 'Employee Portal – Self-Service Workspace',
      category: 'Role Dashboards',
      caption: 'Employee self-service dashboard for checking attendance, leave balances, payslips, and announcements.'
    },
    {
      filenameMatch: '03-hr.png',
      title: 'HR Portal – Workforce & Recruitment Hub',
      category: 'Role Dashboards',
      caption: 'Dedicated HR specialist view for managing employee onboarding, department allocation, and policies.'
    },
    {
      filenameMatch: '04-manager.png',
      title: 'Manager Portal – Team Approvals & Performance',
      category: 'Role Dashboards',
      caption: 'Team manager console for reviewing direct reports, approving leave requests, and tracking attendance.'
    },
    {
      filenameMatch: '06-screenshot-2026-09-23-171212.png',
      title: 'Live Admin Dashboard – Headcount & Payroll Metrics',
      category: 'Enterprise Modules',
      caption: 'Real-time operational metrics showing active employees, present today, pending leaves, and monthly payroll.'
    },
    {
      filenameMatch: '07-screenshot-2026-09-23-171232.png',
      title: 'Employee Directory – Department & Role Management',
      category: 'Enterprise Modules',
      caption: 'Searchable organization directory with role badges, department filters, and profile actions.'
    },
    {
      filenameMatch: '08-screenshot-2026-09-23-171255.png',
      title: 'Attendance Workspace – Live Location Check-In & Logs',
      category: 'Enterprise Modules',
      caption: 'Daily attendance tracker with live check-in/check-out timestamps, work hours, and location status.'
    },
    {
      filenameMatch: '09-screenshot-2026-09-23-171308.png',
      title: 'Leave Management – Request Tracking & Approvals',
      category: 'Enterprise Modules',
      caption: 'Leave application and approval workflow with category breakdowns and status filters.'
    },
    {
      filenameMatch: '10-screenshot-2026-09-23-171353.png',
      title: 'Payroll Engine – Salary Breakdown & Disbursement',
      category: 'Enterprise Modules',
      caption: 'Administrator payroll management module displaying base salary, allowances, deductions, and net pay.'
    }
  ],

  'nova-ai-assistant': [
    {
      filenameMatch: 'main.jpg',
      title: 'NOVA AI Assistant – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Interactive AI chat workspace with Python syntax highlighting, model switching, and voice input.'
    }
  ],

  'digital-vault': [
    {
      filenameMatch: 'digital_vault_banner_1793870364923.jpg',
      title: 'Digital Vault – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing Digital Vault Secure Digital Locker with AES-256 encryption, encrypted document management, and password security.'
    },
    {
      filenameMatch: '10-landing-page.png',
      title: 'Public Landing Page & Security Architecture',
      category: 'User Portal',
      caption: 'Product landing page highlighting encrypted document storage, cloud sync, and zero-trust security.'
    },
    {
      filenameMatch: '11-login.png',
      title: 'Secure User Login & Authentication',
      category: 'User Portal',
      caption: 'Encrypted vault sign-in portal with credential validation.'
    },
    {
      filenameMatch: '14-register.png',
      title: 'New User Account Registration',
      category: 'User Portal',
      caption: 'Account creation workflow for initializing a private digital document vault.'
    },
    {
      filenameMatch: '07-dashboard.png',
      title: 'User Vault Dashboard & Storage Overview',
      category: 'User Portal',
      caption: 'Personal vault dashboard displaying recent documents, category counts, and storage utilization.'
    },
    {
      filenameMatch: '08-documents.png',
      title: 'Encrypted Documents Repository & Categorization',
      category: 'User Portal',
      caption: 'Document manager for uploading, previewing, tagging, and downloading sensitive files.'
    },
    {
      filenameMatch: '09-favorites.png',
      title: 'Starred & Favorite Documents View',
      category: 'User Portal',
      caption: 'Quick-access collection of pinned and frequently used credentials and documents.'
    },
    {
      filenameMatch: '16-storage-details.png',
      title: 'Cloud Storage Quota & File Type Breakdown',
      category: 'User Portal',
      caption: 'Visual storage analytics showing space consumed by PDFs, images, archives, and notes.'
    },
    {
      filenameMatch: '12-notifications.png',
      title: 'User Notification Center & Security Alerts',
      category: 'User Portal',
      caption: 'Real-time alert log for account activity, admin broadcasts, and security updates.'
    },
    {
      filenameMatch: '13-profile.png',
      title: 'User Profile & Identity Management',
      category: 'User Portal',
      caption: 'Personal account profile settings and verification details.'
    },
    {
      filenameMatch: '15-settings.png',
      title: 'Vault Security & Account Preferences',
      category: 'User Portal',
      caption: 'Security configuration panel for password updates, session controls, and preferences.'
    },
    {
      filenameMatch: '02-admin-dashboard.png',
      title: 'Admin Console – System Overview & Analytics',
      category: 'Admin Console',
      caption: 'Administrator command center monitoring total users, stored documents, and platform health.'
    },
    {
      filenameMatch: '06-admin-user-management.png',
      title: 'Admin Console – User Accounts & Access Control',
      category: 'Admin Console',
      caption: 'User directory for managing account status, storage quotas, and role permissions.'
    },
    {
      filenameMatch: '03-admin-document-management.png',
      title: 'Admin Console – Global Document Audit & Management',
      category: 'Admin Console',
      caption: 'Administrative oversight panel for auditing uploaded document metadata and storage compliance.'
    },
    {
      filenameMatch: '05-admin-send-notification.png',
      title: 'Admin Console – Broadcast System Notifications',
      category: 'Admin Console',
      caption: 'Admin tool for dispatching real-time alerts and maintenance notices to vault users.'
    },
    {
      filenameMatch: '01-admin-contact-messages.png',
      title: 'Admin Console – Support & Contact Messages Inbox',
      category: 'Admin Console',
      caption: 'Support ticket and inquiry management inbox for responding to user messages.'
    },
    {
      filenameMatch: '04-admin-newsletter-subscribers.png',
      title: 'Admin Console – Newsletter Subscribers Directory',
      category: 'Admin Console',
      caption: 'Mailing list manager tracking subscribed users and communication preferences.'
    }
  ],

  'golden-road-safety': [
    {
      filenameMatch: 'golden_road_safety_banner_1793870365424.jpg',
      title: 'Golden Road Safety – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing Golden Road Safety – Ensuring Safer Communities on the Road with traffic guidelines, road signs, and incident reporting.'
    },
    {
      filenameMatch: '01-screenshot-2026-11-04-141641.png',
      title: 'Dashboard Overview & 1-Tap Emergency SOS Hub',
      category: 'Emergency Response',
      caption: 'GoldenGuard Citizen Safety Network dashboard with 1-Tap Emergency Help for police, ambulance, and volunteers.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-04-141946.png',
      title: 'Golden Hour SOS Dispatch & Role Verification',
      category: 'Emergency Response',
      caption: 'Role-based onboarding for Citizens and Good Samaritan Volunteers to enable verified emergency dispatch.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-04-142025.png',
      title: 'Report a Road Problem & Hazard Flagging',
      category: 'Emergency Response',
      caption: 'Interactive hazard reporting workflow for potholes, vehicle accidents, broken streetlights, and traffic issues.'
    },
    {
      filenameMatch: '04-screenshot-2026-11-04-142051.png',
      title: 'Smart Incident Map & Nearby Hospitals Radar',
      category: 'GIS & Telemetry',
      caption: 'Live road map with instant filters for hospitals, police, verified volunteers, pharmacies, and road hazards.'
    },
    {
      filenameMatch: '05-screenshot-2026-11-04-142329.png',
      title: 'Smart First Aid Assistant & CPR Metronome',
      category: 'Medical & Triage',
      caption: 'Emergency triage dashboard with symptom search, 60-minute Golden Hour timer, and 100–120 BPM CPR timer.'
    },
    {
      filenameMatch: '06-screenshot-2026-11-04-142352.png',
      title: 'User Medical Profile & Responder Readiness',
      category: 'Medical & Triage',
      caption: 'Good Samaritan profile tracking rescues conducted, Golden Hour hours, responder rating, and proximity dispatch.'
    },
    {
      filenameMatch: '07-screenshot-2026-11-04-142417.png',
      title: 'GoldenGuard Offline-to-Cloud Sync Center',
      category: 'System & PWA',
      caption: 'Offline queue manager synchronizing SOS alerts, hazard reports, and offline medical guides with Firestore.'
    },
    {
      filenameMatch: '08-screenshot-2026-11-04-142530.png',
      title: 'Install GoldenGuard Native PWA Modal',
      category: 'System & PWA',
      caption: 'Progressive Web App installation guide enabling 1-Tap SOS, 100% offline first-aid guides, and crash sensors.'
    },
    {
      filenameMatch: '09-screenshot-2026-11-04-142555.png',
      title: 'Device Battery & Power Telemetry Monitor',
      category: 'GIS & Telemetry',
      caption: 'Live device battery telemetry modal ensuring power readiness during highway emergencies.'
    },
    {
      filenameMatch: '10-screenshot-2026-11-04-142708.png',
      title: 'Hands-Free Voice SOS Command Listener',
      category: 'Emergency Response',
      caption: 'Voice-activated SOS modal listening for hands-free trigger phrases like "Help Me", "SOS", and "Call Ambulance".'
    },
    {
      filenameMatch: '11-screenshot-2026-11-04-142734.png',
      title: 'Citizen Account & Quick Safety Navigation Drawer',
      category: 'System & PWA',
      caption: 'Account menu linking Medical ID, Emergency Wallet Card, SaferRide Telemetry, and First Aid Badges.'
    },
    {
      filenameMatch: '12-screenshot-2026-11-04-142754.png',
      title: 'Categorized Emergency Notifications Center',
      category: 'System & PWA',
      caption: 'Notification drawer filtering alerts across SOS, Emergency, Hazard, System, and Community channels.'
    },
    {
      filenameMatch: '13-screenshot-2026-11-04-142837.png',
      title: 'SaferRide Guardian & Unconscious Rider Auto-SOS',
      category: 'GIS & Telemetry',
      caption: 'Real-time velocity, impact G-force, and route inactivity monitor that auto-dispatches SOS upon crash detection.'
    },
    {
      filenameMatch: '14-screenshot-2026-11-04-142941.png',
      title: 'CPR Academy & Good Samaritan Learning Hub',
      category: 'Medical & Triage',
      caption: 'Interactive lifesaver training modules covering Hands-Only CPR, severe bleeding control, and fracture care.'
    },
    {
      filenameMatch: '15-screenshot-2026-11-04-143019.png',
      title: 'Offline Queue Verification & Firestore Sync Status',
      category: 'System & PWA',
      caption: 'Real-time verification of local IndexedDB queue synchronization with cloud storage.'
    },
    {
      filenameMatch: '16-screenshot-2026-11-04-143116.png',
      title: 'Good Samaritan Network & Community Feed',
      category: 'Community & Auth',
      caption: 'Community safety hub connecting 2,405+ active volunteers with local hazard posts, tips, and leaderboards.'
    },
    {
      filenameMatch: '17-screenshot-2026-11-04-143141.png',
      title: 'About GoldenGuard Mission & 10-Minute Golden Hour',
      category: 'Community & Auth',
      caption: 'Platform mission and vision statement focused on maximizing trauma survival during the critical Golden Hour.'
    },
    {
      filenameMatch: '18-screenshot-2026-11-04-143157.png',
      title: 'Policies, Safeguards & Offline Privacy Protocol',
      category: 'Community & Auth',
      caption: 'Regulatory compliance, Good Samaritan legal protections, and client-side privacy architecture.'
    },
    {
      filenameMatch: '19-screenshot-2026-11-04-143234.png',
      title: 'Create Good Samaritan Account & Google OAuth',
      category: 'Community & Auth',
      caption: 'Responder registration modal with one-click Google OAuth and email sign-up.'
    },
    {
      filenameMatch: '20-screenshot-2026-11-04-143257.png',
      title: 'Sign In to GoldenGuard Responder Portal',
      category: 'Community & Auth',
      caption: 'Authentication modal for synchronizing Golden Hour dispatches, certifications, and community posts.'
    }
  ],

  'attendx-ai': [
    {
      filenameMatch: 'attendx_ai_banner_1793870365409.jpg',
      title: 'AttendX AI – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing AttendX AI Next-Gen AI Attendance System with live facial recognition scanning and real-time attendance logs.'
    },
    {
      filenameMatch: '01-screenshot-2026-11-04-145231.png',
      title: 'Landing Page – The Future of Smart Attendance',
      category: 'Platform Screens',
      caption: 'AttendX AI hero showcase featuring real-time attendance analytics, facial verification, and role-based access.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-04-145256.png',
      title: 'Sign In Portal & Google Workspace OAuth',
      category: 'Platform Screens',
      caption: 'Split-screen authentication portal with Google OAuth and encrypted session sign-in.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-04-145316.png',
      title: 'Student & Teacher Role-Based Registration',
      category: 'Platform Screens',
      caption: 'Account creation screen with dedicated Student and Teacher role selection.'
    }
  ],

  'road-safety': [
    {
      filenameMatch: 'road_safety_banner_1793870365256.jpg',
      title: 'Road Safety – Official Project Poster & Cover',
      category: 'Poster Cover',
      caption: 'Official project poster cover showcasing the Integrated Road Safety Platform with real-time traffic updates, safe route navigation map, and emergency dispatch guides.'
    },
    {
      filenameMatch: '01-screenshot-2026-11-04-144236.png',
      title: 'Hero Landing Page & Hackathon Demo Mode',
      category: 'Command & Triage',
      caption: 'GoldenGuard AI ecosystem hero with preloaded Hackathon Demo Mode, Simulate SOS trigger, and Pitch Mode.'
    },
    {
      filenameMatch: '02-screenshot-2026-11-04-144325.png',
      title: 'Golden Hour Hub & Live Operations Dashboard',
      category: 'Command & Triage',
      caption: 'Live command center with one-touch emergency actions: SOS Emergency, AI First Aid, Nearby Hospitals, and CPR.'
    },
    {
      filenameMatch: '03-screenshot-2026-11-04-144336.png',
      title: 'Instant Highway SOS & 60-Minute Golden Hour Timer',
      category: 'Command & Triage',
      caption: 'Emergency broadcast hub transmitting live GPS coordinates to 108 dispatch, traffic police, and nearby volunteers.'
    },
    {
      filenameMatch: '04-screenshot-2026-11-04-144347.png',
      title: 'AI Driving Guardian & Pre-Drive Safety Check',
      category: 'GIS & Telemetry',
      caption: 'Accident prevention engine with route configuration, vehicle type selector, and AI voice radar.'
    },
    {
      filenameMatch: '05-screenshot-2026-11-04-144358.png',
      title: 'AI Emergency Command Center & Tactical Telemetry',
      category: 'Command & Triage',
      caption: 'Unified GIS tactical dashboard tracking active emergencies, CPR volunteers, ambulances, and response times.'
    },
    {
      filenameMatch: '06-screenshot-2026-11-04-144605.png',
      title: 'Smart Emergency GIS Map & Multi-Layer Radar',
      category: 'GIS & Telemetry',
      caption: 'Interactive OpenStreetMap radar plotting trauma hospitals, police posts, ambulance hubs, blood banks, and black spots.'
    },
    {
      filenameMatch: '07-screenshot-2026-11-04-144728.png',
      title: 'Critical SOS Broadcast Notification Popover',
      category: 'Alerts & Profile',
      caption: 'Priority-filtered notification popover highlighting critical SOS dispatches and volunteer acceptances.'
    },
    {
      filenameMatch: '08-screenshot-2026-11-04-144804.png',
      title: 'Citizen Profile & Cloudinary Medical ID Upload',
      category: 'Alerts & Profile',
      caption: 'User profile management with Cloudinary CDN photo storage, blood group, and emergency contact settings.'
    },
    {
      filenameMatch: '09-screenshot-2026-11-04-144819.png',
      title: 'System Preferences, Dark Mode & Security Settings',
      category: 'Alerts & Profile',
      caption: 'Account preferences for dark mode appearance, push notification alerts, and password security.'
    },
    {
      filenameMatch: '10-screenshot-2026-11-04-144840.png',
      title: 'Enterprise Notification Center & Test Alert Generator',
      category: 'Alerts & Profile',
      caption: 'Real-time notification hub with interactive test triggers for SOS, AI First Aid Triage, and Black Spot alerts.'
    },
    {
      filenameMatch: '11-screenshot-2026-11-04-145000.png',
      title: 'Live GPS Coordinates & OpenStreetMap Reverse Geocoding',
      category: 'GIS & Telemetry',
      caption: 'Real-time GPS telemetry modal displaying formatted street address, coordinates, accuracy radius, and map links.'
    }
  ]
};

export const isExcludedProjectScreenshot = (urlOrPath: string): boolean => {
  if (!urlOrPath) return false;
  const lower = urlOrPath.toLowerCase();
  return EXCLUDED_SCREENSHOT_FILENAMES.some(excluded => lower.includes(excluded.toLowerCase()));
};

export const getProjectScreenshotMetadata = (
  projectId: string,
  index: number,
  imgPath: string
): { title: string; category: string; caption: string } => {
  const cleanPath = (imgPath || '').toLowerCase();
  const catalog = PROJECT_SCREENSHOT_CATALOG[projectId];

  if (catalog) {
    const matched = catalog.find(entry => cleanPath.endsWith(entry.filenameMatch.toLowerCase()) || cleanPath.includes(entry.filenameMatch.toLowerCase()));
    if (matched) {
      return {
        title: `${String(index + 1).padStart(2, '0')} – ${matched.title}`,
        category: matched.category,
        caption: matched.caption
      };
    }

    if (index < catalog.length) {
      return {
        title: `${String(index + 1).padStart(2, '0')} – ${catalog[index].title}`,
        category: catalog[index].category,
        caption: catalog[index].caption
      };
    }
  }

  if (cleanPath.includes('/banners/')) {
    return {
      title: `${String(index + 1).padStart(2, '0')} – Official Project Cover Banner`,
      category: 'Cover Banner',
      caption: 'High-resolution project cover banner and visual showcase.'
    };
  }

  return {
    title: `${String(index + 1).padStart(2, '0')} – Application Screen View`,
    category: 'Application View',
    caption: 'Interactive application interface and workflow screen.'
  };
};
