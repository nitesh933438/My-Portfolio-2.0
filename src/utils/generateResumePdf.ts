import { jsPDF } from 'jspdf';
import type { Project, SkillCategory } from '../data/portfolio';
import type { PortfolioCertificate } from '../types/certificate';
import type { SchoolRecord, UniversityRecord } from '../data/education';
import { getProjectMetrics, getCertificateMetrics, getEducationMetrics } from './portfolioMetrics';

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  bio: string;
  university: UniversityRecord;
  schooling: SchoolRecord[];
  projects: Project[];
  certificates: PortfolioCertificate[];
  skills: SkillCategory[];
}

export function downloadResumePdf(data?: Partial<ResumeData>) {
  const name = data?.name || 'Nitesh Kumar';
  const title = data?.title || 'Full-Stack Developer | MERN Stack | AI Enthusiast';
  const email = data?.email || 'nitesh933438@gmail.com';
  const phone = data?.phone || '+91 9334387983';
  const location = data?.location || 'Rohtas, Bihar, India';
  const github = data?.github || 'https://github.com/nitesh933438';
  const linkedin = data?.linkedin || 'https://www.linkedin.com/in/nitesh933438/';

  const projectMetrics = getProjectMetrics(data?.projects || []);
  const certMetrics = getCertificateMetrics(data?.certificates || []);
  const eduMetrics = getEducationMetrics(data?.university, data?.schooling || []);

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 80, 6, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 80, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(name.toUpperCase(), margin + 16, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(title.toUpperCase(), margin + 16, y + 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${location}   |   ${phone}   |   ${email}`, margin + 16, y + 62);
  doc.text(`GitHub: ${github.replace('https://', '')}   |   LinkedIn: ${linkedin.replace('https://', '')}`, margin + 16, y + 73);
  y += 94;

  const renderSectionHeader = (secTitle: string) => {
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y, 4, 13, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(secTitle.toUpperCase(), margin + 10, y + 10);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(margin + 120, y + 7, pageWidth - margin, y + 7);
    y += 18;
  };

  // Summary
  renderSectionHeader('Professional Summary');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const projectCountText = projectMetrics.active.length > 0 ? `${projectMetrics.active.length}+` : 'multiple';
  const latestSemText = eduMetrics.latestSgpa ? ` (${eduMetrics.latestSgpa.toFixed(2)} latest SGPA)` : '';
  const summaryText =
    data?.bio ||
    `Passionate Full-Stack MERN Developer pursuing ${data?.university?.degree || 'B.Tech'} in ${data?.university?.branch || 'Computer Science & Engineering'} at ${data?.university?.institution || 'Arka Jain University'}${latestSemText}. Proven track record building ${projectCountText} web applications, AI integrations, and responsive platforms backed by ${certMetrics.published.length || 'verified'}+ technical certifications.`;
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 11 + 6;

  // Technical Skills
  renderSectionHeader('Technical Skills');
  const dynamicSkills = (data?.skills && data.skills.length > 0)
    ? data.skills.map((group) => ({
        label: group.category,
        text: group.skills.map((s) => s.name).join(', '),
      }))
    : [
        { label: 'Frontend', text: 'React.js, TypeScript, JavaScript (ES6+), Tailwind CSS, Vite' },
        { label: 'Backend & APIs', text: 'Node.js, Express.js, RESTful APIs, Supabase, Firebase' },
        { label: 'AI & Automation', text: 'Google Gemini API, WhatsApp Business API, Prompt Engineering' },
      ];

  dynamicSkills.forEach((s) => {
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

  // Education
  renderSectionHeader('Education');
  const uni = data?.university;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${uni?.degree || 'Bachelor of Technology (B.Tech)'} - ${uni?.branch || 'Computer Science & Engineering'}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  const uniSession = `${uni?.session || '2025 - 2029'} (${uni?.status || 'Pursuing'})`;
  doc.text(uniSession, pageWidth - margin - doc.getTextWidth(uniSession), y);
  y += 11;
  doc.setTextColor(71, 85, 105);
  doc.text(`${uni?.institution || 'Arka Jain University'} - ${uni?.location || 'Jharkhand, India'}`, margin, y);
  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129);
  const semLine = eduMetrics.declaredSemesters.length
    ? eduMetrics.declaredSemesters.map((s) => `Sem ${s.semesterNumber}: ${Number(s.sgpa).toFixed(2)} SGPA`).join(' | ')
    : 'Results scheduled';
  doc.text(`Verified Semesters: ${semLine}`, margin, y);
  y += 14;

  (data?.schooling || []).forEach((sch) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sch.qualificationTitle} (${sch.standard})`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    const yr = `Passing Year: ${sch.passingYear}`;
    doc.text(yr, pageWidth - margin - doc.getTextWidth(yr), y);
    y += 11;
    doc.setTextColor(71, 85, 105);
    doc.text(`${sch.boardFullName || sch.board} - ${sch.location}`, margin, y);
    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(16, 185, 129);
    doc.text(`Result: ${sch.division} | ${sch.percentage}% (${sch.totalMarks} / ${sch.maxMarks})`, margin, y);
    y += 13;
  });

  // Featured Projects
  renderSectionHeader(`Featured Projects (${projectMetrics.active.length} Active)`);
  projectMetrics.resumeFeatured.slice(0, 4).forEach((proj) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(proj.title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(79, 70, 229);
    const stackStr = (proj.techStack || []).slice(0, 4).join(', ');
    const stackWidth = doc.getTextWidth(stackStr);
    doc.text(stackStr, pageWidth - margin - stackWidth, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(`• ${proj.shortDescription}`, contentWidth - 10);
    doc.text(splitDesc, margin + 6, y);
    y += splitDesc.length * 9.5 + 3;
  });
  y += 4;

  // Certifications
  renderSectionHeader(`Certifications (${certMetrics.published.length} Verified)`);
  certMetrics.resumeFeatured.slice(0, 5).forEach((cert) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const line = `✔ ${cert.title} — ${cert.issuer} (${cert.issueDate})`;
    const splitC = doc.splitTextToSize(line, contentWidth - 8);
    doc.text(splitC, margin + 4, y);
    y += splitC.length * 9.5 + 2;
  });

  const filename = `${name.replace(/\s+/g, '_')}_Resume.pdf`;
  doc.save(filename);
}
