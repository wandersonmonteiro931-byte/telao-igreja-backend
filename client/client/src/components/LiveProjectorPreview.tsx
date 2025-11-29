import type { MediaItem, FitMode, TextOverlay, Theme } from '@shared/schema';

interface LiveProjectorPreviewProps {
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
}

export function LiveProjectorPreview({
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
}: LiveProjectorPreviewProps) {
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

  if (blackScreen) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex items-center justify-center">
        <p className="text-white/30 text-xs">Tela Preta</p>
      </div>
    );
  }

  if (darkScreen || !showProjector) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex items-center justify-center">
        <p className="text-white/30 text-xs">
          {darkScreen ? 'Modo de Espera' : 'Telão Fechado'}
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full aspect-video bg-black rounded-md border border-border flex flex-col items-center justify-center gap-2">
        <p className="text-white/50 text-xs text-center px-2">
          Aguardando conteúdo
        </p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-md border border-border overflow-hidden relative">
      {item.type === 'image' && (
        <img
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
          src={item.url}
          className="w-full h-full"
          style={{
            objectFit: getObjectFit(),
            transform: getTransform(),
          }}
          muted
        />
      )}

      {item.type === 'audio' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-center px-2">
            <p className="text-sm font-bold truncate">{item.name}</p>
            <p className="text-xs text-white/60">Áudio</p>
          </div>
        </div>
      )}

      {item.type === 'text' && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
          <div
            className="w-full text-center overflow-hidden"
            style={{
              fontFamily: theme?.fontFamily || 'Poppins',
              fontSize: `${Math.min((theme?.fontSize || 72) / 6, 16)}px`,
              color: theme?.color || '#ffffff',
              textAlign: theme?.textAlign || 'center',
              textShadow: '1px 1px 4px rgba(0,0,0,0.9)',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {item.textTitle && (
              <h2 className="font-bold mb-1 text-yellow-300 text-xs" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {item.textTitle}
              </h2>
            )}
            {item.textContent && (
              <p className="leading-tight text-xs line-clamp-3" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {item.textContent}
              </p>
            )}
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
              <h2 className="font-bold text-xs truncate">{textOverlay.title}</h2>
            )}
            {textOverlay.subtitle && (
              <h3 className="text-xs truncate">{textOverlay.subtitle}</h3>
            )}
            {textOverlay.content && (
              <p className="whitespace-pre-wrap text-xs line-clamp-2">{textOverlay.content}</p>
            )}
          </div>
        </div>
      )}

      {isLive && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-destructive/80 rounded-sm px-1 py-0.5">
          <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
          <span className="text-white font-semibold text-[8px] leading-none">AO VIVO</span>
        </div>
      )}
    </div>
  );
}
