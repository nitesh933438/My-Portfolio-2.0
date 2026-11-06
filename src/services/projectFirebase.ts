import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, isUserAdmin } from './academicFirebase';
import { Project } from '../data/portfolio';

const storage = getStorage();
const projectsColRef = collection(db, 'projects');

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  const q = query(projectsColRef, orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    callback(projects);
  }, (err) => {
    console.warn('Projects listener offline fallback:', err.message);
    callback([]);
  });
};

export const saveProject = async (project: Omit<Project, 'id'>, id?: string) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  
  if (id) {
    await updateDoc(doc(db, 'projects', id), { ...project });
  } else {
    await addDoc(projectsColRef, { ...project });
  }
};

export const deleteProject = async (projectId: string, imageUrls: string[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  
  // Delete images from storage
  for (const url of imageUrls) {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (e) {
      console.error('Error deleting image:', e);
    }
  }
  
  await deleteDoc(doc(db, 'projects', projectId));
};

export const uploadProjectImage = async (file: File): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};
