import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import Patients from "./pages/doctor/Patients";
import PatientDashboard from "./pages/patient/PatientDashboard";
import Cases from "./pages/patient/Cases";
import Upload from "./pages/shared/Upload";
import AnalysisResult from "./pages/shared/AnalysisResult";
import Customize from "./pages/shared/Customize";
import Appointments from "./pages/shared/Appointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: 'doctor' | 'patient' }) => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to="/auth/login" replace />;
  }

  if (profile.role !== role) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute role="doctor"><Patients /></ProtectedRoute>} />
          <Route path="/doctor/upload" element={<ProtectedRoute role="doctor"><Upload role="doctor" /></ProtectedRoute>} />
          <Route path="/doctor/analysis-result/:caseId" element={<ProtectedRoute role="doctor"><AnalysisResult role="doctor" /></ProtectedRoute>} />
          <Route path="/doctor/customize/:caseId" element={<ProtectedRoute role="doctor"><Customize role="doctor" /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute role="doctor"><Appointments role="doctor" /></ProtectedRoute>} />
          
          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/upload" element={<ProtectedRoute role="patient"><Upload role="patient" /></ProtectedRoute>} />
          <Route path="/patient/analysis-result/:caseId" element={<ProtectedRoute role="patient"><AnalysisResult role="patient" /></ProtectedRoute>} />
          <Route path="/patient/cases" element={<ProtectedRoute role="patient"><Cases /></ProtectedRoute>} />
          <Route path="/patient/customize/:caseId" element={<ProtectedRoute role="patient"><Customize role="patient" /></ProtectedRoute>} />
          <Route path="/patient/appointments" element={<ProtectedRoute role="patient"><Appointments role="patient" /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
