import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app, db, auth, isUserAdmin } from './academicFirebase';
import type { PortfolioCertificate } from '../types/certificate';
const storage = getStorage(app);
const certificatesRef = collection(db, 'certifications');
export const subscribeToCertificates = (callback: (items: PortfolioCertificate[]) => void, admin = false) => { const base = admin ? query(certificatesRef, orderBy('displayOrder', 'asc')) : query(certificatesRef, where('published', '==', true)); return onSnapshot(base, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate))), err => { console.error('Certificates listener:', err); callback([]); }); };
export const saveCertificate = async (data: Omit<PortfolioCertificate, 'id'>, id?: string) => { if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.'); const payload = { ...data, updatedAt: new Date().toISOString() }; if (id) await updateDoc(doc(db, 'certifications', id), payload); else await addDoc(certificatesRef, { ...payload, createdAt: new Date().toISOString() }); };
export const removeCertificate = async (item: PortfolioCertificate) => { if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.'); await deleteDoc(doc(db, 'certifications', item.id)); if (item.fileUrl) { try { await deleteObject(ref(storage, item.fileUrl)); } catch { /* file may already be absent */ } } };
export const uploadCertificateFile = (file: File, onProgress: (value: number) => void) => new Promise<string>((resolve, reject) => { if (!isUserAdmin(auth.currentUser)) return reject(new Error('Admin access required.')); const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'); const task = uploadBytesResumable(ref(storage, `certifications/${Date.now()}-${safeName}`), file, { contentType: file.type }); task.on('state_changed', s => onProgress(Math.round(s.bytesTransferred / s.totalBytes * 100)), reject, async () => resolve(await getDownloadURL(task.snapshot.ref))); });

export const markBundledCertificatesImported = async () => { if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.'); await setDoc(doc(db, 'site_metadata', 'certificates'), { bundledImported: true, publicVisible: true, updatedAt: new Date().toISOString() }, { merge: true }); };

export const subscribeToPublicCertificates = (callback: (items: PortfolioCertificate[], catalogImported: boolean) => void) => {
  let items: PortfolioCertificate[] = [];
  let catalogImported = false;
  const emit = () => callback(items, catalogImported);
  const stopItems = onSnapshot(query(certificatesRef, where('published', '==', true)), snap => {
    items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioCertificate));
    emit();
  }, err => { console.error('Public certificates listener:', err); items = []; emit(); });
  const stopState = onSnapshot(doc(db, 'site_metadata', 'certificates'), snap => {
    catalogImported = snap.exists() && snap.data().bundledImported === true;
    emit();
  }, err => { console.warn('Certificate catalog state unavailable:', err); catalogImported = false; emit(); });
  return () => { stopItems(); stopState(); };
};
