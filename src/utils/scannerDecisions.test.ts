import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateScanDecision,
  detectIrrelevantContent,
  normalizeScannerModule,
} from './scannerDecisions';
import type { PortfolioSnapshotForScan } from './scannerDecisions';

const snapshot: PortfolioSnapshotForScan = {
  certificates: [
    {
      id: 'cert-1',
      title: 'Programming in Java',
      issuer: 'NPTEL IIT Kharagpur',
      category: 'Web & Software Development',
      description: 'Short desc',
      issueDate: '2025-04-10',
      credentialId: 'NPTEL25CS1001',
      credentialUrl: 'https://nptel.ac.in/verify/NPTEL25CS1001',
      imageUrl: '/uploads/cert1.png',
      fileUrl: '/uploads/cert1.pdf',
      fileType: 'pdf',
      skills: ['Java'],
      featured: true,
      published: true,
      displayOrder: 1,
    },
  ],
  projects: [
    {
      id: 'proj-1',
      slug: 'worksphere-hrms',
      title: 'WorkSphere HRMS',
      shortDescription: 'HR Suite',
      detailedDescription: 'Detailed HR suite',
      category: 'SaaS & Management',
      techStack: ['React', 'TypeScript'],
      mainScreenshot: '/uploads/ws.png',
      additionalScreenshots: [],
      githubUrl: 'https://github.com/nitesh933438/WorkSphere-HRMS',
      liveDemoUrl: '',
      status: 'Completed',
      featured: true,
      displayOrder: 1,
      keyFeatures: [],
    },
  ],
  university: {
    id: 'uni-1',
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
      { semesterNumber: 1, semesterLabel: 'Sem 1', sgpa: 7.91, status: 'PASS', statusLabel: 'Pass', isDeclared: true },
      { semesterNumber: 3, semesterLabel: 'Sem 3', sgpa: null, status: 'UPCOMING', statusLabel: 'Upcoming', isDeclared: false },
    ],
  },
  skills: [
    { category: 'Frontend Development', iconName: 'Layout', skills: [{ name: 'React', level: 95 }, { name: 'Tailwind CSS', level: 90 }] },
  ],
  experience: [
    {
      role: 'Full-Stack Developer',
      company: 'Freelance',
      location: 'Remote',
      period: '2024 - Present',
      description: 'Building apps',
      highlights: ['Built web apps'],
      type: 'Independent',
    },
  ],
};

test('rejects private or irrelevant documents such as Aadhaar, PAN, and payment receipts', () => {
  const aadhaarCheck = detectIrrelevantContent({
    fileName: 'aadhaar_front.jpg',
    text: 'Government of India UIDAI Aadhaar Number 1234',
  });
  assert.equal(aadhaarCheck.isIrrelevant, true);

  const invoiceDecision = evaluateScanDecision({
    raw: {
      detectedModule: 'project',
      detectedType: 'bill',
      confidence: 0.9,
      data: { title: 'UPI Payment Receipt' },
    },
    portfolio: snapshot,
    fileName: 'phonepe_upi_receipt.png',
    text: 'UPI Ref No 987654321 Transaction Receipt Paid',
  });
  assert.equal(invoiceDecision.shouldAdd, false);
  assert.equal(invoiceDecision.action, 'reject_irrelevant');
  assert.equal(invoiceDecision.detectedModule, 'irrelevant');
});

test('rejects low-confidence or AI-flagged non-portfolio items instead of forcing into project/certificate', () => {
  const decision = evaluateScanDecision({
    raw: {
      detectedModule: 'unknown',
      detectedType: 'random_photo',
      shouldAddToPortfolio: false,
      rejectionReason: 'Photo shows a scenic landscape, not a portfolio artifact.',
      confidence: 0.3,
      data: {},
    },
    portfolio: snapshot,
    fileName: 'sunset_park.jpg',
    mimeType: 'image/jpeg',
  });
  assert.equal(decision.shouldAdd, false);
  assert.equal(decision.action, 'reject_irrelevant');
});

test('skips duplicate certificate when credentialId matches and adds no new metadata', () => {
  const decision = evaluateScanDecision({
    raw: {
      detectedModule: 'certificate',
      detectedType: 'NPTEL Certificate',
      confidence: 0.96,
      data: {
        title: 'Programming in Java',
        issuer: 'NPTEL',
        credentialId: 'NPTEL25CS1001',
        credentialUrl: 'https://nptel.ac.in/verify/NPTEL25CS1001',
        description: 'Short desc',
      },
    },
    portfolio: snapshot,
    fileName: 'java_cert.pdf',
    mimeType: 'application/pdf',
  });
  assert.equal(decision.action, 'skip_duplicate');
  assert.equal(decision.shouldAdd, false);
  assert.equal(decision.matchedId, 'cert-1');
});

test('creates new certificate when title/credentialId do not match any existing certificate', () => {
  const decision = evaluateScanDecision({
    raw: {
      detectedModule: 'certificate',
      detectedType: 'AWS Certificate',
      confidence: 0.95,
      data: {
        title: 'AWS Cloud Practitioner',
        issuer: 'Amazon Web Services',
        credentialId: 'AWS-998877',
      },
    },
    portfolio: snapshot,
    fileName: 'aws_cp.pdf',
    mimeType: 'application/pdf',
  });
  assert.equal(decision.action, 'create_new');
  assert.equal(decision.shouldAdd, true);
  assert.equal(decision.suggestedStorageFolder, 'certificates');
});

test('updates existing project cleanly when new screenshot or liveDemoUrl is scanned for same repo', () => {
  const decision = evaluateScanDecision({
    raw: {
      detectedModule: 'project',
      detectedType: 'Project Screenshot',
      confidence: 0.92,
      data: {
        title: 'WorkSphere HRMS',
        githubUrl: 'https://github.com/nitesh933438/WorkSphere-HRMS',
        liveDemoUrl: 'https://worksphere.demo.app',
        techStack: ['React', 'Tailwind CSS'],
      },
    },
    portfolio: snapshot,
    fileName: 'worksphere_dashboard.png',
    mimeType: 'image/png',
  });
  assert.equal(decision.action, 'update_existing');
  assert.equal(decision.shouldAdd, true);
  assert.equal(decision.matchedId, 'proj-1');
});

test('education scanner updates upcoming semester 3 and skips identical semester 1', () => {
  const sem3 = evaluateScanDecision({
    raw: {
      detectedModule: 'education',
      detectedType: 'University Marksheet',
      confidence: 0.95,
      data: { semesterNumber: 3, sgpa: 8.84, status: 'PASS' },
    },
    portfolio: snapshot,
    fileName: 'sem3_marksheet.pdf',
    mimeType: 'application/pdf',
  });
  assert.equal(sem3.action, 'update_existing');
  assert.equal(sem3.matchedId, 'semester-3');

  const sem1Dup = evaluateScanDecision({
    raw: {
      detectedModule: 'education',
      detectedType: 'University Marksheet',
      confidence: 0.95,
      data: { semesterNumber: 1, sgpa: 7.91, status: 'PASS' },
    },
    portfolio: snapshot,
    fileName: 'sem1_marksheet.pdf',
    mimeType: 'application/pdf',
  });
  assert.equal(sem1Dup.action, 'skip_duplicate');
  assert.equal(sem1Dup.shouldAdd, false);
});

test('skills scanner merges only missing skills into matching category and skips exact duplicates', () => {
  const mergeDecision = evaluateScanDecision({
    raw: {
      detectedModule: 'skills',
      detectedType: 'Skills List',
      confidence: 0.9,
      data: {
        category: 'Frontend Development',
        skills: [{ name: 'React', level: 95 }, { name: 'Next.js', level: 85 }],
      },
    },
    portfolio: snapshot,
  });
  assert.equal(mergeDecision.action, 'update_existing');
  assert.equal(mergeDecision.matchedLabel, 'Frontend Development');

  const dupDecision = evaluateScanDecision({
    raw: {
      detectedModule: 'skills',
      detectedType: 'Skills List',
      confidence: 0.9,
      data: {
        category: 'Frontend Development',
        skills: [{ name: 'React', level: 95 }],
      },
    },
    portfolio: snapshot,
  });
  assert.equal(dupDecision.action, 'skip_duplicate');
});

test('normalizeScannerModule handles module aliases and filename hints cleanly', () => {
  assert.equal(normalizeScannerModule('projects', 'github_repository'), 'project');
  assert.equal(normalizeScannerModule('academic', 'marksheet'), 'education');
  assert.equal(normalizeScannerModule('profile_photo', 'headshot'), 'profile_photo');
});

test('matches existing project via liveDemoUrl and flags unread SGPA warning', () => {
  const snapshotWithLive: PortfolioSnapshotForScan = {
    ...snapshot,
    projects: [
      {
        ...snapshot.projects![0],
        liveDemoUrl: 'https://worksphere.demo.app',
      },
    ],
  };

  const projMatch = evaluateScanDecision({
    raw: {
      detectedModule: 'project',
      detectedType: 'live_web_project',
      confidence: 0.9,
      data: {
        title: 'WorkSphere Dashboard',
        liveDemoUrl: 'https://www.worksphere.demo.app/',
        techStack: ['React', 'Tailwind CSS'],
      },
    },
    portfolio: snapshotWithLive,
    url: 'https://worksphere.demo.app',
  });
  assert.equal(projMatch.action, 'update_existing');
  assert.equal(projMatch.matchedId, 'proj-1');

  const unreadSgpaDecision = evaluateScanDecision({
    raw: {
      detectedModule: 'education',
      detectedType: 'University Semester Marksheet',
      confidence: 0.72,
      data: { semesterNumber: 3, status: 'PASS' },
    },
    portfolio: snapshot,
    fileName: 'sem3_blurry.jpg',
    mimeType: 'image/jpeg',
  });
  assert.equal(unreadSgpaDecision.detectedModule, 'education');
  assert.ok(unreadSgpaDecision.warnings.some((w) => /SGPA/i.test(w)));
});

