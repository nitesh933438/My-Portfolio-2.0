import type { Project, SkillCategory, Experience } from '../data/portfolio';
import type { PortfolioCertificate } from '../types/certificate';
import type { SchoolRecord, UniversityRecord } from '../data/education';
import type { SiteSettings } from '../services/academicFirebase';

export type ScannerModule =
  | 'project'
  | 'certificate'
  | 'education'
  | 'experience'
  | 'skills'
  | 'settings'
  | 'profile_photo'
  | 'irrelevant'
  | 'unknown';

export type ScanAction =
  | 'create_new'
  | 'update_existing'
  | 'skip_duplicate'
  | 'reject_irrelevant';

export interface PortfolioSnapshotForScan {
  projects?: Project[];
  certificates?: PortfolioCertificate[];
  university?: UniversityRecord | null;
  schooling?: SchoolRecord[];
  skills?: SkillCategory[];
  experience?: Experience[];
  settings?: Partial<SiteSettings> | null;
}

export interface RawExtractionPayload {
  detectedModule?: string;
  detectedType?: string;
  shouldAddToPortfolio?: boolean;
  rejectionReason?: string;
  confidence?: number;
  suggestion?: string;
  data?: Record<string, any>;
}

export interface ScanDecision {
  shouldAdd: boolean;
  action: ScanAction;
  detectedModule: ScannerModule;
  detectedType: string;
  confidence: number;
  reason: string;
  matchedId?: string;
  matchedLabel?: string;
  normalizedData: Record<string, any>;
  suggestedStorageFolder: 'certificates' | 'projects' | 'profile' | 'resume' | 'documents';
  warnings: string[];
}

export function normalizeMatchKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeUrlForMatch(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
}

const PRIVATE_OR_IRRELEVANT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(aadhaar|aadhar|uidai)\b/i, label: 'Private Government ID (Aadhaar)' },
  { pattern: /\b(pan\s*card|permanent\s*account\s*number|income\s*tax\s*department)\b/i, label: 'Private Tax ID (PAN Card)' },
  { pattern: /\b(passport\s*(?:no|number)|voter\s*id|epic\s*no|driving\s*licen[cs]e)\b/i, label: 'Private Identity Document' },
  { pattern: /\b(bank\s*statement|ifsc|account\s*(?:balance|number)|passbook|cheque|upi\s*(?:ref|id)|transaction\s*(?:id|receipt)|payment\s*receipt|gpay|phonepe|paytm)\b/i, label: 'Financial / Payment Receipt' },
  { pattern: /\b(tax\s*invoice|gstin|bill\s*(?:no|amount)|order\s*summary|amazon\s*order|flipkart\s*order|zomato|swiggy)\b/i, label: 'Shopping Invoice / Order Bill' },
  { pattern: /\b(pnr\s*(?:no|number)|boarding\s*pass|irctc|flight\s*ticket|train\s*ticket|bus\s*ticket)\b/i, label: 'Travel Ticket' },
  { pattern: /\b(prescription|pathology|blood\s*test|diagnostic\s*report|hospital\s*bill|medical\s*report)\b/i, label: 'Private Medical Record' },
  { pattern: /\b(meme|wallpaper|selfie|family\s*photo|wedding|birthday\s*party|random\s*photo)\b/i, label: 'Non-Portfolio Personal Media' },
];

export function detectIrrelevantContent(params: {
  fileName?: string;
  text?: string;
  url?: string;
  mimeType?: string;
  raw?: RawExtractionPayload;
}): { isIrrelevant: boolean; reason: string; label: string } {
  const { fileName = '', text = '', url = '', raw } = params;
  const combined = `${fileName}\n${text}\n${url}`.trim();

  if (raw?.shouldAddToPortfolio === false || raw?.detectedModule === 'irrelevant') {
    return {
      isIrrelevant: true,
      label: raw?.detectedType || 'Non-Portfolio Document',
      reason:
        raw?.rejectionReason ||
        raw?.suggestion ||
        'This file/text does not appear to be a valid portfolio item (certificate, project, education, skill, experience, or resume). It will NOT be added.',
    };
  }

  for (const rule of PRIVATE_OR_IRRELEVANT_PATTERNS) {
    if (rule.pattern.test(combined)) {
      return {
        isIrrelevant: true,
        label: rule.label,
        reason: `Blocked "${rule.label}": Sensitive, financial, or personal non-portfolio documents must not be uploaded to a public portfolio.`,
      };
    }
  }

  // Reject tiny/garbage plain text with no file, no URL, and no structured extracted data
  const hasStructuredData = Boolean(
    raw?.data &&
      typeof raw.data === 'object' &&
      Object.values(raw.data).some((v) =>
        Array.isArray(v) ? v.length > 0 : Boolean(String(v ?? '').trim())
      )
  );
  if (!fileName && !url.trim() && !hasStructuredData) {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length < 4) {
      return {
        isIrrelevant: true,
        label: 'Unreadable / Empty Input',
        reason: 'Not enough meaningful information found. Provide clear project/certificate/academic text or upload a document.',
      };
    }
  }

  // Unrecognized generic module with very low confidence
  const mod = String(raw?.detectedModule || '').toLowerCase();
  const confidence = Number(raw?.confidence ?? 0.8);
  if ((mod === 'unknown' || !mod) && confidence < 0.55) {
    return {
      isIrrelevant: true,
      label: raw?.detectedType || 'Low-Confidence / Unclear Input',
      reason:
        raw?.rejectionReason ||
        raw?.suggestion ||
        'Could not reliably identify this content as a portfolio item (Project, Certificate, Education, Skills, Experience, or Resume). Skipped to prevent wrong entries.',
    };
  }

  return { isIrrelevant: false, reason: '', label: '' };
}

export function normalizeScannerModule(rawModule?: string, detectedType?: string, fileName?: string, text?: string): ScannerModule {
  const m = String(rawModule || '').trim().toLowerCase();
  const combined = `${detectedType || ''} ${fileName || ''} ${text || ''}`.toLowerCase();

  if (m === 'irrelevant' || m === 'rejected') return 'irrelevant';
  if (m === 'profile_photo' || m === 'avatar' || m === 'headshot') return 'profile_photo';
  if (m === 'projects' || m === 'project' || m === 'github_repository' || m === 'project_screenshot') return 'project';
  if (m === 'certificates' || m === 'certificate') return 'certificate';
  if (m === 'academic' || m === 'education' || m === 'marksheet') return 'education';
  if (m === 'profile' || m === 'settings' || m === 'resume') return 'settings';
  if (m === 'experience' || m === 'internship') return 'experience';
  if (m === 'skills' || m === 'skill') return 'skills';

  if (/\b(headshot|profile\s*photo|dp|portrait)\b/i.test(combined)) return 'profile_photo';
  if (/\b(marksheet|sgpa|cgpa|semester|bseb|cbse|matriculation|intermediate)\b/i.test(combined)) return 'education';
  if (/\b(certificate|certification|nptel|coursera|udemy|credential|badge)\b/i.test(combined)) return 'certificate';
  if (/\b(resume|curriculum\s*vitae|\bcv\b)\b/i.test(combined)) return 'settings';
  if (/\b(internship|experience|company|designation)\b/i.test(combined)) return 'experience';
  if (/\b(skills?|tech\s*stack|competencies)\b/i.test(combined)) return 'skills';
  if (/\b(github\.com|project|repository|live\s*demo)\b/i.test(combined)) return 'project';

  return 'unknown';
}

function mapStorageFolder(mod: ScannerModule): ScanDecision['suggestedStorageFolder'] {
  switch (mod) {
    case 'certificate':
      return 'certificates';
    case 'project':
      return 'projects';
    case 'profile_photo':
      return 'profile';
    case 'settings':
      return 'resume';
    default:
      return 'documents';
  }
}

export function evaluateScanDecision(params: {
  raw: RawExtractionPayload;
  portfolio: PortfolioSnapshotForScan;
  fileName?: string;
  text?: string;
  url?: string;
  mimeType?: string;
}): ScanDecision {
  const { raw, portfolio, fileName = '', text = '', url = '', mimeType = '' } = params;
  const warnings: string[] = [];

  const irrelevance = detectIrrelevantContent({ fileName, text, url, mimeType, raw });
  if (irrelevance.isIrrelevant) {
    return {
      shouldAdd: false,
      action: 'reject_irrelevant',
      detectedModule: 'irrelevant',
      detectedType: irrelevance.label,
      confidence: Math.min(0.49, Number(raw?.confidence) || 0.25),
      reason: irrelevance.reason,
      normalizedData: raw?.data || {},
      suggestedStorageFolder: 'documents',
      warnings: [irrelevance.reason],
    };
  }

  const detectedModule = normalizeScannerModule(
    raw?.detectedModule,
    raw?.detectedType,
    fileName,
    text
  );
  const detectedType = String(raw?.detectedType || detectedModule);
  const confidence = Math.max(0, Math.min(1, Number(raw?.confidence) || 0.85));
  const data: Record<string, any> = { ...(raw?.data || {}) };
  const folder = mapStorageFolder(detectedModule);

  if (detectedModule === 'unknown') {
    const reason =
      raw?.suggestion ||
      'Unable to confirm which portfolio section this belongs to. Please verify manually before adding.';
    return {
      shouldAdd: false,
      action: 'reject_irrelevant',
      detectedModule: 'unknown',
      detectedType,
      confidence,
      reason,
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings: [reason],
    };
  }

  if (confidence < 0.55) {
    const reason = `Low extraction confidence (${Math.round(confidence * 100)}%). Review or upload a clearer file so bad data does not enter your portfolio.`;
    return {
      shouldAdd: false,
      action: 'reject_irrelevant',
      detectedModule,
      detectedType,
      confidence,
      reason,
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings: [reason],
    };
  }

  // 1. Certificate Duplicate / Merge Match
  if (detectedModule === 'certificate') {
    const existingCerts = portfolio.certificates || [];
    const incomingCredId = String(data.credentialId || '').trim().toLowerCase();
    const incomingTitleKey = normalizeMatchKey(data.title || '');
    const incomingIssuerKey = normalizeMatchKey(data.issuer || '');

    const matched = existingCerts.find((c) => {
      const cCred = String(c.credentialId || '').trim().toLowerCase();
      if (incomingCredId && cCred && incomingCredId === cCred) return true;
      const cTitleKey = normalizeMatchKey(c.title || '');
      const cIssuerKey = normalizeMatchKey(c.issuer || '');
      if (incomingTitleKey && cTitleKey && incomingTitleKey === cTitleKey) {
        if (!incomingIssuerKey || !cIssuerKey) return true;
        return cIssuerKey.includes(incomingIssuerKey) || incomingIssuerKey.includes(cIssuerKey);
      }
      return false;
    });

    if (matched) {
      const hasNewAsset = Boolean(fileName) && (!matched.fileUrl || matched.fileUrl.includes('placeholder'));
      const hasNewCredUrl = Boolean(data.credentialUrl && !matched.credentialUrl);
      const hasBetterDesc = Boolean(data.description && String(data.description).length > String(matched.description || '').length + 20);
      const hasNewGrade = Boolean(data.grade && !matched.grade) || Boolean(data.score && !matched.score);

      if (hasNewAsset || hasNewCredUrl || hasBetterDesc || hasNewGrade) {
        return {
          shouldAdd: true,
          action: 'update_existing',
          detectedModule,
          detectedType,
          confidence,
          matchedId: matched.id,
          matchedLabel: `#${String(matched.displayOrder || 1).padStart(2, '0')} ${matched.title}`,
          reason: `Matched existing certificate "${matched.title}". Will merge missing credential metadata/file without creating a duplicate.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }

      return {
        shouldAdd: false,
        action: 'skip_duplicate',
        detectedModule,
        detectedType,
        confidence,
        matchedId: matched.id,
        matchedLabel: `#${String(matched.displayOrder || 1).padStart(2, '0')} ${matched.title}`,
        reason: `Already exists in Certificates (#${String(matched.displayOrder || 1).padStart(2, '0')} "${matched.title}"). Skipped to prevent duplicate entries.`,
        normalizedData: data,
        suggestedStorageFolder: folder,
        warnings,
      };
    }

    return {
      shouldAdd: true,
      action: 'create_new',
      detectedModule,
      detectedType,
      confidence,
      reason: `New verified certificate "${data.title || 'Untitled'}" from ${data.issuer || 'Issuer'} ready to add to Portfolio & Admin.`,
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings,
    };
  }

  // 2. Project Duplicate / Merge Match
  if (detectedModule === 'project') {
    const existingProjects = portfolio.projects || [];
    const incomingGh = normalizeUrlForMatch(data.githubUrl || url || '');
    const incomingTitleKey = normalizeMatchKey(data.title || '');

    const matched = existingProjects.find((p) => {
      const pGh = normalizeUrlForMatch(p.githubUrl || '');
      if (incomingGh && pGh && incomingGh === pGh) return true;
      const pTitleKey = normalizeMatchKey(p.title || '');
      const pSlugKey = normalizeMatchKey(p.slug || '');
      return Boolean(incomingTitleKey && (pTitleKey === incomingTitleKey || pSlugKey === incomingTitleKey));
    });

    if (matched) {
      const hasNewImage = Boolean(fileName && mimeType.startsWith('image/'));
      const hasNewLive = Boolean(data.liveDemoUrl && !matched.liveDemoUrl);
      const hasMoreTech =
        Array.isArray(data.techStack) &&
        data.techStack.some((t: string) => !(matched.techStack || []).some((m) => m.toLowerCase() === String(t).toLowerCase()));

      if (hasNewImage || hasNewLive || hasMoreTech) {
        return {
          shouldAdd: true,
          action: 'update_existing',
          detectedModule,
          detectedType,
          confidence,
          matchedId: matched.id,
          matchedLabel: matched.title,
          reason: hasNewImage
            ? `Matched project "${matched.title}". Will attach this screenshot/cover and merge updated tech details without duplicating the project.`
            : `Matched existing project "${matched.title}". Will enrich live link / tech stack without creating a duplicate.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }

      return {
        shouldAdd: false,
        action: 'skip_duplicate',
        detectedModule,
        detectedType,
        confidence,
        matchedId: matched.id,
        matchedLabel: matched.title,
        reason: `Project "${matched.title}" already exists with equivalent metadata. Skipped duplicate creation.`,
        normalizedData: data,
        suggestedStorageFolder: folder,
        warnings,
      };
    }

    return {
      shouldAdd: true,
      action: 'create_new',
      detectedModule,
      detectedType,
      confidence,
      reason: `New portfolio project "${data.title || 'Untitled Project'}" ready to publish and sync.`,
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings,
    };
  }

  // 3. Education / Marksheet Match
  if (detectedModule === 'education') {
    const isSchool = Boolean(
      data.standard && /10|12|matric|inter|class\s*x/i.test(String(data.standard))
    ) && !data.semesterNumber;

    if (isSchool) {
      const schooling = portfolio.schooling || [];
      const reqStd = normalizeMatchKey(String(data.standard || data.qualificationTitle || ''));
      const targetSchool =
        schooling.find((s) => reqStd.includes('12') && String(s.standard).includes('12')) ||
        schooling.find((s) => reqStd.includes('10') && String(s.standard).includes('10'));

      if (targetSchool) {
        const pctChanged =
          typeof data.percentage === 'number' &&
          Math.abs(data.percentage - targetSchool.percentage) > 0.05;
        const yearChanged =
          data.passingYear && String(data.passingYear) !== String(targetSchool.passingYear);

        if (!pctChanged && !yearChanged) {
          return {
            shouldAdd: false,
            action: 'skip_duplicate',
            detectedModule,
            detectedType,
            confidence,
            matchedId: targetSchool.id,
            matchedLabel: targetSchool.qualificationTitle,
            reason: `${targetSchool.qualificationTitle} already matches (${targetSchool.percentage}%, ${targetSchool.passingYear}). Skipped redundant update.`,
            normalizedData: data,
            suggestedStorageFolder: folder,
            warnings,
          };
        }

        return {
          shouldAdd: true,
          action: 'update_existing',
          detectedModule,
          detectedType,
          confidence,
          matchedId: targetSchool.id,
          matchedLabel: targetSchool.qualificationTitle,
          reason: `Will update ${targetSchool.qualificationTitle} record cleanly without creating duplicate schooling rows.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }
    }

    const semesters = portfolio.university?.semesters || [];
    const semNum = Number(data.semesterNumber);
    const existingSem = Number.isFinite(semNum)
      ? semesters.find((s) => s.semesterNumber === semNum)
      : undefined;

    if (existingSem) {
      const incomingSgpa = typeof data.sgpa === 'number' ? data.sgpa : null;
      const sameSgpa =
        existingSem.isDeclared &&
        incomingSgpa !== null &&
        typeof existingSem.sgpa === 'number' &&
        Math.abs(existingSem.sgpa - incomingSgpa) < 0.01;

      if (sameSgpa) {
        return {
          shouldAdd: false,
          action: 'skip_duplicate',
          detectedModule,
          detectedType,
          confidence,
          matchedId: `semester-${existingSem.semesterNumber}`,
          matchedLabel: `Semester ${existingSem.semesterNumber}`,
          reason: `Semester ${existingSem.semesterNumber} SGPA (${existingSem.sgpa?.toFixed(2)}) is already recorded. Skipped duplicate save.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }

      return {
        shouldAdd: true,
        action: 'update_existing',
        detectedModule,
        detectedType,
        confidence,
        matchedId: `semester-${existingSem.semesterNumber}`,
        matchedLabel: `Semester ${existingSem.semesterNumber}`,
        reason: `Will update Semester ${existingSem.semesterNumber} result${incomingSgpa !== null ? ` (SGPA ${incomingSgpa.toFixed(2)})` : ''} and recalculate academic overview.`,
        normalizedData: data,
        suggestedStorageFolder: folder,
        warnings,
      };
    }

    return {
      shouldAdd: true,
      action: 'update_existing',
      detectedModule,
      detectedType,
      confidence,
      reason: 'Academic record parsed and ready to sync into Education CMS.',
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings,
    };
  }

  // 4. Skills Merge Match
  if (detectedModule === 'skills') {
    const existingGroups = portfolio.skills || [];
    const incomingSkills: Array<{ name: string; level: number }> = Array.isArray(data.skills)
      ? data.skills
          .filter((s: any) => s && s.name)
          .map((s: any) => ({ name: String(s.name).trim(), level: Math.max(10, Math.min(100, Number(s.level) || 80)) }))
      : [];

    if (incomingSkills.length === 0) {
      return {
        shouldAdd: false,
        action: 'reject_irrelevant',
        detectedModule,
        detectedType,
        confidence: 0.4,
        reason: 'No usable technical skills were extracted from the input.',
        normalizedData: data,
        suggestedStorageFolder: folder,
        warnings: ['Empty skill list rejected.'],
      };
    }

    const catKey = normalizeMatchKey(data.category || '');
    const matchedGroup = existingGroups.find((g) => {
      const gKey = normalizeMatchKey(g.category);
      return catKey && (gKey === catKey || gKey.includes(catKey) || catKey.includes(gKey));
    });

    if (matchedGroup) {
      const existingNames = new Set((matchedGroup.skills || []).map((s) => s.name.toLowerCase()));
      const newOnes = incomingSkills.filter((s) => !existingNames.has(s.name.toLowerCase()));
      if (newOnes.length === 0) {
        return {
          shouldAdd: false,
          action: 'skip_duplicate',
          detectedModule,
          detectedType,
          confidence,
          matchedId: matchedGroup.category,
          matchedLabel: matchedGroup.category,
          reason: `All extracted skills already exist inside "${matchedGroup.category}". Skipped duplicate category.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }
      return {
        shouldAdd: true,
        action: 'update_existing',
        detectedModule,
        detectedType,
        confidence,
        matchedId: matchedGroup.category,
        matchedLabel: matchedGroup.category,
        reason: `Will merge ${newOnes.length} new skill(s) (${newOnes.map((s) => s.name).join(', ')}) into "${matchedGroup.category}".`,
        normalizedData: { ...data, skills: incomingSkills },
        suggestedStorageFolder: folder,
        warnings,
      };
    }

    return {
      shouldAdd: true,
      action: 'create_new',
      detectedModule,
      detectedType,
      confidence,
      reason: `Will add new skill category "${data.category || 'Extracted Skills'}" (${incomingSkills.length} skills).`,
      normalizedData: { ...data, skills: incomingSkills },
      suggestedStorageFolder: folder,
      warnings,
    };
  }

  // 5. Experience Duplicate / Merge Match
  if (detectedModule === 'experience') {
    const existingExp = portfolio.experience || [];
    const roleKey = normalizeMatchKey(data.role || '');
    const companyKey = normalizeMatchKey(data.company || '');
    const matchedIndex = existingExp.findIndex((e) => {
      const rKey = normalizeMatchKey(e.role);
      const cKey = normalizeMatchKey(e.company);
      return Boolean(roleKey && companyKey && rKey === roleKey && cKey === companyKey);
    });

    if (matchedIndex >= 0) {
      const matched = existingExp[matchedIndex];
      const hasNewPeriod = Boolean(data.period && data.period !== matched.period);
      const hasMoreHighlights =
        Array.isArray(data.highlights) &&
        data.highlights.length > (matched.highlights || []).length;

      if (hasNewPeriod || hasMoreHighlights) {
        return {
          shouldAdd: true,
          action: 'update_existing',
          detectedModule,
          detectedType,
          confidence,
          matchedId: String(matchedIndex),
          matchedLabel: `${matched.role} @ ${matched.company}`,
          reason: `Matched existing experience "${matched.role} @ ${matched.company}". Will update in place without duplicating.`,
          normalizedData: data,
          suggestedStorageFolder: folder,
          warnings,
        };
      }

      return {
        shouldAdd: false,
        action: 'skip_duplicate',
        detectedModule,
        detectedType,
        confidence,
        matchedId: String(matchedIndex),
        matchedLabel: `${matched.role} @ ${matched.company}`,
        reason: `Experience "${matched.role} @ ${matched.company}" already exists. Skipped duplicate entry.`,
        normalizedData: data,
        suggestedStorageFolder: folder,
        warnings,
      };
    }

    return {
      shouldAdd: true,
      action: 'create_new',
      detectedModule,
      detectedType,
      confidence,
      reason: `New experience record "${data.role || 'Developer'} @ ${data.company || 'Organization'}" ready to add.`,
      normalizedData: data,
      suggestedStorageFolder: folder,
      warnings,
    };
  }

  // 6. Settings / Resume / Profile Photo
  if (detectedModule === 'profile_photo') {
    return {
      shouldAdd: true,
      action: 'update_existing',
      detectedModule: 'settings',
      detectedType: 'Profile Photo',
      confidence,
      matchedId: 'portfolio_config',
      matchedLabel: 'Profile Photo',
      reason: 'Detected profile portrait/photo. Will upload cleanly and update Portfolio Profile Photo.',
      normalizedData: { ...data, __assetKind: 'profilePhoto' },
      suggestedStorageFolder: 'profile',
      warnings,
    };
  }

  // settings / resume
  return {
    shouldAdd: true,
    action: 'update_existing',
    detectedModule: 'settings',
    detectedType,
    confidence,
    matchedId: 'portfolio_config',
    matchedLabel: 'Profile & Resume Settings',
    reason: fileName && mimeType === 'application/pdf'
      ? 'Detected official Resume PDF. Will upload PDF and sync extracted profile summary.'
      : 'Detected profile/contact updates. Will merge into Portfolio Settings.',
    normalizedData: { ...data, ...(mimeType === 'application/pdf' ? { __assetKind: 'resumePdf' } : {}) },
    suggestedStorageFolder: folder,
    warnings,
  };
}
