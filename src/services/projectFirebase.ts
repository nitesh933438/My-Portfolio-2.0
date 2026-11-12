import { collection, addDoc, updateDoc, setDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth, isUserAdmin } from './academicFirebase';
import { Project, ProjectScreenshot, PROJECTS } from '../data/portfolio';
import { getProjectScreenshotMetadata, isExcludedProjectScreenshot } from '../data/projectScreenshotCatalog';
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

  if (cleanPath.startsWith('uploads/')) {
    return `${prefix}${cleanPath}`;
  }

  if (cleanPath.startsWith('images/') || cleanPath.startsWith('assets/')) {
    return `${prefix}${cleanPath}`;
  }

  if (cleanPath.startsWith('projects/')) {
    return getStorageUrl(cleanPath);
  }

  return `${prefix}projects/${cleanPath}`;
};

export const projectsColRef = collection(db, 'projects');

const syncScreenshotTitlePrefix = (rawTitle: string, orderNum: number): string => {
  const clean = (rawTitle || '').replace(/^\d+\s*[–-]\s*/, '').trim();
  const prefix = String(orderNum).padStart(2, '0');
  return clean ? `${prefix} – ${clean}` : `${prefix} – Screenshot`;
};

export const mergeWithBundledProjects = (firestoreProjects: Project[]): Project[] => {
  const mergedList = firestoreProjects.map((fp) => {
    const bundled = PROJECTS.find(
      (bp) => bp.slug === fp.slug || bp.id === fp.id || bp.title.toLowerCase() === fp.title?.toLowerCase()
    );

    if (!bundled) {
      if (fp.screenshotMetadata && fp.screenshotMetadata.length > 0) {
        const synced = normalizeAndSyncScreenshots(fp.screenshotMetadata);
        return {
          ...fp,
          screenshotMetadata: synced.items,
          mainScreenshot: synced.mainScreenshot || fp.mainScreenshot,
          additionalScreenshots: synced.additionalScreenshots
        };
      }
      return fp;
    }

    const projectKey = bundled.slug || bundled.id;

    // If screenshotMetadata is already stored in Firestore, respect the admin's custom order, cover, & deletions
    if (fp.screenshotMetadata && fp.screenshotMetadata.length > 0) {
      const filteredMeta = fp.screenshotMetadata
        .filter((m) => Boolean(m.url) && !isExcludedProjectScreenshot(m.url))
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
        .map((m, idx) => {
          const info = getProjectScreenshotMetadata(projectKey, idx, m.url);
          const rawTitle =
            m.title && !m.title.includes('Application Screenshot')
              ? m.title
              : info.title;
          return {
            ...m,
            displayOrder: idx + 1,
            title: syncScreenshotTitlePrefix(rawTitle, idx + 1),
            category: m.category || info.category,
            caption:
              m.caption && !m.caption.includes('workflow screenshot view')
                ? m.caption
                : info.caption,
            altText: m.altText || syncScreenshotTitlePrefix(rawTitle, idx + 1),
            published: m.published !== false,
          };
        });

      const synced = normalizeAndSyncScreenshots(filteredMeta);
      return {
        ...bundled,
        ...fp,
        slug: fp.slug || bundled.slug,
        mainScreenshot: synced.mainScreenshot || fp.mainScreenshot || bundled.mainScreenshot,
        additionalScreenshots: synced.additionalScreenshots,
        screenshotMetadata: synced.items,
      };
    }

    // Legacy fallback when screenshotMetadata has not been initialized yet
    const currentAdd = (fp.additionalScreenshots || []).filter((url) => !isExcludedProjectScreenshot(url));
    const bundledAdd = (bundled.additionalScreenshots || []).filter((url) => url !== bundled.mainScreenshot);
    const isCustomExternalCover =
      fp.mainScreenshot &&
      !isExcludedProjectScreenshot(fp.mainScreenshot) &&
      !fp.mainScreenshot.includes('/images/projects/') &&
      !fp.mainScreenshot.includes('/images/banners/');
    const mergedMain = isCustomExternalCover ? fp.mainScreenshot : (bundled.mainScreenshot || fp.mainScreenshot);

    const customUploaded = currentAdd.filter(
      (url) =>
        url !== mergedMain &&
        !bundledAdd.includes(url) &&
        !url.includes('/images/projects/') &&
        !url.includes('/images/banners/')
    );
    const mergedAdditional = (bundledAdd.length > 0 ? [...bundledAdd, ...customUploaded] : currentAdd).filter(
      (url) => url !== mergedMain
    );

    return {
      ...bundled,
      ...fp,
      slug: fp.slug || bundled.slug,
      mainScreenshot: mergedMain,
      additionalScreenshots: mergedAdditional,
    };
  });

  return mergedList
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
    .map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
};

export const initializeProjectsInFirestore = async () => {
  try {
    const querySnapshot = await getDocs(projectsColRef);
    if (querySnapshot.empty) {
      for (let i = 0; i < PROJECTS.length; i++) {
        const proj = PROJECTS[i];
        const { id, ...data } = proj;
        await addDoc(projectsColRef, { ...data, displayOrder: i + 1 });
      }
      console.log('Initialized default projects in Firestore');
    }
  } catch (e) {
    console.warn('Could not auto-seed projects:', e);
  }
};

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  const q = query(projectsColRef, orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    if (projects.length === 0) {
      callback(PROJECTS.map((p, idx) => ({ ...p, displayOrder: idx + 1 })));
    } else {
      callback(mergeWithBundledProjects(projects));
    }
  }, (err) => {
    console.warn('Projects listener offline fallback:', err.message);
    callback(PROJECTS.map((p, idx) => ({ ...p, displayOrder: idx + 1 })));
  });
};

/**
 * Recalculates sequential display orders (1, 2, 3...) and syncs main & additional screenshots
 * along with their 01, 02, 03 title prefixes.
 */
export const normalizeAndSyncScreenshots = (screenshots: ProjectScreenshot[]) => {
  if (!screenshots || screenshots.length === 0) {
    return {
      items: [],
      mainScreenshot: '',
      additionalScreenshots: []
    };
  }

  // Preserve identity while re-assigning sequential 1-based display orders and synced title numbers
  const items = screenshots.map((item, idx) => ({
    ...item,
    displayOrder: idx + 1,
    title: syncScreenshotTitlePrefix(item.title, idx + 1),
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

export const saveProject = async (project: Omit<Project, 'id'>, id?: string): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');
  
  // If screenshotMetadata is present, sync mainScreenshot & additionalScreenshots
  let payload: any = { ...project, updatedAt: new Date().toISOString() };
  if (project.screenshotMetadata && project.screenshotMetadata.length > 0) {
    const synced = normalizeAndSyncScreenshots(project.screenshotMetadata);
    payload.screenshotMetadata = synced.items;
    payload.mainScreenshot = synced.mainScreenshot || project.mainScreenshot;
    payload.additionalScreenshots = synced.additionalScreenshots;
  }

  if (id) {
    await setDoc(doc(db, 'projects', id), payload, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(projectsColRef, { ...payload, createdAt: new Date().toISOString() });
    return docRef.id;
  }
};

/**
 * Automatically normalizes and persists sequential 1-based displayOrder (1, 2, 3... N)
 * across all projects in a single atomic Firestore writeBatch.
 */
export const reindexProjectsInFirestore = async (orderedProjects: Project[]) => {
  if (!isUserAdmin(auth.currentUser)) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  orderedProjects.forEach((p, idx) => {
    if (!p.id) return;
    batch.set(
      doc(db, 'projects', p.id),
      { displayOrder: idx + 1, updatedAt: now },
      { merge: true }
    );
  });

  await batch.commit();
};

export const saveProjectScreenshots = async (projectId: string, screenshots: ProjectScreenshot[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  const synced = normalizeAndSyncScreenshots(screenshots);

  await setDoc(
    doc(db, 'projects', projectId),
    {
      screenshotMetadata: synced.items,
      mainScreenshot: synced.mainScreenshot,
      additionalScreenshots: synced.additionalScreenshots,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
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

export const deleteProject = async (
  projectId: string,
  assetPaths: string[],
  allProjects: Project[] = [],
  remainingOrdered?: Project[]
) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  // Delete the Firestore record first. If this fails, leave all media untouched.
  await deleteDoc(doc(db, 'projects', projectId));

  if (remainingOrdered && remainingOrdered.length > 0) {
    await reindexProjectsInFirestore(remainingOrdered);
  }

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return;
  const uniquePaths = Array.from(new Set(assetPaths)).filter((assetPath) => {
    if (!assetPath || assetPath.startsWith('http') || assetPath.startsWith('data:') || assetPath.startsWith('blob:')) return false;
    if (!assetPath.includes('/')) return false;
    return !isScreenshotUrlInUse(assetPath, projectId, allProjects);
  });

  for (const assetPath of uniquePaths) {
    try {
      await deleteFileProxy(assetPath, idToken);
    } catch (error) {
      // A failed media cleanup must not undo the successful metadata deletion.
      console.warn('Project deleted, but an unused asset could not be removed:', assetPath, error);
    }
  }
};
