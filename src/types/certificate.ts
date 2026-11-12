export type CertificateCategory =
  | 'AI & Generative AI'
  | 'AI Agents'
  | 'Data Science'
  | 'AWS & Cloud'
  | 'Web & Software Development'
  | 'GitHub & Developer Tools'
  | 'Microsoft & Productivity'
  | 'Professional Development'
  | 'Events & Participation'
  | 'Other';

export interface PortfolioCertificate {
  id: string;
  title: string;
  issuer: string;
  category: CertificateCategory;
  description: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationCode?: string;
  credentialUrl?: string;
  suggestedCredentialUrl?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  imageUrl: string;
  fileUrl: string;
  fileType: 'image' | 'pdf';
  skills: string[];
  featured: boolean;
  published: boolean;
  displayOrder: number;
  grade?: string;
  score?: string;
  assignmentScore?: string;
  examScore?: string;
  credits?: string;
  duration?: string;
  totalCandidates?: string;
  coordinator?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceAsset?: string;
}

export const CERTIFICATE_CATEGORIES: CertificateCategory[] = [
  'Web & Software Development',
  'AI & Generative AI',
  'AI Agents',
  'Data Science',
  'AWS & Cloud',
  'GitHub & Developer Tools',
  'Microsoft & Productivity',
  'Professional Development',
  'Events & Participation',
  'Other'
];
