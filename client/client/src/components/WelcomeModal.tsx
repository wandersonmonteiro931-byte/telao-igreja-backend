import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Monitor, 
  ImageIcon, 
  Type, 
  Radio, 
  Keyboard,
  HelpCircle,
  MessageCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export function WelcomeModal() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">
                Bem-vindo a Equipe da Mídia!
              </DialogTitle>
              <DialogDescription className="sr-only">
                Guia de boas-vindas e orientações de uso da plataforma
              </DialogDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute right-4 top-4"
                data-testid="button-close-welcome"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
            <p className="text-center font-semibold text-lg">
              Este sistema é totalmente GRATUITO!
            </p>
            <p className="text-center text-muted-foreground mt-2">
              Você NÃO deve pagar ninguém para utilizar esta plataforma. 
              Se alguém cobrar pelo uso, denuncie ao suporte.
            </p>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Como usar o sistema:</h3>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Adicione suas mídias</p>
                  <p className="text-sm text-muted-foreground">
                    Arraste imagens ou vídeos para criar sua playlist de apresentação.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Type className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Crie slides de texto</p>
                  <p className="text-sm text-muted-foreground">
                    Use o botão "Novo Slide" para adicionar textos, letras de músicas ou avisos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Inicie a apresentação</p>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão verde pulsante "Iniciar Apresentação" para começar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Aprove as mídias antes de transmitir</p>
                  <p className="text-sm text-muted-foreground">
                    Você deve aprovar as mídias antes de iniciar a transmissão, senão elas não serão exibidas no telão ou projetor.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Conecte ao projetor</p>
                  <p className="text-sm text-muted-foreground">
                    Abra o telão em nova janela e arraste para o monitor do projetor.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Use atalhos de teclado</p>
                  <p className="text-sm text-muted-foreground">
                    Setas para navegar, F para tela cheia, Ctrl+Shift+T para exibir/ocultar telão.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Dúvidas ou encontrou algum erro?</p>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com o suporte no final da página. Estamos aqui para ajudar!
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span>Para ver estas informações novamente, clique no botão de ajuda (?) no canto superior.</span>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleClose}
            data-testid="button-welcome-understood"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
