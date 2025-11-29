import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth-context';
import { AnnouncementsPanel } from '@/components/AnnouncementsPanel';
import { 
  LogOut, 
  Projector, 
  User, 
  ImageIcon, 
  ListMusic, 
  Palette,
  ChevronRight,
  Clock,
  Settings,
  Church,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Sunrise
} from 'lucide-react';

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Bom dia', icon: Sunrise };
  } else if (hour >= 12 && hour < 18) {
    return { text: 'Boa tarde', icon: Sun };
  } else {
    return { text: 'Boa noite', icon: Moon };
  }
}

export default function UserHome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading, settings, updateSettings, logout } = useAuth();
  const [isEditingChurchName, setIsEditingChurchName] = useState(false);
  const [churchNameInput, setChurchNameInput] = useState('');
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const features = [
    {
      icon: Projector,
      title: 'Controle do Projetor',
      description: 'Gerencie apresentações em tempo real',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: ImageIcon,
      title: 'Galeria de Mídia',
      description: 'Organize imagens e vídeos',
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: ListMusic,
      title: 'Playlists',
      description: 'Crie listas para apresentações',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      icon: Palette,
      title: 'Personalização',
      description: 'Configure temas e estilos',
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (settings?.churchName) {
      setChurchNameInput(settings.churchName);
    }
  }, [settings]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Desconectado',
        description: 'Você foi desconectado com sucesso',
      });
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleGoToProjector = () => {
    setLocation('/');
  };

  const handleSaveChurchName = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const success = await updateSettings({ churchName: churchNameInput });
    
    if (success) {
      setIsEditingChurchName(false);
      toast({
        title: 'Salvo',
        description: 'Nome da igreja atualizado com sucesso',
      });
    } else {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar nome da igreja',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setChurchNameInput(settings?.churchName || '');
    setIsEditingChurchName(false);
  };

  if (authLoading) {
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

  const currentFeature = features[currentFeatureIndex];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed top-2 right-2 z-50 flex items-center gap-1">
        <AnnouncementsPanel />
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout" className="h-7 px-2 text-xs bg-background/80 backdrop-blur-sm">
          <LogOut className="w-3 h-3 mr-1" />
          Sair
        </Button>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="p-4 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <h1 className="text-xl font-bold text-primary" data-testid="text-welcome-team">
              Bem-vindo a Equipe da Mídia!
            </h1>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -20 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <GreetingIcon className="w-8 h-8 text-yellow-500" />
                </motion.div>
                <motion.h2 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  data-testid="text-greeting"
                >
                  {greeting.text}, {user?.username || user?.email}!
                </motion.h2>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm" data-testid="text-datetime">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Church className="w-4 h-4 text-muted-foreground" />
                {isEditingChurchName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={churchNameInput}
                      onChange={(e) => setChurchNameInput(e.target.value)}
                      placeholder="Nome da sua igreja"
                      className="h-8 text-sm max-w-xs"
                      data-testid="input-church-name"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveChurchName}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                      data-testid="button-save-church"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                      data-testid="button-cancel-church"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground" data-testid="text-church-name">
                      {settings?.churchName || 'Clique para adicionar o nome da igreja'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingChurchName(true)}
                      className="h-6 w-6 p-0"
                      data-testid="button-edit-church"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <Card 
            className="p-6 cursor-pointer hover-elevate border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
            onClick={handleGoToProjector}
            data-testid="card-projector"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Projector className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ir para o Projetor</h3>
                  <p className="text-sm text-muted-foreground">Acesse o painel de controle do projetor</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        >
          <Card className="p-6 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Recursos Disponíveis</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className={`p-4 rounded-xl ${feature.color} transition-all duration-300 ${
                      index === currentFeatureIndex ? 'ring-2 ring-primary/50 scale-105' : ''
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: index === currentFeatureIndex ? 1.05 : 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    data-testid={`feature-${feature.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs opacity-70">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
        >
          <Card className="p-6 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Sua Conta</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium" data-testid="text-user-email">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="text-sm font-medium" data-testid="text-user-name">{user?.username || 'Não definido'}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
