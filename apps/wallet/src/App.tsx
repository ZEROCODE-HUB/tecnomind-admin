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
import ProtectedRoute from "./components/ProtectedRoute";

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
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
              <Route path="/movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />
              <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
              <Route path="/api-config" element={<ProtectedRoute><ApiConfig /></ProtectedRoute>} />
              <Route path="/web-access" element={<ProtectedRoute><WebAccess /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/scan-qr" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
              <Route path="/confirm-pay" element={<ProtectedRoute><ConfirmPay /></ProtectedRoute>} />
              <Route path="/success-pay" element={<ProtectedRoute><SuccessPay /></ProtectedRoute>} />
              <Route path="/error-pay" element={<ProtectedRoute><ErrorPay /></ProtectedRoute>} />
              <Route path="/linked-devices" element={<ProtectedRoute><LinkedDevices /></ProtectedRoute>} />
              <Route path="/share-cvu" element={<ProtectedRoute><ShareCVU /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/apis-wiki" element={<ProtectedRoute><ApisWiki /></ProtectedRoute>} />
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
