import { collection, addDoc, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth, isUserAdmin } from './academicFirebase';
import { uploadFileProxy, deleteFileProxy, getStorageUrl } from './supabaseStorage';
import type { PortfolioCertificate } from '../types/certificate';
import { BUNDLED_CERTIFICATES } from '../data/certificates';
import { detectVerificationUrl, isIndividualVerificationUrl } from './verificationDetection';

export const certificatesRef = collection(db, 'certifications');
const certExclusionsDocRef = doc(db, 'site_metadata', 'cert_exclusions');

const updateCertExclusion = async (certId: string, hide: boolean) => {
  try {
    const snap = await getDoc(certExclusionsDocRef);
    const existing: string[] = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
    const next = hide
      ? Array.from(new Set([...existing, certId]))
      : existing.filter((id) => id !== certId);
    await setDoc(certExclusionsDocRef, { hiddenIds: next, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not update certificate exclusion list:', err);
  }
};

/**
 * Checks whether a path refers to a Supabase Storage uploaded object
 * (which always has the format `certificates/1730000000000_filename.ext`).
 */
const isSupabaseStoragePath = (cleanPath: string): boolean => {
  if (cleanPath.startsWith('uploads/')) return false;
  return /^(certificates|projects|profile|resume|documents)\/\d{10,}_/.test(cleanPath);
};

/**
 * Resolves the final public URL for a certificate asset (image or PDF).
 * Properly handles full URLs, Supabase storage paths, and local static assets in `/public/certificates/`.
 */
export const resolveCertificateUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }

  let cleanPath = pathOrUrl.trim();
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (cleanPath.startsWith('uploads/')) {
    return `${prefix}${cleanPath}`;
  }

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
    if (
      lower.startsWith('data:image/') ||
      lower.startsWith('blob:') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
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

const normalizeText = (s?: string) =>
  (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getCertificateAssetKeys = (cert: Partial<PortfolioCertificate>): string[] => {
  const keys = new Set<string>();
  const rawCandidates = [cert.sourceAsset, cert.fileUrl, cert.imageUrl].filter(Boolean) as string[];
  for (const raw of rawCandidates) {
    const clean = raw.split('?')[0].split('#')[0].trim();
    if (!clean || clean.startsWith('data:') || clean.startsWith('blob:')) continue;
    let fileName = clean;
    try {
      fileName = decodeURIComponent(clean.split('/').pop() || clean);
    } catch {
      fileName = clean.split('/').pop() || clean;
    }
    const normalized = fileName.replace(/^\d{10,}_/, '').trim().toLowerCase();
    if (!normalized || normalized === 'diagnostic-test.jpg') continue;
    if (normalized.startsWith('nptel-programming-in-java')) {
      keys.add('nptel-programming-in-java');
    }
    keys.add(normalized);
  }
  return Array.from(keys);
};

export const matchesSameCertificate = (
  a: Partial<PortfolioCertificate>,
  b: Partial<PortfolioCertificate>
): boolean => {
  if (a.id && b.id && a.id === b.id) return true;

  const credIdA = normalizeText(a.credentialId);
  const credIdB = normalizeText(b.credentialId);
  if (credIdA.length >= 4 && credIdB.length >= 4 && credIdA === credIdB) {
    return true;
  }

  const urlA = normalizeText(a.credentialUrl).replace(/\/+$/, '');
  const urlB = normalizeText(b.credentialUrl).replace(/\/+$/, '');
  if (urlA.startsWith('https://') && urlB.startsWith('https://') && urlA === urlB) {
    return true;
  }

  const assetsA = getCertificateAssetKeys(a);
  const assetsB = getCertificateAssetKeys(b);
  if (assetsA.some((k) => assetsB.includes(k))) {
    return true;
  }

  const titleA = normalizeText(a.title);
  const titleB = normalizeText(b.title);
  if (titleA && titleB) {
    const issuerA = normalizeText(a.issuer);
    const issuerB = normalizeText(b.issuer);
    const sameIssuer =
      !issuerA ||
      !issuerB ||
      issuerA === issuerB ||
      issuerA.includes(issuerB) ||
      issuerB.includes(issuerA);

    if (titleA === titleB && sameIssuer) return true;

    if (
      titleA.includes('programming in java') &&
      titleB.includes('programming in java') &&
      (issuerA.includes('nptel') || issuerA.includes('iit') || issuerA.includes('kharagpur')) &&
      (issuerB.includes('nptel') || issuerB.includes('iit') || issuerB.includes('kharagpur'))
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Smartly merges remote Firestore records with `BUNDLED_CERTIFICATES` so that:
 * 1. All bundled certificates are enriched and deduplicated cleanly across ID, asset filename,
 *    credential ID, verification URL, and title+issuer — never creating "double" entries even
 *    if Firestore contains legacy duplicate documents.
 * 2. Missing or generic metadata fields on existing Firestore documents are automatically
 *    enriched from `BUNDLED_CERTIFICATES`.
 */
export const mergeWithBundledCertificates = (
  remoteItems: PortfolioCertificate[],
  adminMode = false
): PortfolioCertificate[] => {
  if (!remoteItems || remoteItems.length === 0) {
    return BUNDLED_CERTIFICATES
      .filter(c => adminMode || c.published)
      .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
      .map((c, idx) => ({ ...c, displayOrder: idx }));
  }

  const usedRemoteIds = new Set<string>();
  const merged: PortfolioCertificate[] = [];

  const pickBestRemote = (candidates: PortfolioCertificate[], preferredId: string): PortfolioCertificate => {
    const sorted = [...candidates].sort((a, b) => {
      if (a.id === preferredId && b.id !== preferredId) return -1;
      if (b.id === preferredId && a.id !== preferredId) return 1;
      const pubA = a.published !== false ? 1 : 0;
      const pubB = b.published !== false ? 1 : 0;
      if (pubA !== pubB) return pubB - pubA;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
    return sorted[0];
  };

  for (const bundled of BUNDLED_CERTIFICATES) {
    const matches = remoteItems.filter(r => matchesSameCertificate(r, bundled));

    if (matches.length > 0) {
      matches.forEach(m => usedRemoteIds.add(m.id));
      const activeMatches = matches.filter(m => (m as any).deleted !== true);
      if (activeMatches.length === 0) {
        continue;
      }

      const match = pickBestRemote(activeMatches, bundled.id);
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
        featured: match.featured !== undefined ? match.featured : (isNptelJava ? true : bundled.featured),
        displayOrder: match.displayOrder !== undefined ? match.displayOrder : (isNptelJava ? 0 : (bundled.displayOrder ?? 9999))
      };
      merged.push(enriched);
    } else {
      merged.push(bundled);
    }
  }

  // Append any custom admin-added certificates not in BUNDLED_CERTIFICATES, deduplicated strictly
  const customItems: PortfolioCertificate[] = [];
  for (const remote of remoteItems) {
    if (usedRemoteIds.has(remote.id) || (remote as any).deleted === true) continue;
    if (merged.some(existing => matchesSameCertificate(existing, remote))) continue;

    const existingCustomIdx = customItems.findIndex(existing => matchesSameCertificate(existing, remote));
    const autoUrl = remote.credentialUrl || detectVerificationUrl(remote) || '';
    const prepared: PortfolioCertificate = {
      ...remote,
      credentialUrl: autoUrl,
      verificationStatus: remote.verificationStatus || (autoUrl ? 'approved' : undefined)
    };

    if (existingCustomIdx >= 0) {
      const existing = customItems[existingCustomIdx];
      if ((prepared.updatedAt || '') > (existing.updatedAt || '')) {
        customItems[existingCustomIdx] = prepared;
      }
    } else {
      customItems.push(prepared);
    }
  }

  merged.push(...customItems);

  return merged
    .filter(c => adminMode || c.published !== false)
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
    .map((c, idx) => ({ ...c, displayOrder: idx }));
};

export const initializeCertificatesInFirestore = async () => {
  if (!isUserAdmin(auth.currentUser)) return;
  try {
    const snap = await getDocs(certificatesRef);
    if (snap.empty) {
      for (let i = 0; i < BUNDLED_CERTIFICATES.length; i++) {
        const cert = BUNDLED_CERTIFICATES[i];
        const { id, ...data } = cert;
        await setDoc(doc(db, 'certifications', id), {
          ...data,
          displayOrder: i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Automatically seeded bundled certificates into Firestore');
      return;
    }

    // If admin is logged in and NPTEL Java certificate is missing from Firestore, seed it once
    if (isUserAdmin(auth.currentUser)) {
      const nptelCert = BUNDLED_CERTIFICATES[0];
      const exists = snap.docs.some(d =>
        matchesSameCertificate({ id: d.id, ...d.data() } as PortfolioCertificate, nptelCert)
      );
      if (!exists) {
        const { id, ...data } = nptelCert;
        await setDoc(doc(db, 'certifications', id), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed certificates:', err);
  }
};

export const subscribeToCertificates = (callback: (items: PortfolioCertificate[]) => void, admin = false) => {
  const base = admin ? query(certificatesRef) : query(certificatesRef, where('published', '==', true));
  let latestRemote: PortfolioCertificate[] = [];
  let hiddenIds = new Set<string>();
  let hasRemoteSnapshot = false;

  const emitMerged = () => {
    const merged = mergeWithBundledCertificates(hasRemoteSnapshot ? latestRemote : [], admin);
    const filtered = admin ? merged : merged.filter((item) => !hiddenIds.has(item.id));
    callback(filtered.map((c, idx) => ({ ...c, displayOrder: idx })));
  };

  const unsubExclusions = onSnapshot(
    certExclusionsDocRef,
    (snap) => {
      const ids = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
      hiddenIds = new Set(ids);
      emitMerged();
    },
    () => {
      // Ignore exclusion listener error
    }
  );

  const unsubCerts = onSnapshot(
    base,
    (snap) => {
      hasRemoteSnapshot = true;
      latestRemote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioCertificate));
      emitMerged();
    },
    (err) => {
      console.error('Certificates listener:', err);
      hasRemoteSnapshot = false;
      emitMerged();
    }
  );

  return () => {
    unsubExclusions();
    unsubCerts();
  };
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
      deleted: false,
      updatedAt: new Date().toISOString()
    }).filter(([_, v]) => v !== undefined)
  );

  if (id) {
    await setDoc(doc(db, 'certifications', id), cleanPayload, { merge: true });
    const isBundled = BUNDLED_CERTIFICATES.some((b) => b.id === id);
    if (isBundled) {
      await updateCertExclusion(id, data.published === false);
    }
    return id;
  } else {
    const docRef = await addDoc(certificatesRef, { ...cleanPayload, createdAt: new Date().toISOString() });
    return docRef.id;
  }
};

/**
 * Automatically normalizes and persists sequential 0-based displayOrder (0, 1, 2... N-1)
 * for all certificates in a single atomic Firestore writeBatch so UI stays instant.
 */
export const reindexCertificatesInFirestore = async (orderedItems: PortfolioCertificate[]) => {
  if (!isUserAdmin(auth.currentUser)) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  orderedItems.forEach((item, idx) => {
    if (!item.id) return;
    const { id, ...data } = item;
    const cleanPayload = Object.fromEntries(
      Object.entries({
        ...data,
        displayOrder: idx,
        deleted: false,
        updatedAt: now
      }).filter(([_, v]) => v !== undefined)
    );
    batch.set(doc(db, 'certifications', id), cleanPayload, { merge: true });
  });

  await batch.commit();
};

/**
 * Removes a certificate from Firestore and its associated file from storage if applicable,
 * then automatically re-indexes remaining certificates so serial numbers stay contiguous.
 */
export const removeCertificate = async (
  item: PortfolioCertificate,
  remainingOrdered?: PortfolioCertificate[]
) => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in with an authorized administrator account.');
  }

  if (
    item.fileUrl &&
    (isSupabaseStoragePath(item.fileUrl) || item.fileUrl.startsWith('/uploads/') || item.fileUrl.startsWith('uploads/'))
  ) {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) await deleteFileProxy(item.fileUrl, idToken);
    } catch (e) {
      console.warn('Could not delete certificate asset:', e);
    }
  }

  const isBundled = BUNDLED_CERTIFICATES.some(b => b.id === item.id);
  if (isBundled) {
    await setDoc(
      doc(db, 'certifications', item.id),
      { deleted: true, published: false, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    await updateCertExclusion(item.id, true);
  } else {
    await deleteDoc(doc(db, 'certifications', item.id));
  }

  if (remainingOrdered && remainingOrdered.length > 0) {
    await reindexCertificatesInFirestore(remainingOrdered);
  }
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
  let hiddenIds = new Set<string>();
  let catalogImported = false;
  let hasRemoteSnapshot = false;

  const emit = () => {
    const merged = mergeWithBundledCertificates(hasRemoteSnapshot ? remoteItems : [], false);
    const filtered = merged.filter((item) => !hiddenIds.has(item.id));
    callback(
      filtered.map((c, idx) => ({ ...c, displayOrder: idx })),
      catalogImported
    );
  };

  const stopExclusions = onSnapshot(
    certExclusionsDocRef,
    (snap) => {
      const ids = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
      hiddenIds = new Set(ids);
      emit();
    },
    () => {
      // Ignore exclusion listener errors
    }
  );

  const stopItems = onSnapshot(
    query(certificatesRef, where('published', '==', true)),
    snap => {
      hasRemoteSnapshot = true;
      remoteItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate));
      emit();
    },
    err => {
      console.error('Public certificates listener:', err);
      hasRemoteSnapshot = false;
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
    stopExclusions();
    stopItems();
    stopState();
  };
};

/**
 * Cleans up duplicate Firestore documents in `certifications` (preserving one canonical
 * record per certificate with the best/newest metadata) and normalizes displayOrder.
 */
export const cleanupDuplicateCertificatesInFirestore = async (): Promise<{
  duplicatesRemoved: number;
  totalRemaining: number;
}> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required.');
  }

  const snap = await getDocs(certificatesRef);
  if (snap.empty) {
    return { duplicatesRemoved: 0, totalRemaining: 0 };
  }

  const rawDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioCertificate));
  const consumedIds = new Set<string>();
  const toDeleteIds = new Set<string>();
  const updates: { id: string; payload: Record<string, any> }[] = [];

  const sortPreferred = (list: PortfolioCertificate[], preferredId?: string) =>
    [...list].sort((a, b) => {
      if (preferredId) {
        if (a.id === preferredId && b.id !== preferredId) return -1;
        if (b.id === preferredId && a.id !== preferredId) return 1;
      }
      const delA = (a as any).deleted === true ? 1 : 0;
      const delB = (b as any).deleted === true ? 1 : 0;
      if (delA !== delB) return delA - delB;
      const pubA = a.published !== false ? 1 : 0;
      const pubB = b.published !== false ? 1 : 0;
      if (pubA !== pubB) return pubB - pubA;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

  // 1. Deduplicate matches for each bundled certificate
  for (const bundled of BUNDLED_CERTIFICATES) {
    const matches = rawDocs.filter((r) => !consumedIds.has(r.id) && matchesSameCertificate(r, bundled));
    if (matches.length === 0) continue;
    matches.forEach((m) => consumedIds.add(m.id));
    if (matches.length === 1) continue;

    const sorted = sortPreferred(matches, bundled.id);
    const keeper = sorted[0];
    const duplicates = sorted.slice(1);

    const bestNonDeleted = sortPreferred(matches.filter((m) => (m as any).deleted !== true))[0];
    if (bestNonDeleted && bestNonDeleted.id !== keeper.id) {
      const { id: _dropId, ...rest } = bestNonDeleted;
      const cleanMerge = Object.fromEntries(
        Object.entries({
          ...rest,
          updatedAt: new Date().toISOString()
        }).filter(([_, v]) => v !== undefined)
      );
      updates.push({ id: keeper.id, payload: cleanMerge });
    }

    duplicates.forEach((dup) => toDeleteIds.add(dup.id));
  }

  // 2. Deduplicate remaining custom documents against each other
  const remaining = rawDocs.filter((r) => !consumedIds.has(r.id));
  const customGroups: PortfolioCertificate[][] = [];
  for (const docItem of remaining) {
    const group = customGroups.find((g) => matchesSameCertificate(g[0], docItem));
    if (group) {
      group.push(docItem);
    } else {
      customGroups.push([docItem]);
    }
  }

  for (const group of customGroups) {
    if (group.length <= 1) continue;
    const sorted = sortPreferred(group);
    sorted.slice(1).forEach((dup) => toDeleteIds.add(dup.id));
  }

  if (toDeleteIds.size === 0 && updates.length === 0) {
    return { duplicatesRemoved: 0, totalRemaining: rawDocs.length };
  }

  const ops: Array<{ type: 'set' | 'delete'; id: string; payload?: Record<string, any> }> = [
    ...updates.map((u) => ({ type: 'set' as const, id: u.id, payload: u.payload })),
    ...Array.from(toDeleteIds).map((id) => ({ type: 'delete' as const, id }))
  ];

  const CHUNK_SIZE = 400;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + CHUNK_SIZE)) {
      const ref = doc(db, 'certifications', op.id);
      if (op.type === 'delete') {
        batch.delete(ref);
      } else if (op.payload) {
        batch.set(ref, op.payload, { merge: true });
      }
    }
    await batch.commit();
  }

  return {
    duplicatesRemoved: toDeleteIds.size,
    totalRemaining: rawDocs.length - toDeleteIds.size
  };
};
