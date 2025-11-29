import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/lib/auth-context";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import SecurityQuestions from "@/pages/security-questions";
import ResetPassword from "@/pages/reset-password";
import AccessDenied from "@/pages/access-denied";
import Home from "@/pages/home";
import UserHome from "@/pages/user-home";
import AdminDashboard from "@/pages/admin-dashboard";
import ProjectorView from "@/pages/projector";
import NotFound from "@/pages/not-found";

function MainRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/security-questions" component={SecurityQuestions} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/access-denied" component={AccessDenied} />
        <Route path="/admin-dashboard">
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/user/home">
          <ProtectedRoute>
            <UserHome />
          </ProtectedRoute>
        </Route>
        <Route path="/home">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const [location] = useLocation();
  
  if (location === "/projector") {
    return <ProjectorView />;
  }
  
  return <MainRoutes />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
