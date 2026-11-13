import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProjectMetrics,
  getCertificateMetrics,
  getEducationMetrics,
  getSkillMetrics,
  getPortfolioMetricsSnapshot,
} from './portfolioMetrics';
import type { Project, SkillCategory, Experience } from '../data/portfolio';
import type { PortfolioCertificate } from '../types/certificate';
import type { UniversityRecord, SchoolRecord } from '../data/education';

const sampleProjects: Project[] = [
  {
    id: 'p1',
    slug: 'p1',
    title: 'Active Featured #2',
    shortDescription: 's',
    detailedDescription: 'd',
    category: 'Full-Stack Development',
    techStack: ['React'],
    mainScreenshot: '/img1.png',
    additionalScreenshots: [],
    githubUrl: 'https://github.com/u/p1',
    liveDemoUrl: '',
    status: 'Completed',
    featured: true,
    displayOrder: 2,
    keyFeatures: [],
  },
  {
    id: 'p2',
    slug: 'p2',
    title: 'Archived Featured',
    shortDescription: 's',
    detailedDescription: 'd',
    category: 'Full-Stack Development',
    techStack: ['Node.js'],
    mainScreenshot: '',
    additionalScreenshots: [],
    githubUrl: 'https://github.com/u/archived',
    liveDemoUrl: '',
    status: 'Archived',
    featured: true,
    displayOrder: 1,
    keyFeatures: [],
  },
  {
    id: 'p3',
    slug: 'p3',
    title: 'Upcoming Non-Featured',
    shortDescription: 's',
    detailedDescription: 'd',
    category: 'AI & Automation',
    techStack: ['TypeScript'],
    mainScreenshot: '',
    additionalScreenshots: [],
    githubUrl: '',
    liveDemoUrl: '',
    status: 'Coming Soon',
    featured: false,
    displayOrder: 3,
    keyFeatures: [],
  },
  {
    id: 'p4',
    slug: 'p4',
    title: 'Active Featured #1',
    shortDescription: 's',
    detailedDescription: 'd',
    category: 'AI & Automation',
    techStack: ['Gemini'],
    mainScreenshot: '/img4.png',
    additionalScreenshots: [],
    githubUrl: 'https://github.com/u/p4',
    liveDemoUrl: 'https://p4.example.com',
    status: 'In Progress',
    featured: true,
    displayOrder: 1,
    keyFeatures: [],
  },
];

const sampleCerts: PortfolioCertificate[] = [
  {
    id: 'c1',
    title: 'Cert 1',
    issuer: 'NPTEL',
    category: 'Data Science',
    description: 'd',
    issueDate: '2025-05-01',
    credentialId: 'NPTEL123',
    imageUrl: '/c1.png',
    fileUrl: '/c1.pdf',
    fileType: 'pdf',
    skills: ['Python'],
    featured: true,
    published: true,
    displayOrder: 2,
  },
  {
    id: 'c2',
    title: 'Draft Cert',
    issuer: 'Udemy',
    category: 'Web & Software Development',
    description: 'd',
    issueDate: '2025-06-01',
    imageUrl: '/c2.png',
    fileUrl: '/c2.png',
    fileType: 'image',
    skills: ['React'],
    featured: true,
    published: false,
    displayOrder: 1,
  },
  {
    id: 'c3',
    title: 'Published Unverified',
    issuer: 'Workshop',
    category: 'Events & Participation',
    description: 'd',
    issueDate: '2025-07-01',
    imageUrl: '/c3.png',
    fileUrl: '/c3.png',
    fileType: 'image',
    skills: [],
    featured: false,
    published: true,
    displayOrder: 1,
  },
];

test('getProjectMetrics excludes archived from active/featured/github counts and preserves displayOrder', () => {
  const m = getProjectMetrics(sampleProjects);
  assert.equal(m.total, 4);
  assert.equal(m.archivedCount, 1);
  assert.equal(m.active.length, 3);
  assert.equal(m.featured.length, 2);
  assert.equal(m.featured[0].id, 'p4');
  assert.equal(m.featured[1].id, 'p1');
  assert.equal(m.githubRepoCount, 2);
  assert.equal(m.completedCount, 1);
  assert.equal(m.inProgressCount, 1);
  assert.equal(m.upcomingCount, 1);
  assert.equal(m.resumeFeatured[0].id, 'p4');
  assert.equal(m.resumeFeatured[2].id, 'p3');
});

test('getCertificateMetrics separates published vs draft and computes verified count accurately', () => {
  const m = getCertificateMetrics(sampleCerts);
  assert.equal(m.total, 3);
  assert.equal(m.published.length, 2);
  assert.equal(m.draftCount, 1);
  assert.equal(m.featured.length, 1);
  assert.equal(m.featured[0].id, 'c1');
  assert.equal(m.verifiedCount, 1);
  assert.equal(m.resumeFeatured[0].id, 'c1');
});

test('getEducationMetrics computes declared semesters, latest SGPA, and CGPA fallback cleanly', () => {
  const uni: UniversityRecord = {
    id: 'u1',
    type: 'university',
    institution: 'AJU',
    degree: 'B.Tech',
    branch: 'CSE',
    session: '2025-2029',
    status: 'Pursuing',
    location: 'India',
    description: 'd',
    highlights: [],
    semesters: [
      { semesterNumber: 2, semesterLabel: 'Sem 2', sgpa: 9.23, status: 'PASS', statusLabel: 'Pass', isDeclared: true },
      { semesterNumber: 1, semesterLabel: 'Sem 1', sgpa: 7.91, status: 'PASS', statusLabel: 'Pass', isDeclared: true },
      { semesterNumber: 3, semesterLabel: 'Sem 3', sgpa: null, status: 'UPCOMING', statusLabel: 'Upcoming', isDeclared: false },
    ],
  };
  const schools: SchoolRecord[] = [
    {
      id: 's1',
      type: 'school',
      standard: 'Class 12th',
      qualificationTitle: 'Intermediate',
      board: 'BSEB',
      boardFullName: 'BSEB',
      passingYear: '2025',
      totalMarks: 393,
      maxMarks: 500,
      percentage: 78.6,
      division: 'First',
      status: 'Passed',
      location: 'Bihar',
      description: 'd',
      highlights: [],
    },
  ];

  const m = getEducationMetrics(uni, schools);
  assert.equal(m.totalRecords, 2);
  assert.equal(m.declaredSemesters.length, 2);
  assert.equal(m.upcomingSemesters.length, 1);
  assert.equal(m.latestSgpa, 9.23);
  assert.equal(m.displayCgpa, 8.57);
});

test('getSkillMetrics and getPortfolioMetricsSnapshot aggregate all portfolio modules cleanly', () => {
  const skills: SkillCategory[] = [
    { category: 'Frontend', iconName: 'Layout', skills: [{ name: 'React', level: 95 }, { name: 'CSS', level: 85 }] },
    { category: 'Backend', iconName: 'Server', skills: [{ name: 'Node.js', level: 90 }] },
  ];
  const experience: Experience[] = [
    { role: 'Dev', company: 'Co', location: 'Remote', period: '2025', description: 'd', highlights: [], type: 'Independent' },
  ];

  const sm = getSkillMetrics(skills);
  assert.equal(sm.categoryCount, 2);
  assert.equal(sm.totalSkills, 3);
  assert.equal(sm.topSkills[0].name, 'React');

  const snap = getPortfolioMetricsSnapshot({
    projects: sampleProjects,
    certificates: sampleCerts,
    skills,
    experience,
    messageTotal: 5,
    messageUnread: 2,
  });
  assert.equal(snap.experienceCount, 1);
  assert.equal(snap.messages.total, 5);
  assert.equal(snap.messages.unread, 2);
});
