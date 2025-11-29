import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import type { TextOverlay } from '@shared/schema';

interface TextOverlayEditorProps {
  overlay: TextOverlay;
  onChange: (overlay: TextOverlay) => void;
}

export function TextOverlayEditor({ overlay, onChange }: TextOverlayEditorProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Overlay de Texto</h3>
        <Switch
          checked={overlay.visible}
          onCheckedChange={(visible) => onChange({ ...overlay, visible })}
          data-testid="switch-overlay-visible"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={overlay.title || ''}
            onChange={(e) => onChange({ ...overlay, title: e.target.value })}
            placeholder="Digite o título..."
            data-testid="input-title"
          />
        </div>

        <div>
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input
            id="subtitle"
            value={overlay.subtitle || ''}
            onChange={(e) => onChange({ ...overlay, subtitle: e.target.value })}
            placeholder="Digite o subtítulo..."
            data-testid="input-subtitle"
          />
        </div>

        <div>
          <Label htmlFor="content">Conteúdo</Label>
          <Textarea
            id="content"
            value={overlay.content || ''}
            onChange={(e) => onChange({ ...overlay, content: e.target.value })}
            placeholder="Digite o conteúdo..."
            rows={4}
            data-testid="textarea-content"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>Posição Horizontal ({overlay.position.x}%)</Label>
          <Slider
            value={[overlay.position.x]}
            onValueChange={([x]) =>
              onChange({
                ...overlay,
                position: { ...overlay.position, x },
              })
            }
            min={0}
            max={100}
            step={1}
            data-testid="slider-position-x"
          />
        </div>

        <div>
          <Label>Posição Vertical ({overlay.position.y}%)</Label>
          <Slider
            value={[overlay.position.y]}
            onValueChange={([y]) =>
              onChange({
                ...overlay,
                position: { ...overlay.position, y },
              })
            }
            min={0}
            max={100}
            step={1}
            data-testid="slider-position-y"
          />
        </div>
      </div>
    </Card>
  );
}
