import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

export function buildNiteshResumePdf(): Buffer {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Header Background Accent (Subtle hairline banner)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, contentWidth, 80, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 80, 6, 6, 'S');

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('NITESH KUMAR', margin + 16, y + 28);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('FULL-STACK DEVELOPER  |  MERN STACK  |  AI ENTHUSIAST', margin + 16, y + 45);

  // Contact Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Rohtas, Bihar, India   |   +91 9334387983   |   nitesh933438@gmail.com', margin + 16, y + 62);
  doc.text('GitHub: github.com/nitesh933438   |   LinkedIn: linkedin.com/in/nitesh933438', margin + 16, y + 73);

  y += 94;

  // Helper for Section Titles
  const renderSectionHeader = (title: string) => {
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y, 4, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin + 10, y + 10);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(margin + 120, y + 7, pageWidth - margin, y + 7);

    y += 18;
  };

  // Section 1: Professional Summary
  renderSectionHeader('Professional Summary');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const summaryText =
    'Passionate and results-driven Full-Stack MERN Developer pursuing B.Tech in Computer Science and Engineering at Arka Jain University (9.23 SGPA). Proven track record of designing, building, and deploying 8+ production web applications, automated bots, and AI assistants. Strong foundation in modern JavaScript/TypeScript, scalable RESTful APIs, cloud deployment, and user-centric frontend architectures.';
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 11 + 6;

  // Section 2: Technical Skills
  renderSectionHeader('Technical Skills');
  const skills = [
    { label: 'Frontend', text: 'React.js, TypeScript, JavaScript (ES6+), Tailwind CSS, HTML5, CSS3, Vite, Responsive UI/UX, Chart.js' },
    { label: 'Backend & APIs', text: 'Node.js, Express.js, RESTful APIs, Webhooks, Supabase, Firebase Firestore & Authentication' },
    { label: 'Databases', text: 'MongoDB, Mongoose ORM, PostgreSQL, Relational DB Basics' },
    { label: 'AI & Automation', text: 'Google Gemini API, Agentic AI, WhatsApp Business API Automation, Prompt Engineering' },
    { label: 'DevOps & Tools', text: 'Git, GitHub, Postman, Vercel, Render, VS Code, Linux Shell, NPM' },
  ];

  skills.forEach((s) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${s.label}: `, margin, y);
    const labelWidth = doc.getTextWidth(`${s.label}: `);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitSkill = doc.splitTextToSize(s.text, contentWidth - labelWidth);
    doc.text(splitSkill, margin + labelWidth, y);
    y += splitSkill.length * 10 + 2;
  });
  y += 6;

  // Section 3: Education
  renderSectionHeader('Education');

  // University
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Bachelor of Technology (B.Tech) - Computer Science & Engineering', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('2025 - 2029 (Currently Pursuing)', pageWidth - margin - doc.getTextWidth('2025 - 2029 (Currently Pursuing)'), y);
  y += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Arka Jain University - Jharkhand, India', margin, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('Key Achievements: Semester 1 SGPA: 7.91 | Semester 2 SGPA: 9.23 (Distinction)', margin, y);
  y += 14;

  // Class 12
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Intermediate (Class 12th) - Science Stream', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('Passing Year: 2025', pageWidth - margin - doc.getTextWidth('Passing Year: 2025'), y);
  y += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Bihar School Examination Board (BSEB) - Rohtas, Bihar', margin, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129);
  doc.text('Result: First Division | 78.6% (393 / 500)', margin, y);
  y += 14;

  // Class 10
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Matriculation (Class 10th)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('Passing Year: 2023', pageWidth - margin - doc.getTextWidth('Passing Year: 2023'), y);
  y += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Bihar School Examination Board (BSEB) - Rohtas, Bihar', margin, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129);
  doc.text('Result: First Division | 79.8% (399 / 500)', margin, y);
  y += 16;

  // Section 4: Featured Projects
  renderSectionHeader('Featured Production Projects');

  const projects = [
    {
      title: 'Money Details - Financial Tracking & Analytics Portal',
      stack: 'React, JavaScript, Tailwind CSS, Chart.js',
      live: 'https://nitesh933438.github.io/Money-Details/',
      bullets: [
        'Built full-stack personal finance tracker with category breakdown, budget limit warnings, and dynamic charts.',
        'Engineered responsive mobile-first UI with dark/light theme persistence and local storage cache.',
      ],
    },
    {
      title: 'WhatsApp Personal AI Bot - Automated Intelligence Assistant',
      stack: 'Node.js, Express, WhatsApp Business API, Google Gemini API, Render',
      live: 'https://nitesh-personal-bot.onrender.com/',
      bullets: [
        'Developed intelligent conversational webhook bot providing 24/7 autonomous responses and task assistance.',
        'Integrated Google Gemini LLM API for context-aware dialog processing with zero-cost cloud hosting on Render.',
      ],
    },
    {
      title: 'WorkSphere HRMS - Enterprise Human Resource Suite',
      stack: 'React, TypeScript, Tailwind CSS, Node.js',
      live: 'https://nitesh933438.github.io/WorkSphere-HRMS/',
      bullets: [
        'Engineered comprehensive HR management platform featuring employee directory, org charts, and payroll metrics.',
        'Implemented real-time attendance logging, role-based view permissions, and exportable employee rosters.',
      ],
    },
    {
      title: 'Digital Vault - Encrypted Storage & Note Locker',
      stack: 'React, Node.js, Express, Web Crypto API, Tailwind CSS',
      live: 'https://nitesh933438.github.io/Digital-Vault/',
      bullets: [
        'Architected private credential locker with client-side master password hashing and categorized secure notes.',
      ],
    },
  ];

  projects.forEach((proj) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(proj.title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    const stackWidth = doc.getTextWidth(proj.stack);
    doc.text(proj.stack, pageWidth - margin - stackWidth, y);
    y += 10;

    proj.bullets.forEach((bullet) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text('•', margin + 4, y);
      const splitBullet = doc.splitTextToSize(bullet, contentWidth - 14);
      doc.text(splitBullet, margin + 12, y);
      y += splitBullet.length * 9.5;
    });
    y += 3;
  });

  y += 4;

  // Section 5: Certifications & Recognition
  renderSectionHeader('Certifications & Achievements');
  const certs = [
    'AWS Networking in AWS SysOps — Henry Harvin Education (Practitioner ID: HH-289146, Valid through Feb 2027)',
    'A Guide to Artificial Intelligence — Microsoft Learn (Foundations of AI & Generative Workflows)',
    'Building Database Agents & Claude 4.5 AI — Analytics Vidhya (Agentic AI architectures & integrations)',
    'Academic Distinction: 9.23 SGPA in B.Tech CSE Semester 2 at Arka Jain University',
  ];

  certs.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    doc.text('✔', margin + 4, y);
    const splitC = doc.splitTextToSize(c, contentWidth - 16);
    doc.text(splitC, margin + 14, y);
    y += splitC.length * 9.5 + 1;
  });

  return Buffer.from(doc.output('arraybuffer'));
}

if (process.argv[1]?.endsWith('generate_resume_pdf.ts')) {
  const buf = buildNiteshResumePdf();
  const target1 = path.resolve('public/nitesh_kumar_resume.pdf');
  const target2 = path.resolve('public/resume/nitesh-kumar-resume.pdf');
  
  fs.writeFileSync(target1, buf);
  fs.mkdirSync(path.dirname(target2), { recursive: true });
  fs.writeFileSync(target2, buf);
  
  console.log(`Successfully generated resume PDF at:`);
  console.log(`- ${target1} (${buf.length} bytes)`);
  console.log(`- ${target2} (${buf.length} bytes)`);
}
