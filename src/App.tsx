import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import "@/lib/i18n";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute><Patients /></ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute><Appointments /></ProtectedRoute>
            } />
            
            {/* Placeholder routes */}
            <Route path="/treatments" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/whatsapp" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/settings/*" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
