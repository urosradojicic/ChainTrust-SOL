import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import Web3Provider from "./providers/Web3Provider";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PageTransition from "./components/layout/PageTransition";
import RoleGuard from "./components/RoleGuard";
import { useRealtimeSync } from "./hooks/use-realtime";
import CommandPalette from "./components/CommandPalette";
import KeyboardHelpOverlay from "./components/KeyboardHelpOverlay";
import { Loader2 } from "lucide-react";

import { InstitutionalViewProvider } from "./contexts/InstitutionalViewContext";

// Route-level code splitting — each page is loaded on demand
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StartupDetail = lazy(() => import("./pages/StartupDetail"));
const Register = lazy(() => import("./pages/Register"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Compare = lazy(() => import("./pages/Compare"));
const Staking = lazy(() => import("./pages/Staking"));
const Governance = lazy(() => import("./pages/Governance"));
const Demo = lazy(() => import("./pages/Demo"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const MyStartup = lazy(() => import("./pages/MyStartup"));
const Screener = lazy(() => import("./pages/Screener"));
const Security = lazy(() => import("./pages/Security"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CostCalculator = lazy(() => import("./pages/CostCalculator"));
const API = lazy(() => import("./pages/API"));
const Provenance = lazy(() => import("./pages/Provenance"));
const Investors = lazy(() => import("./pages/Investors"));
const Tokenomics = lazy(() => import("./pages/Tokenomics"));
const Verify = lazy(() => import("./pages/Verify"));
const Hackathon = lazy(() => import("./pages/Hackathon"));
const InvestorHub = lazy(() => import("./pages/InvestorHub"));
const ProofExplorer = lazy(() => import("./pages/ProofExplorer"));
const Integrate = lazy(() => import("./pages/Integrate"));
const EntityDossier = lazy(() => import("./pages/EntityDossier"));
const DealRooms = lazy(() => import("./pages/DealRooms"));
const LiveTestnetDemo = lazy(() => import("./pages/LiveTestnetDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}

/** Helper — wraps a page with role guard + page transition */
function G({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <RoleGuard path={path}>
      <PageTransition>{children}</PageTransition>
    </RoleGuard>
  );
}

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/demo" element={<PageTransition><Demo /></PageTransition>} />
          <Route path="/verify" element={<PageTransition><Verify /></PageTransition>} />
          <Route path="/testnet-demo" element={<PageTransition><LiveTestnetDemo /></PageTransition>} />
          <Route path="/hackathon" element={<PageTransition><Hackathon /></PageTransition>} />
          <Route path="/proof-explorer" element={<PageTransition><ProofExplorer /></PageTransition>} />
          <Route path="/integrate" element={<PageTransition><Integrate /></PageTransition>} />

          {/* All authenticated users */}
          <Route path="/dashboard" element={<G path="/dashboard"><Dashboard /></G>} />
          <Route path="/leaderboard" element={<G path="/leaderboard"><Leaderboard /></G>} />
          <Route path="/startup/:id" element={<G path="/startup"><StartupDetail /></G>} />
          <Route path="/entity/:id" element={<G path="/entity"><EntityDossier /></G>} />
          <Route path="/deals" element={<G path="/deals"><DealRooms /></G>} />
          <Route path="/staking" element={<G path="/staking"><Staking /></G>} />
          <Route path="/governance" element={<G path="/governance"><Governance /></G>} />
          <Route path="/security" element={<G path="/security"><Security /></G>} />
          <Route path="/tokenomics" element={<G path="/tokenomics"><Tokenomics /></G>} />
          <Route path="/compliance" element={<G path="/compliance"><Compliance /></G>} />
          <Route path="/provenance" element={<G path="/provenance"><Provenance /></G>} />

          {/* Investor-only */}
          <Route path="/investor-hub" element={<G path="/investor-hub"><InvestorHub /></G>} />
          <Route path="/portfolio" element={<G path="/portfolio"><Portfolio /></G>} />
          <Route path="/screener" element={<G path="/screener"><Screener /></G>} />
          <Route path="/compare" element={<G path="/compare"><Compare /></G>} />
          <Route path="/analytics" element={<G path="/analytics"><Analytics /></G>} />
          <Route path="/cost-calculator" element={<G path="/cost-calculator"><CostCalculator /></G>} />
          <Route path="/investors" element={<G path="/investors"><Investors /></G>} />
          <Route path="/api" element={<G path="/api"><API /></G>} />

          {/* Startup-only */}
          <Route path="/my-startup" element={<G path="/my-startup"><MyStartup /></G>} />
          <Route path="/register" element={<G path="/register"><Register /></G>} />

          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
  <AuthProvider>
    <Web3Provider>
      <WalletProvider>
        <InstitutionalViewProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RealtimeProvider>
              <CommandPalette />
              <KeyboardHelpOverlay />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <AnimatedRoutes />
                </main>
                <Footer />
              </div>
            </RealtimeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </InstitutionalViewProvider>
      </WalletProvider>
    </Web3Provider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;
