import React, { createContext, useContext } from 'react';
import { SiteSettings } from '../services/academicFirebase';
import { ACADEMIC_DATA, UniversityRecord, SchoolRecord } from '../data/education';
import {
  SITE_CONFIG,
  PROJECTS,
  SKILLS_DATA,
  EXPERIENCE_DATA,
  Project,
  SkillCategory,
  Experience,
} from '../data/portfolio';
import { BUNDLED_CERTIFICATES } from '../data/certificates';
import type { PortfolioCertificate } from '../types/certificate';

interface PortfolioContextType {
  settings: SiteSettings;
  university: UniversityRecord;
  schooling: SchoolRecord[];
  projects: Project[];
  certificates: PortfolioCertificate[];
  skills: SkillCategory[];
  experience: Experience[];
}

const PortfolioContext = createContext<PortfolioContextType>({
  settings: SITE_CONFIG as SiteSettings,
  university: ACADEMIC_DATA.university,
  schooling: ACADEMIC_DATA.schooling,
  projects: PROJECTS,
  certificates: BUNDLED_CERTIFICATES.filter((c) => c.published !== false),
  skills: SKILLS_DATA,
  experience: EXPERIENCE_DATA,
});

interface PortfolioProviderProps {
  settings: SiteSettings;
  university?: UniversityRecord;
  schooling?: SchoolRecord[];
  projects?: Project[];
  certificates?: PortfolioCertificate[];
  skills?: SkillCategory[];
  experience?: Experience[];
  children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({
  settings,
  university = ACADEMIC_DATA.university,
  schooling = ACADEMIC_DATA.schooling,
  projects = PROJECTS,
  certificates = BUNDLED_CERTIFICATES.filter((c) => c.published !== false),
  skills = SKILLS_DATA,
  experience = EXPERIENCE_DATA,
  children,
}) => {
  return (
    <PortfolioContext.Provider
      value={{
        settings,
        university,
        schooling,
        projects,
        certificates,
        skills,
        experience,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
