import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  Keyboard, 
  Monitor, 
  ImageIcon, 
  Type,
  Radio,
  Settings,
  Download,
  MessageCircle
} from 'lucide-react';

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" data-testid="button-help">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajuda - Sistema de Apresentações</DialogTitle>
          <DialogDescription>
            Guia completo de uso do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
            <p className="text-center font-semibold">
              Este sistema é totalmente GRATUITO!
            </p>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Você NÃO deve pagar ninguém para utilizar esta plataforma.
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              <h3 className="font-semibold">Iniciar Apresentação</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Clique no botão verde pulsante <strong>"Iniciar Apresentação"</strong> para 
                começar a transmitir para o telão/projetor.
              </p>
              <p>
                Quando ativo, um indicador <strong>"AO VIVO"</strong> será exibido e todas 
                as alterações serão transmitidas em tempo real.
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              <h3 className="font-semibold">Atalhos de Teclado</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Ctrl+Shift+T</span>
                <span>Exibir/Ocultar Telão</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Ctrl+Shift+P</span>
                <span>Pausar/Retomar Transmissão</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">F9</span>
                <span>Pausar/Retomar Reprodução</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Seta →</span>
                <span>Próximo Item</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Seta ←</span>
                <span>Item Anterior</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">F</span>
                <span>Tela Cheia (no telão)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Esc</span>
                <span>Sair da Tela Cheia</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <h3 className="font-semibold">Mídias e Playlist</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Upload:</strong> Arraste arquivos de imagem (JPG, PNG, GIF) ou 
                vídeo (MP4, WebM) para adicionar à playlist.
              </p>
              <p>
                <strong>Organizar:</strong> Arraste os itens na playlist para reorganizá-los 
                na ordem desejada.
              </p>
              <p>
                <strong>Reproduzir:</strong> Clique em um item para selecioná-lo e exibi-lo no telão.
              </p>
              <p>
                <strong>Ajustes:</strong> Use as configurações de zoom, posição e modo de ajuste 
                para cada imagem/vídeo.
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              <h3 className="font-semibold">Slides de Texto</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Novo Slide:</strong> Clique em "Novo Slide" para criar um slide de texto 
                com fundo personalizável.
              </p>
              <p>
                <strong>Formatação:</strong> Ajuste cor do texto, fundo, tamanho da fonte, 
                negrito, itálico e sublinhado.
              </p>
              <p>
                <strong>Auto-ajuste:</strong> Ative o ajuste automático para que o texto 
                preencha a tela proporcionalmente.
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              <h3 className="font-semibold">Conectar ao Projetor (HDMI)</h3>
            </div>
            <Separator />
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Passo 1: Conectar o Cabo</p>
                <p className="text-muted-foreground">
                  Conecte o cabo HDMI do computador ao projetor. O sistema
                  operacional deve detectar automaticamente o segundo monitor.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Passo 2: Abrir Telão</p>
                <p className="text-muted-foreground">
                  Clique no botão "Abrir Telão em Nova Janela" para abrir a
                  janela de projeção.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Passo 3: Mover para Projetor</p>
                <p className="text-muted-foreground">
                  Arraste a janela do telão para o monitor secundário (projetor)
                  e pressione F ou clique no botão para entrar em tela cheia.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Passo 4: Controlar</p>
                <p className="text-muted-foreground">
                  Use a janela principal para controlar o que aparece no projetor.
                  O telão é sincronizado automaticamente.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">Recursos Especiais</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Modo de Espera:</strong> Exibe uma tela escura com mensagem personalizada, 
                ideal para momentos de silêncio ou oração.
              </p>
              <p>
                <strong>Tela Preta:</strong> Escurece completamente o telão quando necessário.
              </p>
              <p>
                <strong>Pausar Transmissão:</strong> Congela a imagem atual no telão enquanto 
                você prepara o próximo conteúdo.
              </p>
              <p>
                <strong>Logotipo:</strong> Adicione o logotipo da sua igreja para exibir 
                sobre as apresentações.
              </p>
              <p>
                <strong>Reprodução Automática:</strong> Configure o tempo de exibição de cada 
                slide para apresentações automáticas.
              </p>
              <p>
                <strong>Loop de Vídeo:</strong> Configure vídeos para repetir automaticamente.
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <h3 className="font-semibold">Salvar e Carregar</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Salvar Playlist:</strong> Exporte sua playlist completa como arquivo 
                para usar em outro momento ou computador.
              </p>
              <p>
                <strong>Carregar Playlist:</strong> Importe uma playlist salva anteriormente.
              </p>
              <p>
                <strong>Backup Automático:</strong> O sistema salva automaticamente sua 
                última playlist no navegador.
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Dicas Importantes</h3>
            <Separator />
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              <li>Use navegador Chrome ou Edge para melhor compatibilidade</li>
              <li>Permita autoplay de mídia quando solicitado pelo navegador</li>
              <li>Exporte suas playlists regularmente como backup</li>
              <li>Teste a conexão com o projetor antes do evento</li>
              <li>Mantenha imagens em boa resolução (1920x1080 recomendado)</li>
              <li>Vídeos em formato MP4 H.264 têm melhor compatibilidade</li>
            </ul>
          </Card>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
