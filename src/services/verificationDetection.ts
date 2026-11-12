import type { PortfolioCertificate } from '../types/certificate';

/**
 * Checks whether a URL is a live, publicly accessible third-party issuer verification page
 * (Microsoft Learn, Coursera, Credly, Analytics Vidhya, Udemy).
 */
export const isExternalLiveVerificationUrl = (value?: string): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = url.pathname.replace(/\/+$/, '');
    if (!path || path === '/') return false;

    if (host === 'coursera.org') {
      return /^\/verify\/[A-Za-z0-9_-]{6,}$/i.test(path);
    }

    if (host === 'credly.com') {
      return /^\/badges\/[0-9a-f-]{30,}(?:\/public_url)?$/i.test(path);
    }

    if (host === 'learn.microsoft.com') {
      if (/\/users\/me\/transcript/i.test(path)) return false;
      return /^\/[a-z]{2}-[a-z]{2}\/users\/[a-z0-9-]+\/(?:achievements\/print|credentials)\/[a-z0-9_-]{6,}$/i.test(path);
    }

    if (host === 'courses.analyticsvidhya.com' || host === 'trainings.analyticsvidhya.com') {
      return /^\/certificates\/[a-z0-9_-]{6,}$/i.test(path);
    }

    if (host === 'udemy.com') {
      return /^\/certificate\/[A-Za-z0-9_-]{6,}$/i.test(path);
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Checks whether a URL is a valid individual verification URL
 * (either an external live issuer verification URL or an internal `/#/verify/:id` route).
 */
export const isIndividualVerificationUrl = (value?: string): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('/#/verify/') || trimmed.startsWith('#/verify/') || trimmed.startsWith('/verify/')) {
    return true;
  }
  if (isExternalLiveVerificationUrl(trimmed)) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    if (url.hash && url.hash.startsWith('#/verify/')) return true;
    return false;
  } catch {
    return false;
  }
};

/**
 * Automatically detects or generates a working verification URL for any certificate.
 * - For Microsoft Learn, Coursera, Credly, Analytics Vidhya, and Udemy: generates the live external issuer verification URL.
 * - For NPTEL, NASSCOM FutureSkills Prime, Henry Harvin, Arka Jain University, and other document-backed credentials:
 *   generates the internal `/#/verify/<credentialId>` official verification registry route so links never 404.
 */
export const detectVerificationUrl = (cert: PortfolioCertificate): string | null => {
  if (cert.credentialUrl && isIndividualVerificationUrl(cert.credentialUrl)) return null;

  const issuer = (cert.issuer || '').toLowerCase();
  const id = (cert.credentialId || '').trim();
  const code = (cert.verificationCode || '').trim();
  const token = id || code || cert.id;

  if (id) {
    if (issuer.includes('coursera') && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      const url = `https://coursera.org/verify/${encodeURIComponent(id)}`;
      return url === cert.credentialUrl ? null : url;
    }

    if (issuer.includes('credly') && /^[0-9a-f-]{30,}$/i.test(id)) {
      const url = `https://www.credly.com/badges/${encodeURIComponent(id)}`;
      return url === cert.credentialUrl ? null : url;
    }

    if (issuer.includes('microsoft') && !issuer.includes('arka jain') && /^[a-z0-9_-]{6,}$/i.test(id)) {
      const url = `https://learn.microsoft.com/en-us/users/niteshkumar-7537/achievements/print/${encodeURIComponent(id)}`;
      return url === cert.credentialUrl ? null : url;
    }

    if (issuer.includes('analytics vidhya') && /^[a-z0-9_-]{6,}$/i.test(id)) {
      const url = `https://courses.analyticsvidhya.com/certificates/${encodeURIComponent(id)}`;
      return url === cert.credentialUrl ? null : url;
    }

    if (issuer.includes('udemy') && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      const url = `https://www.udemy.com/certificate/${encodeURIComponent(id)}/`;
      return url === cert.credentialUrl ? null : url;
    }
  }

  if (token) {
    const internalUrl = `#/verify/${encodeURIComponent(token)}`;
    return internalUrl === cert.credentialUrl ? null : internalUrl;
  }

  return null;
};

export interface VerificationScanCandidate {
  id: string;
  credentialUrl: string;
  suggestedCredentialUrl: string;
  verificationStatus: 'approved';
}

export const bulkScanCertificates = (certificates: PortfolioCertificate[]): VerificationScanCandidate[] =>
  certificates
    .map(certificate => {
      const suggestedUrl = detectVerificationUrl(certificate);
      return suggestedUrl
        ? {
            id: certificate.id,
            credentialUrl: suggestedUrl,
            suggestedCredentialUrl: suggestedUrl,
            verificationStatus: 'approved' as const
          }
        : null;
    })
    .filter((item): item is VerificationScanCandidate => Boolean(item));
