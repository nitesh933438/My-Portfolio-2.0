import { Project, ProjectScreenshot, PROJECTS } from '../data/portfolio';
import { getProjectScreenshotMetadata, isExcludedProjectScreenshot } from '../data/projectScreenshotCatalog';

export const isUploadedStoragePath = (pathOrUrl?: string): boolean => {
  if (!pathOrUrl) return false;
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return false;
  }
  const clean = pathOrUrl.replace(/^\.?\//, '');
  if (clean.startsWith('uploads/')) return true;
  return /^(certificates|projects|profile|resume|documents)\/\d{10,}_/.test(clean);
};

export const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
};

const normalizeText = (s?: string): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeSlug = (s?: string): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeUrl = (u?: string): string =>
  (u || '')
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '');

export const matchesSameProject = (
  a: Partial<Project>,
  b: Partial<Project>
): boolean => {
  if (a.id && b.id && a.id === b.id) return true;

  const slugA = normalizeSlug(a.slug || a.title);
  const slugB = normalizeSlug(b.slug || b.title);
  if (slugA && slugB && slugA === slugB) return true;

  const titleA = normalizeText(a.title);
  const titleB = normalizeText(b.title);
  if (titleA && titleB && titleA === titleB) return true;

  const ghA = normalizeUrl(a.githubUrl);
  const ghB = normalizeUrl(b.githubUrl);
  if (ghA.startsWith('http') && ghB.startsWith('http') && ghA === ghB) return true;

  const demoA = normalizeUrl(a.liveDemoUrl);
  const demoB = normalizeUrl(b.liveDemoUrl);
  if (demoA.startsWith('http') && demoB.startsWith('http') && demoA === demoB) return true;

  return false;
};

export const syncScreenshotTitlePrefix = (rawTitle: string, orderNum: number): string => {
  const clean = (rawTitle || '').replace(/^\d+\s*[–-]\s*/, '').trim();
  const prefix = String(orderNum).padStart(2, '0');
  return clean ? `${prefix} – ${clean}` : `${prefix} – Screenshot`;
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

  const items = screenshots.map((item, idx) => ({
    ...item,
    displayOrder: idx + 1,
    title: syncScreenshotTitlePrefix(item.title, idx + 1),
    published: item.published !== false
  }));

  let coverItem = items.find((i) => i.isCover);
  if (!coverItem) {
    coverItem = items[0];
    items[0].isCover = true;
  }

  items.forEach((i) => {
    i.isCover = i.id === coverItem?.id;
  });

  const mainScreenshot = coverItem.url;
  const additionalScreenshots = items
    .filter((i) => i.id !== coverItem?.id && i.published)
    .map((i) => i.url);

  return {
    items,
    mainScreenshot,
    additionalScreenshots
  };
};

export const pickBestRemoteProject = (candidates: Project[], preferredId?: string): Project => {
  const sorted = [...candidates].sort((a, b) => {
    if (preferredId) {
      if (a.id === preferredId && b.id !== preferredId) return -1;
      if (b.id === preferredId && a.id !== preferredId) return 1;
    }
    const delA = (a as any).deleted === true ? 1 : 0;
    const delB = (b as any).deleted === true ? 1 : 0;
    if (delA !== delB) return delA - delB;

    const metaLenA = a.screenshotMetadata?.length || 0;
    const metaLenB = b.screenshotMetadata?.length || 0;
    if (metaLenA !== metaLenB) return metaLenB - metaLenA;

    const updA = ((a as any).updatedAt || '') as string;
    const updB = ((b as any).updatedAt || '') as string;
    return updB.localeCompare(updA);
  });
  return sorted[0];
};

export const enrichRemoteProjectWithBundled = (fp: Project, bundled: Project): Project => {
  const projectKey = bundled.slug || bundled.id;

  if (fp.screenshotMetadata && fp.screenshotMetadata.length > 0) {
    const seenUrls = new Set<string>();
    const filteredMeta = fp.screenshotMetadata
      .filter((m) => {
        if (!m.url || isExcludedProjectScreenshot(m.url)) return false;
        const norm = m.url.trim();
        if (seenUrls.has(norm)) return false;
        seenUrls.add(norm);
        return true;
      })
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
      techStack: fp.techStack && fp.techStack.length > 0 ? fp.techStack : bundled.techStack,
      keyFeatures: fp.keyFeatures && fp.keyFeatures.length > 0 ? fp.keyFeatures : bundled.keyFeatures,
      mainScreenshot: synced.mainScreenshot || fp.mainScreenshot || bundled.mainScreenshot,
      additionalScreenshots: synced.additionalScreenshots,
      screenshotMetadata: synced.items,
    };
  }

  const currentAdd = (fp.additionalScreenshots || []).filter((url) => Boolean(url) && !isExcludedProjectScreenshot(url));
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
  const mergedAdditional = Array.from(
    new Set(
      (bundledAdd.length > 0 ? [...bundledAdd, ...customUploaded] : currentAdd).filter(
        (url) => url !== mergedMain
      )
    )
  );

  return {
    ...bundled,
    ...fp,
    slug: fp.slug || bundled.slug,
    techStack: fp.techStack && fp.techStack.length > 0 ? fp.techStack : bundled.techStack,
    keyFeatures: fp.keyFeatures && fp.keyFeatures.length > 0 ? fp.keyFeatures : bundled.keyFeatures,
    mainScreenshot: mergedMain,
    additionalScreenshots: mergedAdditional,
  };
};

export const mergeWithBundledProjects = (
  firestoreProjects: Project[],
  hiddenIds: Set<string> = new Set(),
  bundledList: Project[] = PROJECTS
): Project[] => {
  if (!firestoreProjects || firestoreProjects.length === 0) {
    return bundledList
      .filter((p) => !hiddenIds.has(p.id) && !hiddenIds.has(p.slug))
      .map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
  }

  const usedRemoteIds = new Set<string>();
  const merged: Project[] = [];

  for (const bundled of bundledList) {
    const matches = firestoreProjects.filter((fp) => matchesSameProject(fp, bundled));
    const isExcluded = hiddenIds.has(bundled.id) || hiddenIds.has(bundled.slug);

    if (matches.length > 0) {
      matches.forEach((m) => usedRemoteIds.add(m.id));
      const activeMatches = matches.filter((m) => (m as any).deleted !== true);
      if (isExcluded || activeMatches.length === 0) {
        continue;
      }
      const best = pickBestRemoteProject(activeMatches, bundled.id);
      merged.push(enrichRemoteProjectWithBundled(best, bundled));
    } else if (!isExcluded) {
      merged.push(bundled);
    }
  }

  const customProjects: Project[] = [];
  for (const remote of firestoreProjects) {
    if (usedRemoteIds.has(remote.id) || (remote as any).deleted === true) continue;
    if (hiddenIds.has(remote.id) || (remote.slug && hiddenIds.has(remote.slug))) continue;
    if (merged.some((existing) => matchesSameProject(existing, remote))) continue;

    let prepared = remote;
    if (remote.screenshotMetadata && remote.screenshotMetadata.length > 0) {
      const synced = normalizeAndSyncScreenshots(
        remote.screenshotMetadata.filter((m) => Boolean(m.url) && !isExcludedProjectScreenshot(m.url))
      );
      prepared = {
        ...remote,
        screenshotMetadata: synced.items,
        mainScreenshot: synced.mainScreenshot || remote.mainScreenshot,
        additionalScreenshots: synced.additionalScreenshots,
      };
    }

    const existingIdx = customProjects.findIndex((existing) => matchesSameProject(existing, prepared));
    if (existingIdx >= 0) {
      customProjects[existingIdx] = pickBestRemoteProject([customProjects[existingIdx], prepared]);
    } else {
      customProjects.push(prepared);
    }
  }

  merged.push(...customProjects);

  return merged
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
    .map((p, idx) => ({ ...p, displayOrder: idx + 1 }));
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
    if (proj.screenshotMetadata?.some((s) => s.url === url)) return true;
  }

  return false;
};
