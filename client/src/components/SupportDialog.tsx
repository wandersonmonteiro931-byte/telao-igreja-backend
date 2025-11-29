import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Send, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SupportDialogProps {
  triggerVariant?: 'button' | 'link' | 'icon';
  triggerClassName?: string;
}

export function SupportDialog({ triggerVariant = 'button', triggerClassName }: SupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/support', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          phone,
          subject,
          message,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erro ao enviar mensagem' }));
        throw new Error(errorData.message || 'Erro ao enviar mensagem');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso. Entraremos em contato em breve.',
      });
      setOpen(false);
      setUsername('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    },
    onError: () => {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate();
  };

  const renderTrigger = () => {
    switch (triggerVariant) {
      case 'link':
        return (
          <button 
            className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${triggerClassName || ''}`}
            data-testid="link-support"
          >
            Suporte
          </button>
        );
      case 'icon':
        return (
          <Button variant="outline" size="icon" data-testid="button-support-icon" className={triggerClassName}>
            <LifeBuoy className="w-4 h-4" />
          </Button>
        );
      default:
        return (
          <Button variant="outline" data-testid="button-support" className={triggerClassName}>
            <LifeBuoy className="w-4 h-4 mr-2" />
            Suporte
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            Contato de Suporte
          </DialogTitle>
          <DialogDescription>
            Envie sua mensagem e entraremos em contato por email ou telefone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-username">Nome *</Label>
            <Input
              id="support-username"
              placeholder="Seu nome completo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitMutation.isPending}
              data-testid="input-support-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email">Email *</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitMutation.isPending}
              data-testid="input-support-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-phone">Telefone *</Label>
            <Input
              id="support-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitMutation.isPending}
              data-testid="input-support-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-subject">Assunto *</Label>
            <Input
              id="support-subject"
              placeholder="Assunto da mensagem"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitMutation.isPending}
              data-testid="input-support-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">Mensagem *</Label>
            <Textarea
              id="support-message"
              placeholder="Descreva sua dúvida ou problema..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitMutation.isPending}
              rows={4}
              className="resize-none"
              data-testid="input-support-message"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitMutation.isPending}
              data-testid="button-support-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              data-testid="button-support-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
