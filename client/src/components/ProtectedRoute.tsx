import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    } else if (!loading && user && requireAdmin && user.role !== 'admin') {
      setLocation('/access-denied');
    }
  }, [user, loading, setLocation, requireAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
