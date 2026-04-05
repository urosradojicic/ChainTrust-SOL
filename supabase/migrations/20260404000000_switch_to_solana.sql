-- Switch default blockchain from Ethereum/Sepolia to Solana Devnet
ALTER TABLE public.startups ALTER COLUMN blockchain SET DEFAULT 'Solana';

-- Update any existing startups that still reference old defaults
UPDATE public.startups SET blockchain = 'Solana' WHERE blockchain IN ('Base Sepolia', 'Sepolia', 'Base');
