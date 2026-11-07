import type { PortfolioCertificate } from '../types/certificate';

/**
 * Detection patterns for common certificate issuers.
 * Based on official documentation and common URL structures.
 */
const ISSUER_PATTERNS = [
  {
    name: 'Coursera',
    match: (issuer: string) => issuer.toLowerCase().includes('coursera'),
    generate: (id: string) => id ? `https://coursera.org/verify/${id}` : null
  },
  {
    name: 'Udemy',
    match: (issuer: string) => issuer.toLowerCase().includes('udemy'),
    generate: (id: string) => id ? `https://www.udemy.com/certificate/${id}/` : null
  },
  {
    name: 'LinkedIn Learning',
    match: (issuer: string) => issuer.toLowerCase().includes('linkedin'),
    generate: (id: string) => id ? `https://www.linkedin.com/learning/certificates/${id}` : null
  },
  {
    name: 'Credly',
    match: (issuer: string) => issuer.toLowerCase().includes('credly'),
    generate: (id: string) => id ? `https://www.credly.com/badges/${id}/public_url` : null
  },
  {
    name: 'Henry Harvin',
    match: (issuer: string) => issuer.toLowerCase().includes('henry harvin'),
    generate: (id: string) => id ? `https://learner-henryharvin.com/my-certified-card` : null // They seem to use a generic link based on the bundled data
  },
  {
    name: 'Microsoft Learn',
    match: (issuer: string) => issuer.toLowerCase().includes('microsoft'),
    generate: (id: string) => id ? `https://learn.microsoft.com/en-us/users/me/transcript/` : null // Verification usually requires a transcript ID
  }
];

/**
 * Scans a certificate and suggests a verification URL if a pattern matches.
 */
export const detectVerificationUrl = (cert: PortfolioCertificate): string | null => {
  // Don't suggest if a URL is already approved or manually set
  if (cert.credentialUrl && cert.verificationStatus === 'approved') return null;

  const issuer = cert.issuer || '';
  const id = cert.credentialId || '';

  for (const pattern of ISSUER_PATTERNS) {
    if (pattern.match(issuer)) {
      const suggested = pattern.generate(id);
      if (suggested && suggested !== cert.credentialUrl) {
        return suggested;
      }
    }
  }

  return null;
};

/**
 * Bulk scan certificates and return updates for those with newly detected URLs.
 */
export const bulkScanCertificates = (certs: PortfolioCertificate[]): Partial<PortfolioCertificate>[] => {
  return certs
    .map(cert => {
      const suggested = detectVerificationUrl(cert);
      if (suggested) {
        return {
          id: cert.id,
          suggestedCredentialUrl: suggested,
          verificationStatus: 'pending' as const
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
};
