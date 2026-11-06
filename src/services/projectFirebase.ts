import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, isUserAdmin } from './academicFirebase';
import { Project } from '../data/portfolio';
import { getStorageUrl, deleteFileProxy } from './supabaseStorage';

export const resolveProjectImageUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  if (pathOrUrl.includes('/')) return getStorageUrl(pathOrUrl);
  
  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${prefix}projects/${pathOrUrl}`;
};

export const projectsColRef = collection(db, 'projects');

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

export const deleteProject = async (projectId: string, assetPaths: string[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  
  const idToken = await auth.currentUser?.getIdToken();
  if (idToken) {
    for (const path of assetPaths) {
      if (path && path.includes('/') && !path.startsWith('http')) {
        try {
          await deleteFileProxy(path, idToken);
        } catch (e) {
          console.warn('Could not delete Supabase project asset:', path, e);
        }
      }
    }
  }

  await deleteDoc(doc(db, 'projects', projectId));
};
