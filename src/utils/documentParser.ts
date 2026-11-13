export interface GitHubRepoContextData {
  name?: string;
  fullName?: string;
  description?: string;
  homepage?: string;
  language?: string;
  topics?: string[];
  readmeText?: string;
  htmlUrl?: string;
}

export interface WebPageContextData {
  url: string;
  title?: string;
  description?: string;
  textSnippet?: string;
}

export interface ParseDocumentInput {
  fileName?: string;
  mimeType?: string;
  extractedText?: string;
  pastedText?: string;
  url?: string;
  hintModule?: string;
  githubRepo?: GitHubRepoContextData;
  webPage?: WebPageContextData;
}

export interface ParsedDocumentResult {
  detectedType: string;
  detectedModule: string;
  shouldAddToPortfolio: boolean;
  rejectionReason?: string;
  data: Record<string, any>;
  confidence: number;
  suggestion: string;
}

const KNOWN_TECH_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\breact(?:\.js| native)?\b/i, label: 'React' },
  { pattern: /\bnext\.?js\b/i, label: 'Next.js' },
  { pattern: /\btypescript\b/i, label: 'TypeScript' },
  { pattern: /\bjavascript\b|\bes6\+?\b/i, label: 'JavaScript' },
  { pattern: /\btailwind(?:\s*css)?\b/i, label: 'Tailwind CSS' },
  { pattern: /\bnode\.?js\b/i, label: 'Node.js' },
  { pattern: /\bexpress(?:\.js)?\b/i, label: 'Express.js' },
  { pattern: /\bmongodb\b|\bmongoose\b/i, label: 'MongoDB' },
  { pattern: /\bfirebase\b|\bfirestore\b/i, label: 'Firebase' },
  { pattern: /\bsupabase\b/i, label: 'Supabase' },
  { pattern: /\bpostgres(?:ql)?\b/i, label: 'PostgreSQL' },
  { pattern: /\bmysql\b|\bsql\b/i, label: 'SQL' },
  { pattern: /\bpython\b/i, label: 'Python' },
  { pattern: /\bjava\b(?!script)/i, label: 'Java' },
  { pattern: /\bc\+\+\b/i, label: 'C++' },
  { pattern: /\bvite\b/i, label: 'Vite' },
  { pattern: /\bdocker\b/i, label: 'Docker' },
  { pattern: /\baws\b|\bamazon web services\b/i, label: 'AWS' },
  { pattern: /\bgemini\b|\bopenai\b|\bllm\b|\bgenerative ai\b/i, label: 'Generative AI / LLMs' },
  { pattern: /\bmachine learning\b/i, label: 'Machine Learning' },
  { pattern: /\bdata science\b/i, label: 'Data Science' },
  { pattern: /\bhtml5?\b/i, label: 'HTML5' },
  { pattern: /\bcss3?\b/i, label: 'CSS3' },
  { pattern: /\bgit\b|\bgithub\b/i, label: 'Git & GitHub' },
  { pattern: /\brest(?:ful)?\s*api/i, label: 'REST APIs' },
];

const MONTHS_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

export function cleanHumanTitle(rawName: string, preserveDotExt = false): string {
  const base = preserveDotExt ? String(rawName || '') : String(rawName || '').replace(/\.(?:pdf|jpg|jpeg|png|webp|txt|md|json|git)$/i, '');
  const cleaned = base
    .replace(/^(?:certificate|cert|project|marksheet|result|resume|cv|img|image|photo|pic|scan|doc|document|screenshot|whatsapp[_\s-]*image|pxl|dsc|vid)[_-]*/i, '')
    .replace(/\b\d{8}(?:[_-]\d{4,6})?\b/g, '')
    .replace(/\bwa\d{3,5}\b/ig, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || /^\d+$/.test(cleaned) || cleaned.length < 3) return '';
  return cleaned.replace(/(^|\s)[a-z]/g, (c) => c.toUpperCase());
}

export function isGenericCameraFileName(fileName: string): boolean {
  const base = String(fileName || '').replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim().toLowerCase();
  if (!base) return true;
  if (/^(?:img|dsc|pxl|screenshot|whatsapp[_\s-]*image|photo|image|scan|doc|file|untitled)/i.test(base)) {
    const remainder = base
      .replace(/^(?:img|dsc|pxl|screenshot|whatsapp[_\s-]*image|photo|image|scan|doc|file|untitled)[_\s-]*/i, '')
      .replace(/\b(?:at|on|of|am|pm)\b/gi, '')
      .replace(/\bwa\d+\b/gi, '')
      .replace(/[\d\s_.\-:]+/g, '');
    return remainder.length < 3;
  }
  return /^\d{6,}$/.test(base);
}

export function extractTechFromText(text: string): string[] {
  const found: string[] = [];
  for (const item of KNOWN_TECH_KEYWORDS) {
    if (item.pattern.test(text) && !found.includes(item.label)) {
      found.push(item.label);
    }
  }
  return found;
}

export function parseFlexibleDateToIso(text: string): string {
  const isoMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // "May 14, 2026" or "14 May 2026" or "04 Nov 2025" or "25 Sept 2025"
  const monthFirst = text.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i
  );
  if (monthFirst) {
    const mm = MONTHS_MAP[monthFirst[1].toLowerCase()];
    if (mm) return `${monthFirst[3]}-${mm}-${monthFirst[2].padStart(2, '0')}`;
  }

  const dayFirst = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?),?\s+(20\d{2})\b/i
  );
  if (dayFirst) {
    const mm = MONTHS_MAP[dayFirst[2].toLowerCase()];
    if (mm) return `${dayFirst[3]}-${mm}-${dayFirst[1].padStart(2, '0')}`;
  }

  const ddmmyyyy = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/);
  if (ddmmyyyy) {
    const d = Number(ddmmyyyy[1]);
    const m = Number(ddmmyyyy[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${ddmmyyyy[3]}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Month-range + year like "JUL-OCT 2026"
  const spanYear = text.match(
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(20\d{2})\b/i
  );
  if (spanYear) {
    const mm = MONTHS_MAP[spanYear[1].toLowerCase()] || '01';
    return `${spanYear[2]}-${mm}-01`;
  }

  const yearOnly = text.match(/\b(202[0-9])\b/);
  if (yearOnly) {
    return `${yearOnly[1]}-01-01`;
  }

  return '';
}

function sanitizeOcrTitleCandidate(raw: string): string {
  return raw
    .replace(/^[;:.,\-~"'`<>|©®™£@#*&+\s]+/, '')
    .replace(/\b(?:may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar|apr)[a-z]*\s+\d{1,2},?\s+20\d{2}.*$/i, '')
    .replace(/\b(?:provided\s+by|awarded\s+by|issued\s+by|satya\s+narayana|signature|verified\s+this|unique\s+id)\b.*$/i, '')
    .replace(/[<>|~•£©®™]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectCertificateTitleFromText(rawText: string, fileName: string): string {
  const normalized = rawText.replace(/\r/g, '\n');

  // 1. Specific completion & program phrases (allow noisy OCR punctuation & linebreaks)
  const completionPatterns = [
    /\b(?:has\s+successfully\s+completed(?:\s+the\s+(?:free\s+)?(?:course|online\s+course|program))?|for\s+successfully\s+completing(?:\s+the\s+(?:free\s+)?(?:course|online\s+course|program))?|successfully\s+completed(?:\s+the\s+(?:free\s+)?course)?)\b[;:\-~"'`<>|.\s]*([^\n]{5,120})/i,
    /\b(?:certified\s+in|programme|program|course\s*(?:name|title)|program\s*(?:name|title)|certification\s*in)\b[;:\-~.\s]*([^\n]{5,120})/i,
    /\b(?:this\s+is\s+to\s+certify\s+that\s+[^\n]{2,60}\s+(?:completed|for))\b[;:\-~.\s]+([^\n]{5,120})/i,
  ];

  for (const pat of completionPatterns) {
    const m = normalized.match(pat);
    if (m && m[1]) {
      const candidate = sanitizeOcrTitleCandidate(m[1]).replace(/[^a-zA-Z0-9\s:&+\-()/]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = candidate.split(' ').filter((w) => w.length >= 2);
      if (candidate.length >= 6 && words.length >= 2 && !/^(nitesh|kumar|certificate|completion|course|program)$/i.test(candidate)) {
        return candidate.replace(/\b[a-z]/g, (c) => c.toUpperCase());
      }
    }
  }

  // 2. Clean meaningful lines (filter out short OCR watermarks like "De Ne :")
  const lines = normalized
    .split('\n')
    .map((l) => sanitizeOcrTitleCandidate(l).replace(/[^a-zA-Z0-9\s:&+\-()/]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 8 && l.length <= 105 && !/^[^a-zA-Z]*$/.test(l));

  const ignoreLine = (line: string) =>
    /^(?:nitesh|kumar|nitesh\s+kumar|certificate|certificate\s+of|this\s+certif|awarded\s+to|presented\s+to|is\s+awarded|provided\s+by|microsoft|google|aws\s+certificate|nptel|coursera|udemy|analytics\s*vidhya|henry\s*harvin|infosys|hackerrank|date|roll\s*no|score|credits|week\s+course|satya|nadella|signature|director|dean|vice\s+chancellor|unique\s+id|valid\s+until|internationally\s+verifiable)/i.test(
      line
    ) ||
    /^\d+%/.test(line) ||
    /^NPTEL\d+/i.test(line) ||
    /^HH-\d+/i.test(line) ||
    /^https?:/i.test(line);

  const courseKeywordRegex =
    /\b(programming|development|artificial\s+intelligence|machine\s+learning|data\s+scien\w*|networking|sysops|python|java|react|cloud|aws|agent|genai|generative|llm|sql|excel|transformer|database|cyber|algorithm|web|interview|bootcamp|guide\s+to)\b/i;

  const strongCourseLine = lines.find((l) => !ignoreLine(l) && courseKeywordRegex.test(l));
  if (strongCourseLine) {
    return strongCourseLine.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const decentMultiWordLine = lines.find((l) => {
    if (ignoreLine(l)) return false;
    const realWords = l.split(' ').filter((w) => /^[a-zA-Z]{3,}$/.test(w));
    return realWords.length >= 3;
  });
  if (decentMultiWordLine) {
    return decentMultiWordLine.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (!isGenericCameraFileName(fileName)) {
    const clean = cleanHumanTitle(fileName);
    if (clean) return clean;
  }

  return 'Verified Technical Certificate';
}

function detectIssuerFromText(lower: string): { issuer: string; category: string } {
  if (/nptel|swayam|iit\s*(kharagpur|madras|bombay|delhi|kanpur|roorkee|guwahati|hyderabad)/i.test(lower)) {
    return { issuer: 'NPTEL · IIT Kharagpur', category: 'Web & Software Development' };
  }
  if (/analytics\s*vidhya/i.test(lower)) {
    return { issuer: 'Analytics Vidhya', category: /agent/i.test(lower) ? 'AI Agents' : 'AI & Generative AI' };
  }
  if (/henry\s*harvin/i.test(lower)) {
    return {
      issuer: 'Henry Harvin Education',
      category: /aws|cloud|sysops|networking/i.test(lower) ? 'AWS & Cloud' : 'Professional Development',
    };
  }
  if (/microsoft|satya\s*narayana\s*nadella|azure/i.test(lower)) {
    return {
      issuer: 'Microsoft',
      category: /artificial intelligence|\bai\b|generative|copilot/i.test(lower)
        ? 'AI & Generative AI'
        : 'Microsoft & Productivity',
    };
  }
  if (/infosys|springboard/i.test(lower)) {
    return { issuer: 'Infosys Springboard', category: 'Web & Software Development' };
  }
  if (/\baws\b|amazon\s*web\s*services|bedrock|sysops/i.test(lower)) {
    return { issuer: 'Amazon Web Services (AWS)', category: 'AWS & Cloud' };
  }
  if (/google\s*cloud|google\s*developers|\bgdg\b|cloud\s*skills/i.test(lower)) {
    return { issuer: 'Google Cloud', category: 'AWS & Cloud' };
  }
  if (/coursera/i.test(lower)) {
    return { issuer: 'Coursera', category: 'Web & Software Development' };
  }
  if (/udemy/i.test(lower)) {
    return { issuer: 'Udemy', category: 'Web & Software Development' };
  }
  if (/hackerrank/i.test(lower)) {
    return { issuer: 'HackerRank', category: 'Web & Software Development' };
  }
  if (/letsupgrade/i.test(lower)) {
    return { issuer: 'LetsUpgrade', category: 'Web & Software Development' };
  }
  if (/github/i.test(lower)) {
    return { issuer: 'GitHub', category: 'GitHub & Developer Tools' };
  }
  if (/arka\s*jain/i.test(lower)) {
    return { issuer: 'Arka Jain University', category: 'Events & Participation' };
  }
  if (/cisco|netacad/i.test(lower)) {
    return { issuer: 'Cisco Networking Academy', category: 'Web & Software Development' };
  }
  if (/oracle/i.test(lower)) {
    return { issuer: 'Oracle', category: 'Web & Software Development' };
  }
  if (/ibm/i.test(lower)) {
    return { issuer: 'IBM', category: 'Data Science' };
  }
  if (/freecodecamp/i.test(lower)) {
    return { issuer: 'freeCodeCamp', category: 'Web & Software Development' };
  }
  return { issuer: 'Official Issuing Authority', category: 'Professional Development' };
}

function parseGitHubProject(repo: GitHubRepoContextData, fallbackUrl: string): ParsedDocumentResult {
  const repoRawName = repo.name || fallbackUrl.split('/').filter(Boolean).pop() || 'Software Project';
  const title = cleanHumanTitle(repoRawName, true) || repoRawName.replace(/[-_]/g, ' ');
  const readme = String(repo.readmeText || '');
  const combined = `${repo.name || ''} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${readme}`;

  const rawTopics = Array.isArray(repo.topics)
    ? repo.topics.map((t) => t.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    : [];
  const extractedTech = extractTechFromText(combined);
  const techStack = Array.from(
    new Set([repo.language, ...extractedTech, ...rawTopics].filter((x): x is string => Boolean(x && x.trim())))
  ).slice(0, 10);

  // Extract bullet features from README if available
  const readmeBullets = readme
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+.{10,120}$/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, '').replace(/[*_`#]/g, '').trim())
    .slice(0, 5);

  const shortDescription =
    (repo.description && repo.description.trim()) ||
    `${title} — Software engineering project built with ${techStack.slice(0, 3).join(', ') || 'modern web technologies'}.`;

  const cleanReadmeExcerpt = readme
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*`]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 900);

  const detailedDescription =
    cleanReadmeExcerpt.length > 80
      ? `${shortDescription}\n\n${cleanReadmeExcerpt}`
      : `${shortDescription} Engineered with ${techStack.join(', ') || 'React and TypeScript'} with clean modular architecture and responsive UI.`;

  const coreText = `${repo.name || ''} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  let category = 'Full-Stack Development';
  if (/\bai\b|gemini|llm|chatbot|agent|machine learning|attendance/i.test(coreText)) category = 'AI & Automation';
  else if (/hrms|saas|management|erp|admin/i.test(coreText)) category = 'SaaS & Management';
  else if (/commerce|shop|store|cart/i.test(coreText)) category = 'E-Commerce';
  else if (/expense|finance|money|budget|tracker/i.test(coreText)) category = 'Full-Stack Development';
  else if (/lms|education|quiz|study|college/i.test(coreText)) category = 'Education & LMS';
  else if (/security|vault|encryption/i.test(coreText)) category = 'Security & Storage';
  else if (/framework|react|web/i.test(coreText)) category = 'Web Applications';

  return {
    detectedType: 'github_repository',
    detectedModule: 'project',
    shouldAddToPortfolio: true,
    confidence: 0.96,
    data: {
      title,
      shortDescription,
      detailedDescription,
      category,
      techStack: techStack.length ? techStack : ['React', 'TypeScript', 'Tailwind CSS'],
      keyFeatures: readmeBullets.length
        ? readmeBullets
        : [
            `Built with ${techStack.slice(0, 4).join(', ') || 'modern full-stack technologies'}`,
            'Clean modular component & state management architecture',
            'Responsive user interface across desktop and mobile devices',
          ],
      githubUrl: repo.htmlUrl || fallbackUrl,
      liveDemoUrl: repo.homepage ? String(repo.homepage).trim() : '',
      status: 'Completed',
    },
    suggestion: `Extracted live repository data for "${title}" (${techStack.slice(0, 4).join(', ') || 'GitHub'}).`,
  };
}

export function parseDocumentContent(input: ParseDocumentInput): ParsedDocumentResult {
  const {
    fileName = '',
    mimeType = '',
    extractedText = '',
    pastedText = '',
    url = '',
    hintModule = '',
    githubRepo,
    webPage,
  } = input;

  const rawHint = String(hintModule || '').trim().toLowerCase();
  const explicitModule = rawHint === 'auto' ? '' : rawHint;

  // Combine ONLY real human-readable text (never binary file bytes)
  const webText = webPage ? `${webPage.title || ''}\n${webPage.description || ''}\n${webPage.textSnippet || ''}` : '';
  const readableBody = [pastedText, extractedText, webText].filter(Boolean).join('\n').trim();
  const safeFileName = isGenericCameraFileName(fileName) ? '' : fileName;
  const combined = `${safeFileName}\n${readableBody}\n${url}`.trim();
  const lower = combined.toLowerCase();

  // 0. Always block private government IDs, financial receipts, invoices, tickets, medical docs, personal media
  const irrelevantLabel =
    /\b(aadhaar|aadhar|uidai|enrolment\s*no)\b/i.test(lower)
      ? 'Private Identity Document (Aadhaar)'
      : /\b(pan\s*card|permanent\s*account\s*number|income\s*tax\s*department)\b/i.test(lower)
      ? 'Private Tax Document (PAN)'
      : /\b(voter\s*id|epic\s*no|driving\s*licen[cs]e|passport\s*(?:no|number))\b/i.test(lower)
      ? 'Private Identity Document'
      : /\b(bank\s*statement|ifsc|passbook|upi\s*(?:ref|id)|transaction\s*(?:id|receipt)|payment\s*receipt|phonepe|gpay|paytm)\b/i.test(lower)
      ? 'Financial / UPI Payment Receipt'
      : /\b(tax\s*invoice|gstin|amazon\s*order|flipkart\s*order|zomato|swiggy|pnr\s*no|boarding\s*pass|irctc|medical\s*report|pathology)\b/i.test(lower)
      ? 'Personal Invoice / Ticket / Medical Document'
      : /\b(meme|wallpaper|wedding|birthday\s*party)\b/i.test(lower)
      ? 'Non-Portfolio Personal Media'
      : null;

  if (irrelevantLabel) {
    return {
      detectedType: irrelevantLabel,
      detectedModule: 'irrelevant',
      shouldAddToPortfolio: false,
      rejectionReason: `Blocked "${irrelevantLabel}": Private, financial, or non-portfolio files cannot be added to your portfolio.`,
      confidence: 0.2,
      data: {},
      suggestion: `Blocked "${irrelevantLabel}" — upload only portfolio-related certificates, projects, marksheets, skills, experience, resume, or profile photo.`,
    };
  }

  // 1. Live GitHub Repository Metadata
  if (githubRepo && (githubRepo.name || githubRepo.fullName)) {
    return parseGitHubProject(githubRepo, url);
  }

  // 2. Public Web URL verification / project page
  if (webPage && webPage.url) {
    const isVerifyPage = /coursera\.org\/account\/accomplishments|analyticsvidhya\.com\/certificates|credly\.com\/badges|udemy\.com\/certificate|hackerrank\.com\/certificates|nptel\.ac\.in/i.test(
      webPage.url
    );
    if (isVerifyPage) {
      const { issuer, category } = detectIssuerFromText(`${webPage.url} ${webText}`);
      const title =
        (webPage.title || '')
          .replace(/\s*[-|].*$/, '')
          .trim() || 'Verified Online Certificate';
      const urlIdMatch = webPage.url.match(/\/certificates?\/([a-zA-Z0-9_-]{5,32})/i);
      return {
        detectedType: 'certificate_verification_url',
        detectedModule: 'certificate',
        shouldAddToPortfolio: true,
        confidence: 0.92,
        data: {
          title,
          issuer,
          category,
          issueDate: parseFlexibleDateToIso(webText) || new Date().toISOString().split('T')[0],
          credentialId: urlIdMatch ? urlIdMatch[1] : '',
          credentialUrl: webPage.url,
          skills: extractTechFromText(`${title} ${webText}`),
          description: webPage.description || `Verified credential from ${issuer}.`,
        },
        suggestion: `Extracted certificate details from ${issuer} verification link.`,
      };
    }

    const techStack = extractTechFromText(webText);
    const title = (webPage.title || '').replace(/\s*[-|].*$/, '').trim() || cleanHumanTitle(new URL(webPage.url).hostname) || 'Web Project';
    return {
      detectedType: 'live_web_project',
      detectedModule: explicitModule || 'project',
      shouldAddToPortfolio: true,
      confidence: 0.89,
      data: {
        title,
        shortDescription: webPage.description || `${title} — Live deployed web application.`,
        detailedDescription: `${webPage.description || title}\n\n${webPage.textSnippet || ''}`.trim().slice(0, 700),
        category: /ai|gemini|bot|assistant/i.test(webText) ? 'AI & Automation' : 'Full-Stack Development',
        techStack: techStack.length ? techStack : ['React', 'TypeScript', 'Web Application'],
        liveDemoUrl: webPage.url,
        githubUrl: '',
        status: 'Completed',
      },
      suggestion: `Extracted live web application details for "${title}".`,
    };
  }

  // 3. Decide target module
  const isImage = mimeType.startsWith('image/');
  const alphaChars = readableBody.replace(/[^a-zA-Z0-9]/g, '').length;

  const isResumeSignal =
    /\b(curriculum\s*vitae|resume)\b/i.test(`${safeFileName}\n${readableBody}`) ||
    (/\btechnical\s+skills\b/i.test(lower) &&
      (/\bprofessional\s+summary\b/i.test(lower) || /\bfeatured\s+projects\b/i.test(lower) || /\beducation\b/i.test(lower)) &&
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(lower));

  const isAcademicSignal =
    !isResumeSignal &&
    /\b(sgpa|cgpa|semester|marksheet|grade\s*card|statement\s*of\s*marks|matriculation|intermediate|bseb|cbse|10th|12th|class\s*x|class\s*xii|roll\s*no|board\s*of\s*(?:secondary|high))\b/i.test(
      lower
    ) &&
    !/\broll\s*no\s*:\s*nptel/i.test(lower);

  const isCertSignal =
    !isResumeSignal &&
    /\b(certificat|nptel|coursera|udemy|infosys|springboard|hackerrank|letsupgrade|analytics\s*vidhya|analyticsvidhya|henry\s*harvin|credly|credential\s*id|certification\s*id|unique\s*id|successfully\s+completed|for\s+(?:successfully\s+)?completing|certificate\s+of\s+(?:completion|achievement|participation|appreciation)|certified\s+in|awarded\s+to|verified\s+badge)\b/i.test(
      lower
    );

  const isExperienceSignal =
    /\b(internship|offer\s*letter|appointment\s*letter|relieving\s*letter|experience\s*letter|worked\s*as|employment|designation)\b/i.test(
      lower
    ) && !isResumeSignal;

  const isSkillsSignal =
    (/\b(skill\s*set|technical\s*skills|proficiency|competencies|languages\s*&\s*frameworks)\b/i.test(lower) ||
      extractTechFromText(readableBody).length >= 3) &&
    !isResumeSignal &&
    !isCertSignal &&
    !isAcademicSignal;

  const isProfilePhotoSignal =
    /\b(headshot|profile[_\s-]*photo|profile[_\s-]*pic|portrait|avatar|dp)\b/i.test(`${fileName}\n${pastedText}`);

  const isProjectSignal =
    !isResumeSignal &&
    (Boolean(url) ||
      /\b(github\.com|vercel\.app|netlify\.app|onrender\.com|live\s*demo|repository|tech\s*stack|full-stack|saas|dashboard|project|screenshot|features)\b/i.test(
        lower
      ));

  let targetModule = '';
  if (explicitModule && ['certificate', 'project', 'education', 'experience', 'skills', 'settings', 'profile_photo'].includes(explicitModule)) {
    targetModule = explicitModule;
  } else if (isProfilePhotoSignal && isImage) {
    targetModule = 'profile_photo';
  } else if (isResumeSignal) {
    targetModule = 'settings';
  } else if (isAcademicSignal) {
    targetModule = 'education';
  } else if (isCertSignal) {
    targetModule = 'certificate';
  } else if (isExperienceSignal) {
    targetModule = 'experience';
  } else if (isSkillsSignal) {
    targetModule = 'skills';
  } else if (isProjectSignal) {
    targetModule = 'project';
  } else if (isImage && alphaChars < 12 && isGenericCameraFileName(fileName)) {
    return {
      detectedType: 'Unreadable / Generic Image',
      detectedModule: 'unknown',
      shouldAddToPortfolio: false,
      rejectionReason:
        'Could not read clear text from this image to decide where it belongs. Select a target category above (e.g. Certificate or Project Screenshot) or paste a short title/caption.',
      confidence: 0.35,
      data: {},
      suggestion: 'Select a target category above or add a brief caption so it maps to the right section.',
    };
  } else if (!fileName && !url && alphaChars < 8) {
    return {
      detectedType: 'Unclear Input',
      detectedModule: 'unknown',
      shouldAddToPortfolio: false,
      rejectionReason: 'Input is too short or unclear to safely classify into your portfolio.',
      confidence: 0.35,
      data: {},
      suggestion: 'Paste more details or choose a category above.',
    };
  } else {
    return {
      detectedType: 'Unverified Document',
      detectedModule: 'unknown',
      shouldAddToPortfolio: false,
      rejectionReason:
        'Could not confidently classify this document automatically (Certificate / Marksheet / Project / Experience / Skills / Resume). Pick the target category above if you want to force-map it.',
      confidence: 0.42,
      data: {},
      suggestion: 'Choose the target category selector above to route this file explicitly.',
    };
  }

  // 4. Structured extraction per resolved module

  if (targetModule === 'profile_photo') {
    return {
      detectedType: 'profile_photo',
      detectedModule: 'profile_photo',
      shouldAddToPortfolio: true,
      confidence: 0.92,
      data: { updatedAsset: 'profilePhoto' },
      suggestion: 'Profile portrait image ready to upload and set as your Portfolio Profile Photo.',
    };
  }

  if (targetModule === 'education') {
    const isSchool =
      /\b(10th|12th|matric|intermediate|bseb|cbse|class\s*x\b|class\s*xii|high\s*school|senior\s*secondary)\b/i.test(
        lower
      ) && !/\bsemester\b/i.test(lower);

    if (isSchool) {
      const is12 = /\b(12th|12|intermediate|xii|senior\s*secondary)\b/i.test(lower);
      const pctMatch = combined.match(/(\d{2}(?:\.\d{1,2})?)\s*%/);
      const marksMatch = combined.match(/\b(\d{3})\s*(?:\/|out\s*of)\s*(\d{3})\b/i);
      const yearMatch = combined.match(/\b(20\d{2})\b/);
      const obtained = marksMatch ? Number(marksMatch[1]) : undefined;
      const maxMarks = marksMatch ? Number(marksMatch[2]) : undefined;
      const percentage = pctMatch
        ? parseFloat(pctMatch[1])
        : obtained && maxMarks
        ? Math.round((obtained / maxMarks) * 1000) / 10
        : undefined;

      return {
        detectedType: 'School Academic Marksheet',
        detectedModule: 'education',
        shouldAddToPortfolio: true,
        confidence: percentage !== undefined ? 0.92 : 0.72,
        data: {
          standard: is12 ? 'Class XII' : 'Class X',
          qualificationTitle: is12 ? 'Intermediate (Class 12th)' : 'Matriculation (Class 10th)',
          board: /\bcbse\b/i.test(lower) ? 'CBSE' : /\bicse\b/i.test(lower) ? 'ICSE' : 'Bihar School Examination Board (BSEB)',
          passingYear: yearMatch ? yearMatch[1] : undefined,
          percentage,
          totalMarks: obtained,
        },
        suggestion:
          percentage !== undefined
            ? `Extracted ${is12 ? 'Class 12th' : 'Class 10th'} marksheet (${percentage}%).`
            : `Detected ${is12 ? 'Class 12th' : 'Class 10th'} marksheet. Verify percentage before saving.`,
      };
    }

    const semMatch = combined.match(/sem(?:ester)?\s*[:#-]?\s*([1-8]|viii|vii|vi|iv|iii|ii|v|i)\b/i);
    const romanMap: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };
    const semRaw = semMatch ? semMatch[1].toLowerCase() : '';
    const semesterNumber = Number(semRaw) || romanMap[semRaw] || undefined;

    const sgpaMatch =
      combined.match(/(?:sgpa|s\.?g\.?p\.?a\.?)\s*[:=-]?\s*(10(?:\.0{1,2})?|[0-9]\.\d{1,2})/i) ||
      combined.match(/\b([6-9]\.\d{2})\b/);
    const sgpa = sgpaMatch ? parseFloat(sgpaMatch[1]) : undefined;

    const cgpaMatch = combined.match(/(?:cgpa|c\.?g\.?p\.?a\.?)\s*[:=-]?\s*(10(?:\.0{1,2})?|[0-9]\.\d{1,2})/i);
    const officialCGPA = cgpaMatch ? parseFloat(cgpaMatch[1]) : undefined;
    const declDate = parseFlexibleDateToIso(combined);
    const failDetected = /\b(fail|backlog|reappear|detained)\b/i.test(lower);

    return {
      detectedType: 'University Semester Marksheet',
      detectedModule: 'education',
      shouldAddToPortfolio: true,
      confidence: sgpa !== undefined ? 0.93 : 0.72,
      data: {
        institution: /arka\s*jain/i.test(lower) ? 'Arka Jain University' : 'Arka Jain University',
        degree: 'Bachelor of Technology (B.Tech)',
        branch: 'Computer Science and Engineering',
        semesterNumber: semesterNumber ?? 1,
        sgpa,
        officialCGPA,
        resultDeclarationDate: declDate || undefined,
        status: failDetected ? 'FAIL' : 'PASS',
        passFailStatus: failDetected ? 'FAIL' : 'PASS',
      },
      suggestion:
        sgpa !== undefined
          ? `Extracted Semester ${semesterNumber ?? '?'} result (SGPA: ${sgpa.toFixed(2)}).`
          : 'Marksheet detected, but SGPA value could not be read clearly — please verify in Education form.',
    };
  }

  if (targetModule === 'certificate') {
    const { issuer, category } = detectIssuerFromText(lower);
    const title = detectCertificateTitleFromText(readableBody || fileName, fileName);
    const issueDate = parseFlexibleDateToIso(combined) || new Date().toISOString().split('T')[0];

    const credMatch =
      combined.match(/\b(NPTEL\d{2}[A-Z0-9]{6,20})\b/i) ||
      combined.match(/\b(HH-\d{4,10})\b/i) ||
      combined.match(/(?:credential\s*id|certificate\s*(?:id|no|number|code)|certification\s*id|unique\s*id|card\s*id|verification\s*(?:code|id)|id)\s*[:#-]\s*([A-Za-z0-9_-]{5,32})/i) ||
      combined.match(/\b((?=[a-z0-9]*[a-z])(?=[a-z0-9]*\d)[a-z0-9]{7,16})\b(?=[\s\S]{0,80}certification\s*id)/i);
    const credentialId = credMatch ? credMatch[1] : '';

    const urlMatch = combined.match(/https?:\/\/[^\s"'<>]+/i);
    const scoreMatch = combined.match(/\b(\d{2}(?:\.\d{1,2})?)\s*%/);
    const creditsMatch = combined.match(/credits?\s*(?:recommended)?\s*[:=-]?\s*(\d+)/i);
    const durationMatch = combined.match(/\b(\d{1,2}\s*week\s*course)\b/i);

    const extractedSkills = extractTechFromText(`${title} ${readableBody}`);
    const skills = extractedSkills.length
      ? extractedSkills
      : category.includes('AI')
      ? ['Artificial Intelligence', 'Generative AI']
      : ['Software Engineering', 'Technical Skills'];

    return {
      detectedType: 'certificate',
      detectedModule: 'certificate',
      shouldAddToPortfolio: true,
      confidence: title !== 'Verified Technical Certificate' ? 0.93 : 0.78,
      data: {
        title,
        issuer,
        category,
        issueDate,
        credentialId,
        credentialUrl: url || (urlMatch ? urlMatch[0] : ''),
        score: scoreMatch ? `${scoreMatch[1]}%` : undefined,
        credits: creditsMatch ? `${creditsMatch[1]} Credits` : undefined,
        duration: durationMatch ? durationMatch[1] : undefined,
        skills,
        description: `Verified certification in ${title} awarded by ${issuer}${scoreMatch ? ` (Score: ${scoreMatch[1]}%)` : ''}.`,
      },
      suggestion: `Detected certificate "${title}" from ${issuer}.`,
    };
  }

  if (targetModule === 'experience') {
    const firstLines = (readableBody || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3 && l.length < 90);
    const roleMatch = combined.match(/(?:role|position|designation|as)\s*[:\-]?\s*([A-Za-z0-9\s/&+-]{4,60})/i);
    const companyMatch = combined.match(/(?:company|organization|at)\s*[:\-]?\s*([A-Za-z0-9\s.&,-]{3,60})/i);
    const role = (roleMatch?.[1] || cleanHumanTitle(fileName) || firstLines[0] || 'Software Developer Intern').trim();
    const company = (companyMatch?.[1] || firstLines[1] || 'Technology Organization').trim();
    const periodMatch = combined.match(/\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}\s*[-–to]+\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2})|20\d{2}\s*[-–]\s*(?:present|20\d{2}))\b/i);

    return {
      detectedType: 'experience',
      detectedModule: 'experience',
      shouldAddToPortfolio: true,
      confidence: 0.87,
      data: {
        role,
        company,
        location: /\bindia\b|\bremote\b|\bjharkhand\b|\bbihar\b/i.test(lower) ? 'Remote / India' : 'India',
        period: periodMatch ? periodMatch[1] : `${new Date().getFullYear()} – Present`,
        type: /\bintern/i.test(lower) ? 'Internship' : 'Professional',
        description: (readableBody || `${role} at ${company}`).slice(0, 320),
        highlights: firstLines.slice(0, 3),
      },
      suggestion: `Extracted experience "${role} @ ${company}".`,
    };
  }

  if (targetModule === 'skills') {
    const foundTech = extractTechFromText(readableBody || pastedText || fileName);
    const lineSplit = (pastedText || readableBody)
      .split(/[,|\n•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 32 && !/\b(skills?|technical|proficiency|categories?)\b/i.test(s));

    const names = Array.from(new Set([...foundTech, ...(foundTech.length < 2 ? lineSplit : [])])).slice(0, 15);
    return {
      detectedType: 'skills',
      detectedModule: 'skills',
      shouldAddToPortfolio: names.length > 0,
      confidence: names.length >= 2 ? 0.9 : 0.55,
      data: {
        category: cleanHumanTitle(fileName) || (/\bbackend|node|express|sql\b/i.test(lower) ? 'Backend & Databases' : /\bai|llm|gemini\b/i.test(lower) ? 'AI & Tools' : 'Technical Skills'),
        skills: names.map((name) => ({ name, level: 85 })),
      },
      suggestion: `Extracted ${names.length} technical skill(s) ready to merge.`,
    };
  }

  if (targetModule === 'settings') {
    const emailMatch = combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = combined.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b/);
    const ghUser = combined.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    const liUser = combined.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    const firstNonEmpty = (readableBody || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return {
      detectedType: 'resume',
      detectedModule: 'settings',
      shouldAddToPortfolio: true,
      confidence: 0.9,
      data: {
        name: firstNonEmpty[0] && firstNonEmpty[0].length < 40 && /^[A-Za-z\s.]+$/.test(firstNonEmpty[0]) ? firstNonEmpty[0] : 'Nitesh Kumar',
        title: firstNonEmpty[1] && firstNonEmpty[1].length < 80 ? firstNonEmpty[1] : undefined,
        email: emailMatch ? emailMatch[0] : undefined,
        whatsapp: phoneMatch ? phoneMatch[0] : undefined,
        github: ghUser ? ghUser[0] : undefined,
        linkedin: liUser ? liUser[0] : undefined,
        bio: pastedText.trim().slice(0, 260) || undefined,
      },
      suggestion: 'Resume / Profile details extracted cleanly for Portfolio Settings.',
    };
  }

  // Fallback: Project
  const title =
    (!isGenericCameraFileName(fileName) ? cleanHumanTitle(fileName) : '') ||
    (readableBody.split('\n')[0]?.trim().slice(0, 60)) ||
    'Portfolio Project';
  const techStack = extractTechFromText(combined);

  return {
    detectedType: mimeType.startsWith('image/') ? 'project_screenshot' : 'project',
    detectedModule: 'project',
    shouldAddToPortfolio: true,
    confidence: 0.88,
    data: {
      title,
      shortDescription: pastedText.trim().slice(0, 150) || `${title} — Web application built with modern technologies.`,
      detailedDescription: readableBody.slice(0, 700) || `${title} — Full-stack application with responsive UI and clean architecture.`,
      category: /\bai|gemini|bot|ml\b/i.test(lower) ? 'AI & Automation' : 'Full-Stack Development',
      techStack: techStack.length ? techStack : ['React', 'TypeScript', 'Tailwind CSS'],
      githubUrl: url.includes('github.com') ? url : '',
      liveDemoUrl: url && !url.includes('github.com') ? url : '',
      keyFeatures: [],
      status: 'Completed',
    },
    suggestion: `Detected project "${title}".`,
  };
}
