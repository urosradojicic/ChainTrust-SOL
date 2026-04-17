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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three") || id.includes("@react-three")) return "vendor-3d";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@solana/") || id.includes("@metaplex") || id.includes("bubblegum")) return "vendor-solana";
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
