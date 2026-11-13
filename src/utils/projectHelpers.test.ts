import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isUploadedStoragePath,
  matchesSameProject,
  mergeWithBundledProjects,
  normalizeAndSyncScreenshots,
  isScreenshotUrlInUse,
  stripUndefined
} from './projectHelpers';
import { PROJECTS, Project } from '../data/portfolio';

test('matchesSameProject matches across id, slug, normalized title, and URLs', () => {
  assert.equal(matchesSameProject({ id: 'abc', title: 'Alpha' }, { id: 'abc', title: 'Beta' }), true);
  assert.equal(
    matchesSameProject({ slug: 'money-details', title: 'X' }, { title: 'Money Details' }),
    true
  );
  assert.equal(
    matchesSameProject(
      { title: '  My  Cool  App ' },
      { title: 'my cool app' }
    ),
    true
  );
  assert.equal(
    matchesSameProject(
      { githubUrl: 'https://github.com/user/repo/' },
      { githubUrl: 'https://github.com/user/repo' }
    ),
    true
  );
  assert.equal(
    matchesSameProject({ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }),
    false
  );
});

test('mergeWithBundledProjects eliminates duplicate Firestore docs and preserves unseeded bundled projects', () => {
  const firstBundled = PROJECTS[0];
  const duplicateCopy: Project = {
    ...firstBundled,
    id: 'random_firestore_doc_999',
    shortDescription: 'Edited copy',
    displayOrder: 1
  };
  const deletedCopy: Project = {
    ...firstBundled,
    id: 'random_deleted_copy',
    deleted: true
  } as Project;

  const merged = mergeWithBundledProjects([duplicateCopy, deletedCopy]);
  const matchesForFirst = merged.filter((p) => matchesSameProject(p, firstBundled));

  assert.equal(matchesForFirst.length, 1);
  assert.equal(matchesForFirst[0].shortDescription, 'Edited copy');
  assert.equal(merged.length, PROJECTS.length);
});

test('mergeWithBundledProjects respects hiddenIds exclusions and appends deduplicated custom projects', () => {
  const firstBundled = PROJECTS[0];
  const hidden = new Set([firstBundled.id]);

  const customA: Project = {
    id: 'custom_1',
    slug: 'custom-one',
    title: 'Custom One',
    category: firstBundled.category,
    shortDescription: 'First custom',
    detailedDescription: 'Desc',
    techStack: ['React'],
    mainScreenshot: '/images/banners/custom.jpg',
    additionalScreenshots: [],
    githubUrl: 'https://github.com/example/custom-one',
    liveDemoUrl: 'https://custom-one.example.com',
    featured: false,
    keyFeatures: ['Feature A'],
    status: 'Completed',
    displayOrder: 50
  };
  const customDup: Project = {
    ...customA,
    id: 'custom_1_dup',
    shortDescription: 'Duplicate custom'
  };

  const merged = mergeWithBundledProjects([customA, customDup], hidden);

  assert.equal(merged.some((p) => matchesSameProject(p, firstBundled)), false);
  const customMatches = merged.filter((p) => matchesSameProject(p, customA));
  assert.equal(customMatches.length, 1);
  assert.equal(merged.length, PROJECTS.length - 1 + 1);
});

test('normalizeAndSyncScreenshots enforces sequential order, prefixes, single cover, and published filter', () => {
  const result = normalizeAndSyncScreenshots([
    { id: '1', url: '/a.jpg', title: '09 – First Shot', displayOrder: 9, published: true, isCover: false },
    { id: '2', url: '/b.jpg', title: 'Cover Shot', displayOrder: 2, published: true, isCover: true },
    { id: '3', url: '/c.jpg', title: 'Draft Shot', displayOrder: 3, published: false, isCover: false }
  ]);

  assert.equal(result.mainScreenshot, '/b.jpg');
  assert.deepEqual(result.additionalScreenshots, ['/a.jpg']);
  assert.equal(result.items[0].title, '01 – First Shot');
  assert.equal(result.items[1].title, '02 – Cover Shot');
  assert.equal(result.items[1].isCover, true);
  assert.equal(result.items.filter((i) => i.isCover).length, 1);
});

test('isUploadedStoragePath distinguishes uploaded paths from static assets and external URLs', () => {
  assert.equal(isUploadedStoragePath('projects/1712345678901_shot.png'), true);
  assert.equal(isUploadedStoragePath('/uploads/1712345678901_shot.png'), true);
  assert.equal(isUploadedStoragePath('/images/banners/money_details_banner.jpg'), false);
  assert.equal(isUploadedStoragePath('/images/projects/money-details/1.jpg'), false);
  assert.equal(isUploadedStoragePath('https://example.com/img.png'), false);
  assert.equal(isUploadedStoragePath('data:image/jpeg;base64,abc'), false);
  assert.equal(isUploadedStoragePath('blob:http://localhost:3000/123'), false);
});

test('isScreenshotUrlInUse detects shared URLs across other projects', () => {
  const p1 = { ...PROJECTS[0], mainScreenshot: '/shared.jpg' };
  const p2 = { ...PROJECTS[1], mainScreenshot: '/other.jpg', additionalScreenshots: ['/shared.jpg'] };
  assert.equal(isScreenshotUrlInUse('/shared.jpg', p1.id, [p1, p2]), true);
  assert.equal(isScreenshotUrlInUse('/unique.jpg', p1.id, [p1, p2]), false);
});

test('stripUndefined recursively removes undefined keys without mutating arrays', () => {
  const cleaned = stripUndefined({ a: 1, b: undefined, nested: { x: 'ok', y: undefined } });
  assert.deepEqual(cleaned, { a: 1, nested: { x: 'ok' } });
  assert.equal('b' in cleaned, false);
});
