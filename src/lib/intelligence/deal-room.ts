/**
 * Deal Room / Data Room System
 * ────────────────────────────
 * Manages secure document sharing for investment due diligence.
 * Each startup gets a deal room with access-controlled folders,
 * activity tracking, and document hash verification.
 *
 * In production, documents would be stored on IPFS/Arweave with
 * SHA-256 hashes on Solana for tamper-proof provenance.
 * This module provides the client-side logic and state management.
 */

// ── Types ────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'financials'
  | 'legal'
  | 'technical'
  | 'market'
  | 'team'
  | 'product'
  | 'compliance'
  | 'other';

export type AccessLevel = 'public' | 'basic' | 'pro' | 'whale' | 'lead_investor';

export interface DealRoomDocument {
  /** Unique document ID */
  id: string;
  /** Document name */
  name: string;
  /** Document category */
  category: DocumentCategory;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** SHA-256 hash of document contents */
  contentHash: string;
  /** Minimum access level required to view */
  accessLevel: AccessLevel;
  /** Who uploaded the document */
  uploadedBy: string;
  /** Upload timestamp */
  uploadedAt: number;
  /** Last accessed timestamp */
  lastAccessedAt: number | null;
  /** Number of times viewed */
  viewCount: number;
  /** On-chain tx hash where the document hash is stored (if verified) */
  onChainTxHash: string | null;
  /** Optional description */
  description: string | null;
  /** Version number (for updated documents) */
  version: number;
}

export interface DealRoomFolder {
  /** Category key */
  category: DocumentCategory;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Documents in this folder */
  documents: DealRoomDocument[];
  /** Required documents checklist */
  requiredDocs: string[];
  /** Completion percentage */
  completionPct: number;
}

export interface DealRoomActivity {
  /** Activity type */
  type: 'view' | 'upload' | 'download' | 'access_granted' | 'access_revoked';
  /** Who performed the action */
  actor: string;
  /** Document involved (if applicable) */
  documentId: string | null;
  /** Description */
  description: string;
  /** Timestamp */
  timestamp: number;
}

export interface DealRoom {
  /** Startup ID */
  startupId: string;
  /** Startup name */
  startupName: string;
  /** Deal room creation date */
  createdAt: number;
  /** Folders with documents */
  folders: DealRoomFolder[];
  /** Recent activity log */
  activity: DealRoomActivity[];
  /** Overall completion percentage */
  overallCompletion: number;
  /** Total documents */
  totalDocuments: number;
  /** Total verified (on-chain hash) */
  verifiedDocuments: number;
}

export interface QAThread {
  /** Thread ID */
  id: string;
  /** Question asked by investor */
  question: string;
  /** Answer from startup */
  answer: string | null;
  /** Who asked */
  askedBy: string;
  /** Who answered */
  answeredBy: string | null;
  /** Category */
  category: DocumentCategory;
  /** Status */
  status: 'open' | 'answered' | 'follow_up';
  /** Timestamps */
  askedAt: number;
  answeredAt: number | null;
}

// ── Folder Templates ─────────────────────────────────────────────────

const FOLDER_TEMPLATES: Record<DocumentCategory, { name: string; description: string; requiredDocs: string[] }> = {
  financials: {
    name: 'Financial Documents',
    description: 'Revenue data, financial statements, projections, and unit economics',
    requiredDocs: [
      'Monthly revenue report (last 12 months)',
      'Financial projections (next 24 months)',
      'Unit economics breakdown (CAC, LTV, payback)',
      'Cap table (current)',
      'Bank statements or Stripe dashboard',
    ],
  },
  legal: {
    name: 'Legal Documents',
    description: 'Corporate structure, IP, contracts, and compliance',
    requiredDocs: [
      'Certificate of incorporation',
      'Articles of association / bylaws',
      'IP assignment agreements',
      'Material contracts summary',
      'Privacy policy & terms of service',
    ],
  },
  technical: {
    name: 'Technical Documentation',
    description: 'Architecture, audits, code quality, and infrastructure',
    requiredDocs: [
      'System architecture diagram',
      'Smart contract audit report',
      'Security assessment',
      'API documentation',
    ],
  },
  market: {
    name: 'Market Analysis',
    description: 'Market size, competitive landscape, and customer data',
    requiredDocs: [
      'TAM/SAM/SOM analysis',
      'Competitive landscape map',
      'Customer case studies (3+)',
      'Go-to-market strategy',
    ],
  },
  team: {
    name: 'Team & Culture',
    description: 'Founder backgrounds, org chart, and hiring plan',
    requiredDocs: [
      'Founder bios and track records',
      'Organizational chart',
      'Key hire pipeline',
      'Advisory board details',
    ],
  },
  product: {
    name: 'Product',
    description: 'Product roadmap, metrics, and demo materials',
    requiredDocs: [
      'Product roadmap (next 12 months)',
      'Product metrics dashboard',
      'Demo video or live product link',
    ],
  },
  compliance: {
    name: 'Compliance & Regulatory',
    description: 'Regulatory filings, licenses, and compliance status',
    requiredDocs: [
      'Regulatory compliance summary',
      'KYC/AML policy',
      'Data protection compliance (GDPR/CCPA)',
    ],
  },
  other: {
    name: 'Other Documents',
    description: 'Pitch deck, investor updates, and supplementary materials',
    requiredDocs: [
      'Pitch deck (latest)',
      'Last 3 investor update emails',
    ],
  },
};

// ── Deal Room Factory ────────────────────────────────────────────────

/**
 * Create a new empty deal room for a startup.
 */
export function createDealRoom(startupId: string, startupName: string): DealRoom {
  const folders: DealRoomFolder[] = Object.entries(FOLDER_TEMPLATES).map(([key, template]) => ({
    category: key as DocumentCategory,
    name: template.name,
    description: template.description,
    documents: [],
    requiredDocs: template.requiredDocs,
    completionPct: 0,
  }));

  return {
    startupId,
    startupName,
    createdAt: Date.now(),
    folders,
    activity: [],
    overallCompletion: 0,
    totalDocuments: 0,
    verifiedDocuments: 0,
  };
}

/**
 * Generate a SHA-256 hash of file contents for on-chain storage.
 */
export async function hashDocument(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Add a document to a deal room folder.
 */
export function addDocument(
  dealRoom: DealRoom,
  category: DocumentCategory,
  doc: Omit<DealRoomDocument, 'viewCount' | 'lastAccessedAt' | 'version'>,
): DealRoom {
  const folder = dealRoom.folders.find(f => f.category === category);
  if (!folder) return dealRoom;

  const newDoc: DealRoomDocument = {
    ...doc,
    viewCount: 0,
    lastAccessedAt: null,
    version: 1,
  };

  folder.documents.push(newDoc);
  folder.completionPct = Math.round(
    (folder.documents.length / Math.max(folder.requiredDocs.length, 1)) * 100
  );

  // Update overall stats
  const totalDocs = dealRoom.folders.reduce((s, f) => s + f.documents.length, 0);
  const verifiedDocs = dealRoom.folders.reduce(
    (s, f) => s + f.documents.filter(d => d.onChainTxHash).length, 0
  );
  const totalRequired = dealRoom.folders.reduce((s, f) => s + f.requiredDocs.length, 0);

  dealRoom.totalDocuments = totalDocs;
  dealRoom.verifiedDocuments = verifiedDocs;
  dealRoom.overallCompletion = Math.round((totalDocs / Math.max(totalRequired, 1)) * 100);

  // Log activity
  dealRoom.activity.unshift({
    type: 'upload',
    actor: doc.uploadedBy,
    documentId: doc.id,
    description: `Uploaded "${doc.name}" to ${folder.name}`,
    timestamp: Date.now(),
  });

  return { ...dealRoom };
}

/**
 * Record a document view in the activity log.
 */
export function recordView(
  dealRoom: DealRoom,
  documentId: string,
  viewerName: string,
): DealRoom {
  for (const folder of dealRoom.folders) {
    const doc = folder.documents.find(d => d.id === documentId);
    if (doc) {
      doc.viewCount++;
      doc.lastAccessedAt = Date.now();
      dealRoom.activity.unshift({
        type: 'view',
        actor: viewerName,
        documentId,
        description: `Viewed "${doc.name}"`,
        timestamp: Date.now(),
      });
      break;
    }
  }
  return { ...dealRoom };
}

/**
 * Generate demo deal room with sample documents.
 */
export function createDemoDealRoom(startupId: string, startupName: string): DealRoom {
  const room = createDealRoom(startupId, startupName);

  const sampleDocs: { category: DocumentCategory; name: string; mime: string; size: number }[] = [
    { category: 'financials', name: 'Monthly Revenue Report Q1 2026.pdf', mime: 'application/pdf', size: 245000 },
    { category: 'financials', name: 'Financial Projections 2026-2028.xlsx', mime: 'application/vnd.ms-excel', size: 89000 },
    { category: 'financials', name: 'Cap Table - April 2026.pdf', mime: 'application/pdf', size: 156000 },
    { category: 'legal', name: 'Certificate of Incorporation.pdf', mime: 'application/pdf', size: 312000 },
    { category: 'legal', name: 'IP Assignment Agreement.pdf', mime: 'application/pdf', size: 178000 },
    { category: 'technical', name: 'Architecture Overview.pdf', mime: 'application/pdf', size: 1200000 },
    { category: 'technical', name: 'Smart Contract Audit - OtterSec.pdf', mime: 'application/pdf', size: 890000 },
    { category: 'market', name: 'TAM Analysis - DeFi Infrastructure.pdf', mime: 'application/pdf', size: 567000 },
    { category: 'team', name: 'Founder Bios.pdf', mime: 'application/pdf', size: 234000 },
    { category: 'product', name: 'Product Roadmap 2026.pdf', mime: 'application/pdf', size: 445000 },
    { category: 'other', name: 'Pitch Deck - April 2026.pdf', mime: 'application/pdf', size: 3400000 },
  ];

  let result = room;
  for (const doc of sampleDocs) {
    result = addDocument(result, doc.category, {
      id: `doc-${doc.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: doc.name,
      category: doc.category,
      mimeType: doc.mime,
      sizeBytes: doc.size,
      contentHash: Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
      accessLevel: doc.category === 'other' ? 'public' : doc.category === 'financials' ? 'pro' : 'basic',
      uploadedBy: startupName,
      uploadedAt: Date.now() - Math.random() * 30 * 24 * 3600 * 1000,
      onChainTxHash: Math.random() > 0.3 ? `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}` : null,
      description: null,
    });
  }

  return result;
}
