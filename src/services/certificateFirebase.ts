import { collection, addDoc, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth, isUserAdmin, ADMIN_EMAIL } from './academicFirebase';
import { uploadFileProxy, deleteFileProxy, getStorageUrl } from './supabaseStorage';
import type { PortfolioCertificate } from '../types/certificate';

export const certificatesRef = collection(db, 'certifications');

/**
 * Resolves the final public URL for a certificate asset.
 * Checks if it's a Supabase path, a full URL, or a local static asset.
 */
export const resolveCertificateUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  
  let cleanPath = pathOrUrl;
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Local static certificates
  if (
    cleanPath.startsWith('certificates/certificate-') ||
    cleanPath.startsWith('certificate-') ||
    cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('images/')
  ) {
    if (cleanPath.startsWith('certificate-')) {
      return `${prefix}certificates/${cleanPath}`;
    }
    return `${prefix}${cleanPath}`;
  }

  // Supabase paths: certificates/1730000_filename.jpg
  if (cleanPath.startsWith('certificates/') || (cleanPath.includes('/') && !cleanPath.includes('certificate-'))) {
    return getStorageUrl(cleanPath);
  }

  return `${prefix}certificates/${cleanPath}`;
};

export const subscribeToCertificates = (callback: (items: PortfolioCertificate[]) => void, admin = false) => {
  const base = admin ? query(certificatesRef, orderBy('displayOrder', 'asc')) : query(certificatesRef, where('published', '==', true));
  return onSnapshot(base, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate))), err => {
    console.error('Certificates listener:', err);
    callback([]);
  });
};

/**
 * Saves certificate metadata to Firestore. 
 */
export const saveCertificate = async (data: Omit<PortfolioCertificate, 'id'>, id?: string): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in as ' + ADMIN_EMAIL + '.');
  }
  
  const payload = { 
    ...data, 
    updatedAt: new Date().toISOString() 
  };

  if (id) {
    await setDoc(doc(db, 'certifications', id), payload, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(certificatesRef, { ...payload, createdAt: new Date().toISOString() });
    return docRef.id;
  }
};

/**
 * Removes a certificate from Firestore and its associated file from Supabase if applicable.
 */
export const removeCertificate = async (item: PortfolioCertificate) => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in as ' + ADMIN_EMAIL + '.');
  }

  // Detect Supabase path: contains / but doesn't start with http or /
  if (item.fileUrl && item.fileUrl.includes('/') && !item.fileUrl.startsWith('http') && !item.fileUrl.startsWith('/')) {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) await deleteFileProxy(item.fileUrl, idToken);
    } catch (e) {
      console.warn('Could not delete Supabase asset:', e);
    }
  }

  await deleteDoc(doc(db, 'certifications', item.id));
};

export interface ImportDiagnostic {
  success: boolean;
  stage: 'auth' | 'asset_fetch' | 'supabase_upload' | 'firestore_save' | 'completed';
  authEmail: string;
  isAdmin: boolean;
  details: string;
  timestamp: string;
  storagePath?: string;
  storageUrl?: string;
}

export const testSingleCertificateDiagnostic = async (currentUser: User | null): Promise<ImportDiagnostic> => {
  const diagnostic: ImportDiagnostic = {
    success: false,
    stage: 'auth',
    authEmail: currentUser?.email || 'unauthenticated',
    isAdmin: isUserAdmin(currentUser),
    details: 'Initiating Supabase + Firestore diagnostic...',
    timestamp: new Date().toISOString()
  };

  if (!currentUser || !isUserAdmin(currentUser)) {
    diagnostic.details = `Authentication failed: User is not authorized as ${ADMIN_EMAIL}.`;
    return diagnostic;
  }

  const idToken = await currentUser.getIdToken();

  diagnostic.stage = 'asset_fetch';
  let blob: Blob;
  try {
    const response = await fetch('/certificates/certificate-01.jpg');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    blob = await response.blob();
  } catch (e: any) {
    diagnostic.details = `Failed to fetch test asset: ${e.message}`;
    return diagnostic;
  }

  diagnostic.stage = 'supabase_upload';
  try {
    const file = new File([blob], 'diagnostic-test.jpg', { type: 'image/jpeg' });
    const { path, url } = await uploadFileProxy(file, 'certificates', idToken);
    diagnostic.storagePath = path;
    diagnostic.storageUrl = url;
  } catch (e: any) {
    diagnostic.details = `Supabase upload failed: ${e.message}`;
    return diagnostic;
  }

  diagnostic.stage = 'firestore_save';
  try {
    const testData = {
      title: 'Diagnostic Test Certificate',
      issuer: 'System',
      category: 'Other' as any,
      description: 'Automated diagnostic test of Supabase + Firestore bridge.',
      issueDate: new Date().toISOString().split('T')[0],
      credentialId: 'TEST-123',
      credentialUrl: '',
      imageUrl: diagnostic.storageUrl || '',
      fileUrl: diagnostic.storagePath || '', 
      fileType: 'image' as const,
      skills: ['Testing'],
      featured: false,
      published: false,
      displayOrder: 999
    };
    const docId = await saveCertificate(testData);
    await deleteDoc(doc(db, 'certifications', docId));
    if (diagnostic.storagePath) await deleteFileProxy(diagnostic.storagePath, idToken);
    diagnostic.success = true;
    diagnostic.details = 'End-to-end diagnostic passed!';
  } catch (e: any) {
    diagnostic.details = `Firestore operation failed: ${e.message}`;
    return diagnostic;
  }

  diagnostic.stage = 'completed';
  return diagnostic;
};

export const markBundledCertificatesImported = async () => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.');
  await setDoc(doc(db, 'site_metadata', 'certificates'), {
    bundledImported: true,
    publicVisible: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const subscribeToPublicCertificates = (callback: (items: PortfolioCertificate[], catalogImported: boolean) => void) => {
  let items: PortfolioCertificate[] = [];
  let catalogImported = false;
  const emit = () => callback(items, catalogImported);
  
  const stopItems = onSnapshot(query(certificatesRef, where('published', '==', true)), snap => {
    items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate));
    emit();
  }, err => {
    console.error('Public certificates listener:', err);
    items = [];
    emit();
  });
  
  const stopState = onSnapshot(doc(db, 'site_metadata', 'certificates'), snap => {
    catalogImported = snap.exists() && snap.data().bundledImported === true;
    emit();
  }, err => {
    console.warn('Certificate catalog state unavailable:', err);
    catalogImported = false;
    emit();
  });
  
  return () => {
    stopItems();
    stopState();
  };
};
