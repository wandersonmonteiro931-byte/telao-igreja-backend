import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bold, Italic, Underline, Palette, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TextSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, content: string, formatting: TextFormatting) => void;
}

export interface TextFormatting {
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  size: number;
  formattedContent?: string;
}

export function TextSlideDialog({ open, onOpenChange, onSave }: TextSlideDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    applyFormattingToSelection(newColor);
  };

  const applyFormattingToSelection = (selectedColor?: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start === end) return; // Nada selecionado
    
    const selectedText = content.substring(start, end);
    const colorToUse = selectedColor || color;
    
    // Criar span com a cor
    const formattedText = `<span style="color: ${colorToUse};">${selectedText}</span>`;
    
    const newContent = 
      content.substring(0, start) + 
      formattedText + 
      content.substring(end);
    
    setContent(newContent);
  };

  const handleSave = () => {
    if (title.trim() || content.trim()) {
      const formatting: TextFormatting = {
        color,
        backgroundColor,
        bold,
        italic,
        underline,
        size: 72, // Tamanho padrão - será controlado pelo slider global
        formattedContent: content.includes('<span') ? content : undefined,
      };
      onSave(title, content, formatting);
      handleReset();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setColor('#000000');
    setBackgroundColor('#FFFFFF');
    setBold(false);
    setItalic(false);
    setUnderline(false);
  };

  const handleUseDefaultPattern = () => {
    setBold(true);
    setColor('#000000');
    setBackgroundColor('#FFFFFF');
    setItalic(false);
    setUnderline(false);
    // Converte TUDO para maiúsculas
    setContent(content.toUpperCase());
    setTitle(title.toUpperCase());
  };

  const getPreviewStyle = (): React.CSSProperties => {
    return {
      color,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      textDecoration: underline ? 'underline' : 'none',
      fontSize: '16px', // Tamanho fixo para a prévia
      lineHeight: '1.4',
    };
  };

  const renderPreviewContent = () => {
    if (content.includes('<span')) {
      // Renderizar com formatação HTML
      return <div 
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content }} 
        style={getPreviewStyle()}
      />;
    } else {
      // Renderizar texto simples
      return <div className="whitespace-pre-wrap" style={getPreviewStyle()}>{content || 'Digite o texto para ver a prévia...'}</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Slide de Texto</DialogTitle>
          <DialogDescription>
            Adicione letras de músicas, versículos, anúncios ou qualquer texto para exibir no telão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Coluna Esquerda - Edição */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                placeholder="Ex: Hino 123 - Grande é o Senhor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-text-slide-title"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Conteúdo</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseDefaultPattern}
                  data-testid="button-use-default-pattern"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Usar Padrão
                </Button>
              </div>
              <Textarea
                ref={textareaRef}
                id="content"
                placeholder="Digite o texto aqui...&#10;&#10;Você pode usar várias linhas&#10;para letras de músicas ou versículos&#10;&#10;Selecione palavras e escolha cores diferentes!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                data-testid="textarea-text-slide-content"
              />
              <p className="text-xs text-muted-foreground">
                💡 Dica: Selecione palavras e clique em uma cor para aplicar cores diferentes
              </p>
            </div>

            <Separator />

            {/* Controles de Formatação */}
            <div className="space-y-3">
              <Label>Formatação</Label>
              
              {/* Cor do Texto */}
              <div className="flex items-center gap-2">
                <Label htmlFor="text-color" className="min-w-[80px]">Cor texto:</Label>
                <input
                  id="text-color"
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-9 w-20 rounded border cursor-pointer"
                  data-testid="input-text-color"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#000000"
                />
              </div>

              {/* Cor de Fundo */}
              <div className="flex items-center gap-2">
                <Label htmlFor="bg-color" className="min-w-[80px]">Cor fundo:</Label>
                <input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-9 w-20 rounded border cursor-pointer"
                  data-testid="input-bg-color"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>

              {/* Botões de Estilo */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={bold ? 'default' : 'outline'}
                  onClick={() => setBold(!bold)}
                  data-testid="button-bold"
                >
                  <Bold className="w-4 h-4 mr-1" />
                  Negrito
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={italic ? 'default' : 'outline'}
                  onClick={() => setItalic(!italic)}
                  data-testid="button-italic"
                >
                  <Italic className="w-4 h-4 mr-1" />
                  Itálico
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={underline ? 'default' : 'outline'}
                  onClick={() => setUnderline(!underline)}
                  data-testid="button-underline"
                >
                  <Underline className="w-4 h-4 mr-1" />
                  Sublinhado
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                💡 O tamanho do texto será controlado pelo slider em "Slides e texto"
              </p>
            </div>
          </div>

          {/* Coluna Direita - Preview */}
          <div className="space-y-2">
            <Label>Prévia do Telão</Label>
            <div 
              className="rounded-md border border-border p-2 min-h-[160px] flex items-center justify-center text-center overflow-hidden"
              style={{ aspectRatio: '16/9', backgroundColor }}
            >
              <div className="max-w-full px-2">
                {renderPreviewContent()}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Prévia reduzida - no telão será maior
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-text-slide"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() && !content.trim()}
            data-testid="button-save-text-slide"
          >
            Adicionar à Playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
