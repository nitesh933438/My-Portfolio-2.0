import { parseDocumentContent, GitHubRepoContextData } from '../utils/documentParser';

/**
 * Resolve API paths for both same-origin hosting and a separately hosted backend.
 * Also provides automatic client-side fallbacks when deployed to static hosts (e.g. GitHub Pages / nginx)
 * where POST /api/* returns 405 Not Allowed.
 */
const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE = configuredBase.replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export async function readJsonResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  if (!contentType.toLowerCase().includes('application/json')) {
    const preview = body.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(
      `API returned ${response.status} ${response.statusText} instead of JSON. Response: ${preview || 'empty response'}`
    );
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('The API returned malformed JSON.');
  }
}

/**
 * Extracts text ONLY from plain-text file formats (.txt, .md, .json, .csv, .html, .svg).
 * Never decodes binary image/PDF bytes as text (which corrupts classification with random noise).
 */
async function extractReadableTextFromFile(file?: File | null): Promise<string> {
  if (!file) return '';
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  const isTextLike =
    type.startsWith('text/') ||
    type === 'application/json' ||
    /\.(txt|md|json|csv|html|svg)$/i.test(name);
  if (!isTextLike) return '';
  try {
    return (await file.text()).slice(0, 30000);
  } catch {
    return '';
  }
}

/**
 * Client-side intelligent analyzer when backend /api/ai/analyze-and-extract is unavailable (e.g. 405 on static host).
 */
export async function analyzeAndExtractClientFallback(params: {
  file?: File | null;
  text?: string;
  url?: string;
  hintModule?: string;
}): Promise<any> {
  const { file, text = '', url = '', hintModule = '' } = params;
  const trimmedUrl = url.trim();
  let githubRepo: GitHubRepoContextData | undefined;

  const ghMatch = (trimmedUrl || text).match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (ghMatch) {
    const owner = ghMatch[1];
    const repo = ghMatch[2].replace(/\.git$/i, '');
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
      if (ghRes.ok) {
        const repoData = await ghRes.json();
        let readmeText = '';
        try {
          const readmeRes = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`
          );
          if (readmeRes.ok) {
            const readmeJson = await readmeRes.json();
            if (readmeJson.encoding === 'base64' && readmeJson.content) {
              readmeText = atob(String(readmeJson.content).replace(/\s/g, '')).slice(0, 15000);
            }
          }
        } catch {
          // Optional README fetch
        }
        githubRepo = {
          name: repoData.name || repo,
          fullName: repoData.full_name || `${owner}/${repo}`,
          description: repoData.description || '',
          homepage: repoData.homepage || '',
          language: repoData.language || '',
          topics: Array.isArray(repoData.topics) ? repoData.topics : [],
          readmeText,
          htmlUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
        };
      }
    } catch {
      // Continue to deterministic parser
    }
  }

  const fileText = await extractReadableTextFromFile(file);
  const parsed = parseDocumentContent({
    fileName: file?.name || '',
    mimeType: file?.type || '',
    extractedText: fileText,
    pastedText: text,
    url: trimmedUrl,
    hintModule,
    githubRepo,
  });

  return {
    success: true,
    fallback: true,
    data: parsed,
  };
}

/**
 * Smart wrapper for Universal AI Scanner (/api/ai/analyze-and-extract)
 * Surfaces auth/validation errors (401/403/400/413/415) clearly, and falls back cleanly on static hosts (404/405/network).
 */
export async function analyzeAndExtractSmart(params: {
  file?: File | null;
  text?: string;
  url?: string;
  idToken?: string;
  hintModule?: string;
}): Promise<any> {
  const { file, text, url, idToken, hintModule } = params;
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (text) formData.append('text', text);
  if (url) formData.append('url', url);
  if (hintModule) formData.append('hintModule', hintModule);

  try {
    const response = await fetch(apiUrl('/api/ai/analyze-and-extract'), {
      method: 'POST',
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.toLowerCase().includes('application/json')) {
      const json = await response.json().catch(() => null);
      if (response.status === 401 || response.status === 403) {
        throw new Error(json?.error || 'Admin session required or expired. Please sign in again.');
      }
      if ([400, 413, 415, 422].includes(response.status)) {
        throw new Error(json?.error || `Invalid scan input (${response.status}).`);
      }
      if (response.ok && json && json.success && json.data) {
        return json;
      }
    }
  } catch (err: any) {
    if (err?.message && /admin session|unauthorized|forbidden|unsupported file type|exceeds|upload a file/i.test(err.message)) {
      throw err;
    }
    console.warn('[AI Scanner] Backend unreachable or static host, using smart client extractor:', err);
  }

  return analyzeAndExtractClientFallback({ file, text, url, hintModule });
}

/**
 * Smart wrapper for Academic Marksheet Extraction (/api/academic/extract-marksheet)
 * Automatically falls back to client-side extraction if the backend returns 405/non-JSON.
 */
export async function extractMarksheetSmart(params: {
  file?: File | null;
  fileBase64?: string;
  mimeType?: string;
  fileName: string;
}): Promise<any> {
  try {
    const response = await fetch(apiUrl('/api/academic/extract-marksheet'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: params.fileBase64,
        mimeType: params.mimeType,
        fileName: params.fileName
      })
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.toLowerCase().includes('application/json')) {
      const result = await response.json();
      if (result && result.success && result.extractedData) {
        return result;
      }
    }
  } catch (err) {
    console.warn('[Marksheet AI] Backend unreachable, using client-side extractor:', err);
  }

  const fileText = await extractReadableTextFromFile(params.file);
  const parsed = parseDocumentContent({
    fileName: params.fileName,
    mimeType: params.mimeType || params.file?.type || 'application/pdf',
    extractedText: fileText,
    hintModule: 'education',
  });

  const d = parsed.data || {};
  return {
    success: true,
    fallback: true,
    extractedData: {
      semesterNumber: d.semesterNumber ?? 1,
      sgpa: typeof d.sgpa === 'number' ? d.sgpa : null,
      officialCGPA: typeof d.officialCGPA === 'number' ? d.officialCGPA : null,
      resultDeclarationDate: d.resultDeclarationDate || '',
      passFailStatus: d.passFailStatus || 'PASS',
      academicSession: '2025–2026',
    }
  };
}

/**
 * Smart wrapper for Project AI Description Generator (/api/ai/generate-description)
 */
export async function generateProjectDescriptionSmart(params: {
  title: string;
  category?: string;
  techStack?: string[];
  idToken?: string;
}): Promise<any> {
  const { title, category = 'Full-Stack Development', techStack = [], idToken } = params;
  try {
    const response = await fetch(apiUrl('/api/ai/generate-description'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        type: 'project',
        context: { title, category, techStack },
        title,
        category,
        techStack,
      })
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.toLowerCase().includes('application/json')) {
      const json = await response.json();
      if (json && json.success && json.data) return json;
    }
  } catch (err) {
    console.warn('[AI Description] Backend unavailable, using client generator:', err);
  }

  const stackText = techStack.length ? techStack.join(', ') : 'React, TypeScript, Tailwind CSS, and Firebase';
  return {
    success: true,
    fallback: true,
    data: {
      shortDescription: `${title} — A high-performance ${category.toLowerCase()} solution engineered with ${stackText}.`,
      fullDescription: `${title} is a production-ready ${category.toLowerCase()} application built using ${stackText}. It features a responsive interface, modular component architecture, real-time cloud synchronization, and optimized performance across desktop and mobile devices.`,
      keyFeatures: [
        `Modern, responsive UI crafted for ${category} workflows`,
        `Engineered with ${stackText} for scalability and fast load times`,
        'Real-time data persistence, role-based security, and intuitive user controls',
        'Cross-device mobile and desktop responsiveness with dark/light mode'
      ],
      challenges: `Designing a seamless real-time synchronization layer and optimizing asset rendering so ${title} performs smoothly under heavy data loads.`
    }
  };
}

/**
 * Smart wrapper for AI Portfolio Assistant Chat (/api/ai/chat)
 */
export async function chatWithAssistantSmart(params: {
  message: string;
  idToken?: string;
  portfolioSummary?: Record<string, any>;
}): Promise<{ success: boolean; reply: string }> {
  const { message, idToken, portfolioSummary } = params;
  try {
    const response = await fetch(apiUrl('/api/ai/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({ message, portfolioSummary })
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.toLowerCase().includes('application/json')) {
      const json = await response.json();
      if (json && json.reply) return { success: true, reply: json.reply };
    }
  } catch {
    // Use client fallback below
  }

  const q = message.toLowerCase();
  const projCount = portfolioSummary?.projects?.active ?? 'all live';
  const certCount = portfolioSummary?.certificates?.published ?? 'all published';

  if (q.includes('certificate') || q.includes('verify')) {
    return {
      success: true,
      reply:
        `You currently have **${certCount} published certificates** tracked in the **Certificates Manager**:\n• Upload or multi-scan any Certificate image/PDF via **Universal AI Scanner** — duplicates are skipped or merged automatically.\n• Use **Top (#01)**, **Up (↑)**, and **Down (↓)** or edit **Serial #** to reorder; serial numbers (#01, #02, ...) auto-sync across Admin & Public Portfolio.`
    };
  }
  if (q.includes('project') || q.includes('screenshot')) {
    return {
      success: true,
      reply:
        `You currently have **${projCount} active projects** synced between Admin & Portfolio:\n• Click **AI Generate** inside the Project Editor to auto-write descriptions and key features.\n• Open **Screenshots** on any project card to upload, reorder, and set cover images.\n• Reorder projects with **#01 Top / Up / Down** and toggle **Featured** to spotlight projects cleanly.`
    };
  }
  if (q.includes('scanner') || q.includes('scan') || q.includes('auto-fill')) {
    return {
      success: true,
      reply:
        'The **Universal AI Scanner** supports multi-file uploads, pasted text, and GitHub URLs. It decides **what the file is**, **checks your live portfolio for duplicates**, blocks irrelevant/private files (Aadhaar, PAN, payment receipts), and can **Auto-Apply** updates directly or open the pre-filled Admin form for review.'
    };
  }

  return {
    success: true,
    reply:
      `Here is a quick live summary for **"${message}"**:\n• **Projects (${projCount} active):** Managed in **Projects Manager**; Featured active items sync to the Hero & Featured showcase.\n• **Certificates (${certCount} published):** Ordered dynamically with automatic #01..#NN serial indexing.\n• **Education, Skills & Experience:** Managed in their CMS tabs and auto-synced into your Public Portfolio & ATS Resume.\n• **Universal AI Scanner:** Launch **AI Scan** in the top bar for multi-file smart detection & safe Auto-Apply.`
  };
}
