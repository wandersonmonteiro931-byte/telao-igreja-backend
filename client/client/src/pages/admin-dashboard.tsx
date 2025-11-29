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
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { authenticatedFetch, clearAuthTokens } from '@/lib/api';
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
  Send
} from 'lucide-react';
import type { Announcement, AnnouncementType, SupportTicket } from '@shared/schema';

interface User {
  id: number;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  failedAttempts: number;
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
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [usersRes, logsRes, announcementsRes, supportRes] = await Promise.all([
        authenticatedFetch('/api/admin/users'),
        authenticatedFetch('/api/admin/login-attempts?limit=50'),
        authenticatedFetch('/api/admin/announcements'),
        authenticatedFetch('/api/admin/support'),
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  const handleLogout = () => {
    clearAuthTokens();
    toast({
      title: 'Desconectado',
      description: 'Você foi desconectado com sucesso',
    });
    setLocation('/login');
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
        toast({ title: 'Anúncio criado com sucesso' });
        setShowAnnouncementForm(false);
        setAnnouncementForm(initialAnnouncementForm);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao criar anúncio', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao criar anúncio', variant: 'destructive' });
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
        toast({ title: 'Anúncio atualizado com sucesso' });
        setEditingAnnouncement(null);
        setAnnouncementForm(initialAnnouncementForm);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: data.message || 'Erro ao atualizar anúncio', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao atualizar anúncio', variant: 'destructive' });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Anúncio excluído com sucesso' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Erro ao excluir anúncio', variant: 'destructive' });
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
                <p className="text-xs text-muted-foreground">Logins Hoje</p>
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
              <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
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
                        {u.id !== user?.id && (
                          <div className="flex items-center justify-end gap-1">
                            {u.isBlocked ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblockUser(u.id)}
                                data-testid={`button-unblock-${u.id}`}
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                Desbloquear
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleBlockUser(u.id)}
                                data-testid={`button-block-${u.id}`}
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Bloquear
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              data-testid={`button-delete-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

        {activeTab === 'announcements' && (
          <div className="space-y-4">
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
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Título da notícia"
                        data-testid="input-announcement-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea
                        id="content"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm(f => ({ ...f, content: e.target.value }))}
                        placeholder="Conteúdo da notícia"
                        rows={3}
                        data-testid="input-announcement-content"
                      />
                    </div>
                    {announcementForm.type === 'image' && (
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL da Imagem</Label>
                        <Input
                          id="imageUrl"
                          value={announcementForm.imageUrl}
                          onChange={(e) => setAnnouncementForm(f => ({ ...f, imageUrl: e.target.value }))}
                          placeholder="https://exemplo.com/imagem.jpg"
                          data-testid="input-announcement-image-url"
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
                          placeholder="https://exemplo.com/video.mp4"
                          data-testid="input-announcement-video-url"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancelEdit} data-testid="button-cancel-announcement">
                        Cancelar
                      </Button>
                      <Button 
                        onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                        data-testid="button-save-announcement"
                      >
                        {editingAnnouncement ? 'Salvar Alterações' : 'Criar Notícia'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma notícia cadastrada</p>
                  <p className="text-sm">Clique em "Nova Notícia" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => {
                    const TypeIcon = getAnnouncementTypeIcon(announcement.type);
                    return (
                      <div 
                        key={announcement.id} 
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        data-testid={`card-admin-announcement-${announcement.id}`}
                      >
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
                                <Badge variant="outline" className="text-xs">
                                  {announcement.type === 'text' ? 'Texto' : announcement.type === 'image' ? 'Imagem' : 'Vídeo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                              {announcement.imageUrl && (
                                <img 
                                  src={announcement.imageUrl} 
                                  alt={announcement.title}
                                  className="mt-2 rounded-lg max-w-xs max-h-24 object-cover"
                                />
                              )}
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              data-testid={`button-delete-announcement-${announcement.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'logs' && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <h2 className="text-lg font-bold">Histórico de Logins</h2>
              <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh-logs">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email/Usuário</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">IP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-log-${attempt.id}`}>
                      <td className="p-3">
                        {attempt.success ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Sucesso</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="w-4 h-4" />
                            <span>Falha</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium">{attempt.email}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">
                        {attempt.ipAddress || 'N/A'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(attempt.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-1">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold">Tickets de Suporte</h2>
                <Button variant="ghost" size="sm" onClick={fetchData} data-testid="button-refresh-support">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {supportTickets.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum ticket de suporte encontrado.
                </p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setTicketResponse(ticket.adminResponse || '');
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      data-testid={`ticket-item-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.username} - {ticket.email}
                          </p>
                        </div>
                        <Badge
                          variant={
                            ticket.status === 'pending'
                              ? 'destructive'
                              : ticket.status === 'in-progress'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {ticket.status === 'pending'
                            ? 'Pendente'
                            : ticket.status === 'in-progress'
                            ? 'Em andamento'
                            : 'Resolvido'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 lg:col-span-2">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedTicket.email}
                        </span>
                        {selectedTicket.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedTicket.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={async (value) => {
                          try {
                            const res = await authenticatedFetch(`/api/admin/support/${selectedTicket.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ status: value }),
                            });
                            if (res.ok) {
                              fetchData();
                              setSelectedTicket({ ...selectedTicket, status: value as any });
                              toast({
                                title: 'Status atualizado',
                                description: 'O status do ticket foi atualizado.',
                              });
                            }
                          } catch (error) {
                            toast({
                              title: 'Erro',
                              description: 'Não foi possível atualizar o status.',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px]" data-testid="select-ticket-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in-progress">Em andamento</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            const res = await authenticatedFetch(`/api/admin/support/${selectedTicket.id}`, {
                              method: 'DELETE',
                            });
                            if (res.ok) {
                              fetchData();
                              setSelectedTicket(null);
                              toast({
                                title: 'Ticket excluído',
                                description: 'O ticket foi excluído com sucesso.',
                              });
                            }
                          } catch (error) {
                            toast({
                              title: 'Erro',
                              description: 'Não foi possível excluir o ticket.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        data-testid="button-delete-ticket"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mensagem do usuário:</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="ticket-response" className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4" />
                      Resposta do administrador
                    </Label>
                    <Textarea
                      id="ticket-response"
                      placeholder="Escreva sua resposta aqui... O usuário receberá esta resposta por email ou telefone."
                      value={ticketResponse}
                      onChange={(e) => setTicketResponse(e.target.value)}
                      rows={4}
                      className="resize-none"
                      data-testid="textarea-ticket-response"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTicketResponse(selectedTicket.adminResponse || '');
                        }}
                        data-testid="button-cancel-response"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const res = await authenticatedFetch(`/api/admin/support/${selectedTicket.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
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
                    <p className="mt-1">
                      Para contatar o usuário, use:{' '}
                      <a href={`mailto:${selectedTicket.email}`} className="text-primary hover:underline">
                        {selectedTicket.email}
                      </a>
                      {selectedTicket.phone && (
                        <>
                          {' '}ou{' '}
                          <a href={`tel:${selectedTicket.phone}`} className="text-primary hover:underline">
                            {selectedTicket.phone}
                          </a>
                        </>
                      )}
                    </p>
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
    </div>
  );
}
