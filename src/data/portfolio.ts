import { 
  Terminal, 
  Github, 
  Linkedin, 
  Instagram, 
  Mail, 
  MessageSquare,
  Code2,
  Server,
  Cpu,
  Globe,
  Database,
  Layout,
  Layers,
  Search,
  CheckCircle,
  Clock,
  Rocket,
  Beaker,
  Archive,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Phone,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Download,
  Sparkles,
  X,
  Menu,
  Sun,
  Moon,
  ArrowUp,
  ArrowRight,
  Printer,
  Tag
} from 'lucide-react';

export const ICONS = {
  Terminal,
  Github,
  Linkedin,
  Instagram,
  Mail,
  MessageSquare,
  Code2,
  Server,
  Cpu,
  Globe,
  Database,
  Layout,
  Layers,
  Search,
  CheckCircle,
  Clock,
  Rocket,
  Beaker,
  Archive,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Phone,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Download,
  Sparkles,
  X,
  Menu,
  Sun,
  Moon,
  ArrowUp,
  ArrowRight,
  Printer,
  Tag
};

export type ProjectCategory = 
  | 'Full-Stack Development' 
  | 'AI & Automation' 
  | 'Web Applications' 
  | 'SaaS & Management' 
  | 'E-Commerce' 
  | 'Productivity & Tools' 
  | 'Education & LMS' 
  | 'Security & Storage' 
  | 'Other Projects';

export type ProjectStatus = 
  | 'Completed' 
  | 'In Progress' 
  | 'Planning' 
  | 'Coming Soon' 
  | 'Archived';

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: ProjectCategory;
  secondaryCategories?: ProjectCategory[];
  techStack: string[];
  mainScreenshot: string;
  additionalScreenshots: string[];
  githubUrl: string;
  liveDemoUrl: string;
  status: ProjectStatus;
  featured: boolean;
  displayOrder: number;
  creationDate?: string;
  keyFeatures: string[];
}

export interface Skill {
  name: string;
  level: number; // 0-100
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
  iconName: keyof typeof ICONS;
}

export interface Education {
  college: string;
  degree: string;
  status: string;
  location: string;
  description: string;
  period: string;
  highlights: string[];
  percentage?: string;
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  period: string;
  description: string;
  highlights: string[];
  type: 'Professional' | 'Independent' | 'Internship';
}

export interface SocialLink {
  platform: string;
  url: string;
  iconName: keyof typeof ICONS;
  colorClass: string;
}

export interface NavLink {
  name: string;
  href: string;
}

// Utility to handle base path correctly for both dev and production
const getPath = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `./${cleanPath}`;
};

export const SITE_CONFIG = {
  name: "Nitesh Kumar",
  portfolioVersion: "2.0",
  title: "Full-Stack Developer | MERN Stack | AI Enthusiast",
  email: "nitesh933438@gmail.com",
  whatsapp: "+91 9334387983",
  whatsappNumberDigits: "919334387983",
  location: "Rohtas, Bihar, India",
  profilePhoto: getPath('/assets/aistudio/Any_Profile_Photo_0559445a.png'),
  resumeUrl: getPath('/nitesh_kumar_resume.pdf'),
  bio: "Passionate Full-Stack MERN Developer and AI enthusiast pursuing B.Tech in Computer Science and Engineering at Arka Jain University. Building robust web applications, intelligent bots, and scalable enterprise platforms from Rohtas, Bihar.",
  aboutQuote: "Building intelligent, user-centric web systems from Rohtas, Bihar.",
  experienceSummary: "Designing, developing, and deploying 8+ end-to-end production web applications, automated bots, and AI assistants. Managing complete software development lifecycles from architecture design to deployment.",
};

export const NAV_LINKS: NavLink[] = [
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Education', href: '#education' },
  { name: 'Certifications', href: '#certifications' },
  { name: 'Contact', href: '#contact' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { 
    platform: "GitHub", 
    url: "https://github.com/nitesh933438", 
    iconName: "Github", 
    colorClass: "hover:text-indigo-600 dark:hover:text-indigo-400" 
  },
  { 
    platform: "LinkedIn", 
    url: "https://www.linkedin.com/in/nitesh933438/", 
    iconName: "Linkedin", 
    colorClass: "hover:text-indigo-600 dark:hover:text-indigo-400" 
  },
  { 
    platform: "Instagram", 
    url: "https://www.instagram.com/nitesh.kumar.012/", 
    iconName: "Instagram", 
    colorClass: "hover:text-pink-600 dark:hover:text-pink-400" 
  },
  { 
    platform: "WhatsApp", 
    url: `https://wa.me/${SITE_CONFIG.whatsappNumberDigits}`, 
    iconName: "MessageSquare", 
    colorClass: "hover:text-emerald-600 dark:hover:text-emerald-400" 
  },
];

export const SKILLS_DATA: SkillCategory[] = [
  {
    category: "Frontend Development",
    iconName: "Code2",
    skills: [
      { name: "React / React Native", level: 90 },
      { name: "TypeScript / JavaScript (ES6+)", level: 88 },
      { name: "Tailwind CSS / CSS3", level: 92 },
      { name: "HTML5 / Responsive Design", level: 95 },
      { name: "Vite / Webpack", level: 85 }
    ]
  },
  {
    category: "Backend & Databases",
    iconName: "Server",
    skills: [
      { name: "Node.js & Express.js", level: 88 },
      { name: "MongoDB & Mongoose", level: 85 },
      { name: "RESTful APIs & Webhooks", level: 90 },
      { name: "SQL Basics", level: 75 }
    ]
  },
  {
    category: "AI & Tools",
    iconName: "Cpu",
    skills: [
      { name: "Gemini API & LLM Integration", level: 88 },
      { name: "Git & GitHub Workflow", level: 90 },
      { name: "Postman & API Testing", level: 85 },
      { name: "Vercel & Render Deployment", level: 90 }
    ]
  }
];

// Single source of truth: Re-export & derive legacy EDUCATION_DATA from ACADEMIC_DATA in education.ts
import { ACADEMIC_DATA } from './education';

export const EDUCATION_DATA: Education[] = [
  {
    college: ACADEMIC_DATA.university.institution,
    degree: `${ACADEMIC_DATA.university.degree} (${ACADEMIC_DATA.university.branch})`,
    status: ACADEMIC_DATA.university.status,
    location: ACADEMIC_DATA.university.location,
    period: ACADEMIC_DATA.university.session,
    description: ACADEMIC_DATA.university.description,
    highlights: ACADEMIC_DATA.university.highlights.slice(0, 2)
  },
  ...ACADEMIC_DATA.schooling.map((sch) => ({
    college: sch.boardFullName,
    degree: sch.stream ? `${sch.qualificationTitle} — ${sch.stream}` : sch.qualificationTitle,
    status: `${sch.status} — ${sch.division}`,
    location: sch.location,
    period: sch.passingYear,
    description: sch.description,
    highlights: sch.highlights,
    percentage: `${sch.percentage}%`
  }))
];

export const EXPERIENCE_DATA: Experience[] = [
  {
    role: "Independent Full-Stack Developer",
    company: "Personal & Open-Source Projects",
    location: "Rohtas, Bihar, India",
    period: "2024 – Present",
    type: "Independent",
    description: SITE_CONFIG.experienceSummary,
    highlights: [
      "MERN Stack Architecture & REST APIs",
      "Generative AI Integration & Webhook Automation"
    ]
  }
];

export const PROJECTS: Project[] = [
  {
    id: "money-details",
    slug: "money-details",
    title: "Money Details",
    shortDescription: "A comprehensive financial tracker web app to monitor expenses, budgets, and savings goals.",
    detailedDescription: "Money Details is an intuitive financial management web application designed to help users track their day-to-day spending, categorize transactions, set monthly budget limits, and visualize financial growth through interactive charts.",
    category: "Full-Stack Development",
    techStack: ["React", "JavaScript", "Tailwind CSS", "Chart.js"],
    mainScreenshot: getPath('/images/banners/money_details_banner_1793870364321.jpg'),
    additionalScreenshots: [getPath('/images/projects/money-details/02-screenshot-2026-11-01-122319.png'), getPath('/images/projects/money-details/03-screenshot-2026-11-01-122344.png'), getPath('/images/projects/money-details/04-screenshot-2026-11-01-122512.png'), getPath('/images/projects/money-details/05-screenshot-2026-11-01-160007.png'), getPath('/images/projects/money-details/06-screenshot-2026-11-01-160257.png'), getPath('/images/projects/money-details/07-screenshot-2026-11-01-160313.png'), getPath('/images/projects/money-details/08-screenshot-2026-11-01-160326.png'), getPath('/images/projects/money-details/09-screenshot-2026-11-01-160337.png'), getPath('/images/projects/money-details/10-screenshot-2026-11-01-160347.png'), getPath('/images/projects/money-details/11-screenshot-2026-11-01-160406.png'), getPath('/images/projects/money-details/12-screenshot-2026-11-01-160418.png'), getPath('/images/projects/money-details/13-screenshot-2026-11-01-160433.png'), getPath('/images/projects/money-details/14-screenshot-2026-11-01-160639.png'), getPath('/images/projects/money-details/01-screenshot-2026-11-01-16-09-26-91-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/02-screenshot-2026-11-01-16-09-31-48-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/03-screenshot-2026-11-01-16-10-21-43-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/04-screenshot-2026-11-01-16-10-26-58-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/05-screenshot-2026-11-01-16-10-32-70-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/06-screenshot-2026-11-01-16-10-37-44-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/07-screenshot-2026-11-01-16-10-45-64-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/08-screenshot-2026-11-01-16-10-50-73-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/09-screenshot-2026-11-01-16-11-02-41-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/10-screenshot-2026-11-01-16-11-17-70-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/11-screenshot-2026-11-01-16-11-27-66-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/12-screenshot-2026-11-01-16-11-34-05-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/13-screenshot-2026-11-01-16-11-51-44-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/14-screenshot-2026-11-01-16-12-37-30-40deb401b9ffe8e1df2f1cc5ba480b12.jpg'), getPath('/images/projects/money-details/01-screenshot-2026-11-01-162131.png'), getPath('/images/projects/money-details/02-screenshot-2026-11-01-162222.png'), getPath('/images/projects/money-details/03-screenshot-2026-11-01-162241.png'), getPath('/images/projects/money-details/04-screenshot-2026-11-01-162302.png'), getPath('/images/projects/money-details/05-screenshot-2026-11-01-162321.png'), getPath('/images/projects/money-details/06-screenshot-2026-11-01-162341.png'), getPath('/images/projects/money-details/07-screenshot-2026-11-01-162403.png'), getPath('/images/projects/money-details/08-screenshot-2026-11-01-162419.png'), getPath('/images/projects/money-details/09-screenshot-2026-11-01-162439.png')],
    githubUrl: "https://github.com/nitesh933438/Money-Details-Demo",
    liveDemoUrl: "https://nitesh933438.github.io/Money-Details/",
    status: "Completed",
    featured: true,
    displayOrder: 1,
    creationDate: "2025",
    keyFeatures: [
      "Expense and income tracking with categories",
      "Interactive charts and spending analytics",
      "Monthly budget alert system",
      "Responsive, clean UI with dark mode support"
    ]
  },
  {
    id: "whatsapp-personal-ai-bot",
    slug: "whatsapp-personal-ai-bot",
    title: "WhatsApp Personal AI Bot",
    shortDescription: "An intelligent automated WhatsApp companion powered by AI for smart conversational replies and task assistance.",
    detailedDescription: "WhatsApp Personal AI Bot integrates messaging APIs with advanced language models to provide instant conversational responses, answer queries, automate notifications, and assist users directly via WhatsApp.",
    category: "AI & Automation",
    techStack: ["Node.js", "Express", "WhatsApp API", "Gemini API"],
    mainScreenshot: getPath('/images/banners/whatsapp_ai_banner_1793870364243.jpg'),
    additionalScreenshots: [getPath('/images/projects/whatsapp-personal-ai-bot/02-desktop-02.png'), getPath('/images/projects/whatsapp-personal-ai-bot/03-desktop-03.png'), getPath('/images/projects/whatsapp-personal-ai-bot/04-desktop-04.png'), getPath('/images/projects/whatsapp-personal-ai-bot/05-desktop-05.png'), getPath('/images/projects/whatsapp-personal-ai-bot/06-desktop-06.png'), getPath('/images/projects/whatsapp-personal-ai-bot/07-mobile-01.jpg'), getPath('/images/projects/whatsapp-personal-ai-bot/08-mobile-02.jpg'), getPath('/images/projects/whatsapp-personal-ai-bot/09-mobile-03.jpg'), getPath('/images/projects/whatsapp-personal-ai-bot/10-mobile-04.jpg'), getPath('/images/projects/whatsapp-personal-ai-bot/11-mobile-05.jpg'), getPath('/images/projects/whatsapp-personal-ai-bot/12-mobile-06.jpg')],
    githubUrl: "https://github.com/nitesh933438/WhatsApp-Personal-AI-Bot-Demo",
    liveDemoUrl: "https://nitesh-personal-bot.onrender.com/",
    status: "Completed",
    featured: true,
    displayOrder: 2,
    creationDate: "2025",
    keyFeatures: [
      "Automated webhook handling for WhatsApp messages",
      "Context-aware AI responses",
      "Deployed and hosted live on Render",
      "Customizable system prompts and command triggers"
    ]
  },
  {
    id: "worksphere-hrms",
    slug: "worksphere-hrms",
    title: "WorkSphere HRMS",
    shortDescription: "An enterprise-grade Human Resource Management System for attendance, employee records, and payroll.",
    detailedDescription: "WorkSphere HRMS streamlines organizational workflows including employee onboarding, attendance tracking, department organization charts, leave management, and performance analytics.",
    category: "SaaS & Management",
    techStack: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    mainScreenshot: getPath('/images/banners/worksphere_hrms_banner_1793870364647.jpg'),
    additionalScreenshots: [getPath('/images/projects/worksphere-hrms/02-employee.png'), getPath('/images/projects/worksphere-hrms/03-hr.png'), getPath('/images/projects/worksphere-hrms/04-manager.png'), getPath('/images/projects/worksphere-hrms/05-screenshot-2026-09-23-163001.png'), getPath('/images/projects/worksphere-hrms/06-screenshot-2026-09-23-171212.png'), getPath('/images/projects/worksphere-hrms/07-screenshot-2026-09-23-171232.png'), getPath('/images/projects/worksphere-hrms/08-screenshot-2026-09-23-171255.png'), getPath('/images/projects/worksphere-hrms/09-screenshot-2026-09-23-171308.png'), getPath('/images/projects/worksphere-hrms/10-screenshot-2026-09-23-171353.png')],
    githubUrl: "https://github.com/nitesh933438/WorkSphere-HRMS-Demo",
    liveDemoUrl: "https://nitesh933438.github.io/WorkSphere-HRMS/",
    status: "Completed",
    featured: true,
    displayOrder: 3,
    creationDate: "2025",
    keyFeatures: [
      "Comprehensive employee directory and organization chart",
      "Real-time attendance and absence tracking",
      "Performance analytics and metric graphs",
      "Role-based navigation and clean dashboards"
    ]
  },
  {
    id: "nova-ai-assistant",
    slug: "nova-ai-assistant",
    title: "NOVA AI Assistant",
    shortDescription: "A versatile AI-powered virtual assistant web application for brainstorming, coding help, and productivity.",
    detailedDescription: "NOVA AI Assistant provides a sleek chat interface for interacting with generative AI models, executing code queries, drafting content, and organizing productivity tasks.",
    category: "AI & Automation",
    techStack: ["React", "Node.js", "Express", "Tailwind CSS", "Gemini API"],
    mainScreenshot: getPath('/images/projects/nova-ai/main.jpg'),
    additionalScreenshots: [],
    githubUrl: "",
    liveDemoUrl: "https://nova-ai-assistant-oue3.onrender.com/",
    status: "Completed",
    featured: true,
    displayOrder: 4,
    creationDate: "2025",
    keyFeatures: [
      "Responsive AI chat interface with syntax highlighting",
      "Secure backend proxy for API requests",
      "Chat history management",
      "Deployed on Render"
    ]
  },
  {
    id: "digital-vault",
    slug: "digital-vault",
    title: "Digital Vault",
    shortDescription: "A secure digital locker application to store sensitive credentials, documents, and notes safely.",
    detailedDescription: "Digital Vault offers encrypted client-side and server-side storage capabilities for safeguarding private notes, passwords, and sensitive files with master password protection.",
    category: "Security & Storage",
    techStack: ["React", "Node.js", "Express", "Crypto", "Tailwind CSS"],
    mainScreenshot: getPath('/images/banners/digital_vault_banner_1793870364923.jpg'),
    additionalScreenshots: [getPath('/images/projects/digital-vault/02-admin-dashboard.png'), getPath('/images/projects/digital-vault/03-admin-document-management.png'), getPath('/images/projects/digital-vault/04-admin-newsletter-subscribers.png'), getPath('/images/projects/digital-vault/05-admin-send-notification.png'), getPath('/images/projects/digital-vault/06-admin-user-management.png'), getPath('/images/projects/digital-vault/07-dashboard.png'), getPath('/images/projects/digital-vault/08-documents.png'), getPath('/images/projects/digital-vault/09-favorites.png'), getPath('/images/projects/digital-vault/10-landing-page.png'), getPath('/images/projects/digital-vault/11-login.png'), getPath('/images/projects/digital-vault/12-notifications.png'), getPath('/images/projects/digital-vault/13-profile.png'), getPath('/images/projects/digital-vault/14-register.png'), getPath('/images/projects/digital-vault/15-settings.png'), getPath('/images/projects/digital-vault/16-storage-details.png')],
    githubUrl: "https://github.com/nitesh933438/Digital-Vault",
    liveDemoUrl: "https://nitesh933438.github.io/Digital-Vault/",
    status: "Completed",
    featured: false,
    displayOrder: 5,
    creationDate: "2024",
    keyFeatures: [
      "Master password encryption",
      "Secure credential category management",
      "Clean minimalist vault UI",
      "Local and cloud storage sync options"
    ]
  },
  {
    id: "golden-road-safety",
    slug: "golden-road-safety",
    title: "Golden Road Safety",
    shortDescription: "An awareness and reporting web portal dedicated to traffic rules, road safety guidelines, and incident alerts.",
    detailedDescription: "Golden Road Safety promotes civic responsibility and road safety education by providing clear guidelines, interactive hazard reporting, and safety tips for drivers and pedestrians.",
    category: "Web Applications",
    techStack: ["React", "Tailwind CSS", "JavaScript"],
    mainScreenshot: getPath('/images/banners/golden_road_safety_banner_1793870365424.jpg'),
    additionalScreenshots: [getPath('/images/projects/golden-road-safety/02-screenshot-2026-11-04-141946.png'), getPath('/images/projects/golden-road-safety/03-screenshot-2026-11-04-142025.png'), getPath('/images/projects/golden-road-safety/04-screenshot-2026-11-04-142051.png'), getPath('/images/projects/golden-road-safety/05-screenshot-2026-11-04-142329.png'), getPath('/images/projects/golden-road-safety/06-screenshot-2026-11-04-142352.png'), getPath('/images/projects/golden-road-safety/07-screenshot-2026-11-04-142417.png'), getPath('/images/projects/golden-road-safety/08-screenshot-2026-11-04-142530.png'), getPath('/images/projects/golden-road-safety/09-screenshot-2026-11-04-142555.png'), getPath('/images/projects/golden-road-safety/10-screenshot-2026-11-04-142708.png'), getPath('/images/projects/golden-road-safety/11-screenshot-2026-11-04-142734.png'), getPath('/images/projects/golden-road-safety/12-screenshot-2026-11-04-142754.png'), getPath('/images/projects/golden-road-safety/13-screenshot-2026-11-04-142837.png'), getPath('/images/projects/golden-road-safety/14-screenshot-2026-11-04-142941.png'), getPath('/images/projects/golden-road-safety/15-screenshot-2026-11-04-143019.png'), getPath('/images/projects/golden-road-safety/16-screenshot-2026-11-04-143116.png'), getPath('/images/projects/golden-road-safety/17-screenshot-2026-11-04-143141.png'), getPath('/images/projects/golden-road-safety/18-screenshot-2026-11-04-143157.png'), getPath('/images/projects/golden-road-safety/19-screenshot-2026-11-04-143234.png'), getPath('/images/projects/golden-road-safety/20-screenshot-2026-11-04-143257.png')],
    githubUrl: "https://github.com/nitesh933438/Golden-Road-Safety",
    liveDemoUrl: "https://nitesh933438.github.io/Golden-Road-Safety/",
    status: "Completed",
    featured: false,
    displayOrder: 6,
    creationDate: "2024",
    keyFeatures: [
      "Road safety modules and traffic sign guides",
      "Incident reporting form and emergency contacts",
      "Fully responsive mobile-friendly design",
      "Educational resources for safe driving"
    ]
  },
  {
    id: "attendx-ai",
    slug: "attendx-ai",
    title: "AttendX AI",
    shortDescription: "An AI-powered smart attendance system leveraging facial recognition and automated logging.",
    detailedDescription: "AttendX AI streamlines classroom and workplace attendance by utilizing intelligent verification, instant logging, and exportable attendance reports.",
    category: "AI & Automation",
    techStack: ["React", "Node.js", "Python", "OpenCV", "Tailwind CSS"],
    mainScreenshot: getPath('/images/banners/attendx_ai_banner_1793870365409.jpg'),
    additionalScreenshots: [getPath('/images/projects/attendx-ai/02-screenshot-2026-11-04-145256.png'), getPath('/images/projects/attendx-ai/03-screenshot-2026-11-04-145316.png')],
    githubUrl: "https://github.com/nitesh933438/AttendX-AI",
    liveDemoUrl: "https://attend-x-ai.vercel.app",
    status: "Completed",
    featured: true,
    displayOrder: 7,
    creationDate: "2025",
    keyFeatures: [
      "Automated attendance logging dashboard",
      "Real-time analytics and attendance percentages",
      "Exportable CSV/PDF attendance reports",
      "Hosted live on Vercel"
    ]
  },
  {
    id: "road-safety",
    slug: "road-safety",
    title: "Road Safety",
    shortDescription: "A comprehensive civic safety platform providing traffic updates, emergency dispatch guides, and safe route planning.",
    detailedDescription: "Road Safety focuses on accident prevention, emergency preparedness, and community-driven road hazard reporting to build safer commuting environments.",
    category: "Web Applications",
    techStack: ["React", "Tailwind CSS", "Vite"],
    mainScreenshot: getPath('/images/banners/road_safety_banner_1793870365256.jpg'),
    additionalScreenshots: [getPath('/images/projects/road-safety/02-screenshot-2026-11-04-144325.png'), getPath('/images/projects/road-safety/03-screenshot-2026-11-04-144336.png'), getPath('/images/projects/road-safety/04-screenshot-2026-11-04-144347.png'), getPath('/images/projects/road-safety/05-screenshot-2026-11-04-144358.png'), getPath('/images/projects/road-safety/06-screenshot-2026-11-04-144605.png'), getPath('/images/projects/road-safety/07-screenshot-2026-11-04-144728.png'), getPath('/images/projects/road-safety/08-screenshot-2026-11-04-144804.png'), getPath('/images/projects/road-safety/09-screenshot-2026-11-04-144819.png'), getPath('/images/projects/road-safety/10-screenshot-2026-11-04-144840.png'), getPath('/images/projects/road-safety/11-screenshot-2026-11-04-145000.png')],
    githubUrl: "https://github.com/nitesh933438/Road-Safety",
    liveDemoUrl: "https://road-safety-beta.vercel.app/",
    status: "Completed",
    featured: false,
    displayOrder: 8,
    creationDate: "2025",
    keyFeatures: [
      "Community road hazard mapping",
      "Emergency contact quick-dialer",
      "Traffic regulation guides",
    ]
  },
  {
    id: "git-github-masterclass",
    slug: "git-github-masterclass",
    title: "Git & GitHub Masterclass LMS",
    shortDescription: "A specialized learning management system for mastering version control with Git and GitHub workflows.",
    detailedDescription: "A dedicated platform for developers to learn advanced Git commands, branching strategies, and collaborative GitHub features through structured modules and assessments.",
    category: "Education & LMS",
    techStack: ["React", "Node.js", "Express", "Tailwind CSS"],
    mainScreenshot: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/Git-GitHub-Masterclass",
    liveDemoUrl: "",
    status: "Coming Soon",
    featured: false,
    displayOrder: 9,
    creationDate: "2025",
    keyFeatures: [
      "Structured learning modules",
      "Progress tracking",
      "Interactive command-line guides",
      "Certification upon completion"
    ]
  },
  {
    id: "business-invoice-generator",
    slug: "business-invoice-generator",
    title: "Business Invoice Generator",
    shortDescription: "A fast and efficient tool for generating professional business invoices with custom branding.",
    detailedDescription: "This tool allows small businesses and freelancers to quickly create, preview, and download professional PDF invoices with automated tax calculations and client management.",
    category: "Productivity & Tools",
    techStack: ["React", "TypeScript", "jspdf", "Tailwind CSS"],
    mainScreenshot: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2011&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/Business-Invoice-Generator",
    liveDemoUrl: "",
    status: "Coming Soon",
    featured: false,
    displayOrder: 10,
    creationDate: "2025",
    keyFeatures: [
      "Instant PDF generation",
      "Custom branding and logos",
      "Tax and discount calculators",
      "Invoice history storage"
    ]
  },
  {
    id: "pro-resume-builder",
    slug: "pro-resume-builder",
    title: "PRO Resume Builder",
    shortDescription: "An advanced resume building platform with professional templates and real-time preview.",
    detailedDescription: "PRO Resume Builder helps job seekers create ATS-friendly resumes using multiple industry-standard templates with a live editing interface and one-click PDF export.",
    category: "Productivity & Tools",
    techStack: ["React", "Tailwind CSS", "Node.js", "Express"],
    mainScreenshot: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/createproresume",
    liveDemoUrl: "",
    status: "Planning",
    featured: false,
    displayOrder: 11,
    creationDate: "2025",
    keyFeatures: [
      "ATS-friendly templates",
      "Live preview editor",
      "Multiple format exports",
      "AI-assisted descriptions"
    ]
  },
  {
    id: "doctor-contact",
    slug: "doctor-contact",
    title: "Doctor Contact",
    shortDescription: "A healthcare portal for connecting patients with doctors and managing appointments.",
    detailedDescription: "Doctor Contact streamlines the process of finding specialized healthcare professionals, viewing their availability, and booking appointments online.",
    category: "Web Applications",
    techStack: ["React", "Firebase", "Tailwind CSS"],
    mainScreenshot: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/Doctor-Contact",
    liveDemoUrl: "",
    status: "Planning",
    featured: false,
    displayOrder: 12,
    creationDate: "2025",
    keyFeatures: [
      "Doctor search and filtering",
      "Appointment booking system",
      "Patient dashboard",
      "Real-time notifications"
    ]
  },
  {
    id: "studyshare",
    slug: "studyshare",
    title: "StudyShare",
    shortDescription: "A collaborative platform for students to share notes, resources, and study materials.",
    detailedDescription: "StudyShare creates a community-driven environment where students can upload, search, and download study notes, previous year questions, and research papers across departments.",
    category: "Education & LMS",
    techStack: ["MERN Stack", "Firebase Storage", "Tailwind CSS"],
    mainScreenshot: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/StudyShare",
    liveDemoUrl: "",
    status: "In Progress",
    featured: false,
    displayOrder: 13,
    creationDate: "2025",
    keyFeatures: [
      "Note sharing and categorization",
      "Peer review system",
      "Global resource search",
      "User profile and contribution points"
    ]
  },
  {
    id: "watch-store",
    slug: "watch-store",
    title: "Watch Store",
    shortDescription: "A modern e-commerce storefront for premium watches with integrated cart and checkout.",
    detailedDescription: "A high-end shopping experience for watch enthusiasts featuring product filtering, detailed item views, cart management, and secure checkout simulation.",
    category: "E-Commerce",
    techStack: ["React", "Redux Toolkit", "Tailwind CSS", "Stripe API"],
    mainScreenshot: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
    additionalScreenshots: [],
    githubUrl: "https://github.com/nitesh933438/watch-store",
    liveDemoUrl: "",
    status: "In Progress",
    featured: false,
    displayOrder: 14,
    creationDate: "2025",
    keyFeatures: [
      "Product catalog with advanced filters",
      "Dynamic shopping cart",
      "Secure checkout flow",
      "Order tracking"
    ]
  }
];

// Helper to get derived data
export const getDerivedData = () => {
  const categories = Array.from(new Set(PROJECTS.map(p => p.category)));
  const techStack = Array.from(new Set(PROJECTS.flatMap(p => p.techStack)));
  const totalCompleted = PROJECTS.filter(p => p.status === 'Completed').length;
  
  return {
    categories,
    techStack,
    totalCompleted,
    totalProjects: PROJECTS.length
  };
};

// Simple Validator
export const validatePortfolioData = () => {
  const errors: string[] = [];
  const ids = new Set();
  
  PROJECTS.forEach(p => {
    if (ids.has(p.id)) errors.push(`Duplicate Project ID: ${p.id}`);
    ids.add(p.id);
    
    if (!p.title) errors.push(`Project ${p.id} is missing a title`);
    if (p.githubUrl && !p.githubUrl.startsWith('http')) errors.push(`Project ${p.id} has invalid GitHub URL`);
  });
  
  return errors;
};
