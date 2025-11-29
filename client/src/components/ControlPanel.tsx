import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  MonitorPlay,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

interface ControlPanelProps {
  isPlaying: boolean;
  showProjector: boolean;
  volume: number;
  muted: boolean;
  autoPlay: boolean;
  loop: boolean;
  pauseAtEnd: boolean;
  darkScreen: boolean;
  isLive: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleProjector: () => void;
  onOpenProjector: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onAutoPlayChange: (autoPlay: boolean) => void;
  onLoopChange: (loop: boolean) => void;
  onPauseAtEndChange: (pauseAtEnd: boolean) => void;
  onDarkScreenToggle: () => void;
  onToggleLive: () => void;
}

export function ControlPanel({
  isPlaying,
  showProjector,
  volume,
  muted,
  autoPlay,
  loop,
  pauseAtEnd,
  darkScreen,
  isLive,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onToggleProjector,
  onOpenProjector,
  onVolumeChange,
  onMuteToggle,
  onAutoPlayChange,
  onLoopChange,
  onPauseAtEndChange,
  onDarkScreenToggle,
  onToggleLive,
}: ControlPanelProps) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Controles de Reprodução</h3>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={onPrevious}
            data-testid="button-previous"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={isPlaying ? onPause : onPlay}
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={onNext}
            data-testid="button-next"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button
            variant={loop ? 'default' : 'outline'}
            size="icon"
            onClick={() => onLoopChange(!loop)}
            data-testid="button-loop"
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Apresentação</h3>
        <div className="space-y-2">
          {isLive ? (
            <Button
              variant="destructive"
              className="w-full font-bold shadow-lg transition-all duration-300 bg-red-600 hover:bg-red-700"
              onClick={onToggleLive}
              data-testid="button-toggle-live"
              size="lg"
            >
              <Radio className="w-4 h-4 mr-2" />
              Encerrar Apresentação
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="heartbeat-button w-full font-bold text-white !bg-emerald-500 hover:!bg-emerald-600 !border-0 rounded-full"
              onClick={onToggleLive}
              data-testid="button-toggle-live"
              size="lg"
            >
              <Radio className="w-5 h-5 mr-2" />
              <span className="text-base tracking-wide">Iniciar Apresentação</span>
            </Button>
          )}
          {isLive && (
            <div className="flex items-center justify-center gap-1 py-1 px-2 bg-destructive/10 rounded-sm">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" data-testid="indicator-live-dot" />
              <span className="text-destructive font-semibold text-xs animate-pulse" data-testid="text-live">
                AO VIVO
              </span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Projetor</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={onOpenProjector}
            data-testid="button-open-projector"
          >
            <MonitorPlay className="w-4 h-4 mr-2" />
            Abrir Telão em Nova Janela
          </Button>
          <Button
            variant={showProjector ? 'default' : 'outline'}
            className="w-full"
            onClick={onToggleProjector}
            data-testid="button-toggle-projector"
          >
            {showProjector ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Fechar Telão (Ctrl+Shift+T)
              </>
            ) : (
              <>
                <MonitorPlay className="w-4 h-4 mr-2" />
                Abrir Telão (Ctrl+Shift+T)
              </>
            )}
          </Button>
          <Button
            variant={darkScreen ? 'destructive' : 'outline'}
            className="w-full"
            onClick={onDarkScreenToggle}
            data-testid="button-dark-screen"
          >
            {darkScreen ? 'Desativar Modo de Espera' : 'Ativar Modo de Espera'}
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Volume</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onMuteToggle}
              data-testid="button-mute"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={([v]) => onVolumeChange(v)}
              max={100}
              step={1}
              className="flex-1"
              data-testid="slider-volume"
            />
            <span className="text-sm text-muted-foreground w-10 text-right">
              {volume}%
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Reprodução Automática</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-play">Ativar</Label>
            <Switch
              id="auto-play"
              checked={autoPlay}
              onCheckedChange={onAutoPlayChange}
              data-testid="switch-auto-play"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pause-at-end">Pausar ao Terminar</Label>
            <Switch
              id="pause-at-end"
              checked={pauseAtEnd}
              onCheckedChange={onPauseAtEndChange}
              data-testid="switch-pause-at-end"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Configure a duração dos slides na aba "Slides"
          </p>
        </div>
      </div>
    </Card>
  );
}
