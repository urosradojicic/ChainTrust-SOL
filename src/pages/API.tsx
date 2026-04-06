import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code, Terminal, Key, Globe, Shield, Zap, Copy, CheckCircle,
  ChevronDown, ChevronUp, FileJson, Lock, Webhook, Database,
  ArrowRight, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Endpoint {
  method: EndpointMethod;
  path: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  response: string;
  example?: string;
}

const METHOD_COLORS: Record<EndpointMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const API_SECTIONS: { title: string; icon: any; endpoints: Endpoint[] }[] = [
  {
    title: 'Startups',
    icon: Database,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/startups',
        description: 'List all registered startups with optional filtering',
        auth: false,
        params: [
          { name: 'category', type: 'string', required: false, desc: 'Filter by category (DeFi, Fintech, SaaS, Cleantech, Infrastructure)' },
          { name: 'verified', type: 'boolean', required: false, desc: 'Filter verified startups only' },
          { name: 'min_trust', type: 'number', required: false, desc: 'Minimum trust score (0-100)' },
          { name: 'sort', type: 'string', required: false, desc: 'Sort field: mrr, trust_score, sustainability_score, created_at' },
          { name: 'limit', type: 'number', required: false, desc: 'Results per page (default: 50, max: 200)' },
          { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
        ],
        response: `{
  "data": [
    {
      "id": "abc123",
      "name": "GreenChain",
      "category": "Cleantech",
      "mrr": 125000,
      "trust_score": 87,
      "sustainability_score": 92,
      "is_verified": true,
      "solana_address": "Gch7x...",
      "proof_hash": "sha256:a1b2c3...",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 127,
  "limit": 50,
  "offset": 0
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/startups/:id',
        description: 'Get detailed startup profile with latest metrics',
        auth: false,
        response: `{
  "id": "abc123",
  "name": "GreenChain",
  "category": "Cleantech",
  "description": "Carbon-neutral supply chain verification",
  "mrr": 125000,
  "monthly_active_users": 8500,
  "growth_rate": 15.2,
  "burn_rate": 45000,
  "runway_months": 18,
  "trust_score": 87,
  "sustainability_score": 92,
  "is_verified": true,
  "verification_badge": {
    "type": "Gold",
    "issued_at": "2026-02-01T00:00:00Z",
    "tx_signature": "5KjP..."
  },
  "proof_chain": [
    { "hash": "sha256:a1b2c3...", "timestamp": "2026-03-01T00:00:00Z", "tx": "4xRm..." }
  ],
  "carbon_offset_tonnes": 45.2,
  "solana_address": "Gch7x..."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/startups',
        description: 'Register a new startup (triggers on-chain registration)',
        auth: true,
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Startup name (max 64 chars)' },
          { name: 'category', type: 'string', required: true, desc: 'One of: DeFi, Fintech, SaaS, Cleantech, Infrastructure' },
          { name: 'description', type: 'string', required: false, desc: 'Short description (max 500 chars)' },
          { name: 'website', type: 'string', required: false, desc: 'Website URL' },
          { name: 'solana_address', type: 'string', required: true, desc: 'Startup Solana wallet address' },
        ],
        response: `{
  "id": "new123",
  "name": "NewStartup",
  "solana_tx": "3xKp...",
  "status": "registered",
  "created_at": "2026-04-06T12:00:00Z"
}`,
      },
    ],
  },
  {
    title: 'Metrics & Verification',
    icon: Shield,
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/startups/:id/metrics',
        description: 'Publish monthly metrics (hashed and submitted to Solana)',
        auth: true,
        params: [
          { name: 'mrr', type: 'number', required: true, desc: 'Monthly recurring revenue (USD)' },
          { name: 'monthly_active_users', type: 'number', required: true, desc: 'Monthly active users count' },
          { name: 'growth_rate', type: 'number', required: true, desc: 'Month-over-month growth rate (%)' },
          { name: 'burn_rate', type: 'number', required: false, desc: 'Monthly burn rate (USD)' },
          { name: 'carbon_offset_tonnes', type: 'number', required: false, desc: 'Carbon offsets in tonnes' },
        ],
        response: `{
  "proof_hash": "sha256:e4f5g6...",
  "solana_tx": "7yBn...",
  "block": 234567890,
  "timestamp": "2026-04-06T12:00:00Z",
  "status": "confirmed"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/startups/:id/metrics/history',
        description: 'Get historical metrics with proof chain',
        auth: false,
        params: [
          { name: 'from', type: 'string', required: false, desc: 'Start date (ISO 8601)' },
          { name: 'to', type: 'string', required: false, desc: 'End date (ISO 8601)' },
        ],
        response: `{
  "startup_id": "abc123",
  "metrics": [
    {
      "month": "2026-03",
      "mrr": 125000,
      "users": 8500,
      "growth": 15.2,
      "proof_hash": "sha256:a1b2c3...",
      "solana_tx": "4xRm...",
      "verified": true
    }
  ]
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/verify/:proof_hash',
        description: 'Verify a proof hash against the Solana ledger',
        auth: false,
        response: `{
  "valid": true,
  "proof_hash": "sha256:a1b2c3...",
  "solana_tx": "4xRm...",
  "block": 234567890,
  "timestamp": "2026-03-01T00:00:00Z",
  "startup_id": "abc123",
  "startup_name": "GreenChain"
}`,
      },
    ],
  },
  {
    title: 'Governance',
    icon: Globe,
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/proposals',
        description: 'List governance proposals with vote counts',
        auth: false,
        params: [
          { name: 'status', type: 'string', required: false, desc: 'Filter: Active, Passed, Defeated' },
        ],
        response: `{
  "data": [
    {
      "id": "prop_1",
      "title": "Increase staking rewards",
      "status": "Active",
      "votes_for": 15000,
      "votes_against": 3200,
      "votes_abstain": 800,
      "ends_at": "2026-04-13T00:00:00Z"
    }
  ]
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/proposals/:id/vote',
        description: 'Cast a vote on an active proposal',
        auth: true,
        params: [
          { name: 'vote', type: 'string', required: true, desc: 'One of: For, Against, Abstain' },
        ],
        response: `{
  "proposal_id": "prop_1",
  "vote": "For",
  "weight": 5000,
  "solana_tx": "2zKm...",
  "timestamp": "2026-04-06T12:00:00Z"
}`,
      },
    ],
  },
  {
    title: 'Webhooks',
    icon: Webhook,
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/webhooks',
        description: 'Register a webhook for real-time events',
        auth: true,
        params: [
          { name: 'url', type: 'string', required: true, desc: 'Webhook endpoint URL (HTTPS required)' },
          { name: 'events', type: 'string[]', required: true, desc: 'Events: startup.registered, metrics.published, verification.complete, proposal.created, vote.cast' },
          { name: 'secret', type: 'string', required: false, desc: 'HMAC signing secret for payload verification' },
        ],
        response: `{
  "id": "wh_abc123",
  "url": "https://your-erp.com/webhooks/chaintrust",
  "events": ["metrics.published", "verification.complete"],
  "status": "active",
  "created_at": "2026-04-06T12:00:00Z"
}`,
        example: `// Webhook payload example
{
  "event": "metrics.published",
  "timestamp": "2026-04-06T12:00:00Z",
  "data": {
    "startup_id": "abc123",
    "proof_hash": "sha256:e4f5g6...",
    "solana_tx": "7yBn..."
  },
  "signature": "hmac-sha256:..."
}`,
      },
    ],
  },
];

const SDK_EXAMPLES = {
  curl: `curl -X GET "https://api.chaintrust.io/v1/startups?category=Fintech&verified=true" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  javascript: `import { ChainTrust } from '@chaintrust/sdk';

const ct = new ChainTrust({ apiKey: process.env.CHAINTRUST_KEY });

// List verified fintech startups
const startups = await ct.startups.list({
  category: 'Fintech',
  verified: true,
});

// Publish metrics (auto-hashes and submits to Solana)
const proof = await ct.metrics.publish('startup_id', {
  mrr: 125000,
  monthly_active_users: 8500,
  growth_rate: 15.2,
});

console.log(proof.solana_tx); // "7yBn..."`,
  python: `from chaintrust import ChainTrust

ct = ChainTrust(api_key="YOUR_API_KEY")

# List verified startups
startups = ct.startups.list(category="Fintech", verified=True)

# Verify a proof hash
result = ct.verify("sha256:a1b2c3...")
print(result.valid)  # True
print(result.solana_tx)  # "4xRm..."`,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-[10px] text-muted-foreground transition hover:text-foreground"
    >
      {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left transition hover:bg-muted/30"
      >
        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-foreground flex-1">{endpoint.path}</code>
        {endpoint.auth && <Lock className="h-3.5 w-3.5 text-amber-400" title="Requires authentication" />}
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border">
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>

            {endpoint.params && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Parameters</h4>
                <div className="rounded-lg bg-muted/30 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Required</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {endpoint.params.map(p => (
                        <tr key={p.name}>
                          <td className="px-3 py-2 font-mono text-primary">{p.name}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{p.type}</td>
                          <td className="px-3 py-2 text-center">{p.required ? <CheckCircle className="h-3 w-3 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Response</h4>
                <CopyButton text={endpoint.response} />
              </div>
              <pre className="rounded-lg bg-[#0d1117] p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto">
                {endpoint.response}
              </pre>
            </div>

            {endpoint.example && (
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Example Payload</h4>
                <pre className="rounded-lg bg-[#0d1117] p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto">
                  {endpoint.example}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function API() {
  const [sdkTab, setSdkTab] = useState<'curl' | 'javascript' | 'python'>('javascript');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">API & Integrations</h1>
            <p className="text-xs text-muted-foreground font-mono">REST API v1 — Connect your ERP, supply chain, or analytics platform</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Integrate ChainTrust verification directly into your existing systems. Every API call that writes data
          automatically creates an on-chain proof on Solana.
        </p>
      </motion.div>

      {/* Quick start cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Key, title: 'API Keys', desc: 'Free tier: 10K requests/month', color: 'text-amber-400' },
          { icon: Zap, title: 'Rate Limits', desc: '100 req/sec, 10K/month free', color: 'text-primary' },
          { icon: Shield, title: 'Authentication', desc: 'Bearer token, HMAC webhooks', color: 'text-emerald-400' },
          { icon: Globe, title: 'Base URL', desc: 'api.chaintrust.io/v1', color: 'text-blue-400' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4"
          >
            <item.icon className={`h-5 w-5 ${item.color} mb-2`} />
            <h3 className="font-bold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* SDK Examples */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" /> Quick Start
        </h2>
        <div className="flex gap-2 mb-4">
          {(['curl', 'javascript', 'python'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSdkTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sdkTab === tab ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : 'Python'}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className="rounded-lg bg-[#0d1117] p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            {SDK_EXAMPLES[sdkTab]}
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton text={SDK_EXAMPLES[sdkTab]} />
          </div>
        </div>
      </motion.div>

      {/* API Endpoints */}
      <div className="space-y-8 mb-8">
        {API_SECTIONS.map((section, si) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + si * 0.05 }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <section.icon className="h-5 w-5 text-primary" /> {section.title}
            </h2>
            <div className="space-y-2">
              {section.endpoints.map((ep, i) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Integration partners */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" /> ERP & Supply Chain Integrations
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          ChainTrust's API is designed to plug directly into existing enterprise systems. No blockchain expertise required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'SAP S/4HANA', desc: 'Push supply chain data via SAP Integration Suite', status: 'Available' },
            { name: 'Oracle SCM Cloud', desc: 'Webhook-based integration for procurement verification', status: 'Available' },
            { name: 'Microsoft Dynamics', desc: 'Power Automate connector for automated verification', status: 'Available' },
            { name: 'Salesforce', desc: 'AppExchange package for startup portfolio tracking', status: 'Coming Q3' },
            { name: 'Shopify', desc: 'Product passport generation at checkout', status: 'Coming Q3' },
            { name: 'Custom Webhook', desc: 'Real-time event delivery to any HTTPS endpoint', status: 'Available' },
          ].map((item, i) => (
            <div key={item.name} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 shrink-0 mt-0.5">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={`text-[10px] font-bold ${item.status === 'Available' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Start integrating today</h3>
          <p className="text-sm text-muted-foreground">Free tier includes 10,000 API requests per month. No credit card required.</p>
        </div>
        <Link to="/register" className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 shrink-0">
          Get API Key <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
