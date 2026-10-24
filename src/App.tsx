import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { OnlineProvider } from "./hooks/useOnlineStatus";
import { LanguageProvider } from "./contexts/LanguageContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { SyncIndicator } from "./components/SyncIndicator";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectTasksView from "./pages/ProjectTasksView";
import UserManagement from "./pages/UserManagement";
import AcceptInvite from "./pages/AcceptInvite";
import PublicProjectView from "./pages/PublicProjectView";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import NotFound from "./pages/NotFound";
import AppStoreScreenshots from "./pages/AppStoreScreenshots";
import Install from "./pages/Install";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionManage from "./pages/SubscriptionManage";
import ProTerms from "./pages/ProTerms";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep data in cache
      staleTime: 1000 * 60 * 5, // 5 minutes - consider data fresh
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "renovatie-app-cache",
});

// Wipe cached data whenever the signed-in user changes, so no data from a
// previous account on this device is ever shown to another account.
const CACHE_OWNER_KEY = "renovatie-app-cache-owner";
supabase.auth.onAuthStateChange((_event, session) => {
  const uid = session?.user?.id ?? "";
  const previous = window.localStorage.getItem(CACHE_OWNER_KEY) ?? "";
  if (uid !== previous) {
    queryClient.clear();
    window.localStorage.removeItem("renovatie-app-cache");
    if (uid) window.localStorage.setItem(CACHE_OWNER_KEY, uid);
    else window.localStorage.removeItem(CACHE_OWNER_KEY);
  }
});

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      <LanguageProvider>
        <OnlineProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <SyncIndicator />
            <PwaInstallPrompt />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                <Route path="/project-tasks/:id" element={<ProtectedRoute><ProjectTasksView /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="/accept-invite/:token" element={<AcceptInvite />} />
                <Route path="/public/project/:shareToken" element={<PublicProjectView />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/abonnement" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
                <Route path="/pro-voorwaarden" element={<ProTerms />} />
                <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/install" element={<Install />} />
                <Route path="/app-store-screenshots" element={<ProtectedRoute requiredRole="admin"><AppStoreScreenshots /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </OnlineProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
