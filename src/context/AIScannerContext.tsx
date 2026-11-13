import React, { createContext, useContext, useState } from 'react';
import type { ScanAction } from '../utils/scannerDecisions';

export interface AIResult {
  detectedModule: string;
  detectedType?: string;
  sourceFile?: File;
  data: any;
  confidence: number;
  action?: ScanAction;
  matchedId?: string;
  matchedLabel?: string;
  reason?: string;
}

interface AIScannerContextType {
  pendingResult: AIResult | null;
  setPendingResult: (result: AIResult | null) => void;
}

const AIScannerContext = createContext<AIScannerContextType>({
  pendingResult: null,
  setPendingResult: () => {},
});

export const AIScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingResult, setPendingResult] = useState<AIResult | null>(null);

  return (
    <AIScannerContext.Provider value={{ pendingResult, setPendingResult }}>
      {children}
    </AIScannerContext.Provider>
  );
};

export const useAIScanner = () => useContext(AIScannerContext);
