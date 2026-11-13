import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth, isUserAdmin } from './academicFirebase';
import { EXPERIENCE_DATA, SKILLS_DATA, Experience, SkillCategory } from '../data/portfolio';

const contentRef = (id: 'skills' | 'experience') =>
  doc(db, 'site_metadata', id === 'skills' ? 'skills_content' : 'experience_content');

export const subscribeToSkills = (callback: (items: SkillCategory[]) => void) =>
  onSnapshot(contentRef('skills'), (snapshot) => {
    const items = snapshot.exists() ? snapshot.data().items : null;
    callback(Array.isArray(items) ? items as SkillCategory[] : SKILLS_DATA);
  }, (error) => {
    console.warn('Skills subscription fallback:', error.message);
    callback(SKILLS_DATA);
  });

export const saveSkills = async (items: SkillCategory[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.');
  await setDoc(contentRef('skills'), { items, updatedAt: new Date().toISOString() }, { merge: true });
};

export const subscribeToExperience = (callback: (items: Experience[]) => void) =>
  onSnapshot(contentRef('experience'), (snapshot) => {
    const items = snapshot.exists() ? snapshot.data().items : null;
    callback(Array.isArray(items) ? items as Experience[] : EXPERIENCE_DATA);
  }, (error) => {
    console.warn('Experience subscription fallback:', error.message);
    callback(EXPERIENCE_DATA);
  });

export const saveExperience = async (items: Experience[]) => {
  if (!isUserAdmin(auth.currentUser)) throw new Error('Admin access required.');
  await setDoc(contentRef('experience'), { items, updatedAt: new Date().toISOString() }, { merge: true });
};
