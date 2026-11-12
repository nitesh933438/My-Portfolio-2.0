import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
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

  if (cleanPath.startsWith('images/') || cleanPath.startsWith('assets/')) {
    return `${prefix}${cleanPath}`;
  }

  if (cleanPath.startsWith('projects/')) {
    return getStorageUrl(cleanPath);
  }

  return `${prefix}projects/${cleanPath}`;
};

export const projectsColRef = collection(db, 'projects');

export const mergeWithBundledProjects = (firestoreProjects: Project[]): Project[] => {
  return firestoreProjects.map((fp) => {
    const bundled = PROJECTS.find(
      (bp) => bp.slug === fp.slug || bp.id === fp.id || bp.title.toLowerCase() === fp.title?.toLowerCase()
    );

    if (!bundled) {
      return fp;
    }

    const projectKey = bundled.slug || bundled.id;
    const currentAdd = (fp.additionalScreenshots || []).filter((url) => !isExcludedProjectScreenshot(url));
    const bundledAdd = (bundled.additionalScreenshots || []).filter((url) => url !== bundled.mainScreenshot);

    // Always prefer the official bundled Poster Cover unless admin uploaded a custom external/Supabase cover
    const isCustomExternalCover =
      fp.mainScreenshot &&
      !isExcludedProjectScreenshot(fp.mainScreenshot) &&
      !fp.mainScreenshot.includes('/images/projects/') &&
      !fp.mainScreenshot.includes('/images/banners/');
    const mergedMain = isCustomExternalCover ? fp.mainScreenshot : (bundled.mainScreenshot || fp.mainScreenshot);
    const mainChanged = fp.mainScreenshot !== mergedMain;

    // Check if any bundled screenshot is missing or if excluded screenshot was present or order changed
    const hasExcluded = (fp.additionalScreenshots || []).some((url) => isExcludedProjectScreenshot(url));
    const missingBundled = bundledAdd.some((bUrl) => !currentAdd.includes(bUrl));
    const orderChanged =
      bundledAdd.length > 0 &&
      (currentAdd.length !== bundledAdd.length || currentAdd[0] !== bundledAdd[0]);

    // Preserve any custom Supabase uploaded screenshots added by admin while keeping bundled screenshots in canonical order
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

    // Full ordered list: #01 is ALWAYS mergedMain (Poster Cover), followed by #02..#N mergedAdditional
    const fullOrderedUrls = Array.from(new Set([mergedMain, ...mergedAdditional].filter(Boolean)));

    let mergedMetadata = fp.screenshotMetadata;
    if (mergedMetadata && mergedMetadata.length > 0) {
      const filteredMeta = mergedMetadata.filter((m) => !isExcludedProjectScreenshot(m.url));
      const metaByUrl = new Map<string, ProjectScreenshot>();
      filteredMeta.forEach((m) => {
        if (!metaByUrl.has(m.url)) {
          metaByUrl.set(m.url, m);
        }
      });

      mergedMetadata = fullOrderedUrls.map((url, idx) => {
        const existing = metaByUrl.get(url);
        const info = getProjectScreenshotMetadata(projectKey, idx, url);
        return {
          id: existing?.id || `scr_sync_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          url,
          title: info.title,
          category: info.category,
          caption:
            existing?.caption && !existing.caption.includes('workflow screenshot view')
              ? existing.caption
              : info.caption,
          altText: existing?.altText || info.title,
          displayOrder: idx + 1,
          published: existing ? existing.published !== false : true,
          isCover: idx === 0,
        };
      });
    }

    const updatedProject: Project = {
      ...bundled,
      ...fp,
      slug: bundled.slug,
      mainScreenshot: mergedMain,
      additionalScreenshots: mergedAdditional,
      screenshotMetadata: mergedMetadata,
    };

    if ((mainChanged || hasExcluded || missingBundled || orderChanged) && isUserAdmin(auth.currentUser) && fp.id) {
      updateDoc(doc(db, 'projects', fp.id), {
        mainScreenshot: mergedMain,
        additionalScreenshots: mergedAdditional,
        ...(mergedMetadata ? { screenshotMetadata: mergedMetadata } : {}),
      }).catch(() => {});
    }

    return updatedProject;
  });
};

export const initializeProjectsInFirestore = async () => {
  try {
    const querySnapshot = await getDocs(projectsColRef);
    if (querySnapshot.empty) {
      for (const proj of PROJECTS) {
        const { id, ...data } = proj;
        await addDoc(projectsColRef, data);
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
      callback(PROJECTS);
    } else {
      callback(mergeWithBundledProjects(projects));
    }
  }, (err) => {
    console.warn('Projects listener offline fallback:', err.message);
    callback(PROJECTS);
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

export const deleteProject = async (projectId: string, assetPaths: string[], allProjects: Project[] = []) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  // Delete the Firestore record first. If this fails, leave all media untouched.
  await deleteDoc(doc(db, 'projects', projectId));

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
      console.warn('Project deleted, but an unused Supabase asset could not be removed:', assetPath, error);
    }
  }
};
