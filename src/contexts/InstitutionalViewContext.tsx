import { createContext, useContext, useState, type ReactNode } from 'react';

interface InstitutionalViewContextType {
  institutionalMode: boolean;
  toggleInstitutionalMode: () => void;
  /** Labels used across the platform — swap crypto jargon for enterprise language */
  labels: {
    staking: string;
    governance: string;
    wallet: string;
    token: string;
    onChain: string;
    proofChain: string;
    soulbound: string;
    dao: string;
    tvl: string;
    dapp: string;
  };
}

const STANDARD_LABELS = {
  staking: 'Staking',
  governance: 'Governance',
  wallet: 'Wallet',
  token: 'CMT Token',
  onChain: 'On-Chain',
  proofChain: 'Proof Chain',
  soulbound: 'Soulbound Badge',
  dao: 'DAO',
  tvl: 'TVL',
  dapp: 'DApp',
};

const ENTERPRISE_LABELS = {
  staking: 'Subscription Tier',
  governance: 'Board Voting',
  wallet: 'Account',
  token: 'Platform Credits',
  onChain: 'Verified',
  proofChain: 'Audit Trail',
  soulbound: 'Verification Certificate',
  dao: 'Governance Board',
  tvl: 'Assets Under Verification',
  dapp: 'Platform',
};

const InstitutionalViewContext = createContext<InstitutionalViewContextType>({
  institutionalMode: false,
  toggleInstitutionalMode: () => {},
  labels: STANDARD_LABELS,
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
    <InstitutionalViewContext.Provider value={{
      institutionalMode,
      toggleInstitutionalMode,
      labels: institutionalMode ? ENTERPRISE_LABELS : STANDARD_LABELS,
    }}>
      {children}
    </InstitutionalViewContext.Provider>
  );
}

export function useInstitutionalView() {
  return useContext(InstitutionalViewContext);
}
