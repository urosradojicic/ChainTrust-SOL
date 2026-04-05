/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SOLANA_PROGRAM_ID?: string;
  readonly VITE_SOLANA_CLUSTER?: 'devnet' | 'mainnet-beta';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
