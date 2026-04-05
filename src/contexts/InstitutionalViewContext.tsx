import { createContext, useContext, useState, type ReactNode } from 'react';

interface InstitutionalViewContextType {
  institutionalMode: boolean;
  toggleInstitutionalMode: () => void;
}

const InstitutionalViewContext = createContext<InstitutionalViewContextType>({
  institutionalMode: false,
  toggleInstitutionalMode: () => {},
});

export function InstitutionalViewProvider({ children }: { children: ReactNode }) {
  const [institutionalMode, setInstitutionalMode] = useState(() => {
    return localStorage.getItem('institutional-mode') === 'true';
  });

  const toggleInstitutionalMode = () => {
    setInstitutionalMode(prev => {
      const next = !prev;
      localStorage.setItem('institutional-mode', String(next));
      return next;
    });
  };

  return (
    <InstitutionalViewContext.Provider value={{ institutionalMode, toggleInstitutionalMode }}>
      {children}
    </InstitutionalViewContext.Provider>
  );
}

export function useInstitutionalView() {
  return useContext(InstitutionalViewContext);
}
