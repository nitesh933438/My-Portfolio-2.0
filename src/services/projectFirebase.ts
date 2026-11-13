import { collection, addDoc, deleteDoc, doc, getDoc, onSnapshot, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth, isUserAdmin } from './academicFirebase';
import { Project, ProjectScreenshot, PROJECTS } from '../data/portfolio';
import { isExcludedProjectScreenshot } from '../data/projectScreenshotCatalog';
import { getStorageUrl, deleteFileProxy } from './supabaseStorage';
import {
  isUploadedStoragePath,
  stripUndefined,
  matchesSameProject,
  normalizeAndSyncScreenshots,
  pickBestRemoteProject,
  mergeWithBundledProjects,
  isScreenshotUrlInUse
} from '../utils/projectHelpers';

export {
  isUploadedStoragePath,
  matchesSameProject,
  normalizeAndSyncScreenshots,
  mergeWithBundledProjects,
  isScreenshotUrlInUse
};

export const projectsColRef = collection(db, 'projects');
const projectExclusionsDocRef = doc(db, 'site_metadata', 'project_exclusions');

export const resolveProjectImageUrl = (pathOrUrl: string): string => {
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

  const baseUrl = import.meta.env?.BASE_URL || '/';
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

const updateProjectExclusion = async (idsToChange: string[], hide: boolean) => {
  const validIds = Array.from(new Set(idsToChange.filter(Boolean)));
  if (validIds.length === 0) return;
  try {
    const snap = await getDoc(projectExclusionsDocRef);
    const existing: string[] = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
    const next = hide
      ? Array.from(new Set([...existing, ...validIds]))
      : existing.filter((id) => !validIds.includes(id));
    await setDoc(projectExclusionsDocRef, { hiddenIds: next, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not update project exclusion list:', err);
  }
};

export const getHiddenProjectIds = async (): Promise<Set<string>> => {
  try {
    const snap = await getDoc(projectExclusionsDocRef);
    const ids = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
};

let projectSeedPromise: Promise<void> | null = null;

export const initializeProjectsInFirestore = async () => {
  if (!isUserAdmin(auth.currentUser)) return;
  if (projectSeedPromise) return projectSeedPromise;

  projectSeedPromise = (async () => {
    try {
      const [querySnapshot, hiddenIds] = await Promise.all([
        getDocs(projectsColRef),
        getHiddenProjectIds()
      ]);

      const existingProjects = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      const now = new Date().toISOString();

      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        PROJECTS.forEach((proj, idx) => {
          if (hiddenIds.has(proj.id) || hiddenIds.has(proj.slug)) return;
          const { id, ...data } = proj;
          batch.set(
            doc(db, 'projects', id),
            stripUndefined({ ...data, slug: proj.slug || id, displayOrder: idx + 1, deleted: false, createdAt: now, updatedAt: now }),
            { merge: true }
          );
        });
        await batch.commit();
        console.log('Initialized default projects in Firestore');
        return;
      }

      // Ensure no missing un-excluded bundled projects exist if partial seed occurred earlier
      const batch = writeBatch(db);
      let missingCount = 0;
      PROJECTS.forEach((proj, idx) => {
        if (hiddenIds.has(proj.id) || hiddenIds.has(proj.slug)) return;
        const alreadyPresent = existingProjects.some((ep) => matchesSameProject(ep, proj));
        if (!alreadyPresent) {
          const { id, ...data } = proj;
          batch.set(
            doc(db, 'projects', id),
            stripUndefined({
              ...data,
              slug: proj.slug || id,
              displayOrder: existingProjects.length + missingCount + idx + 1,
              deleted: false,
              createdAt: now,
              updatedAt: now
            }),
            { merge: true }
          );
          missingCount += 1;
        }
      });
      if (missingCount > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn('Could not auto-seed projects:', e);
    } finally {
      projectSeedPromise = null;
    }
  })();

  return projectSeedPromise;
};

export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  let latestRemote: Project[] = [];
  let hiddenIds = new Set<string>();
  let hasRemoteSnapshot = false;

  const emitMerged = () => {
    const result = hasRemoteSnapshot
      ? mergeWithBundledProjects(latestRemote, hiddenIds)
      : PROJECTS
          .filter((p) => !hiddenIds.has(p.id) && !hiddenIds.has(p.slug))
          .map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
    callback(result);
  };

  const unsubExclusions = onSnapshot(
    projectExclusionsDocRef,
    (snap) => {
      const ids = snap.exists() && Array.isArray(snap.data().hiddenIds) ? snap.data().hiddenIds : [];
      hiddenIds = new Set(ids);
      emitMerged();
    },
    () => {
      // Ignore exclusion read errors
    }
  );

  // Query whole collection and sort client-side so docs missing displayOrder are never silently dropped
  const unsubProjects = onSnapshot(
    projectsColRef,
    (snapshot) => {
      hasRemoteSnapshot = true;
      latestRemote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      emitMerged();
    },
    (err) => {
      console.warn('Projects listener offline fallback:', err.message);
      hasRemoteSnapshot = false;
      emitMerged();
    }
  );

  return () => {
    unsubExclusions();
    unsubProjects();
  };
};



export const saveProject = async (project: Omit<Project, 'id'>, id?: string): Promise<string> => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  const now = new Date().toISOString();
  const payload: Record<string, any> = {
    ...project,
    deleted: false,
    updatedAt: now
  };

  const trimmedMain = (project.mainScreenshot || '').trim();
  const existingMeta = Array.isArray(project.screenshotMetadata) ? [...project.screenshotMetadata] : [];

  if (existingMeta.length > 0) {
    let workingMeta = existingMeta;

    if (trimmedMain) {
      const currentCover = workingMeta.find((s) => s.isCover) || workingMeta[0];
      if (!currentCover || currentCover.url !== trimmedMain) {
        const existingMatchIdx = workingMeta.findIndex((s) => s.url === trimmedMain);
        if (existingMatchIdx >= 0) {
          const matched = { ...workingMeta[existingMatchIdx], isCover: true, published: true };
          const others = workingMeta
            .filter((_, idx) => idx !== existingMatchIdx)
            .map((s) => ({ ...s, isCover: false }));
          workingMeta = [matched, ...others];
        } else {
          const others = workingMeta.map((s) => ({ ...s, isCover: false }));
          const newCover: ProjectScreenshot = {
            id: `scr_cover_${Date.now()}`,
            url: trimmedMain,
            title: `${project.title || 'Project'} – Poster Cover`,
            category: 'Poster Cover',
            caption: 'Official project poster cover and primary showcase image.',
            altText: `${project.title || 'Project'} Poster Cover`,
            displayOrder: 1,
            published: true,
            isCover: true,
            createdAt: now,
            updatedAt: now
          };
          workingMeta = [newCover, ...others];
        }
      }
    }

    const synced = normalizeAndSyncScreenshots(workingMeta);
    payload.screenshotMetadata = synced.items;
    payload.mainScreenshot = synced.mainScreenshot || trimmedMain;
    payload.additionalScreenshots = synced.additionalScreenshots;
  }

  const cleanPayload = stripUndefined(payload);
  const exclusionsToRemove = [id, project.slug].filter(Boolean) as string[];
  if (exclusionsToRemove.length > 0) {
    await updateProjectExclusion(exclusionsToRemove, false);
  }

  if (id) {
    await setDoc(doc(db, 'projects', id), cleanPayload, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(projectsColRef, { ...cleanPayload, createdAt: now });
    return docRef.id;
  }
};

/**
 * Automatically normalizes and persists sequential 1-based displayOrder (1, 2, 3... N)
 * across all projects in a single atomic Firestore writeBatch.
 */
export const reindexProjectsInFirestore = async (orderedProjects: Project[]) => {
  if (!isUserAdmin(auth.currentUser)) return;
  const CHUNK_SIZE = 400;
  const now = new Date().toISOString();

  for (let i = 0; i < orderedProjects.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    orderedProjects.slice(i, i + CHUNK_SIZE).forEach((p, offset) => {
      if (!p.id) return;
      const { id, ...data } = p;
      batch.set(
        doc(db, 'projects', id),
        stripUndefined({
          ...data,
          displayOrder: i + offset + 1,
          deleted: false,
          updatedAt: now
        }),
        { merge: true }
      );
    });
    await batch.commit();
  }
};

export const saveProjectScreenshots = async (projectId: string, screenshots: ProjectScreenshot[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  const synced = normalizeAndSyncScreenshots(screenshots);
  const payload = stripUndefined({
    screenshotMetadata: synced.items,
    mainScreenshot: synced.mainScreenshot,
    additionalScreenshots: synced.additionalScreenshots,
    deleted: false,
    updatedAt: new Date().toISOString()
  });

  await setDoc(doc(db, 'projects', projectId), payload, { merge: true });
};



export const deleteProject = async (
  projectId: string,
  assetPaths: string[],
  allProjects: Project[] = [],
  remainingOrdered?: Project[]
) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Unauthorized');

  const target = allProjects.find((p) => p.id === projectId);
  const matchedBundled = PROJECTS.find(
    (bp) => bp.id === projectId || (target && matchesSameProject(bp, target))
  );

  // Also delete any duplicate Firestore docs matching this project so none can resurface
  const snap = await getDocs(projectsColRef);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'projects', projectId));

  snap.docs.forEach((d) => {
    if (d.id === projectId) return;
    const data = { id: d.id, ...d.data() } as Project;
    if (
      (target && matchesSameProject(data, target)) ||
      (matchedBundled && matchesSameProject(data, matchedBundled))
    ) {
      batch.delete(doc(db, 'projects', d.id));
    }
  });
  await batch.commit();

  if (matchedBundled) {
    await updateProjectExclusion([projectId, matchedBundled.id, matchedBundled.slug], true);
  }

  if (remainingOrdered && remainingOrdered.length > 0) {
    await reindexProjectsInFirestore(remainingOrdered);
  }

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) return;

  const uniquePaths = Array.from(new Set(assetPaths)).filter((assetPath) => {
    if (!isUploadedStoragePath(assetPath)) return false;
    return !isScreenshotUrlInUse(assetPath, projectId, allProjects);
  });

  for (const assetPath of uniquePaths) {
    try {
      await deleteFileProxy(assetPath, idToken);
    } catch (error) {
      console.warn('Project deleted, but an unused asset could not be removed:', assetPath, error);
    }
  }
};

/**
 * Cleans up duplicate Firestore documents in `projects` (preserving one canonical
 * record per project with the richest/newest metadata) and deletes duplicate docs.
 */
export const cleanupDuplicateProjectsInFirestore = async (): Promise<{
  duplicatesRemoved: number;
  totalRemaining: number;
}> => {
  if (!isUserAdmin(auth.currentUser)) {
    throw new Error('Unauthorized');
  }

  const snap = await getDocs(projectsColRef);
  if (snap.empty) {
    return { duplicatesRemoved: 0, totalRemaining: 0 };
  }

  const rawDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
  const consumedIds = new Set<string>();
  const toDeleteIds = new Set<string>();
  const updates: { id: string; payload: Record<string, any> }[] = [];

  // 1. Deduplicate matches for each bundled project
  for (const bundled of PROJECTS) {
    const matches = rawDocs.filter((r) => !consumedIds.has(r.id) && matchesSameProject(r, bundled));
    if (matches.length === 0) continue;
    matches.forEach((m) => consumedIds.add(m.id));
    if (matches.length === 1) continue;

    const keeper = pickBestRemoteProject(matches, bundled.id);
    const duplicates = matches.filter((m) => m.id !== keeper.id);

    const bestNonDeleted = pickBestRemoteProject(matches.filter((m) => (m as any).deleted !== true));
    if (bestNonDeleted && bestNonDeleted.id !== keeper.id) {
      const { id: _dropId, ...rest } = bestNonDeleted;
      updates.push({
        id: keeper.id,
        payload: stripUndefined({ ...rest, deleted: false, updatedAt: new Date().toISOString() })
      });
    }

    duplicates.forEach((dup) => toDeleteIds.add(dup.id));
  }

  // 2. Deduplicate remaining custom projects against each other
  const remaining = rawDocs.filter((r) => !consumedIds.has(r.id));
  const customGroups: Project[][] = [];
  for (const docItem of remaining) {
    const group = customGroups.find((g) => matchesSameProject(g[0], docItem));
    if (group) {
      group.push(docItem);
    } else {
      customGroups.push([docItem]);
    }
  }

  for (const group of customGroups) {
    if (group.length <= 1) continue;
    const keeper = pickBestRemoteProject(group);
    group.filter((m) => m.id !== keeper.id).forEach((dup) => toDeleteIds.add(dup.id));
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
      const ref = doc(db, 'projects', op.id);
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

