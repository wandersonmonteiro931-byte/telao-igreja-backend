import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldX, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AccessDenied() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleGoBack = () => {
    setLocation('/user/home');
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="p-10 max-w-md text-center space-y-6 border-destructive/30">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-5">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground text-lg">
            Você não tem permissão para visualizar esta página.
          </p>
        </div>

        <div className="bg-muted/50 p-5 rounded-lg text-left space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Verifique seu nível de acesso
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Contate o administrador se isso for um erro
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Tente fazer login com outra conta
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleGoBack}
            className="w-full"
            data-testid="button-go-back"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para Minha Área
          </Button>
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Fazer Login com Outra Conta
          </Button>
        </div>
      </Card>
    </div>
  );
}
