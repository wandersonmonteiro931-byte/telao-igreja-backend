import type { MediaItem, FitMode, TextOverlay, Theme } from '@shared/schema';

interface LiveProjectorViewProps {
  item: MediaItem | null;
  showProjector: boolean;
  darkScreen: boolean;
  blackScreen: boolean;
  fitMode: FitMode;
  zoom: number;
  panX: number;
  panY: number;
  textOverlay: TextOverlay | null;
  theme: Theme | null;
  isLive: boolean;
  showLogo: boolean;
  logoUrl: string;
  transmissionPaused?: boolean;
  textFontSize?: number;
  autoFitText?: boolean;
  loop?: boolean;
  isPreview?: boolean;
  waitingMessageTitle?: string;
  waitingMessageSubtitle?: string;
}

export function LiveProjectorView({
  item,
  showProjector,
  darkScreen,
  blackScreen,
  fitMode,
  zoom,
  panX,
  panY,
  textOverlay,
  theme,
  isLive,
  showLogo,
  logoUrl,
  transmissionPaused,
  textFontSize = 72,
  autoFitText = false,
  loop = false,
  isPreview = false,
  waitingMessageTitle = 'EQUIPE DA MÍDIA',
  waitingMessageSubtitle = 'MODO ESPERA - AGUARDANDO CONTEÚDO',
}: LiveProjectorViewProps) {
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

  // Tela preta (completamente preta, sem mensagens)
  if (blackScreen) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border" />
    );
  }

  // Tela Escura (modo de espera)
  if (darkScreen) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex flex-col items-center justify-center gap-2">
        <div className="text-center px-4">
          {waitingMessageTitle && (
            <p className="text-white/80 text-xs font-bold mb-1">
              {waitingMessageTitle}
            </p>
          )}
          {waitingMessageSubtitle && (
            <p className="text-white/60 text-xs mb-1">
              {waitingMessageSubtitle}
            </p>
          )}
          <p className="text-white/40 text-[10px] mt-1">
            PRESSIONE (F) PARA FULL SCREEN
          </p>
        </div>
      </div>
    );
  }

  // Apresentação não iniciada
  if (!isLive) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex flex-col items-center justify-center gap-2">
        <div className="text-center px-4">
          <p className="text-white/90 text-xs font-bold mb-2">
            INICIE A APRESENTAÇÃO PARA COMEÇAR
          </p>
          <p className="text-white/60 text-[10px]">
            Clique no botão "Iniciar Apresentação"
          </p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex flex-col items-center justify-center gap-2">
        <div className="text-center px-4">
          {waitingMessageTitle && (
            <p className="text-white/80 text-xs font-bold mb-1">
              {waitingMessageTitle}
            </p>
          )}
          {waitingMessageSubtitle && (
            <p className="text-white/60 text-xs mb-1">
              {waitingMessageSubtitle}
            </p>
          )}
          <p className="text-white/40 text-[10px] mt-1">
            PRESSIONE (F) PARA FULL SCREEN
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-md border border-border overflow-hidden relative">
      <div className="w-full h-full relative">
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
          />
        )}

        {item.type === 'video' && (
          <video
            key={item.id}
            src={item.url}
            className="w-full h-full"
            style={{
              objectFit: getObjectFit(),
              transform: getTransform(),
            }}
            loop={loop}
            muted
          />
        )}

        {item.type === 'audio' && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center px-2">
              <p className="text-sm font-bold mb-1">{item.name}</p>
              <p className="text-xs text-white/60">Reproduzindo áudio...</p>
            </div>
          </div>
        )}

        {item.type === 'text' && (
          <div 
            key={item.id}
            className="w-full h-full flex items-center justify-center overflow-hidden p-2"
            style={{ backgroundColor: item.textBackgroundColor || '#FFFFFF' }}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: isPreview 
                  ? `${(item.textSize || textFontSize) / 6.5}px` 
                  : `${item.textSize || textFontSize}px`,
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
                />
              ) : item.textContent ? (
                <p className="text-center w-full" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {item.textContent}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {textOverlay && textOverlay.visible && theme && item.type !== 'text' && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center p-2"
            style={{
              left: `${textOverlay.position.x}%`,
              top: `${textOverlay.position.y}%`,
              transform: `translate(-${textOverlay.position.x}%, -${textOverlay.position.y}%)`,
            }}
          >
            <div
              className="max-w-full overflow-hidden"
              style={{
                fontFamily: theme.fontFamily,
                fontSize: `${Math.min(theme.fontSize / 6, 12)}px`,
                color: theme.color,
                textAlign: theme.textAlign,
                textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                backgroundColor: theme.backgroundColor,
                padding: '0.25rem',
                borderRadius: '0.25rem',
              }}
            >
              {textOverlay.title && (
                <h2 className="font-bold text-xs">{textOverlay.title}</h2>
              )}
              {textOverlay.subtitle && (
                <h3 className="text-xs">{textOverlay.subtitle}</h3>
              )}
              {textOverlay.content && (
                <p className="whitespace-pre-wrap text-xs line-clamp-2">{textOverlay.content}</p>
              )}
            </div>
          </div>
        )}

        {showLogo && logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/70">
            <img
              src={logoUrl}
              alt="Logotipo da Igreja"
              className="max-w-[60%] max-h-[60%] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
