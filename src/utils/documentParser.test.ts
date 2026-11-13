import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocumentContent } from './documentParser.js';

test('parseDocumentContent extracts real Microsoft certificate from OCR text even with generic camera filename', () => {
  const res = parseDocumentContent({
    fileName: 'IMG_20261113_WA0001.jpg',
    mimeType: 'image/jpeg',
    extractedText:
      'Microsoft\nNitesh Kumar\nhas successfully completed\nA guide to artificial intelligence\nMay 14, 2026\nSatya Narayana Nadella',
  });

  assert.equal(res.shouldAddToPortfolio, true);
  assert.equal(res.detectedModule, 'certificate');
  assert.equal(res.data.issuer, 'Microsoft');
  assert.equal(res.data.issueDate, '2026-05-14');
  assert.match(res.data.title, /Guide To Artificial Intelligence/i);
});

test('parseDocumentContent extracts NPTEL Java certificate PDF details accurately', () => {
  const res = parseDocumentContent({
    fileName: 'nptel-programming-in-java.pdf',
    mimeType: 'application/pdf',
    extractedText:
      'NPTEL\nNITESH KUMAR\nPROGRAMMING IN JAVA\n78%\n24.94/25 52.5/75\nJUL-OCT 2026\n(12 week course)\nNo. of credits recommended: 4\nRoll No: NPTEL26CS153S1262000875',
  });

  assert.equal(res.shouldAddToPortfolio, true);
  assert.equal(res.detectedModule, 'certificate');
  assert.match(res.data.issuer, /NPTEL/i);
  assert.match(res.data.title, /Programming In Java/i);
  assert.equal(res.data.credentialId, 'NPTEL26CS153S1262000875');
  assert.equal(res.data.score, '78%');
  assert.equal(res.data.credits, '4 Credits');
  assert.equal(res.data.issueDate, '2026-10-01');
});

test('parseDocumentContent uses REAL GitHub repo description, homepage, language, and topics instead of fake placeholders', () => {
  const res = parseDocumentContent({
    url: 'https://github.com/nitesh933438/Money-Details-Demo',
    githubRepo: {
      name: 'Money-Details-Demo',
      description: 'Personal finance and expense tracker built with React and Firebase.',
      homepage: 'https://nitesh933438.github.io/Money-Details/',
      language: 'TypeScript',
      topics: ['react', 'tailwind-css', 'expense-tracker'],
      readmeText: '# Money Details\n- Track daily income & expenses live\n- Visual analytics dashboard with CSV export',
      htmlUrl: 'https://github.com/nitesh933438/Money-Details-Demo',
    },
  });

  assert.equal(res.detectedModule, 'project');
  assert.equal(res.shouldAddToPortfolio, true);
  assert.equal(res.data.shortDescription, 'Personal finance and expense tracker built with React and Firebase.');
  assert.equal(res.data.liveDemoUrl, 'https://nitesh933438.github.io/Money-Details/');
  assert.ok(res.data.techStack.includes('TypeScript'));
  assert.ok(res.data.techStack.includes('React'));
  assert.ok(res.data.keyFeatures.some((f: string) => f.includes('Track daily income')));
});

test('parseDocumentContent classifies generic empty image as unknown instead of misclassifying as resume/settings', () => {
  const res = parseDocumentContent({
    fileName: 'IMG_20261113_WA0001.jpg',
    mimeType: 'image/jpeg',
    extractedText: '',
  });

  assert.equal(res.shouldAddToPortfolio, false);
  assert.equal(res.detectedModule, 'unknown');
});

test('parseDocumentContent respects explicit user hintModule when user chooses target category on unreadable image', () => {
  const res = parseDocumentContent({
    fileName: 'IMG_20261113_WA0001.jpg',
    mimeType: 'image/jpeg',
    extractedText: '',
    pastedText: 'WorkSphere Attendance Dashboard',
    hintModule: 'project',
  });

  assert.equal(res.shouldAddToPortfolio, true);
  assert.equal(res.detectedModule, 'project');
  assert.equal(res.data.title, 'WorkSphere Attendance Dashboard');
});

test('parseDocumentContent extracts 10th/12th school marksheet separately from university semesters', () => {
  const res = parseDocumentContent({
    fileName: 'BSEB_12th_Marksheet.pdf',
    mimeType: 'application/pdf',
    extractedText: 'Bihar School Examination Board Intermediate Class 12th Science Passing Year 2026 Marks 393 / 500 (78.6%)',
  });

  assert.equal(res.detectedModule, 'education');
  assert.equal(res.data.standard, 'Class XII');
  assert.equal(res.data.percentage, 78.6);
  assert.equal(res.data.totalMarks, 393);
});

test('parseDocumentContent extracts University Semester SGPA without inventing fake SGPA when absent', () => {
  const withSgpa = parseDocumentContent({
    fileName: 'Sem_3_Result.pdf',
    mimeType: 'application/pdf',
    extractedText: 'Arka Jain University B.Tech CSE Semester 3 Grade Card SGPA: 9.15 Result Declared 12 Jan 2027 PASS',
  });
  assert.equal(withSgpa.detectedModule, 'education');
  assert.equal(withSgpa.data.semesterNumber, 3);
  assert.equal(withSgpa.data.sgpa, 9.15);

  const withoutSgpa = parseDocumentContent({
    fileName: 'Sem_3_Notice.pdf',
    mimeType: 'application/pdf',
    extractedText: 'Arka Jain University Semester 3 Time Table',
  });
  assert.equal(withoutSgpa.detectedModule, 'education');
  assert.equal(withoutSgpa.data.sgpa, undefined);
});

test('parseDocumentContent always blocks Aadhaar, PAN, UPI and invoices even with a hintModule', () => {
  const res = parseDocumentContent({
    fileName: 'receipt.jpg',
    mimeType: 'image/jpeg',
    extractedText: 'PhonePe Transaction Receipt UPI Ref 432198765432 Paid Rs 450',
    hintModule: 'certificate',
  });

  assert.equal(res.shouldAddToPortfolio, false);
  assert.equal(res.detectedModule, 'irrelevant');
});

test('parseDocumentContent handles noisy real-world Microsoft/AnalyticsVidhya OCR, Resume with SGPA, and Next.js repo name cleanly', () => {
  const noisyMicrosoft = parseDocumentContent({
    fileName: 'IMG_20261113_WA0001.jpg',
    mimeType: 'image/jpeg',
    extractedText: `£" Microsoft
Vd a)I . NK
De Ne :
Nitesh Kumar |
has successfully completed ;
~ A guide to artificial intelligence < >
RN May 14, 2026 ~~
< SNANY fore DN N&OH Satya Narayana Nadella RA 2N`,
  });
  assert.equal(noisyMicrosoft.detectedModule, 'certificate');
  assert.equal(noisyMicrosoft.data.issuer, 'Microsoft');
  assert.equal(noisyMicrosoft.data.title, 'A Guide To Artificial Intelligence');
  assert.equal(noisyMicrosoft.data.issueDate, '2026-05-14');

  const avCert = parseDocumentContent({
    fileName: 'certificate-03.jpg',
    mimeType: 'image/jpeg',
    extractedText: `CERTIFICATE OF COMPLETION |
Awarded to
Nitesh Kumar
For successfully completing the Free Course
Ace a Data Scientist Interview in 2025
Provided by
AL AnalyticsVidhya
2025-09-25 he 400 s86t9tj0u |
Date Founder & CEO, Analytics Vidhya Certification ID`,
  });
  assert.equal(avCert.detectedModule, 'certificate');
  assert.equal(avCert.data.issuer, 'Analytics Vidhya');
  assert.equal(avCert.data.title, 'Ace A Data Scientist Interview In 2025');
  assert.equal(avCert.data.credentialId, 's86t9tj0u');
  assert.equal(avCert.data.issueDate, '2025-09-25');

  const resumeWithSgpa = parseDocumentContent({
    fileName: 'Nitesh_Kumar_-_Resume_8ce55380.pdf',
    mimeType: 'application/pdf',
    extractedText: `NITESH KUMAR
Full-Stack Developer | MERN Stack Developer
nitesh933438@gmail.com https://github.com/nitesh933438 https://www.linkedin.com/in/nitesh933438/
TECHNICAL SKILLS
React.js, Node.js, MongoDB
EDUCATION
B.Tech - CSE Semester 1: SGPA 7.91 | Semester 2: SGPA 9.23
12th Bihar Board 78.6%
PROFESSIONAL SUMMARY
Full-Stack Web Applications.`,
  });
  assert.equal(resumeWithSgpa.detectedModule, 'settings');
  assert.equal(resumeWithSgpa.data.email, 'nitesh933438@gmail.com');

  const nextRepo = parseDocumentContent({
    url: 'https://github.com/vercel/next.js',
    githubRepo: {
      name: 'next.js',
      fullName: 'vercel/next.js',
      description: 'The React Framework',
      homepage: 'https://nextjs.org',
      language: 'JavaScript',
      topics: ['react', 'nextjs'],
      readmeText: '<div align="center"><h1>Next.js</h1></div>\n\n- Learn Next.js framework documentation and routing',
      htmlUrl: 'https://github.com/vercel/next.js',
    },
  });
  assert.equal(nextRepo.detectedModule, 'project');
  assert.equal(nextRepo.data.title, 'Next.js');
  assert.ok(!String(nextRepo.data.detailedDescription).includes('<div'));
});

