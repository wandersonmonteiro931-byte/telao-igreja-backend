import { useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus } from 'lucide-react';

interface SlideSettingsProps {
  slideDuration: number;
  onDurationChange: (duration: number) => void;
  textFontSize: number;
  onTextFontSizeChange: (size: number) => void;
  autoFitText: boolean;
  onAutoFitTextChange: (enabled: boolean) => void;
}

export function SlideSettings({
  slideDuration,
  onDurationChange,
  textFontSize,
  onTextFontSizeChange,
  autoFitText,
  onAutoFitTextChange,
}: SlideSettingsProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDurationChange = (value: string) => {
    // Permitir campo vazio
    if (value === '') {
      onDurationChange(0); // 0 indica campo vazio
      return;
    }
    
    const numValue = parseInt(value);
    
    // Validar entre 1 e 600 segundos (10 minutos)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, Math.min(600, numValue));
      onDurationChange(clampedValue);
    }
  };

  const changeFontSize = useCallback((delta: number) => {
    const newSize = Math.max(24, Math.min(500, textFontSize + delta));
    onTextFontSizeChange(newSize);
  }, [textFontSize, onTextFontSizeChange]);

  const handleMouseDown = useCallback((delta: number) => {
    changeFontSize(delta);
    
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        changeFontSize(delta);
      }, 50);
    }, 300);
  }, [changeFontSize]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Configurações de Slides e Textos</h3>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label htmlFor="slide-duration">
            Tempo entre cada slide (segundos)
          </Label>
          <Input
            id="slide-duration"
            type="number"
            min={1}
            max={600}
            step={1}
            value={slideDuration || ''}
            onChange={(e) => handleDurationChange(e.target.value)}
            data-testid="input-slide-duration"
            className={!slideDuration || slideDuration < 1 ? 'border-destructive' : ''}
          />
          {(!slideDuration || slideDuration < 1) && (
            <p className="text-xs text-destructive mt-1">
              ⚠️ Campo obrigatório - A reprodução está pausada até que você defina um valor
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Define quanto tempo cada imagem ou texto ficará na tela antes de avançar automaticamente (mínimo: 1s, máximo: 10min)
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-fit-text">Auto Ajustar Texto</Label>
              <p className="text-xs text-muted-foreground">
                Ajusta automaticamente o texto para preencher a tela
              </p>
            </div>
            <Switch
              id="auto-fit-text"
              checked={autoFitText}
              onCheckedChange={onAutoFitTextChange}
              data-testid="switch-auto-fit-text"
            />
          </div>

          <Separator />
          
          <div>
            <Label htmlFor="text-font-size">
              {autoFitText ? 'Ajuste fino do tamanho' : 'Tamanho da letra no telão'}: {textFontSize}px
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="icon"
                variant="outline"
                onMouseDown={() => handleMouseDown(-1)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleMouseDown(-1)}
                onTouchEnd={handleMouseUp}
                data-testid="button-decrease-font-size"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                id="text-font-size"
                min={24}
                max={500}
                step={4}
                value={[textFontSize]}
                onValueChange={(value) => onTextFontSizeChange(value[0])}
                data-testid="slider-text-font-size"
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onMouseDown={() => handleMouseDown(1)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleMouseDown(1)}
                onTouchEnd={handleMouseUp}
                data-testid="button-increase-font-size"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {autoFitText 
                ? 'Com Auto Ajustar ativado, este controle funciona como ajuste fino adicional'
                : 'Ajusta o tamanho da fonte dos textos exibidos no telão (mínimo: 24px, máximo: 500px)'
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
