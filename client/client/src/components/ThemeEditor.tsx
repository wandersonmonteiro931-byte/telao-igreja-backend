import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Theme } from '@shared/schema';

interface ThemeEditorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  onSave: () => void;
}

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
];

const FONT_WEIGHTS = [
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Médio' },
  { value: '600', label: 'Semi-Negrito' },
  { value: '700', label: 'Negrito' },
];

const TEXT_ALIGNS = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

export function ThemeEditor({ theme, onChange, onSave }: ThemeEditorProps) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Editor de Tema</h3>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label htmlFor="theme-name">Nome do Tema</Label>
          <Input
            id="theme-name"
            value={theme.name}
            onChange={(e) => onChange({ ...theme, name: e.target.value })}
            data-testid="input-theme-name"
          />
        </div>

        <div>
          <Label htmlFor="font-family">Fonte</Label>
          <Select
            value={theme.fontFamily}
            onValueChange={(fontFamily) => onChange({ ...theme, fontFamily })}
          >
            <SelectTrigger id="font-family" data-testid="select-font-family">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="font-size">Tamanho</Label>
            <Input
              id="font-size"
              type="number"
              min={12}
              max={120}
              value={theme.fontSize}
              onChange={(e) =>
                onChange({ ...theme, fontSize: parseInt(e.target.value) || 24 })
              }
              data-testid="input-font-size"
            />
          </div>

          <div>
            <Label htmlFor="font-weight">Peso</Label>
            <Select
              value={theme.fontWeight}
              onValueChange={(fontWeight) => onChange({ ...theme, fontWeight })}
            >
              <SelectTrigger id="font-weight" data-testid="select-font-weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value}>
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="text-align">Alinhamento</Label>
          <Select
            value={theme.textAlign}
            onValueChange={(textAlign: 'left' | 'center' | 'right') =>
              onChange({ ...theme, textAlign })
            }
          >
            <SelectTrigger id="text-align" data-testid="select-text-align">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEXT_ALIGNS.map((align) => (
                <SelectItem key={align.value} value={align.value}>
                  {align.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Cor do Texto</Label>
          <Input
            id="color"
            type="color"
            value={theme.color}
            onChange={(e) => onChange({ ...theme, color: e.target.value })}
            data-testid="input-color"
          />
        </div>

        <div>
          <Label htmlFor="bg-color">Cor de Fundo (Opcional)</Label>
          <Input
            id="bg-color"
            type="color"
            value={theme.backgroundColor || '#00000000'}
            onChange={(e) =>
              onChange({ ...theme, backgroundColor: e.target.value })
            }
            data-testid="input-bg-color"
          />
        </div>

        <div>
          <Label htmlFor="text-shadow">Sombra (CSS)</Label>
          <Input
            id="text-shadow"
            value={theme.textShadow || ''}
            onChange={(e) => onChange({ ...theme, textShadow: e.target.value })}
            placeholder="2px 2px 4px rgba(0,0,0,0.8)"
            data-testid="input-text-shadow"
          />
        </div>
      </div>

      <Button onClick={onSave} className="w-full" data-testid="button-save-theme">
        Salvar Tema
      </Button>
    </Card>
  );
}
