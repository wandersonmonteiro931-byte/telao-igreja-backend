import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { FitMode } from '@shared/schema';

interface ImageSettingsProps {
  fitMode: FitMode;
  zoom: number;
  panX: number;
  panY: number;
  onFitModeChange: (mode: FitMode) => void;
  onZoomChange: (zoom: number) => void;
  onPanXChange: (panX: number) => void;
  onPanYChange: (panY: number) => void;
  onReset: () => void;
}

const FIT_MODES = [
  { value: 'contain', label: 'Ajustar - Mostra imagem completa' },
  { value: 'cover', label: 'Estender - Preenche toda a tela' },
  { value: 'stretch', label: 'Esticar - Distorce para preencher' },
  { value: 'crop', label: 'Recortar - Corta as bordas' },
];

export function ImageSettings({
  fitMode,
  zoom,
  panX,
  panY,
  onFitModeChange,
  onZoomChange,
  onPanXChange,
  onPanYChange,
  onReset,
}: ImageSettingsProps) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Ajuste de Imagem</h3>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="fit-mode">Modo de Ajuste</Label>
          <Select value={fitMode} onValueChange={onFitModeChange}>
            <SelectTrigger id="fit-mode" data-testid="select-fit-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIT_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Use "Estender" para preencher toda a tela com a imagem ou vídeo
          </p>
        </div>
      </div>
    </Card>
  );
}
