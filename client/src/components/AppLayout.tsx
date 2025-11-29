import { useLocation } from 'wouter';
import { Footer } from '@/components/Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const hideFooter = location === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
