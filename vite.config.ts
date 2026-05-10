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
    // Solana note: web3.js, the wallet adapters, Anchor, and the Metaplex umi
    // packages have well-known circular ES-module imports between siblings.
    // Rollup tolerates cycles across chunk boundaries (each chunk is its own
    // init context) but not within a single chunk — the symptom is a runtime
    // "Cannot access 'X' before initialization" TDZ error from the minified
    // bundle. We therefore split the Solana ecosystem into four narrower
    // buckets along its real package boundaries.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three") || id.includes("@react-three")) return "vendor-3d";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@solana/web3.js") || id.includes("@solana/spl-")) return "vendor-solana-core";
          if (id.includes("@solana/wallet-adapter")) return "vendor-solana-wallet";
          if (id.includes("@coral-xyz")) return "vendor-anchor";
          if (id.includes("@metaplex") || id.includes("bubblegum")) return "vendor-metaplex";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("lucide-react")) return "vendor-icons";
          return "vendor";
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
