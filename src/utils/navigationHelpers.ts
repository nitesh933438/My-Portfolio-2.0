export interface PortfolioLocationLike {
  pathname?: string;
  hash?: string;
  search?: string;
  state?: unknown;
}

const NON_SECTION_ROUTES = new Set([
  '',
  'admin',
  'verify',
  'resume',
  'projects',
  'certifications',
]);

export function parsePortfolioSectionTarget(loc: PortfolioLocationLike): string {
  // 1. Explicit navigation state takes highest priority
  if (loc.state && typeof loc.state === 'object' && 'scrollTo' in loc.state) {
    const rawStateTarget = String((loc.state as { scrollTo?: unknown }).scrollTo || '').trim();
    if (/^[a-zA-Z0-9_-]+$/.test(rawStateTarget) && rawStateTarget !== 'admin' && rawStateTarget !== 'verify' && rawStateTarget !== 'resume') {
      return rawStateTarget;
    }
  }

  // 2. Explicit query parameter (?section=certifications)
  const search = (loc.search || '').trim();
  if (search) {
    try {
      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      const sectionParam = (params.get('section') || '').trim();
      if (/^[a-zA-Z0-9_-]+$/.test(sectionParam) && sectionParam !== 'admin' && sectionParam !== 'verify' && sectionParam !== 'resume') {
        return sectionParam;
      }
    } catch {
      // Ignore malformed search
    }
  }

  // 3. Subpath like /certifications or /projects on PublicPortfolio wildcard route
  const cleanPathname = (loc.pathname || '').replace(/^\/+|\/+$/g, '');
  if (cleanPathname && !cleanPathname.startsWith('admin') && !cleanPathname.startsWith('verify') && cleanPathname !== 'resume') {
    const firstSegment = cleanPathname.split('/')[0];
    if (/^[a-zA-Z0-9_-]+$/.test(firstSegment)) {
      return firstSegment;
    }
  }

  // 4. Raw hash fragment like #certifications or #/certifications or #/#certifications
  const rawHash = (loc.hash || '').trim();
  if (rawHash) {
    // Handle query inside hash if caller passed full window.location.hash (e.g. #/?section=certifications)
    const qIndex = rawHash.indexOf('?');
    if (qIndex !== -1) {
      try {
        const params = new URLSearchParams(rawHash.slice(qIndex));
        const sectionParam = (params.get('section') || '').trim();
        if (/^[a-zA-Z0-9_-]+$/.test(sectionParam) && sectionParam !== 'admin' && sectionParam !== 'verify' && sectionParam !== 'resume') {
          return sectionParam;
        }
      } catch {
        // Ignore malformed hash query
      }
    }

    const withoutQuery = qIndex !== -1 ? rawHash.slice(0, qIndex) : rawHash;
    const match = withoutQuery.match(/#\/?([a-zA-Z0-9_-]+)$/);
    if (match) {
      const candidate = match[1];
      if (!NON_SECTION_ROUTES.has(candidate) || candidate === 'projects' || candidate === 'certifications') {
        return candidate;
      }
    }
  }

  return '';
}

export function readModalStack(state: unknown): string[] {
  if (!state || typeof state !== 'object') return [];
  const raw = (state as { __modalStack?: unknown }).__modalStack;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function pushModalToStack(stack: string[], modalId: string): string[] {
  const clean = stack.filter((id) => id !== modalId);
  return [...clean, modalId];
}

export function removeModalFromStack(stack: string[], modalId: string): string[] {
  return stack.filter((id) => id !== modalId);
}

export function isModalInStack(state: unknown, modalId: string): boolean {
  return readModalStack(state).includes(modalId);
}

export function inferFileExtension(url: string, fallbackExt = 'pdf'): string {
  if (!url) return fallbackExt;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('data:application/pdf')) return 'pdf';
  if (trimmed.startsWith('data:image/png')) return 'png';
  if (trimmed.startsWith('data:image/webp')) return 'webp';
  if (trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg')) return 'jpg';

  const clean = trimmed.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot !== -1 && lastDot < clean.length - 1) {
    const ext = clean.slice(lastDot + 1);
    if (['pdf', 'jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return fallbackExt;
}

export function buildSafeDownloadFilename(title: string, url: string, fallbackExt = 'pdf'): string {
  const safeBase = (title || 'document')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'document';
  const ext = inferFileExtension(url, fallbackExt);
  return `${safeBase}.${ext}`;
}
