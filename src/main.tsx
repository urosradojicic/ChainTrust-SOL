import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { initTelemetry } from "./lib/telemetry";
import "./index.css";

// Boot telemetry as early as possible so even errors during App mount are
// captured. No-op when VITE_SENTRY_DSN is not set; never adds to bundle
// when the optional @sentry/react package isn't installed.
initTelemetry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min — data considered fresh
      gcTime: 1000 * 60 * 30,     // 30 min — garbage collection window
      refetchOnWindowFocus: false, // trust realtime invalidation
      refetchOnReconnect: true,
      retry: (failureCount, error: unknown) => {
        // Don't retry 4xx errors (bad request, unauthorized) — they won't succeed
        const status = (error as { status?: number } | null)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 0, // mutations should never silently retry — side effects
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
