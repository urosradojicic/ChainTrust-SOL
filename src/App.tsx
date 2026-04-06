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
import { useRealtimeSync } from "./hooks/use-realtime";
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

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
          <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
          <Route path="/startup/:id" element={<PageTransition><StartupDetail /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/staking" element={<PageTransition><Staking /></PageTransition>} />
          <Route path="/governance" element={<PageTransition><Governance /></PageTransition>} />
          <Route path="/screener" element={<PageTransition><Screener /></PageTransition>} />
          <Route path="/demo" element={<PageTransition><Demo /></PageTransition>} />
          <Route path="/my-startup" element={<PageTransition><MyStartup /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/security" element={<PageTransition><Security /></PageTransition>} />
          <Route path="/compliance" element={<PageTransition><Compliance /></PageTransition>} />
          <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
          <Route path="/cost-calculator" element={<PageTransition><CostCalculator /></PageTransition>} />
          <Route path="/api" element={<PageTransition><API /></PageTransition>} />
          <Route path="/provenance" element={<PageTransition><Provenance /></PageTransition>} />
          <Route path="/investors" element={<PageTransition><Investors /></PageTransition>} />
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
