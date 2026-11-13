import { doc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  isUserAdmin,
  publishSemesterResult,
  SiteSettings,
} from './academicFirebase';
import { saveCertificate } from './certificateFirebase';
import { saveProject } from './projectFirebase';
import { saveSkills, saveExperience } from './portfolioContentFirebase';
import { uploadFileProxy } from './supabaseStorage';
import type { PortfolioCertificate, CertificateCategory } from '../types/certificate';
import type { Project, ProjectCategory, SkillCategory, Experience } from '../data/portfolio';
import type { SchoolRecord, UniversityRecord } from '../data/education';
import type { ScanDecision, PortfolioSnapshotForScan } from '../utils/scannerDecisions';
import { normalizeMatchKey } from '../utils/scannerDecisions';

export interface AutoApplyResult {
  applied: boolean;
  status: 'created' | 'updated' | 'skipped' | 'rejected' | 'error';
  message: string;
  targetRoute: string;
  savedId?: string;
}

const VALID_CERT_CATEGORIES: CertificateCategory[] = [
  'Web & Software Development',
  'AI & Generative AI',
  'AI Agents',
  'Data Science',
  'AWS & Cloud',
  'GitHub & Developer Tools',
  'Microsoft & Productivity',
  'Professional Development',
  'Events & Participation',
  'Other',
];

const VALID_PROJECT_CATEGORIES: ProjectCategory[] = [
  'Full-Stack Development',
  'AI & Automation',
  'Web Applications',
  'SaaS & Management',
  'E-Commerce',
  'Productivity & Tools',
  'Education & LMS',
  'Security & Storage',
  'Other Projects',
];

function mapCertCategory(raw?: string): CertificateCategory {
  const s = String(raw || '').toLowerCase();
  const exact = VALID_CERT_CATEGORIES.find((c) => c.toLowerCase() === s);
  if (exact) return exact;
  if (s.includes('agent')) return 'AI Agents';
  if (s.includes('ai') || s.includes('generative') || s.includes('ml')) return 'AI & Generative AI';
  if (s.includes('data') || s.includes('python') || s.includes('analytics')) return 'Data Science';
  if (s.includes('aws') || s.includes('cloud')) return 'AWS & Cloud';
  if (s.includes('github') || s.includes('git')) return 'GitHub & Developer Tools';
  if (s.includes('microsoft') || s.includes('azure')) return 'Microsoft & Productivity';
  if (s.includes('web') || s.includes('software') || s.includes('java') || s.includes('program') || s.includes('computer')) {
    return 'Web & Software Development';
  }
  if (s.includes('event') || s.includes('workshop') || s.includes('hackathon')) return 'Events & Participation';
  return 'Professional Development';
}

function mapProjectCategory(raw?: string): ProjectCategory {
  const s = String(raw || '').toLowerCase();
  const exact = VALID_PROJECT_CATEGORIES.find((c) => c.toLowerCase() === s);
  if (exact) return exact;
  if (s.includes('ai') || s.includes('bot') || s.includes('auto')) return 'AI & Automation';
  if (s.includes('saas') || s.includes('hr') || s.includes('manage')) return 'SaaS & Management';
  if (s.includes('shop') || s.includes('commerce')) return 'E-Commerce';
  if (s.includes('edu') || s.includes('lms')) return 'Education & LMS';
  if (s.includes('sec') || s.includes('vault') || s.includes('auth')) return 'Security & Storage';
  if (s.includes('tool') || s.includes('prod')) return 'Productivity & Tools';
  return 'Full-Stack Development';
}

export async function autoApplyScanDecision(params: {
  decision: ScanDecision;
  file?: File | null;
  portfolio: PortfolioSnapshotForScan & {
    allCertificates?: PortfolioCertificate[];
  };
}): Promise<AutoApplyResult> {
  const { decision, file, portfolio } = params;

  if (decision.action === 'reject_irrelevant') {
    return {
      applied: false,
      status: 'rejected',
      message: decision.reason,
      targetRoute: '/admin',
    };
  }

  if (decision.action === 'skip_duplicate') {
    return {
      applied: false,
      status: 'skipped',
      message: decision.reason,
      targetRoute: `/admin/${decision.detectedModule === 'education' ? 'education' : decision.detectedModule === 'project' ? 'projects' : decision.detectedModule === 'certificate' ? 'certificates' : decision.detectedModule}`,
      savedId: decision.matchedId,
    };
  }

  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin sign-in required to auto-save changes to Firebase.');
  }

  const data = decision.normalizedData || {};

  // Guard Education auto-apply BEFORE uploading any storage files so we never publish PASS without real extracted grades
  if (decision.detectedModule === 'education') {
    const isSchool = Boolean(decision.matchedId && !decision.matchedId.startsWith('semester-'));
    if (isSchool) {
      const hasSchoolNumeric =
        (typeof data.percentage === 'number' && !Number.isNaN(data.percentage)) ||
        (typeof data.totalMarks === 'number' && !Number.isNaN(data.totalMarks));
      if (!hasSchoolNumeric) {
        return {
          applied: false,
          status: 'error',
          message: 'Marks or percentage could not be read from this file. Click Review in Form to enter it manually.',
          targetRoute: '/admin/education',
          savedId: decision.matchedId,
        };
      }
    } else {
      const validSgpa =
        typeof data.sgpa === 'number' && !Number.isNaN(data.sgpa) && data.sgpa > 0 && data.sgpa <= 10
          ? data.sgpa
          : null;
      if (validSgpa === null) {
        return {
          applied: false,
          status: 'error',
          message: 'SGPA could not be read from this marksheet. Click Review in Form to enter exact SGPA manually.',
          targetRoute: '/admin/education',
          savedId: decision.matchedId,
        };
      }
    }
  }

  let uploadedUrl = '';
  if (file) {
    const idToken = (await auth.currentUser?.getIdToken().catch(() => '')) || '';
    const uploaded = await uploadFileProxy(file, decision.suggestedStorageFolder, idToken);
    uploadedUrl = uploaded.url;
  }

  // 1. Certificate auto-create / auto-merge
  if (decision.detectedModule === 'certificate') {
    const allCerts = portfolio.allCertificates || portfolio.certificates || [];
    const existing = decision.matchedId ? allCerts.find((c) => c.id === decision.matchedId) : undefined;
    const isPdf = file ? file.type === 'application/pdf' : existing?.fileType === 'pdf';

    if (existing && decision.action === 'update_existing') {
      const merged: Omit<PortfolioCertificate, 'id'> = {
        ...existing,
        title: existing.title || String(data.title || 'Professional Certificate'),
        issuer: existing.issuer || String(data.issuer || 'Official Issuing Authority'),
        category: existing.category || mapCertCategory(data.category),
        description:
          data.description && String(data.description).length > String(existing.description || '').length
            ? String(data.description)
            : existing.description,
        issueDate: existing.issueDate || String(data.issueDate || new Date().toISOString().split('T')[0]),
        credentialId: existing.credentialId || (data.credentialId ? String(data.credentialId) : undefined),
        credentialUrl: existing.credentialUrl || (data.credentialUrl ? String(data.credentialUrl) : undefined),
        fileUrl: uploadedUrl || existing.fileUrl,
        imageUrl: !isPdf && uploadedUrl ? uploadedUrl : existing.imageUrl,
        fileType: uploadedUrl ? (isPdf ? 'pdf' : 'image') : existing.fileType,
        skills: Array.from(new Set([...(existing.skills || []), ...(Array.isArray(data.skills) ? data.skills.map(String) : [])])),
        featured: existing.featured,
        published: existing.published,
        displayOrder: existing.displayOrder,
      };
      await saveCertificate(merged, existing.id);
      return {
        applied: true,
        status: 'updated',
        message: `Merged updates into existing certificate "${existing.title}" without creating duplicates.`,
        targetRoute: '/admin/certificates',
        savedId: existing.id,
      };
    }

    const nextOrder = allCerts.length;
    const payload: Omit<PortfolioCertificate, 'id'> = {
      title: String(data.title || file?.name?.replace(/\.[^/.]+$/, '') || 'Verified Certificate'),
      issuer: String(data.issuer || 'Official Issuing Authority'),
      category: mapCertCategory(data.category),
      description: String(
        data.description ||
          `Official certification awarded by ${data.issuer || 'accredited issuer'}.`
      ),
      issueDate: String(data.issueDate || new Date().toISOString().split('T')[0]),
      credentialId: data.credentialId ? String(data.credentialId) : undefined,
      credentialUrl: data.credentialUrl ? String(data.credentialUrl) : undefined,
      imageUrl: !isPdf && uploadedUrl ? uploadedUrl : '',
      fileUrl: uploadedUrl || '',
      fileType: isPdf ? 'pdf' : 'image',
      skills: Array.isArray(data.skills) && data.skills.length ? data.skills.map(String) : ['Software Engineering'],
      featured: false,
      published: true,
      displayOrder: nextOrder,
    };

    const id = await saveCertificate(payload);
    return {
      applied: true,
      status: 'created',
      message: `Certificate #${String(nextOrder + 1).padStart(2, '0')} "${payload.title}" uploaded & published automatically.`,
      targetRoute: '/admin/certificates',
      savedId: id,
    };
  }

  // 2. Project auto-create / auto-merge
  if (decision.detectedModule === 'project') {
    const existingProjects = portfolio.projects || [];
    const existing = decision.matchedId ? existingProjects.find((p) => p.id === decision.matchedId) : undefined;
    const isImage = Boolean(file && file.type.startsWith('image/') && uploadedUrl);

    if (existing && decision.action === 'update_existing') {
      const mergedTech = Array.from(
        new Set([...(existing.techStack || []), ...(Array.isArray(data.techStack) ? data.techStack.map(String) : [])])
      );
      const nextAdditional =
        isImage && existing.mainScreenshot && existing.mainScreenshot !== uploadedUrl
          ? Array.from(new Set([...(existing.additionalScreenshots || []), uploadedUrl]))
          : existing.additionalScreenshots || [];

      const mergedProject: Omit<Project, 'id'> = {
        slug: existing.slug,
        title: existing.title,
        shortDescription: existing.shortDescription || String(data.shortDescription || ''),
        detailedDescription: existing.detailedDescription || String(data.detailedDescription || data.fullDescription || ''),
        category: existing.category,
        techStack: mergedTech,
        mainScreenshot: existing.mainScreenshot || (isImage ? uploadedUrl : ''),
        additionalScreenshots: nextAdditional,
        screenshotMetadata: existing.screenshotMetadata,
        githubUrl: existing.githubUrl || String(data.githubUrl || ''),
        liveDemoUrl: existing.liveDemoUrl || String(data.liveDemoUrl || ''),
        status: existing.status,
        featured: existing.featured,
        displayOrder: existing.displayOrder,
        keyFeatures: existing.keyFeatures?.length
          ? existing.keyFeatures
          : Array.isArray(data.keyFeatures)
          ? data.keyFeatures.map(String)
          : [],
      };
      await saveProject(mergedProject, existing.id);
      return {
        applied: true,
        status: 'updated',
        message: `Updated existing project "${existing.title}"${isImage ? ' with new screenshot' : ''} automatically.`,
        targetRoute: '/admin/projects',
        savedId: existing.id,
      };
    }

    const title = String(data.title || 'Modern Web Project');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `project-${Date.now()}`;
    const newProj: Omit<Project, 'id'> = {
      slug,
      title,
      shortDescription: String(data.shortDescription || `${title} — Production web application.`),
      detailedDescription: String(data.detailedDescription || data.fullDescription || data.shortDescription || ''),
      category: mapProjectCategory(data.category),
      techStack: Array.isArray(data.techStack) && data.techStack.length ? data.techStack.map(String) : ['React', 'TypeScript'],
      mainScreenshot: isImage ? uploadedUrl : '',
      additionalScreenshots: [],
      githubUrl: String(data.githubUrl || ''),
      liveDemoUrl: String(data.liveDemoUrl || ''),
      status: 'Completed',
      featured: false,
      displayOrder: existingProjects.length + 1,
      keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures.map(String) : [],
    };
    const id = await saveProject(newProj);
    return {
      applied: true,
      status: 'created',
      message: `Project "${title}" created & synced automatically (#${existingProjects.length + 1}).`,
      targetRoute: '/admin/projects',
      savedId: id,
    };
  }

  // 3. Education auto-update
  if (decision.detectedModule === 'education') {
    const isSchool = decision.matchedId && !decision.matchedId.startsWith('semester-');
    if (isSchool) {
      const targetSchool = (portfolio.schooling || []).find((s) => s.id === decision.matchedId);
      if (!targetSchool) throw new Error('Matching school record not found.');
      const updatedSchool: SchoolRecord = {
        ...targetSchool,
        percentage: typeof data.percentage === 'number' ? data.percentage : targetSchool.percentage,
        totalMarks: typeof data.totalMarks === 'number' ? data.totalMarks : targetSchool.totalMarks,
        passingYear: data.passingYear ? String(data.passingYear) : targetSchool.passingYear,
        board: data.board ? String(data.board) : targetSchool.board,
      };
      await setDoc(doc(db, 'academic_records', targetSchool.id), { ...updatedSchool, updatedAt: new Date().toISOString() }, { merge: true });
      return {
        applied: true,
        status: 'updated',
        message: `Updated ${targetSchool.qualificationTitle} (${updatedSchool.percentage}%) automatically.`,
        targetRoute: '/admin/education',
        savedId: targetSchool.id,
      };
    }

    const uni = portfolio.university as UniversityRecord | undefined;
    const requestedSem = Number(data.semesterNumber) || 1;
    const targetSem = uni?.semesters?.find((s) => s.semesterNumber === requestedSem) || uni?.semesters?.[0];
    if (!targetSem) throw new Error('Semester slot not found.');
    const sgpaVal = Number(data.sgpa);
    await publishSemesterResult(
      {
        ...targetSem,
        sgpa: sgpaVal,
        resultDeclarationDate: String(
          data.resultDeclarationDate ||
            targetSem.resultDeclarationDate ||
            new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        ),
        status: data.passFailStatus === 'FAIL' ? 'FAIL' : 'PASS',
        statusLabel: data.passFailStatus === 'FAIL' ? 'Fail' : 'Pass',
        isDeclared: true,
      },
      {
        fileName: file?.name || `AI_Scan_Sem${targetSem.semesterNumber}`,
        extractedData: data,
        adminEmail: auth.currentUser?.email || 'admin',
        officialCGPA: typeof data.officialCGPA === 'number' ? data.officialCGPA : undefined,
      }
    );
    return {
      applied: true,
      status: 'updated',
      message: `Published Semester ${targetSem.semesterNumber} result (SGPA ${sgpaVal}) & updated audit log.`,
      targetRoute: '/admin/education',
      savedId: `semester-${targetSem.semesterNumber}`,
    };
  }

  // 4. Skills auto-merge
  if (decision.detectedModule === 'skills') {
    const current = [...(portfolio.skills || [])];
    const incomingSkills = (Array.isArray(data.skills) ? data.skills : []).map((s: any) => ({
      name: String(s.name).trim(),
      level: Math.max(10, Math.min(100, Number(s.level) || 80)),
    }));
    const catKey = normalizeMatchKey(data.category || '');
    const matchIdx = current.findIndex((g) => {
      const gKey = normalizeMatchKey(g.category);
      return catKey && (gKey === catKey || gKey.includes(catKey) || catKey.includes(gKey));
    });

    if (matchIdx >= 0) {
      const existingGroup = current[matchIdx];
      const skillMap = new Map(existingGroup.skills.map((s) => [s.name.toLowerCase(), s]));
      incomingSkills.forEach((s: { name: string; level: number }) => {
        if (!skillMap.has(s.name.toLowerCase())) {
          skillMap.set(s.name.toLowerCase(), s);
        }
      });
      current[matchIdx] = { ...existingGroup, skills: Array.from(skillMap.values()) };
      await saveSkills(current);
      return {
        applied: true,
        status: 'updated',
        message: `Merged new skills into "${existingGroup.category}" automatically.`,
        targetRoute: '/admin/skills',
      };
    }

    const newCat: SkillCategory = {
      category: String(data.category || 'Extracted Technical Skills'),
      iconName: 'Code2',
      skills: incomingSkills,
    };
    await saveSkills([...current, newCat]);
    return {
      applied: true,
      status: 'created',
      message: `Added skill category "${newCat.category}" (${incomingSkills.length} skills) automatically.`,
      targetRoute: '/admin/skills',
    };
  }

  // 5. Experience auto-add/merge
  if (decision.detectedModule === 'experience') {
    const current = [...(portfolio.experience || [])];
    const draft: Experience = {
      role: String(data.role || 'Software Developer'),
      company: String(data.company || 'Organization'),
      location: String(data.location || 'Remote'),
      period: String(data.period || `${new Date().getFullYear()} - Present`),
      description: String(data.description || ''),
      highlights: Array.isArray(data.highlights) ? data.highlights.map(String) : [],
      type: ['Professional', 'Independent', 'Internship'].includes(data.type) ? data.type : 'Professional',
    };

    const matchIdx = decision.matchedId !== undefined ? Number(decision.matchedId) : -1;
    if (decision.action === 'update_existing' && matchIdx >= 0 && current[matchIdx]) {
      current[matchIdx] = {
        ...current[matchIdx],
        ...draft,
        highlights: Array.from(new Set([...(current[matchIdx].highlights || []), ...draft.highlights])),
      };
      await saveExperience(current);
      return {
        applied: true,
        status: 'updated',
        message: `Updated experience "${draft.role} @ ${draft.company}" automatically.`,
        targetRoute: '/admin/experience',
      };
    }

    await saveExperience([...current, draft]);
    return {
      applied: true,
      status: 'created',
      message: `Added experience "${draft.role} @ ${draft.company}" automatically.`,
      targetRoute: '/admin/experience',
    };
  }

  // 6. Settings / Resume PDF / Profile Photo
  if (decision.detectedModule === 'settings') {
    const settingsPatch: Partial<SiteSettings> = {};
    if (data.name) settingsPatch.name = String(data.name);
    if (data.title) settingsPatch.title = String(data.title);
    if (data.bio) settingsPatch.bio = String(data.bio);
    if (data.location) settingsPatch.location = String(data.location);
    if (data.email) settingsPatch.email = String(data.email);
    if (data.whatsapp) settingsPatch.whatsapp = String(data.whatsapp);
    if (uploadedUrl) {
      if (data.__assetKind === 'profilePhoto' || (file && file.type.startsWith('image/'))) {
        settingsPatch.profilePhoto = uploadedUrl;
      } else if (file && file.type === 'application/pdf') {
        settingsPatch.resumeUrl = uploadedUrl;
      }
    }
    await setDoc(
      doc(db, 'site_metadata', 'portfolio_config'),
      { ...settingsPatch, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return {
      applied: true,
      status: 'updated',
      message: `Portfolio settings${uploadedUrl ? ' & uploaded asset' : ''} synced live.`,
      targetRoute: '/admin/settings',
    };
  }

  throw new Error('Unsupported target module for auto-apply.');
}
