import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
    ],
  },
  build: {
    // Hide the main chunk behind a vendor split so Three.js/Pyth/Solana/charts
    // don't ship together with app code. Keeps initial download small.
    //
    // Solana note: web3.js + spl-token + wallet-adapter + Anchor + Metaplex
    // umi packages share a dense graph of circular ES-module imports across
    // their transitive deps (noble crypto, bs58, bn.js, borsh, etc.). Manually
    // chunking them creates "Cannot access 'X' before initialization" TDZ
    // errors at runtime because module declaration order across chunks no
    // longer matches the runtime evaluation order required by the cycles.
    //
    // The robust fix is to leave the Solana ecosystem out of manualChunks and
    // let Rollup auto-split it: Rollup builds the full dep graph first and
    // only emits chunk boundaries where cycles allow. We lose deterministic
    // chunk names for those packages but keep correctness — a TDZ-free bundle.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          // Heavy libraries that have stable, non-circular module graphs and
          // ship to multiple routes — these are safe to pre-chunk for caching.
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("lucide-react")) return "vendor-icons";
          // Everything else — including Three.js (only used by the lazy
          // Portfolio3D component) and the full Solana / Anchor / Metaplex
          // ecosystem (dense circular graphs) — is left to Rollup's automatic
          // chunk splitting. Manually chunking these caused TDZ runtime errors
          // and broke React.lazy boundaries by lifting chunks into the eager
          // entry dep tree via modulepreload.
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
    sourcemap: mode === "development",
    // In production, drop console.* and debugger statements via esbuild minifier.
    // SWC/esbuild is faster than terser and already installed.
    minify: "esbuild",
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
