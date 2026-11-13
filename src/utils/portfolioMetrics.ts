import type { Project, SkillCategory, Experience } from '../data/portfolio';
import type { PortfolioCertificate } from '../types/certificate';
import type { SchoolRecord, SemesterResult, UniversityRecord } from '../data/education';

export interface ProjectMetrics {
  total: number;
  active: Project[];
  featured: Project[];
  completedCount: number;
  inProgressCount: number;
  upcomingCount: number;
  archivedCount: number;
  githubRepoCount: number;
  resumeFeatured: Project[];
}

export interface CertificateMetrics {
  total: number;
  published: PortfolioCertificate[];
  featured: PortfolioCertificate[];
  draftCount: number;
  verifiedCount: number;
  resumeFeatured: PortfolioCertificate[];
}

export interface EducationMetrics {
  totalRecords: number;
  totalSemesters: number;
  declaredSemesters: SemesterResult[];
  upcomingSemesters: SemesterResult[];
  latestSgpa: number | null;
  displayCgpa: number | null;
  schoolingCount: number;
}

export interface SkillMetrics {
  categoryCount: number;
  totalSkills: number;
  topSkills: Array<{ name: string; level: number; category: string }>;
}

export interface PortfolioMetricsSnapshot {
  projects: ProjectMetrics;
  certificates: CertificateMetrics;
  education: EducationMetrics;
  skills: SkillMetrics;
  experienceCount: number;
  messages: {
    total: number;
    unread: number;
  };
}

export function sortProjectsByOrder(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
}

export function getProjectMetrics(projects: Project[] = []): ProjectMetrics {
  const ordered = sortProjectsByOrder(projects);
  const archivedCount = ordered.filter((p) => p.status === 'Archived').length;
  const active = ordered.filter((p) => p.status !== 'Archived');
  const featured = active.filter((p) => p.featured);
  const completedCount = active.filter((p) => p.status === 'Completed').length;
  const inProgressCount = active.filter((p) => p.status === 'In Progress').length;
  const upcomingCount = active.filter((p) => p.status === 'Planning' || p.status === 'Coming Soon').length;
  const githubRepoCount = active.filter((p) => Boolean(p.githubUrl && p.githubUrl.trim())).length;

  // Resume prioritizes featured projects first, then non-featured active projects by displayOrder
  const resumeOrdered = [
    ...featured,
    ...active.filter((p) => !p.featured),
  ];

  return {
    total: ordered.length,
    active,
    featured,
    completedCount,
    inProgressCount,
    upcomingCount,
    archivedCount,
    githubRepoCount,
    resumeFeatured: resumeOrdered.slice(0, 6),
  };
}

export function sortCertificatesByOrder(certificates: PortfolioCertificate[]): PortfolioCertificate[] {
  return [...certificates].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
}

export function getCertificateMetrics(allCertificates: PortfolioCertificate[] = []): CertificateMetrics {
  const ordered = sortCertificatesByOrder(allCertificates);
  const published = ordered.filter((c) => c.published !== false);
  const draftCount = ordered.length - published.length;
  const featured = published.filter((c) => c.featured);
  const verifiedCount = published.filter((c) =>
    Boolean((c.credentialId && c.credentialId.trim()) || (c.credentialUrl && c.credentialUrl.trim()))
  ).length;

  const resumeOrdered = [
    ...featured,
    ...published.filter((c) => !c.featured),
  ];

  return {
    total: ordered.length,
    published,
    featured,
    draftCount,
    verifiedCount,
    resumeFeatured: resumeOrdered.slice(0, 8),
  };
}

export function getEducationMetrics(
  university?: UniversityRecord | null,
  schooling: SchoolRecord[] = []
): EducationMetrics {
  const semesters = [...(university?.semesters || [])].sort(
    (a, b) => a.semesterNumber - b.semesterNumber
  );
  const declaredSemesters = semesters.filter(
    (s) => s.isDeclared && typeof s.sgpa === 'number' && Number.isFinite(s.sgpa)
  );
  const upcomingSemesters = semesters.filter((s) => !s.isDeclared || s.status === 'UPCOMING');
  const latestSgpa =
    declaredSemesters.length > 0
      ? Number(declaredSemesters[declaredSemesters.length - 1].sgpa)
      : null;

  let displayCgpa: number | null = null;
  if (typeof university?.cgpa === 'number' && Number.isFinite(university.cgpa)) {
    displayCgpa = Number(university.cgpa.toFixed(2));
  } else if (declaredSemesters.length > 0) {
    const sum = declaredSemesters.reduce((acc, s) => acc + Number(s.sgpa || 0), 0);
    displayCgpa = Number((sum / declaredSemesters.length).toFixed(2));
  }

  return {
    totalRecords: (university ? 1 : 0) + schooling.length,
    totalSemesters: semesters.length,
    declaredSemesters,
    upcomingSemesters,
    latestSgpa,
    displayCgpa,
    schoolingCount: schooling.length,
  };
}

export function getSkillMetrics(skills: SkillCategory[] = []): SkillMetrics {
  const flattened = skills.flatMap((group) =>
    (group.skills || []).map((skill) => ({
      name: skill.name,
      level: Number(skill.level) || 0,
      category: group.category,
    }))
  );
  const topSkills = [...flattened].sort((a, b) => b.level - a.level);

  return {
    categoryCount: skills.length,
    totalSkills: flattened.length,
    topSkills,
  };
}

export function getPortfolioMetricsSnapshot(params: {
  projects?: Project[];
  certificates?: PortfolioCertificate[];
  university?: UniversityRecord | null;
  schooling?: SchoolRecord[];
  skills?: SkillCategory[];
  experience?: Experience[];
  messageTotal?: number;
  messageUnread?: number;
}): PortfolioMetricsSnapshot {
  return {
    projects: getProjectMetrics(params.projects || []),
    certificates: getCertificateMetrics(params.certificates || []),
    education: getEducationMetrics(params.university, params.schooling || []),
    skills: getSkillMetrics(params.skills || []),
    experienceCount: (params.experience || []).length,
    messages: {
      total: params.messageTotal || 0,
      unread: params.messageUnread || 0,
    },
  };
}
