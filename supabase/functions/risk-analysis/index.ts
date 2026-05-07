import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Risk Analysis Edge Function
 *
 * Generates a deterministic risk analysis from startup metrics.
 * No external API calls required — all computation is local.
 *
 * Hardening (audit 2026-05-07):
 *   - CORS restricted to a configured allowlist (ALLOWED_ORIGIN env);
 *     wildcard `*` allowed only when explicitly configured for dev/preview.
 *   - Request body size capped via Content-Length to prevent denial-of-wallet
 *     through Supabase invocation billing on huge payloads.
 *   - Per-IP rate limit (in-memory, best-effort) — backstop, not authoritative.
 *   - String fields capped before interpolation into the response template.
 *   - Generic error responses; raw exception messages stay in logs only.
 */

const ALLOWED_ORIGIN_ENV = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get("ALLOWED_ORIGIN");
const ALLOWED_ORIGINS: ReadonlySet<string> = new Set(
  ALLOWED_ORIGIN_ENV
    ? ALLOWED_ORIGIN_ENV.split(",").map((s) => s.trim()).filter(Boolean)
    : ["https://chaintrust.app", "http://localhost:8080", "http://localhost:8081"],
);

const MAX_BODY_BYTES = 8 * 1024; // 8 KiB — startup payloads are tiny
const MAX_STRING_LEN = 200;

// In-memory per-IP rate limit. Resets on cold start; that's fine — Supabase
// also enforces global function-level limits. This is a courtesy backstop.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_HITS = 30;
const rateBucket = new Map<string, { count: number; resetAt: number }>();

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://chaintrust.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

function clip(s: unknown, max = MAX_STRING_LEN): string {
  return typeof s === "string" ? s.slice(0, max) : "";
}

function num(v: unknown, dflt = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

function rateOk(ip: string): boolean {
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || entry.resetAt < now) {
    rateBucket.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_MAX_HITS;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Body size guard — reject before reading.
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Request body too large" }), {
      status: 413, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Best-effort per-IP rate limit. Real enforcement belongs at the platform
  // edge; this is the inner backstop.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown";
  if (!rateOk(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const startup = body?.startup;
    if (!startup || typeof startup !== "object" || !startup.name) {
      return new Response(JSON.stringify({ error: "Missing startup data" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Defensive coercion + clipping. Untrusted input cannot extend output size.
    const name = clip(startup.name, 80);
    const mrr = num(startup.mrr);
    const growth = num(startup.growth_rate);
    const sustainability = num(startup.sustainability_score);
    const concentration = num(startup.token_concentration_pct);
    const treasury = num(startup.treasury);
    const carbonOffset = num(startup.carbon_offset_tonnes);

    const runway = treasury > 0 && mrr > 0 ? Math.round(treasury / (mrr * 0.7)) : 0;
    const burnRisk = runway < 6 ? 'high' : runway < 12 ? 'moderate' : 'low';
    const growthSignal = growth > 15 ? 'strong' : growth > 5 ? 'moderate' : growth > 0 ? 'modest' : 'declining';
    const concentrationRisk = concentration > 50 ? 'critical' : concentration > 30 ? 'elevated' : 'acceptable';

    const sections = [
      `**Financial Risk**\n${name} has ${burnRisk} burn risk with ~${runway} months runway at current spending. MRR of $${mrr.toLocaleString()} with ${growthSignal} growth at ${growth}%. ${runway < 6 ? 'Immediate fundraising recommended.' : 'Financial position is stable.'}`,
      `**Environmental Impact**\nSustainability score of ${sustainability}/100. ${carbonOffset > 0 ? `Offset ${carbonOffset}t CO2 — ${sustainability > 70 ? 'strong ESG positioning' : 'improvement needed'}.` : 'No carbon offset data reported — consider adding environmental metrics.'}`,
      `**Tokenomics Flags**\nTop wallet concentration at ${concentration}% is ${concentrationRisk}. ${concentration > 40 ? 'High concentration creates sell pressure risk and governance centralization concerns.' : 'Distribution is healthy for a project at this stage.'}`,
      `**Recommendation**\n${sustainability > 60 && growth > 5 && concentration < 40 ? 'Positive outlook. Strong fundamentals with sustainable growth trajectory. Suitable for further due diligence.' : sustainability > 40 ? 'Mixed signals. Some metrics are promising but key areas need improvement before institutional investment.' : 'Caution advised. Multiple risk factors present. Recommend monitoring for 1-2 quarters before commitment.'}`,
    ];

    return new Response(JSON.stringify({ analysis: sections.join('\n\n') }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    // Generic error to client; raw error stays server-side via standard logging.
    console.error("[risk-analysis] error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
