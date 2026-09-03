import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Transfer from "./pages/Transfer";
import Movements from "./pages/Movements";
import Statistics from "./pages/Statistics";
import ApiConfig from "./pages/ApiConfig";
import WebAccess from "./pages/WebAccess";
import Settings from "./pages/Settings";
import ScanQR from "./pages/ScanQR";
import ConfirmPay from "./pages/ConfirmPay";
import SuccessPay from "./pages/SuccessPay";
import ErrorPay from "./pages/ErrorPay";
import LinkedDevices from "./pages/LinkedDevices";
import ShareCVU from "./pages/ShareCVU";
import Menu from "./pages/Menu";
import ApisWiki from "./pages/ApisWiki";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/api-config" element={<ApiConfig />} />
              <Route path="/web-access" element={<WebAccess />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/scan-qr" element={<ScanQR />} />
              <Route path="/confirm-pay" element={<ConfirmPay />} />
              <Route path="/success-pay" element={<SuccessPay />} />
              <Route path="/error-pay" element={<ErrorPay />} />
              <Route path="/linked-devices" element={<LinkedDevices />} />
              <Route path="/share-cvu" element={<ShareCVU />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/apis-wiki" element={<ApisWiki />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
