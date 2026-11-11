import React, { createContext, useContext, useState } from 'react';

interface AIResult {
  detectedModule: string;
  detectedType?: string;
  sourceFile?: File;
  data: any;
  confidence: number;
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
