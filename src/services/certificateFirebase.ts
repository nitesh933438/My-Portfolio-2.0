import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app, db, auth, isUserAdmin } from './academicFirebase';
import type { PortfolioCertificate } from '../types/certificate';

export const storage = getStorage(app);
export const certificatesRef = collection(db, 'certifications');

export const getSafeCertificateContentType = (fileName: string, detectedType?: string): string => {
  if (detectedType && ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(detectedType)) {
    return detectedType;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

export const subscribeToCertificates = (callback: (items: PortfolioCertificate[]) => void, admin = false) => {
  const base = admin ? query(certificatesRef, orderBy('displayOrder', 'asc')) : query(certificatesRef, where('published', '==', true));
  return onSnapshot(base, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate))), err => {
    console.error('Certificates listener:', err);
    callback([]);
  });
};

export const saveCertificate = async (data: Omit<PortfolioCertificate, 'id'>, id?: string): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in as nitesh933438@gmail.com.');
  }
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (id) {
    await setDoc(doc(db, 'certifications', id), payload, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(certificatesRef, { ...payload, createdAt: new Date().toISOString() });
    return docRef.id;
  }
};

export const removeCertificate = async (item: PortfolioCertificate) => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in as nitesh933438@gmail.com.');
  }
  await deleteDoc(doc(db, 'certifications', item.id));
  if (item.fileUrl && item.fileUrl.includes('firebasestorage.googleapis.com')) {
    try {
      await deleteObject(ref(storage, item.fileUrl));
    } catch {
      /* file may already be absent or external */
    }
  }
};

/**
 * Uploads a local Blob directly using uploadBytes with strict timeout and error capture.
 * Perfect for bulk imports to prevent resumable upload connection hangs.
 */
export const uploadCertificateBlob = async (
  blob: Blob,
  fileName: string,
  timeoutMs = 35000
): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Admin access required. Please sign in as nitesh933438@gmail.com.');
  }
  const safeContentType = getSafeCertificateContentType(fileName, blob.type);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const storagePath = `certifications/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, storagePath);

  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Storage upload timed out for "${fileName}" after ${Math.round(timeoutMs / 1000)}s. Please check internet connection or Storage permissions.`));
    }, timeoutMs);
  });

  try {
    const uploadTask = uploadBytes(fileRef, blob, {
      contentType: safeContentType,
      customMetadata: {
        originalName: fileName,
        uploadedBy: auth.currentUser?.email || '',
        uploadedAt: new Date().toISOString()
      }
    });

    const snapshot = await Promise.race([uploadTask, timeoutPromise]);
    clearTimeout(timer);

    const downloadUrl = await Promise.race([getDownloadURL(snapshot.ref), timeoutPromise]);
    return downloadUrl;
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.code === 'storage/unauthorized') {
      throw new Error(`Firebase Storage permission denied for ${fileName}. Ensure nitesh933438@gmail.com is authorized.`);
    }
    if (err?.code === 'storage/quota-exceeded') {
      throw new Error(`Firebase Storage daily quota exceeded.`);
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
};

/**
 * Uploads a File using uploadBytesResumable with progress callback and timeout protection.
 * Fixes the unhandled promise rejection bug in task.on and adds settled guard.
 */
export const uploadCertificateFile = (
  file: File,
  onProgress?: (value: number) => void,
  timeoutMs = 45000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isUserAdmin(auth.currentUser)) {
      return reject(new Error('Admin access required. Please sign in as nitesh933438@gmail.com.'));
    }
    const safeContentType = getSafeCertificateContentType(file.name, file.type);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storagePath = `certifications/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, storagePath);

    let hasSettled = false;
    const timer = setTimeout(() => {
      if (!hasSettled) {
        hasSettled = true;
        reject(new Error(`Upload timed out for "${file.name}" after ${Math.round(timeoutMs / 1000)}s.`));
      }
    }, timeoutMs);

    const task = uploadBytesResumable(fileRef, file, { contentType: safeContentType });

    task.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      error => {
        clearTimeout(timer);
        if (!hasSettled) {
          hasSettled = true;
          if (error?.code === 'storage/unauthorized') {
            reject(new Error(`Storage permission denied for ${file.name}.`));
          } else {
            reject(error);
          }
        }
      },
      async () => {
        clearTimeout(timer);
        if (!hasSettled) {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            hasSettled = true;
            resolve(url);
          } catch (err) {
            hasSettled = true;
            reject(err);
          }
        }
      }
    );
  });
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

