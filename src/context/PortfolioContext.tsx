import React, { createContext, useContext } from 'react';
import { SiteSettings } from '../services/academicFirebase';
import { SITE_CONFIG } from '../data/portfolio';


interface PortfolioContextType {
  settings: SiteSettings;
}

const PortfolioContext = createContext<PortfolioContextType>({
  settings: SITE_CONFIG as SiteSettings,
});

export const PortfolioProvider: React.FC<{ settings: SiteSettings; children: React.ReactNode }> = ({ 
  settings, 
  children 
}) => {
  return (
    <PortfolioContext.Provider value={{ settings }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
