import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SITE_CONFIG } from '../data/portfolio';
import { ACADEMIC_DATA, AcademicProfileData, UniversityRecord, SemesterResult, SchoolRecord } from '../data/education';


// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Use the databaseId provisioned in firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';
try {
  enableIndexedDbPersistence(db);
} catch (err: any) {
  console.warn('Firestore persistence not enabled:', err.code);
}

export const ADMIN_EMAIL = 'nitesh933438@gmail.com';

export const isUserAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export interface AuditRecordItem {
  id: string;
  fileName: string;
  semesterNumber: number;
  sgpa?: number;
  declarationDate: string;
  extractedData?: any;
  approvedBy: string;
  approvedAt: string;
  status: 'APPROVED' | 'REJECTED' | 'ROLLED_BACK';
}

/**
 * Initializes Firestore with the initial verified ACADEMIC_DATA if it doesn't already exist.
 */
export const initializeAcademicDataInFirestore = async () => {
  try {
    const universityDocRef = doc(db, 'academic_records', 'arka-jain-btech-cse');
    const existingSnap = await getDoc(universityDocRef);

    if (!existingSnap.exists()) {
      await setDoc(universityDocRef, {
        ...ACADEMIC_DATA.university,
        updatedAt: new Date().toISOString(),
      });
      console.log('Initialized university academic records in Firestore');
    }

    // Ensure school records exist
    for (const school of ACADEMIC_DATA.schooling) {
      const schoolDocRef = doc(db, 'academic_records', school.id);
      const schoolSnap = await getDoc(schoolDocRef);
      if (!schoolSnap.exists()) {
        await setDoc(schoolDocRef, {
          ...school,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.warn('Could not auto-seed Firestore academic records (offline or permission required):', error);
  }
};

/**
 * Real-time listener for university record in Firestore with local fallback.
 */
export const subscribeToSchoolRecords = (callback: (records: SchoolRecord[]) => void) => {
  const schoolsQuery = query(collection(db, 'academic_records'), where('type', '==', 'school'));
  return onSnapshot(schoolsQuery, (snapshot) => {
    const records = snapshot.docs.map((item) => item.data() as SchoolRecord);
    callback(records.length ? records.sort((a, b) => a.standard.localeCompare(b.standard)) : ACADEMIC_DATA.schooling);
  }, (error) => {
    console.warn('School records subscription fallback:', error.message);
    callback(ACADEMIC_DATA.schooling);
  });
};

export const subscribeToUniversityRecord = (
  callback: (data: UniversityRecord) => void
) => {
  const universityDocRef = doc(db, 'academic_records', 'arka-jain-btech-cse');

  const unsubscribe = onSnapshot(
    universityDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as UniversityRecord;
        callback(firestoreData);
      } else {
        callback(ACADEMIC_DATA.university);
      }
    },
    (error) => {
      console.warn('Firestore subscription fallback to local data:', error.message);
      callback(ACADEMIC_DATA.university);
    }
  );

  return unsubscribe;
};

/**
 * Fetch recent audit history records.
 */
export const fetchAuditHistory = async (): Promise<AuditRecordItem[]> => {
  try {
    const auditColRef = collection(db, 'academic_audit');
    const q = query(auditColRef, orderBy('approvedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as AuditRecordItem[];
  } catch (err) {
    console.warn('Could not fetch audit history:', err);
    return [];
  }
};

/**
 * Rollback a semester result to previous or upcoming state.
 */
export const rollbackSemesterResult = async (
  semesterNumber: number,
  adminEmail: string
) => {
  const universityDocRef = doc(db, 'academic_records', 'arka-jain-btech-cse');
  const snap = await getDoc(universityDocRef);
  if (!snap.exists()) return false;

  const currentUniversity = snap.data() as UniversityRecord;
  const updatedSemesters = currentUniversity.semesters.map((sem: SemesterResult) => {
    if (sem.semesterNumber === semesterNumber) {
      return {
        ...sem,
        isDeclared: false,
        status: 'UPCOMING' as const,
        statusLabel: 'Upcoming',
        sgpa: null,
        resultDeclarationDate: null,
      };
    }
    return sem;
  });

  await setDoc(universityDocRef, {
    ...currentUniversity,
    semesters: updatedSemesters,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // Log rollback event
  try {
    const auditColRef = collection(db, 'academic_audit');
    await addDoc(auditColRef, {
      fileName: `Rollback Semester ${semesterNumber}`,
      semesterNumber,
      approvedBy: adminEmail,
      approvedAt: new Date().toISOString(),
      status: 'ROLLED_BACK',
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error recording rollback audit:', err);
  }

  return true;
};

/**
 * Save an updated semester result into Firestore and record an audit log.
 */
export const publishSemesterResult = async (
  semesterData: SemesterResult,
  auditMetadata: {
    fileName: string;
    fileHash?: string;
    adminEmail: string;
    extractedData: any;
    officialCGPA?: number;
  }
) => {
  const universityDocRef = doc(db, 'academic_records', 'arka-jain-btech-cse');
  const snap = await getDoc(universityDocRef);
  
  const currentUniversity = snap.exists() 
    ? (snap.data() as UniversityRecord)
    : ACADEMIC_DATA.university;

  // Replace or update the specific semester
  const updatedSemesters = currentUniversity.semesters.map((sem: SemesterResult) => {
    if (sem.semesterNumber === semesterData.semesterNumber) {
      const isUpcoming = semesterData.status === 'UPCOMING';
      return {
        ...sem,
        ...semesterData,
        isDeclared: !isUpcoming,
        // Use null to explicitly clear SGPA and Date for upcoming semesters in Firestore
        sgpa: isUpcoming ? null : semesterData.sgpa,
        resultDeclarationDate: isUpcoming ? null : semesterData.resultDeclarationDate,
      };
    }
    return sem;
  });

  // Update highlights: remove old for this semester, add new, then sort by semester number
  let updatedHighlights = currentUniversity.highlights.filter((h: string) => !h.includes(`Semester ${semesterData.semesterNumber}`));
  
  if (semesterData.status !== 'UPCOMING') {
    updatedHighlights.push(
      `Semester ${semesterData.semesterNumber} SGPA: ${semesterData.sgpa?.toFixed(2)} (Declared ${semesterData.resultDeclarationDate || 'Recently'})`
    );
  }

  // Sort highlights by semester number
  updatedHighlights.sort((a, b) => {
    const semA = parseInt(a.match(/Semester (\d+)/)?.[1] || '0');
    const semB = parseInt(b.match(/Semester (\d+)/)?.[1] || '0');
    return semA - semB;
  });

  const updatePayload: any = {
    ...currentUniversity,
    semesters: updatedSemesters,
    highlights: updatedHighlights,
    updatedAt: new Date().toISOString(),
  };

  if (auditMetadata.officialCGPA !== undefined && auditMetadata.officialCGPA !== null) {
    updatePayload.cgpa = auditMetadata.officialCGPA;
  }

  await setDoc(universityDocRef, updatePayload);

  // Record audit history
  try {
    const auditColRef = collection(db, 'academic_audit');
    await addDoc(auditColRef, {
      fileName: auditMetadata.fileName,
      fileHash: auditMetadata.fileHash || 'direct-upload',
      semesterNumber: semesterData.semesterNumber,
      sgpa: semesterData.sgpa,
      declarationDate: semesterData.resultDeclarationDate || new Date().toLocaleDateString(),
      extractedData: auditMetadata.extractedData,
      approvedBy: auditMetadata.adminEmail,
      approvedAt: new Date().toISOString(),
      status: 'APPROVED',
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not write audit log:', err);
  }

  return true;
};

/**
 * Site Metadata & Configuration
 */

export interface SiteSettings {
  name: string;
  title: string;
  email: string;
  whatsapp: string;
  location: string;
  bio: string;
  profilePhoto: string;
  resumeUrl: string;
  github: string;
  linkedin: string;
  instagram: string;
  whatsappPrefilledMessage: string;
  emailPrefilledSubject: string;
  emailPrefilledBody: string;
  updatedAt?: string;
}

export const initializeSiteSettingsInFirestore = async () => {
  try {
    const configDocRef = doc(db, 'site_metadata', 'portfolio_config');
    const existingSnap = await getDoc(configDocRef);

    if (!existingSnap.exists()) {
      await setDoc(configDocRef, {
        ...SITE_CONFIG,
        updatedAt: new Date().toISOString(),
      });
      console.log('Initialized site settings in Firestore');
    } else {
      const data = existingSnap.data();
      if (!data.resumeUrl || data.resumeUrl.includes('nitesh_kumar_resume.pdf') || data.resumeUrl.includes('Resume_8ce55380.pdf')) {
        await setDoc(configDocRef, {
          ...data,
          resumeUrl: '/assets/aistudio/Nitesh_Kumar_-_Resume_8ce55380.pdf',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log('Updated resumeUrl in Firestore site settings');
      }
    }
  } catch (error) {
    console.warn('Could not auto-seed Firestore site settings:', error);
  }
};

export const subscribeToSiteSettings = (
  callback: (data: SiteSettings) => void
) => {
  const configDocRef = doc(db, 'site_metadata', 'portfolio_config');

  const unsubscribe = onSnapshot(
    configDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SiteSettings);
      } else {
        callback(SITE_CONFIG as SiteSettings);
      }
    },
    (error) => {
      console.warn('Firestore settings subscription fallback:', error.message);
      callback(SITE_CONFIG as SiteSettings);
    }
  );

  return unsubscribe;
};

