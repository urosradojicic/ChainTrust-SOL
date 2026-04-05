import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { startup } = await req.json();
    if (!startup?.name) {
      return new Response(JSON.stringify({ error: "Missing startup data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Startup: ${startup.name}
Category: ${startup.category} | Blockchain: ${startup.blockchain}
MRR: $${startup.mrr?.toLocaleString()} | Users: ${startup.users?.toLocaleString()} | Growth: ${startup.growth_rate}%
Sustainability Score: ${startup.sustainability_score}/100
Carbon Offsets: ${startup.carbon_offset_tonnes}t CO2 | Energy/tx: ${startup.energy_per_transaction}
Token Concentration (top 10): ${startup.token_concentration_pct}% | Inflation: ${startup.inflation_rate}%
Treasury: $${startup.treasury?.toLocaleString()} | Team Size: ${startup.team_size}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a blockchain startup analyst. Given the following on-chain metrics for a startup, provide a brief risk analysis covering: 1) Financial sustainability risk, 2) Environmental impact assessment, 3) Tokenomics red flags, 4) Overall investment recommendation. Be specific and reference the actual numbers. Keep it under 200 words. Format as exactly 4 sections with headers: **Financial Risk**, **Environmental Impact**, **Tokenomics Flags**, **Recommendation**. Each section should be 1-3 sentences.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No analysis generated.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("risk-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
