import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { authenticatedFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import equipeLogoPath from '@assets/Blue Channel Podcast Multimedia Stream Tv icon logo (3)_1764125660966.png';
import { 
  LogOut, 
  Settings, 
  Users, 
  Shield, 
  Activity,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Bell,
  Plus,
  Edit2,
  Image,
  Video,
  FileText,
  X,
  LifeBuoy,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Eye,
  Key,
  UserPlus,
  History,
  User,
  Save
} from 'lucide-react';
import type { Announcement, AnnouncementType, SupportTicket, SystemSettings } from '@shared/schema';

interface UserData {
  id: number;
  email: string;
  username: string;
  phone?: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  failedAttempts: number;
  lastFailedAttempt?: string;
  securityQuestion1?: string;
  securityQuestion2?: string;
  securityQuestion3?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginAttempt {
  id: number;
  userId: number | null;
  email: string;
  ipAddress: string | null;
  success: boolean;
  userAgent: string | null;
  createdAt: string;
}

interface AnnouncementForm {
  type: AnnouncementType;
  title: string;
  content: string;
  imageUrl: string;
  videoUrl: string;
  active: boolean;
}

const initialAnnouncementForm: AnnouncementForm = {
  type: 'text',
  title: '',
  content: '',
  imageUrl: '',
  videoUrl: '',
  active: true,
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout: contextLogout } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'announcements' | 'support'>('users');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(initialAnnouncementForm);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketResponse, setTicketResponse] = useState('');
  const [slideshowInterval, setSlideshowInterval] = useState(5);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modais de gestão de usuários
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUserLogs, setShowUserLogs] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [userLoginAttempts, setUserLoginAttempts] = useState<LoginAttempt[]>([]);

  // Forms
  const [editForm, setEditForm] = useState({
    email: '',
    username: '',
    phone: '',
    role: 'user' as 'admin' | 'user',
    securityQuestion1: '',
    securityQuestion2: '',
    securityQuestion3: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [createAdminForm, setCreateAdminForm] = useState({
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    securityQuestion1: 'Qual é o nome do seu primeiro pet?',
    securityAnswer1: '',
    securityQuestion2: 'Em que cidade você nasceu?',
    securityAnswer2: '',
    securityQuestion3: 'Qual é o nome da sua mãe?',
    securityAnswer3: '',
  });

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [usersRes, logsRes, announcementsRes, supportRes, settingsRes] = await Promise.all([
        authenticatedFetch('/api/admin/users'),
        authenticatedFetch('/api/admin/login-attempts?limit=100'),
        authenticatedFetch('/api/admin/announcements'),
        authenticatedFetch('/api/admin/support'),
        authenticatedFetch('/api/system-settings'),
      ]);

      if (usersRes.status === 401) {
        toast({ title: 'Sessão expirada', description: 'Faça login novamente', variant: 'destructive' });
        clearAuthTokens();
        setLocation('/login');
        return;
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLoginAttempts(data);
      }

      if (announcementsRes.ok) {
        const data = await announcementsRes.json();
        setAnnouncements(data);
      }

      if (supportRes.ok) {
        const data = await supportRes.json();
        setSupportTickets(data);
      }

      if (settingsRes.ok) {
        const data: SystemSettings = await settingsRes.json();
        setSlideshowInterval(data.slideshowInterval / 1000);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSaveSlideshowInterval = async () => {
    setIsSavingSettings(true);
    try {
      const response = await authenticatedFetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideshowInterval: slideshowInterval * 1000 }),
      });

      if (response.ok) {
        toast({ title: 'Configurações salvas', description: 'O tempo do slideshow foi atualizado.' });
      } else {
        const data = await response.json();
        toast({ title: 'Erro', description: data.message || 'Erro ao salvar configurações', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (!userStr || !token) {
        setLocation('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      if (userData.role !== 'admin') {
        setLocation('/access-denied');
        return;
      }

      setUser(userData);
      await fetchData();
      setIsLoading(false);
    };

    checkAuth();
  }, [setLocation]);

  const handleLogout = async () => {
    await contextLogout();
    toast({
      title: 'Desconectado',
      description: 'Você foi desconectado com sucesso',
    });
    // Reload page to ensure clean state
    window.location.href = '/login';
  };

  const handleBlockUser = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({ title: 'Usuário bloqueado' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro ao bloquear usuário', variant: 'destructive' });
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}/unblock`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({ title: 'Usuário desbloqueado' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro ao desbloquear usuário', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Usuário excluído com sucesso' });
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao excluir usuário', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao excluir usuário', variant: 'destructive' });
    }
  };

  const handleViewUserDetails = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setShowUserDetails(true);
      } else {
        toast({ title: 'Erro ao buscar detalhes do usuário', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar detalhes do usuário', variant: 'destructive' });
    }
  };

  const handleOpenEditUser = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setEditForm({
          email: userData.email,
          username: userData.username,
          phone: userData.phone || '',
          role: userData.role,
          securityQuestion1: userData.securityQuestion1 || '',
          securityQuestion2: userData.securityQuestion2 || '',
          securityQuestion3: userData.securityQuestion3 || '',
        });
        setShowEditUser(true);
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao buscar dados do usuário', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({ title: 'Erro ao buscar dados do usuário', variant: 'destructive' });
    }
  };

  const handleSaveEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await authenticatedFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast({ title: 'Usuário atualizado com sucesso' });
        setShowEditUser(false);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao atualizar usuário', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao atualizar usuário', variant: 'destructive' });
    }
  };

  const handleOpenResetPassword = (userData: UserData) => {
    setSelectedUser(userData);
    setNewPassword('');
    setConfirmPassword('');
    setShowResetPassword(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        toast({ title: 'Senha alterada com sucesso' });
        setShowResetPassword(false);
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao resetar senha', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao resetar senha', variant: 'destructive' });
    }
  };

  const handleViewUserLogs = async (userId: number) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}/login-attempts?limit=100`);
      if (response.ok) {
        const logs = await response.json();
        setUserLoginAttempts(logs);
        const userData = users.find(u => u.id === userId);
        setSelectedUser(userData || null);
        setShowUserLogs(true);
      } else {
        toast({ title: 'Erro ao buscar logs do usuário', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar logs do usuário', variant: 'destructive' });
    }
  };

  const handleCreateAdmin = async () => {
    if (!createAdminForm.email || !createAdminForm.username || !createAdminForm.password) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (createAdminForm.password.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (createAdminForm.password !== createAdminForm.confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    try {
      const response = await authenticatedFetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createAdminForm.email,
          username: createAdminForm.username,
          phone: createAdminForm.phone,
          password: createAdminForm.password,
          securityQuestion1: createAdminForm.securityQuestion1,
          securityAnswer1: createAdminForm.securityAnswer1,
          securityQuestion2: createAdminForm.securityQuestion2,
          securityAnswer2: createAdminForm.securityAnswer2,
          securityQuestion3: createAdminForm.securityQuestion3,
          securityAnswer3: createAdminForm.securityAnswer3,
        }),
      });

      if (response.ok) {
        toast({ title: 'Administrador criado com sucesso' });
        setShowCreateAdmin(false);
        setCreateAdminForm({
          email: '',
          username: '',
          phone: '',
          password: '',
          confirmPassword: '',
          securityQuestion1: 'Qual é o nome do seu primeiro pet?',
          securityAnswer1: '',
          securityQuestion2: 'Em que cidade você nasceu?',
          securityAnswer2: '',
          securityQuestion3: 'Qual é o nome da sua mãe?',
          securityAnswer3: '',
        });
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao criar administrador', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao criar administrador', variant: 'destructive' });
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementForm),
      });
      if (response.ok) {
        toast({ title: 'Notícia criada com sucesso' });
        setShowAnnouncementForm(false);
        setAnnouncementForm(initialAnnouncementForm);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao criar notícia', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao criar notícia', variant: 'destructive' });
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    
    try {
      const response = await authenticatedFetch(`/api/admin/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementForm),
      });
      if (response.ok) {
        toast({ title: 'Notícia atualizada com sucesso' });
        setEditingAnnouncement(null);
        setAnnouncementForm(initialAnnouncementForm);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao atualizar notícia', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao atualizar notícia', variant: 'destructive' });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Notícia excluída com sucesso' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro ao excluir notícia', variant: 'destructive' });
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      type: announcement.type,
      title: announcement.title,
      content: announcement.content,
      imageUrl: announcement.imageUrl || '',
      videoUrl: announcement.videoUrl || '',
      active: announcement.active,
    });
    setShowAnnouncementForm(false);
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setShowAnnouncementForm(false);
    setAnnouncementForm(initialAnnouncementForm);
  };

  const getAnnouncementTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Botões flutuantes */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout" className="h-7 px-2 text-xs bg-background/80 backdrop-blur-sm">
          <LogOut className="w-3 h-3 mr-1" />
          Sair
        </Button>
      </div>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Imagem da equipe */}
        <div className="flex justify-center">
          <img 
            src={equipeLogoPath} 
            alt="Equipe da Mídia" 
            className="h-24 object-contain"
            data-testid="img-equipe-midia"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total de Usuários</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-xs text-muted-foreground">Administradores</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.isBlocked).length}</p>
                <p className="text-xs text-muted-foreground">Bloqueados</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loginAttempts.filter(a => a.success).length}</p>
                <p className="text-xs text-muted-foreground">Logins Recentes</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 border-b flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-users"
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'announcements'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-announcements"
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Últimas Notícias
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-logs"
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Logs de Acesso
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'support'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-support"
          >
            <LifeBuoy className="w-4 h-4 inline mr-2" />
            Suporte
            {supportTickets.filter(t => t.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {supportTickets.filter(t => t.status === 'pending').length}
              </Badge>
            )}
          </button>
        </div>

        {activeTab === 'users' && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-bold">Gerenciamento de Usuários</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button size="sm" onClick={() => setShowCreateAdmin(true)} data-testid="button-create-admin">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Admin
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Perfil</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-user-${u.id}`}>
                      <td className="p-3 font-medium">{u.username}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {u.isBlocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUserDetails(u.id)}
                            title="Ver detalhes"
                            data-testid={`button-view-${u.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditUser(u.id)}
                            title="Editar"
                            data-testid={`button-edit-${u.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResetPassword(u)}
                            title="Resetar senha"
                            data-testid={`button-reset-password-${u.id}`}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUserLogs(u.id)}
                            title="Ver logs"
                            data-testid={`button-logs-${u.id}`}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {u.id !== user?.id && (
                            <>
                              {u.isBlocked ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUnblockUser(u.id)}
                                  title="Desbloquear"
                                  data-testid={`button-unblock-${u.id}`}
                                >
                                  <Unlock className="w-4 h-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleBlockUser(u.id)}
                                  title="Bloquear"
                                  data-testid={`button-block-${u.id}`}
                                >
                                  <Lock className="w-4 h-4 text-orange-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                title="Excluir"
                                data-testid={`button-delete-${u.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-bold">Configurações do Slideshow</h2>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="slideshowInterval" className="whitespace-nowrap">Tempo entre slides:</Label>
                  <Input
                    id="slideshowInterval"
                    type="number"
                    min="1"
                    max="30"
                    value={slideshowInterval}
                    onChange={(e) => setSlideshowInterval(Number(e.target.value))}
                    className="w-20"
                    data-testid="input-slideshow-interval"
                  />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSaveSlideshowInterval}
                  disabled={isSavingSettings}
                  data-testid="button-save-slideshow-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingSettings ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Define o tempo que cada notícia permanece visível no slideshow para os usuários.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h2 className="text-lg font-bold">Gerenciamento de Notícias</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh-announcements">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setShowAnnouncementForm(true);
                      setEditingAnnouncement(null);
                      setAnnouncementForm(initialAnnouncementForm);
                    }}
                    data-testid="button-new-announcement"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Notícia
                  </Button>
                </div>
              </div>

              {(showAnnouncementForm || editingAnnouncement) && (
                <Card className="p-4 mb-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {editingAnnouncement ? 'Editar Notícia' : 'Nova Notícia'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit} data-testid="button-cancel-form">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select 
                          value={announcementForm.type} 
                          onValueChange={(value: AnnouncementType) => setAnnouncementForm(f => ({ ...f, type: value }))}
                        >
                          <SelectTrigger data-testid="select-announcement-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="active"
                          checked={announcementForm.active}
                          onCheckedChange={(checked) => setAnnouncementForm(f => ({ ...f, active: checked }))}
                          data-testid="switch-announcement-active"
                        />
                        <Label htmlFor="active">Ativo</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Título (suporta emojis)</Label>
                      <Input
                        id="title"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Título da notícia 📢"
                        data-testid="input-announcement-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo (suporta emojis)</Label>
                      <Textarea
                        id="content"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm(f => ({ ...f, content: e.target.value }))}
                        placeholder="Digite o conteúdo da notícia... Você pode usar emojis! 🎉✨🙏"
                        rows={4}
                        data-testid="input-announcement-content"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dica: Use emojis para tornar suas notícias mais atrativas! Copie e cole emojis de sites como emojipedia.org
                      </p>
                    </div>
                    {announcementForm.type === 'image' && (
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL da Imagem</Label>
                        <Input
                          id="imageUrl"
                          value={announcementForm.imageUrl}
                          onChange={(e) => setAnnouncementForm(f => ({ ...f, imageUrl: e.target.value }))}
                          placeholder="https://..."
                          data-testid="input-announcement-image"
                        />
                      </div>
                    )}
                    {announcementForm.type === 'video' && (
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">URL do Vídeo</Label>
                        <Input
                          id="videoUrl"
                          value={announcementForm.videoUrl}
                          onChange={(e) => setAnnouncementForm(f => ({ ...f, videoUrl: e.target.value }))}
                          placeholder="https://..."
                          data-testid="input-announcement-video"
                        />
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button 
                        onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                        data-testid="button-save-announcement"
                      >
                        {editingAnnouncement ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma notícia cadastrada</p>
                ) : (
                  announcements.map((announcement) => {
                    const TypeIcon = getAnnouncementTypeIcon(announcement.type);
                    return (
                      <Card key={announcement.id} className="p-4" data-testid={`announcement-${announcement.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <TypeIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{announcement.title}</h4>
                                <Badge variant={announcement.active ? 'default' : 'secondary'}>
                                  {announcement.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Criado em: {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAnnouncement(announcement)}
                              data-testid={`button-edit-announcement-${announcement.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              data-testid={`button-delete-announcement-${announcement.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-bold">Logs de Acesso</h2>
              <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh-logs">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">IP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-log-${attempt.id}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {new Date(attempt.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="p-3">{attempt.email}</td>
                      <td className="p-3 text-muted-foreground">{attempt.ipAddress || '-'}</td>
                      <td className="p-3">
                        {attempt.success ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Sucesso
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="w-4 h-4" />
                            Falhou
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold">Tickets de Suporte</h2>
                <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh-support">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {supportTickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum ticket de suporte</p>
                  ) : (
                    supportTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={`p-3 cursor-pointer hover-elevate ${
                          selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setTicketResponse(ticket.adminResponse || '');
                        }}
                        data-testid={`ticket-${ticket.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">{ticket.username}</p>
                          </div>
                          <Badge
                            variant={
                              ticket.status === 'pending' ? 'destructive' :
                              ticket.status === 'resolved' ? 'default' : 'secondary'
                            }
                          >
                            {ticket.status === 'pending' ? 'Pendente' :
                             ticket.status === 'resolved' ? 'Resolvido' :
                             ticket.status === 'in_progress' ? 'Em andamento' : 'Fechado'}
                          </Badge>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-bold mb-4">Detalhes do Ticket</h2>
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTicket.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedTicket.email}`} className="text-primary hover:underline">
                        {selectedTicket.email}
                      </a>
                    </div>
                    {selectedTicket.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedTicket.phone}`} className="text-primary hover:underline">
                          {selectedTicket.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">{selectedTicket.subject}</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Resposta do Admin</Label>
                    <Textarea
                      value={ticketResponse}
                      onChange={(e) => setTicketResponse(e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={4}
                      data-testid="input-ticket-response"
                    />
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          const res = await authenticatedFetch(`/api/admin/support/${selectedTicket.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              adminResponse: ticketResponse,
                              status: 'resolved',
                            }),
                          });
                          if (res.ok) {
                            fetchData();
                            setSelectedTicket({
                              ...selectedTicket,
                              adminResponse: ticketResponse,
                              status: 'resolved',
                            });
                            toast({
                              title: 'Resposta salva',
                              description: 'A resposta foi salva e o ticket foi marcado como resolvido.',
                            });
                          }
                        } catch (error) {
                          toast({
                            title: 'Erro',
                            description: 'Não foi possível salvar a resposta.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      data-testid="button-save-response"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Salvar Resposta
                    </Button>
                  </div>

                  {selectedTicket.adminResponse && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                        Resposta enviada:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                      {selectedTicket.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Respondido em: {new Date(selectedTicket.respondedAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Criado em: {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <LifeBuoy className="w-12 h-12 mb-4 opacity-50" />
                  <p>Selecione um ticket para ver os detalhes</p>
                </div>
              )}
            </Card>
          </div>
        )}

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Informações do Sistema</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Versão</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold text-green-600">Operacional</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ambiente</p>
              <p className="font-semibold">Produção</p>
            </div>
            <div>
              <p className="text-muted-foreground">Segurança</p>
              <p className="font-semibold">JWT + BCrypt</p>
            </div>
          </div>
        </Card>
      </main>

      {/* Modal Ver Detalhes do Usuário */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="w-[95vw] max-w-lg p-0">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Detalhes do Usuário
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="overflow-y-auto px-6 pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="font-medium">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Perfil</p>
                      <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedUser.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Nome de Usuário</p>
                      <p className="font-medium">{selectedUser.username}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedUser.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      {selectedUser.isBlocked ? (
                        <Badge variant="destructive">Bloqueado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tentativas Falhas</p>
                      <p className="font-medium">{selectedUser.failedAttempts}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Perguntas de Segurança</p>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Pergunta 1</p>
                        <p>{selectedUser.securityQuestion1 || 'Não definida'}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Pergunta 2</p>
                        <p>{selectedUser.securityQuestion2 || 'Não definida'}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-muted-foreground text-xs">Pergunta 3</p>
                        <p>{selectedUser.securityQuestion3 || 'Não definida'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      As respostas são criptografadas e não podem ser visualizadas.
                    </p>
                  </div>

                  <div className="border-t pt-4 text-xs text-muted-foreground">
                    <p>Criado em: {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}</p>
                    <p>Atualizado em: {new Date(selectedUser.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuário */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="w-[95vw] max-w-lg p-0">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome de Usuário</Label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                    data-testid="input-edit-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    data-testid="input-edit-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={editForm.role} onValueChange={(value: 'admin' | 'user') => setEditForm(f => ({ ...f, role: value }))}>
                    <SelectTrigger data-testid="select-edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pergunta de Segurança 1</Label>
                  <Input
                    value={editForm.securityQuestion1}
                    onChange={(e) => setEditForm(f => ({ ...f, securityQuestion1: e.target.value }))}
                    data-testid="input-edit-sq1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta de Segurança 2</Label>
                  <Input
                    value={editForm.securityQuestion2}
                    onChange={(e) => setEditForm(f => ({ ...f, securityQuestion2: e.target.value }))}
                    data-testid="input-edit-sq2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pergunta de Segurança 3</Label>
                  <Input
                    value={editForm.securityQuestion3}
                    onChange={(e) => setEditForm(f => ({ ...f, securityQuestion3: e.target.value }))}
                    data-testid="input-edit-sq3"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-4">
              <Button variant="outline" onClick={() => setShowEditUser(false)}>Cancelar</Button>
              <Button onClick={handleSaveEditUser} data-testid="button-save-edit">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Resetar Senha */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="w-[95vw] max-w-lg p-0">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Resetar Senha
              </DialogTitle>
              <DialogDescription>
                Definir nova senha para {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-4">
              <Button variant="outline" onClick={() => setShowResetPassword(false)}>Cancelar</Button>
              <Button onClick={handleResetPassword} data-testid="button-reset-password">
                <Key className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Logs do Usuário */}
      <Dialog open={showUserLogs} onOpenChange={setShowUserLogs}>
        <DialogContent className="w-[95vw] max-w-2xl p-0">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Login - {selectedUser?.username}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              {userLoginAttempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de login encontrado</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data/Hora</th>
                      <th className="text-left p-2">IP</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLoginAttempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b">
                        <td className="p-2">{new Date(attempt.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="p-2 text-muted-foreground">{attempt.ipAddress || '-'}</td>
                        <td className="p-2">
                          {attempt.success ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Login
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Falhou
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Admin */}
      <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
        <DialogContent className="w-[95vw] max-w-lg p-0">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Criar Novo Administrador
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={createAdminForm.email}
                    onChange={(e) => setCreateAdminForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@exemplo.com"
                    data-testid="input-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome de Usuário *</Label>
                  <Input
                    value={createAdminForm.username}
                    onChange={(e) => setCreateAdminForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="nome_usuario"
                    data-testid="input-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={createAdminForm.phone}
                    onChange={(e) => setCreateAdminForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    data-testid="input-admin-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input
                    type="password"
                    value={createAdminForm.password}
                    onChange={(e) => setCreateAdminForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    data-testid="input-admin-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha *</Label>
                  <Input
                    type="password"
                    value={createAdminForm.confirmPassword}
                    onChange={(e) => setCreateAdminForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Digite novamente"
                    data-testid="input-admin-confirm-password"
                  />
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Perguntas de Segurança</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Pergunta 1</Label>
                      <Input
                        value={createAdminForm.securityQuestion1}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityQuestion1: e.target.value }))}
                        placeholder="Pergunta"
                        data-testid="input-admin-sq1"
                      />
                      <Input
                        value={createAdminForm.securityAnswer1}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityAnswer1: e.target.value }))}
                        placeholder="Resposta"
                        data-testid="input-admin-sa1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pergunta 2</Label>
                      <Input
                        value={createAdminForm.securityQuestion2}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityQuestion2: e.target.value }))}
                        placeholder="Pergunta"
                        data-testid="input-admin-sq2"
                      />
                      <Input
                        value={createAdminForm.securityAnswer2}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityAnswer2: e.target.value }))}
                        placeholder="Resposta"
                        data-testid="input-admin-sa2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pergunta 3</Label>
                      <Input
                        value={createAdminForm.securityQuestion3}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityQuestion3: e.target.value }))}
                        placeholder="Pergunta"
                        data-testid="input-admin-sq3"
                      />
                      <Input
                        value={createAdminForm.securityAnswer3}
                        onChange={(e) => setCreateAdminForm(f => ({ ...f, securityAnswer3: e.target.value }))}
                        placeholder="Resposta"
                        data-testid="input-admin-sa3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-4">
              <Button variant="outline" onClick={() => setShowCreateAdmin(false)}>Cancelar</Button>
              <Button onClick={handleCreateAdmin} data-testid="button-create-admin-submit">
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Admin
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
