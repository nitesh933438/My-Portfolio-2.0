import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth, isUserAdmin } from './academicFirebase';
import { uploadFileProxy, deleteFileProxy, getStorageUrl } from './supabaseStorage';
import type { PortfolioCertificate } from '../types/certificate';
import { BUNDLED_CERTIFICATES } from '../data/certificates';
import { detectVerificationUrl, isIndividualVerificationUrl } from './verificationDetection';

export const certificatesRef = collection(db, 'certifications');

/**
 * Checks whether a path refers to a Supabase Storage uploaded object
 * (which always has the format `certificates/1730000000000_filename.ext`).
 */
const isSupabaseStoragePath = (cleanPath: string): boolean => {
  return /^(certificates|projects|profile|resume|documents)\/\d{10,}_/.test(cleanPath);
};

/**
 * Resolves the final public URL for a certificate asset (image or PDF).
 * Properly handles full URLs, Supabase storage paths, and local static assets in `/public/certificates/`.
 */
export const resolveCertificateUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  let cleanPath = pathOrUrl.trim();
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (isSupabaseStoragePath(cleanPath)) {
    return getStorageUrl(cleanPath);
  }

  if (
    cleanPath.startsWith('certificates/') ||
    cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('images/')
  ) {
    return `${prefix}${cleanPath}`;
  }

  return `${prefix}certificates/${cleanPath}`;
};

/**
 * Resolves the best preview image URL for a certificate card or modal.
 * Even when a certificate's primary file is a PDF (e.g., NPTEL Programming in Java),
 * this returns its high-resolution JPG preview image if available.
 */
export const resolveCertificatePreviewImageUrl = (cert: PortfolioCertificate): string => {
  if (
    cert.id === 'nptel-programming-in-java-2026' ||
    (cert.sourceAsset || '').toLowerCase().includes('nptel-programming-in-java') ||
    (cert.fileUrl || '').toLowerCase().includes('nptel-programming-in-java') ||
    (cert.imageUrl || '').toLowerCase().includes('nptel-programming-in-java')
  ) {
    return resolveCertificateUrl('/certificates/nptel-programming-in-java-original.jpg');
  }
  const candidates = [cert.imageUrl, cert.sourceAsset, cert.fileUrl].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
      return resolveCertificateUrl(candidate);
    }
  }
  return '';
};

/**
 * Resolves the original downloadable/openable document URL (PDF or full-res image).
 */
export const resolveCertificateOriginalFileUrl = (cert: PortfolioCertificate): string => {
  if (cert.fileType === 'pdf' || (cert.sourceAsset || '').toLowerCase().endsWith('.pdf') || (cert.fileUrl || '').toLowerCase().endsWith('.pdf')) {
    const pdfCandidate = [cert.fileUrl, cert.sourceAsset].find(c => c && c.toLowerCase().endsWith('.pdf'));
    if (pdfCandidate) return resolveCertificateUrl(pdfCandidate);
  }
  return resolveCertificateUrl(cert.fileUrl || cert.sourceAsset || cert.imageUrl || '');
};

/**
 * Smartly merges remote Firestore records with `BUNDLED_CERTIFICATES` so that:
 * 1. The NPTEL Programming in Java Elite certificate (`displayOrder: 0`) and all 43 bundled certificates
 *    are always present even if Firestore was seeded with an older 42-item snapshot.
 * 2. Missing or generic metadata fields (`credentialUrl`, `credentialId`, `issueDate`, `expiryDate`,
 *    `grade`, `score`, `assignmentScore`, `examScore`, `credits`, `duration`, `imageUrl`, `skills`)
 *    on existing Firestore documents are automatically enriched from `BUNDLED_CERTIFICATES`.
 */
export const mergeWithBundledCertificates = (
  remoteItems: PortfolioCertificate[],
  adminMode = false
): PortfolioCertificate[] => {
  if (!remoteItems || remoteItems.length === 0) {
    return BUNDLED_CERTIFICATES.filter(c => adminMode || c.published).sort(
      (a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)
    );
  }

  const normalize = (s?: string) => (s || '').trim().toLowerCase();
  const usedRemoteIds = new Set<string>();
  const merged: PortfolioCertificate[] = [];

  for (const bundled of BUNDLED_CERTIFICATES) {
    const match = remoteItems.find(
      r =>
        r.id === bundled.id ||
        (r.sourceAsset && bundled.sourceAsset && normalize(r.sourceAsset) === normalize(bundled.sourceAsset)) ||
        (normalize(r.title) === normalize(bundled.title) && normalize(r.issuer) === normalize(bundled.issuer)) ||
        (bundled.id === 'nptel-programming-in-java-2026' && normalize(r.title).includes('programming in java'))
    );

    if (match) {
      usedRemoteIds.add(match.id);
      const isNptelJava = bundled.id === 'nptel-programming-in-java-2026';
      const isGenericDesc =
        !match.description ||
        match.description.includes('Refer to the original document for its full scope');
      const resolvedCredentialId = isNptelJava
        ? bundled.credentialId || match.credentialId || ''
        : match.credentialId || bundled.credentialId || '';
      const hasValidRemoteVerifyUrl =
        Boolean(match.credentialUrl) && isIndividualVerificationUrl(match.credentialUrl);
      const rawCredentialUrl = hasValidRemoteVerifyUrl
        ? match.credentialUrl || ''
        : bundled.credentialUrl || '';
      const autoDetectedUrl =
        rawCredentialUrl ||
        detectVerificationUrl({
          ...bundled,
          ...match,
          credentialId: resolvedCredentialId
        }) ||
        '';

      const enriched: PortfolioCertificate = {
        ...bundled,
        ...match,
        title: isNptelJava ? bundled.title : match.title || bundled.title,
        issuer: isNptelJava ? bundled.issuer : match.issuer || bundled.issuer,
        description: isGenericDesc ? bundled.description : match.description,
        issueDate: match.issueDate || bundled.issueDate,
        expiryDate: match.expiryDate || bundled.expiryDate,
        credentialId: resolvedCredentialId,
        verificationCode: isNptelJava
          ? bundled.verificationCode
          : match.verificationCode || bundled.verificationCode,
        credentialUrl: autoDetectedUrl,
        verificationStatus:
          match.verificationStatus ||
          bundled.verificationStatus ||
          (autoDetectedUrl ? 'approved' : undefined),
        imageUrl:
          isNptelJava ||
          !match.imageUrl ||
          match.imageUrl.endsWith('.pdf')
            ? bundled.imageUrl
            : match.imageUrl,
        fileUrl: isNptelJava ? bundled.fileUrl : match.fileUrl || bundled.fileUrl,
        fileType: isNptelJava ? bundled.fileType : match.fileType || bundled.fileType,
        grade: match.grade || bundled.grade,
        score: match.score || bundled.score,
        assignmentScore: match.assignmentScore || bundled.assignmentScore,
        examScore: match.examScore || bundled.examScore,
        credits: match.credits || bundled.credits,
        duration: match.duration || bundled.duration,
        totalCandidates: match.totalCandidates || bundled.totalCandidates,
        coordinator: match.coordinator || bundled.coordinator,
        skills: match.skills && match.skills.length > 0 ? match.skills : bundled.skills,
        featured: isNptelJava ? true : match.featured ?? bundled.featured,
        displayOrder: isNptelJava ? 0 : (bundled.displayOrder !== undefined ? bundled.displayOrder : match.displayOrder ?? 9999)
      };
      merged.push(enriched);
    } else {
      merged.push(bundled);
    }
  }

  // Append any custom admin-added certificates not in BUNDLED_CERTIFICATES
  for (const remote of remoteItems) {
    if (!usedRemoteIds.has(remote.id)) {
      const autoUrl = remote.credentialUrl || detectVerificationUrl(remote) || '';
      merged.push({
        ...remote,
        credentialUrl: autoUrl,
        verificationStatus: remote.verificationStatus || (autoUrl ? 'approved' : undefined)
      });
    }
  }

  return merged
    .filter(c => adminMode || c.published !== false)
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
};

export const initializeCertificatesInFirestore = async () => {
  try {
    const snap = await getDocs(certificatesRef);
    if (snap.empty) {
      if (!isUserAdmin(auth.currentUser)) return;
      for (const cert of BUNDLED_CERTIFICATES) {
        const { id, ...data } = cert;
        await setDoc(doc(db, 'certifications', id), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Automatically seeded bundled certificates into Firestore');
      return;
    }

    // If admin is logged in, automatically ensure the NPTEL #1 certificate is synced with the full original image & details
    if (isUserAdmin(auth.currentUser)) {
      const nptelCert = BUNDLED_CERTIFICATES[0];
      const { id, ...data } = nptelCert;
      await setDoc(doc(db, 'certifications', id), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Could not auto-seed certificates:', err);
  }
};

export const subscribeToCertificates = (callback: (items: PortfolioCertificate[]) => void, admin = false) => {
  const base = admin ? query(certificatesRef, orderBy('displayOrder', 'asc')) : query(certificatesRef, where('published', '==', true));
  return onSnapshot(
    base,
    snap => {
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate));
      callback(mergeWithBundledCertificates(remote, admin));
    },
    err => {
      console.error('Certificates listener:', err);
      callback(mergeWithBundledCertificates([], admin));
    }
  );
};

/**
 * Saves certificate metadata to Firestore.
 */
export const saveCertificate = async (data: Omit<PortfolioCertificate, 'id'>, id?: string): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in with an authorized administrator account.');
  }

  const cleanPayload = Object.fromEntries(
    Object.entries({
      ...data,
      updatedAt: new Date().toISOString()
    }).filter(([_, v]) => v !== undefined)
  );

  if (id) {
    await setDoc(doc(db, 'certifications', id), cleanPayload, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(certificatesRef, { ...cleanPayload, createdAt: new Date().toISOString() });
    return docRef.id;
  }
};

/**
 * Removes a certificate from Firestore and its associated file from Supabase if applicable.
 */
export const removeCertificate = async (item: PortfolioCertificate) => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in with an authorized administrator account.');
  }

  if (item.fileUrl && isSupabaseStoragePath(item.fileUrl)) {
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
    diagnostic.details = 'Authentication failed: User is not authorized as administrator.';
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
  await setDoc(
    doc(db, 'site_metadata', 'certificates'),
    {
      bundledImported: true,
      publicVisible: true,
      totalCatalogCount: BUNDLED_CERTIFICATES.length,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
};

export const subscribeToPublicCertificates = (
  callback: (items: PortfolioCertificate[], catalogImported: boolean) => void
) => {
  let remoteItems: PortfolioCertificate[] = [];
  let catalogImported = false;
  const emit = () => {
    const merged = mergeWithBundledCertificates(remoteItems, false);
    callback(merged, catalogImported);
  };

  const stopItems = onSnapshot(
    query(certificatesRef, where('published', '==', true)),
    snap => {
      remoteItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate));
      emit();
    },
    err => {
      console.error('Public certificates listener:', err);
      remoteItems = [];
      emit();
    }
  );

  const stopState = onSnapshot(
    doc(db, 'site_metadata', 'certificates'),
    snap => {
      catalogImported = snap.exists() && snap.data().bundledImported === true;
      emit();
    },
    err => {
      console.warn('Certificate catalog state unavailable:', err);
      catalogImported = false;
      emit();
    }
  );

  return () => {
    stopItems();
    stopState();
  };
};
