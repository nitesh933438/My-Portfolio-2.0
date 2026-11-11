import type { PortfolioCertificate } from '../types/certificate';

/**
 * A public verification URL must identify a credential, not merely its issuer.
 * This deliberately rejects issuer homepages and generic account/transcript pages.
 */
export const isIndividualVerificationUrl = (value?: string): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = url.pathname.replace(/\/+$/, '');
    if (!path || path === '/') return false;

    // Official credential-specific URL patterns supported by the bundled catalog.
    if (host === 'coursera.org' || host === 'www.coursera.org') {
      return /^\/verify\/[A-Za-z0-9_-]{6,}$/i.test(path);
    }
    if (host === 'credly.com') {
      return /^\/badges\/[0-9a-f-]{30,}(?:\/public_url)?$/i.test(path);
    }
    if (host === 'learn.microsoft.com') {
      return /^\/en-us\/users\/[a-z0-9-]+\/achievements\/print\/[a-z0-9_-]{6,}$/i.test(path);
    }
    // Known issuer portals that are generic and do not identify an individual credential.
    if (host === 'learn.microsoft.com' && /\/users\/me\/transcript/i.test(path)) return false;
    if (host === 'learner-henryharvin.com' && path === '/my-certified-card') return false;
    if (host === 'trainings.analyticsvidhya.com') return false;

    // For other issuers, require a credential-like identifier in the path or query.
    const hasCredentialToken = /(?:verify|certificate|credential|badge|certificates?)\//i.test(path)
      && /[A-Za-z0-9_-]{6,}/.test(path.split('/').filter(Boolean).at(-1) || '');
    const hasCredentialQuery = [...url.searchParams.entries()].some(([key, val]) =>
      /credential|certificate|verify|badge|token|id/i.test(key) && val.length >= 6
    );
    return hasCredentialToken || hasCredentialQuery;
  } catch {
    return false;
  }
};

/**
 * Only suggest deterministic issuer URLs when a credential ID is present and
 * the issuer has a documented public URL shape. Suggestions always stay pending
 * for an administrator to inspect; no guessed or generic links are generated.
 */
export const detectVerificationUrl = (cert: PortfolioCertificate): string | null => {
  if (cert.credentialUrl && isIndividualVerificationUrl(cert.credentialUrl)) return null;

  const issuer = (cert.issuer || '').toLowerCase();
  const id = (cert.credentialId || '').trim();
  if (!id) return null;

  if (issuer.includes('coursera') && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
    const url = `https://www.coursera.org/verify/${encodeURIComponent(id)}`;
    return url === cert.credentialUrl ? null : url;
  }

  if (issuer.includes('credly') && /^[0-9a-f-]{30,}$/i.test(id)) {
    const url = `https://www.credly.com/badges/${encodeURIComponent(id)}/public_url`;
    return url === cert.credentialUrl ? null : url;
  }

  if (issuer.includes('udemy') && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
    const url = `https://www.udemy.com/certificate/${encodeURIComponent(id)}/`;
    return url === cert.credentialUrl ? null : url;
  }

  return null;
};

export const bulkScanCertificates = (certs: PortfolioCertificate[]): Partial<PortfolioCertificate>[] =>
  certs.flatMap(cert => {
    const suggested = detectVerificationUrl(cert);
    return suggested
      ? [{ id: cert.id, suggestedCredentialUrl: suggested, verificationStatus: 'pending' as const }]
      : [];
  });
