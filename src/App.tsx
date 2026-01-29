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
import NewPatient from "./pages/patients/NewPatient";
import PatientDetail from "./pages/patients/PatientDetail";
import Appointments from "./pages/Appointments";
import Agenda from "./pages/Agenda";
import Treatments from "./pages/Treatments";
import Budgets from "./pages/Budgets";
import Payments from "./pages/Payments";
import WhatsApp from "./pages/WhatsApp";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
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
            <Route path="/patients/new" element={
              <ProtectedRoute><NewPatient /></ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute><PatientDetail /></ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute><Appointments /></ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute><Agenda /></ProtectedRoute>
            } />
            <Route path="/treatments" element={
              <ProtectedRoute><Treatments /></ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute><Budgets /></ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute><Payments /></ProtectedRoute>
            } />
            <Route path="/whatsapp" element={
              <ProtectedRoute><WhatsApp /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/settings/*" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
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