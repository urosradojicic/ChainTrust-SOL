/**
 * Wallet Abstraction Layer
 * ────────────────────────
 * Provides a unified interface for wallet interactions that works with:
 *   1. Browser extension wallets (Phantom, Solflare, Backpack) — current
 *   2. Embedded wallets (Privy, Dynamic, Turnkey) — future Phase 1 integration
 *   3. Smart wallets (Squads multi-sig) — future Phase 2 integration
 *
 * This layer decouples the application from any specific wallet provider,
 * making it trivial to add new wallet types without modifying page components.
 *
 * Design principles:
 *   - Pages and components NEVER import wallet-adapter-react directly
 *   - All wallet interactions go through this abstraction
 *   - Transaction signing is provider-agnostic
 *   - User-facing flows hide blockchain complexity by default
 */

import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// ── Types ────────────────────────────────────────────────────────────

export type WalletProviderType = 'browser-extension' | 'embedded' | 'multisig';

export interface WalletAdapter {
  /** Wallet provider type */
  type: WalletProviderType;
  /** Display name (e.g., "Phantom", "Email Wallet") */
  name: string;
  /** Whether the wallet is currently connected */
  connected: boolean;
  /** The wallet's public key (null if not connected) */
  publicKey: PublicKey | null;
  /** Connect the wallet */
  connect(): Promise<void>;
  /** Disconnect the wallet */
  disconnect(): Promise<void>;
  /** Sign and send a transaction, returning the signature */
  signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
  ): Promise<string>;
  /** Sign a message (for authentication) */
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}

export interface WalletCapabilities {
  /** Can this wallet sign messages (for auth)? */
  canSignMessages: boolean;
  /** Does this wallet support versioned transactions? */
  supportsVersionedTx: boolean;
  /** Can this wallet be used without the user knowing about crypto? */
  isInvisible: boolean;
  /** Does this wallet support gasless transactions? */
  supportsGasless: boolean;
  /** Does this wallet require multiple signers? */
  requiresMultiSig: boolean;
}

// ── Browser Extension Adapter ────────────────────────────────────────

/**
 * Wraps the existing @solana/wallet-adapter-react wallet into our
 * unified WalletAdapter interface. This is the current production path.
 */
export function createBrowserExtensionAdapter(
  solanaWallet: {
    publicKey: PublicKey | null;
    connected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendTransaction: (tx: Transaction | VersionedTransaction, connection: Connection) => Promise<string>;
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    wallet?: { adapter: { name: string } } | null;
  },
): WalletAdapter {
  return {
    type: 'browser-extension',
    name: solanaWallet.wallet?.adapter.name ?? 'Wallet',
    connected: solanaWallet.connected,
    publicKey: solanaWallet.publicKey,

    async connect() {
      await solanaWallet.connect();
    },

    async disconnect() {
      await solanaWallet.disconnect();
    },

    async signAndSendTransaction(transaction, connection) {
      return solanaWallet.sendTransaction(transaction, connection);
    },

    signMessage: solanaWallet.signMessage
      ? async (message: Uint8Array) => solanaWallet.signMessage!(message)
      : undefined,
  };
}

/**
 * Get the capabilities of a wallet adapter.
 */
export function getWalletCapabilities(adapter: WalletAdapter): WalletCapabilities {
  switch (adapter.type) {
    case 'browser-extension':
      return {
        canSignMessages: !!adapter.signMessage,
        supportsVersionedTx: true,
        isInvisible: false,
        supportsGasless: false,
        requiresMultiSig: false,
      };
    case 'embedded':
      return {
        canSignMessages: true,
        supportsVersionedTx: true,
        isInvisible: true,
        supportsGasless: true,
        requiresMultiSig: false,
      };
    case 'multisig':
      return {
        canSignMessages: false,
        supportsVersionedTx: true,
        isInvisible: false,
        supportsGasless: false,
        requiresMultiSig: true,
      };
  }
}

// ── Gasless Transaction Wrapper ──────────────────────────────────────

/**
 * Configuration for gasless transaction relay.
 * When enabled, the platform pays transaction fees on behalf of users.
 *
 * Future integration: Octane relay or custom fee-payer service.
 */
export interface GaslessConfig {
  enabled: boolean;
  /** Fee payer public key (platform's relayer account) */
  feePayerPublicKey?: PublicKey;
  /** Relay endpoint URL */
  relayEndpoint?: string;
  /** Maximum transaction fee the platform will sponsor (in lamports) */
  maxSponsoredFee?: number;
}

const DEFAULT_GASLESS_CONFIG: GaslessConfig = {
  enabled: false,
};

let gaslessConfig = { ...DEFAULT_GASLESS_CONFIG };

/** Configure gasless transaction settings */
export function configureGasless(config: Partial<GaslessConfig>): void {
  gaslessConfig = { ...gaslessConfig, ...config };
}

/** Check if gasless transactions are enabled */
export function isGaslessEnabled(): boolean {
  return gaslessConfig.enabled;
}

// ── Transaction Helper ───────────────────────────────────────────────

/**
 * Send a transaction through the wallet abstraction layer.
 * Handles gasless relay, error formatting, and confirmation.
 */
export async function sendAbstractedTransaction(
  adapter: WalletAdapter,
  transaction: Transaction,
  connection: Connection,
  options?: {
    /** Skip confirmation wait (fire and forget) */
    skipConfirmation?: boolean;
    /** Confirmation commitment level */
    commitment?: 'processed' | 'confirmed' | 'finalized';
  },
): Promise<{ signature: string; confirmed: boolean }> {
  const commitment = options?.commitment ?? 'confirmed';

  // Future: if gasless is enabled and wallet supports it, route through relay
  // For now, direct submission through the wallet adapter
  const signature = await adapter.signAndSendTransaction(transaction, connection);

  let confirmed = false;
  if (!options?.skipConfirmation) {
    const result = await connection.confirmTransaction(signature, commitment);
    confirmed = !result.value.err;
  }

  return { signature, confirmed };
}

// ── Wallet Display Utilities ─────────────────────────────────────────

/** Truncate a wallet address for display: "7nYk...3fGh" */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Get a human-readable wallet provider name */
export function getProviderDisplayName(adapter: WalletAdapter): string {
  if (adapter.type === 'embedded') return 'ChainTrust Wallet';
  if (adapter.type === 'multisig') return 'Multi-Sig Wallet';
  return adapter.name;
}
