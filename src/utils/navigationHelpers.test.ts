import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePortfolioSectionTarget,
  readModalStack,
  pushModalToStack,
  removeModalFromStack,
  isModalInStack,
  inferFileExtension,
  buildSafeDownloadFilename,
} from './navigationHelpers';

test('parsePortfolioSectionTarget resolves query params, state, pathnames, and hashes deterministically', () => {
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/', search: '?section=certifications' }),
    'certifications'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/', state: { scrollTo: 'projects' } }),
    'projects'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/certifications' }),
    'certifications'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/', hash: '#/?section=certifications' }),
    'certifications'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/', hash: '#/projects' }),
    'projects'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/', hash: '#about' }),
    'about'
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/' }),
    ''
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/admin', state: { scrollTo: 'admin' } }),
    ''
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/verify/NPTEL123', hash: '#/verify/NPTEL123' }),
    ''
  );
  assert.equal(
    parsePortfolioSectionTarget({ pathname: '/resume', hash: '#/resume' }),
    ''
  );
});

test('modal stack helpers preserve LIFO order and safely parse arbitrary history states', () => {
  assert.deepEqual(readModalStack(null), []);
  assert.deepEqual(readModalStack({ foo: 'bar' }), []);
  assert.deepEqual(readModalStack({ __modalStack: ['project-modal', 123, 'image-viewer'] }), [
    'project-modal',
    'image-viewer',
  ]);

  const stack1 = pushModalToStack([], 'project-modal');
  assert.deepEqual(stack1, ['project-modal']);

  const stack2 = pushModalToStack(stack1, 'image-viewer');
  assert.deepEqual(stack2, ['project-modal', 'image-viewer']);
  assert.equal(isModalInStack({ __modalStack: stack2 }, 'image-viewer'), true);
  assert.equal(isModalInStack({ __modalStack: stack2 }, 'project-modal'), true);

  // Deduplicates re-pushing the same ID to the top
  assert.deepEqual(pushModalToStack(stack2, 'project-modal'), ['image-viewer', 'project-modal']);

  // Popping topmost preserves underlying modal
  const afterPop = removeModalFromStack(stack2, 'image-viewer');
  assert.deepEqual(afterPop, ['project-modal']);
  assert.equal(isModalInStack({ __modalStack: afterPop }, 'image-viewer'), false);
  assert.equal(isModalInStack({ __modalStack: afterPop }, 'project-modal'), true);
});

test('inferFileExtension and buildSafeDownloadFilename detect PDF/images cleanly', () => {
  assert.equal(inferFileExtension('/certificates/nptel-java.pdf?v=2#page=1'), 'pdf');
  assert.equal(inferFileExtension('/certificates/azure-900.jpeg'), 'jpg');
  assert.equal(inferFileExtension('/assets/resume.PNG'), 'png');
  assert.equal(inferFileExtension('data:image/webp;base64,AAA'), 'webp');
  assert.equal(inferFileExtension('data:application/pdf;base64,AAA'), 'pdf');

  assert.equal(
    buildSafeDownloadFilename('NPTEL: Programming in Java (Elite)!', '/certificates/nptel.pdf'),
    'NPTEL_Programming_in_Java_Elite.pdf'
  );
  assert.equal(
    buildSafeDownloadFilename('Money Details Screenshot 01', '/images/projects/money-details/01.png'),
    'Money_Details_Screenshot_01.png'
  );
});
