import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import type { MediaItem, FitMode, TextOverlay } from '@shared/schema';

interface MediaPreviewProps {
  item: MediaItem | null;
  fitMode: FitMode;
  zoom: number;
  panX: number;
  panY: number;
  textOverlay: TextOverlay | null;
  theme: {
    fontFamily: string;
    fontSize: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    textShadow?: string;
    backgroundColor?: string;
  } | null;
  volume: number;
  muted: boolean;
  darkScreen: boolean;
  blackScreen: boolean;
  textFontSize?: number;
  loop?: boolean;
  onVideoEnd?: () => void;
}

export function MediaPreview({
  item,
  fitMode,
  zoom,
  panX,
  panY,
  textOverlay,
  theme,
  volume,
  muted,
  darkScreen,
  blackScreen,
  textFontSize = 72,
  loop = false,
  onVideoEnd,
}: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = muted;
    }
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  // Não bloquear o preview quando blackScreen ou darkScreen estão ativos
  // Essas configurações afetam apenas o telão, não o preview local

  if (!item) {
    return (
      <Card className="w-full aspect-video bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum item selecionado</p>
      </Card>
    );
  }

  const getObjectFit = (): React.CSSProperties['objectFit'] => {
    switch (fitMode) {
      case 'contain':
        return 'contain';
      case 'cover':
        return 'cover';
      case 'stretch':
        return 'fill';
      case 'crop':
        return 'cover';
      default:
        return 'contain';
    }
  };

  const getTransform = () => {
    return `scale(${zoom}) translate(${panX}%, ${panY}%)`;
  };

  return (
    <Card className="w-full aspect-video bg-black overflow-hidden relative">
      {item.type === 'image' && (
        <img
          key={item.id}
          src={item.url}
          alt={item.name}
          className="w-full h-full"
          style={{
            objectFit: getObjectFit(),
            transform: getTransform(),
          }}
          data-testid="preview-image"
        />
      )}

      {item.type === 'video' && (
        <video
          ref={videoRef}
          key={item.id}
          src={item.url}
          className="w-full h-full"
          style={{
            objectFit: getObjectFit(),
            transform: getTransform(),
          }}
          controls
          autoPlay
          loop={loop}
          onEnded={onVideoEnd}
          data-testid="preview-video"
        />
      )}

      {item.type === 'audio' && (
        <div className="w-full h-full flex items-center justify-center">
          <audio
            ref={audioRef}
            key={item.id}
            src={item.url}
            controls
            autoPlay
            onEnded={onVideoEnd}
            className="w-full max-w-md"
            data-testid="preview-audio"
          />
        </div>
      )}

      {item.type === 'text' && (
        <div 
          key={item.id}
          className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: item.textBackgroundColor || '#FFFFFF' }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: `${(item.textSize || textFontSize) / 6.5}px`,
              color: item.textColor || '#FFFFFF',
              textAlign: 'center',
              fontWeight: item.textBold ? 'bold' : 'normal',
              fontStyle: item.textItalic ? 'italic' : 'normal',
              textDecoration: item.textUnderline ? 'underline' : 'none',
              lineHeight: '1.3',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {item.formattedContent ? (
              <div 
                className="text-center w-full"
                dangerouslySetInnerHTML={{ __html: item.formattedContent }}
                style={{
                  fontWeight: item.textBold ? 'bold' : 'normal',
                  fontStyle: item.textItalic ? 'italic' : 'normal',
                  textDecoration: item.textUnderline ? 'underline' : 'none',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
                data-testid="text-slide-content"
              />
            ) : (
              <>
                {item.textTitle && (
                  <h2 className="font-bold mb-2 w-full" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} data-testid="text-slide-title">
                    {item.textTitle}
                  </h2>
                )}
                {item.textContent && (
                  <p className="w-full" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} data-testid="text-slide-content">
                    {item.textContent}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {textOverlay && textOverlay.visible && theme && item.type !== 'text' && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center p-8"
          style={{
            left: `${textOverlay.position.x}%`,
            top: `${textOverlay.position.y}%`,
            transform: `translate(-${textOverlay.position.x}%, -${textOverlay.position.y}%)`,
          }}
        >
          <div
            className="max-w-4xl"
            style={{
              fontFamily: theme.fontFamily,
              fontSize: `${theme.fontSize}px`,
              color: theme.color,
              textAlign: theme.textAlign,
              textShadow: theme.textShadow,
              backgroundColor: theme.backgroundColor,
              padding: '1rem',
              borderRadius: '0.5rem',
            }}
          >
            {textOverlay.title && (
              <h2 className="font-bold mb-2" data-testid="text-overlay-title">
                {textOverlay.title}
              </h2>
            )}
            {textOverlay.subtitle && (
              <h3 className="mb-2" data-testid="text-overlay-subtitle">
                {textOverlay.subtitle}
              </h3>
            )}
            {textOverlay.content && (
              <p className="whitespace-pre-wrap" data-testid="text-overlay-content">
                {textOverlay.content}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
