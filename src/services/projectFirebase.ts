import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, isUserAdmin } from './academicFirebase';
import { Project, ProjectScreenshot } from '../data/portfolio';
import { getStorageUrl, deleteFileProxy } from './supabaseStorage';

export const resolveProjectImageUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  
  let cleanPath = pathOrUrl;
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (cleanPath.startsWith('images/') || cleanPath.startsWith('assets/')) {
    return `${prefix}${cleanPath}`;
  }

  if (cleanPath.startsWith('projects/')) {
    return getStorageUrl(cleanPath);
  }

  return `${prefix}projects/${cleanPath}`;
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

/**
 * Recalculates sequential display orders (1, 2, 3...) and syncs main & additional screenshots.
 */
export const normalizeAndSyncScreenshots = (screenshots: ProjectScreenshot[]) => {
  if (!screenshots || screenshots.length === 0) {
    return {
      items: [],
      mainScreenshot: '',
      additionalScreenshots: []
    };
  }

  // Preserve identity while re-assigning sequential 1-based display orders
  const items = screenshots.map((item, idx) => ({
    ...item,
    displayOrder: idx + 1,
    published: item.published !== false
  }));

  // Ensure cover selection
  let coverItem = items.find(i => i.isCover);
  if (!coverItem) {
    coverItem = items[0];
    items[0].isCover = true;
  }

  // Set all other items' isCover to false
  items.forEach(i => {
    if (i.id !== coverItem?.id) {
      i.isCover = false;
    }
  });

  const mainScreenshot = coverItem.url;
  const additionalScreenshots = items
    .filter(i => i.id !== coverItem?.id && i.published)
    .map(i => i.url);

  return {
    items,
    mainScreenshot,
    additionalScreenshots
  };
};

export const saveProject = async (project: Omit<Project, 'id'>, id?: string) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  
  // If screenshotMetadata is present, sync mainScreenshot & additionalScreenshots
  let payload: any = { ...project };
  if (project.screenshotMetadata && project.screenshotMetadata.length > 0) {
    const synced = normalizeAndSyncScreenshots(project.screenshotMetadata);
    payload.screenshotMetadata = synced.items;
    payload.mainScreenshot = synced.mainScreenshot || project.mainScreenshot;
    payload.additionalScreenshots = synced.additionalScreenshots;
  }

  if (id) {
    await updateDoc(doc(db, 'projects', id), payload);
  } else {
    await addDoc(projectsColRef, payload);
  }
};

export const saveProjectScreenshots = async (projectId: string, screenshots: ProjectScreenshot[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  const synced = normalizeAndSyncScreenshots(screenshots);

  await updateDoc(doc(db, 'projects', projectId), {
    screenshotMetadata: synced.items,
    mainScreenshot: synced.mainScreenshot,
    additionalScreenshots: synced.additionalScreenshots,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Safely checks if a file URL is in use elsewhere before deleting from storage
 */
export const isScreenshotUrlInUse = (url: string, currentProjectId: string, allProjects: Project[]): boolean => {
  if (!url) return false;

  for (const proj of allProjects) {
    if (proj.id === currentProjectId) continue;

    if (proj.mainScreenshot === url) return true;
    if (proj.additionalScreenshots?.includes(url)) return true;
    if (proj.screenshotMetadata?.some(s => s.url === url)) return true;
  }

  return false;
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
