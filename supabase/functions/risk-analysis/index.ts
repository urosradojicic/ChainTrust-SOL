import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Risk Analysis Edge Function
 *
 * Generates a deterministic risk analysis from startup metrics.
 * No external API calls required — all computation is local.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { startup } = await req.json();
    if (!startup?.name) {
      return new Response(JSON.stringify({ error: "Missing startup data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deterministic risk analysis based on metrics
    const mrr = startup.mrr ?? 0;
    const growth = startup.growth_rate ?? 0;
    const sustainability = startup.sustainability_score ?? 0;
    const concentration = startup.token_concentration_pct ?? 0;
    const treasury = startup.treasury ?? 0;
    const users = startup.users ?? 0;

    const runway = treasury > 0 && mrr > 0 ? Math.round(treasury / (mrr * 0.7)) : 0;
    const burnRisk = runway < 6 ? 'high' : runway < 12 ? 'moderate' : 'low';
    const growthSignal = growth > 15 ? 'strong' : growth > 5 ? 'moderate' : growth > 0 ? 'modest' : 'declining';
    const concentrationRisk = concentration > 50 ? 'critical' : concentration > 30 ? 'elevated' : 'acceptable';

    const sections = [
      `**Financial Risk**\n${startup.name} has ${burnRisk} burn risk with ~${runway} months runway at current spending. MRR of $${mrr.toLocaleString()} with ${growthSignal} growth at ${growth}%. ${runway < 6 ? 'Immediate fundraising recommended.' : 'Financial position is stable.'}`,
      `**Environmental Impact**\nSustainability score of ${sustainability}/100. ${startup.carbon_offset_tonnes > 0 ? `Offset ${startup.carbon_offset_tonnes}t CO2 — ${sustainability > 70 ? 'strong ESG positioning' : 'improvement needed'}.` : 'No carbon offset data reported — consider adding environmental metrics.'}`,
      `**Tokenomics Flags**\nTop wallet concentration at ${concentration}% is ${concentrationRisk}. ${concentration > 40 ? 'High concentration creates sell pressure risk and governance centralization concerns.' : 'Distribution is healthy for a project at this stage.'}`,
      `**Recommendation**\n${sustainability > 60 && growth > 5 && concentration < 40 ? 'Positive outlook. Strong fundamentals with sustainable growth trajectory. Suitable for further due diligence.' : sustainability > 40 ? 'Mixed signals. Some metrics are promising but key areas need improvement before institutional investment.' : 'Caution advised. Multiple risk factors present. Recommend monitoring for 1-2 quarters before commitment.'}`,
    ];

    return new Response(JSON.stringify({ analysis: sections.join('\n\n') }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
