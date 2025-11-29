import { useEffect, useState, useRef } from 'react';
import { PauseCircle } from 'lucide-react';
import type { MediaItem, FitMode, TextOverlay, Theme } from '@shared/schema';

interface ProjectorMessage {
  type: 'update';
  data: {
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
    volume: number;
    muted: boolean;
    isLive: boolean;
    transmissionPaused?: boolean;
    showLogo?: boolean;
    logoUrl?: string;
    textFontSize?: number;
    autoFitText?: boolean;
    loop?: boolean;
    waitingMessageTitle?: string;
    waitingMessageSubtitle?: string;
  };
}

export default function ProjectorView() {
  const [item, setItem] = useState<MediaItem | null>(null);
  const [showProjector, setShowProjector] = useState(true);
  const [darkScreen, setDarkScreen] = useState(false);
  const [blackScreen, setBlackScreen] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>('stretch');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [transmissionPaused, setTransmissionPaused] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [textFontSize, setTextFontSize] = useState(72);
  const [autoFitText, setAutoFitText] = useState(false);
  const [loop, setLoop] = useState(false);
  const [waitingMessageTitle, setWaitingMessageTitle] = useState('EQUIPE DA MÍDIA');
  const [waitingMessageSubtitle, setWaitingMessageSubtitle] = useState('MODO ESPERA - AGUARDANDO CONTEÚDO');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasEnteredFullscreenRef = useRef(false);

  const goFullscreen = () => {
    console.log('Tentando entrar em tela cheia...');
    
    // Tentar diferentes métodos para fullscreen
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen({ navigationUI: "hide" }).catch((err) => {
        console.error('requestFullscreen falhou:', err);
      });
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  };

  // Auto fullscreen when opened with fullscreen parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fullscreen') === 'true' && !hasEnteredFullscreenRef.current) {
      hasEnteredFullscreenRef.current = true;
      console.log('Parâmetro fullscreen detectado, ativando tela cheia...');
      
      // Tentar ativar fullscreen imediatamente ao carregar
      const activateFullscreen = () => {
        goFullscreen();
      };
      
      // Múltiplas tentativas com delays diferentes
      requestAnimationFrame(() => {
        activateFullscreen();
        setTimeout(activateFullscreen, 50);
        setTimeout(activateFullscreen, 100);
        setTimeout(activateFullscreen, 200);
        setTimeout(activateFullscreen, 500);
        setTimeout(activateFullscreen, 1000);
        setTimeout(activateFullscreen, 2000);
      });
    }

    // Listener para quando sair de fullscreen - tentar reativar automaticamente
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && params.get('fullscreen') === 'true') {
        console.log('Saiu de fullscreen, tentando reativar...');
        // Tentar reativar fullscreen após 100ms
        setTimeout(() => {
          goFullscreen();
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update volume and muted
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

  // Handle pausing video/audio when transmission is paused
  useEffect(() => {
    if (transmissionPaused) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [transmissionPaused]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ProjectorMessage | { type: 'visibility'; data: { showProjector: boolean } } | { type: 'requestFullscreen' }>) => {
      if (event.data.type === 'update') {
        const { data } = event.data as ProjectorMessage;
        setItem(data.item);
        setShowProjector(data.showProjector);
        setDarkScreen(data.darkScreen);
        setBlackScreen(data.blackScreen);
        setFitMode(data.fitMode);
        setZoom(data.zoom);
        setPanX(data.panX);
        setPanY(data.panY);
        setTextOverlay(data.textOverlay);
        setTheme(data.theme);
        setVolume(data.volume);
        setMuted(data.muted);
        setIsLive(data.isLive || false);
        setTransmissionPaused(data.transmissionPaused || false);
        setShowLogo(data.showLogo || false);
        setLogoUrl(data.logoUrl || '');
        setTextFontSize(data.textFontSize || 72);
        setAutoFitText(data.autoFitText || false);
        setLoop(data.loop || false);
        setWaitingMessageTitle(data.waitingMessageTitle || 'EQUIPE DA MÍDIA');
        setWaitingMessageSubtitle(data.waitingMessageSubtitle || 'MODO ESPERA - AGUARDANDO CONTEÚDO');
      } else if (event.data.type === 'visibility') {
        setShowProjector(event.data.data.showProjector);
      } else if (event.data.type === 'requestFullscreen') {
        console.log('Recebida mensagem requestFullscreen da janela principal');
        goFullscreen();
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Avisar janela principal que projetor está pronto
    if (window.opener) {
      console.log('Enviando mensagem projectorReady para janela principal');
      window.opener.postMessage({ type: 'projectorReady' }, '*');
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+T to toggle projector visibility
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        window.opener?.postMessage({ type: 'toggleProjector' }, '*');
      } else if (e.key === 'F9') {
        e.preventDefault();
        window.opener?.postMessage({ type: 'togglePlay' }, '*');
      } else if (e.key === 'ArrowRight') {
        window.opener?.postMessage({ type: 'next' }, '*');
      } else if (e.key === 'ArrowLeft') {
        window.opener?.postMessage({ type: 'previous' }, '*');
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        goFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    return <div className="w-screen h-screen bg-black" />;
  }

  // Tela escura (modo de espera)
  if (darkScreen || !showProjector) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-white/90 text-2xl font-bold mb-4">
            {waitingMessageTitle}
          </p>
          <p className="text-white/70 text-xl mb-2">
            {waitingMessageSubtitle}
          </p>
        </div>
      </div>
    );
  }

  // Telão aberto mas apresentação não iniciada
  if (!isLive) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-white/90 text-3xl font-bold mb-6">
            INICIE A APRESENTAÇÃO PARA COMEÇAR
          </p>
          <p className="text-white/70 text-xl mb-2">
            Clique no botão "Iniciar Apresentação" no aplicativo principal
          </p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-white/90 text-2xl font-bold mb-4" data-testid="text-projector-waiting">
            {waitingMessageTitle}
          </p>
          <p className="text-white/70 text-xl mb-2">
            {waitingMessageSubtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
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
          ref={videoRef}
          key={item.id}
          src={item.url}
          className="w-full h-full"
          style={{
            objectFit: getObjectFit(),
            transform: getTransform(),
          }}
          autoPlay
          loop={loop}
        />
      )}

      {item.type === 'audio' && (
        <div className="w-full h-full flex items-center justify-center">
          <audio
            ref={audioRef}
            key={item.id}
            src={item.url}
            autoPlay
            loop={loop}
            style={{ display: 'none' }}
          />
          <div className="text-white text-center">
            <p className="text-4xl font-bold mb-2">{item.name}</p>
            <p className="text-xl text-white/60">Reproduzindo áudio...</p>
          </div>
        </div>
      )}

      {item.type === 'text' && (
        <div 
          key={item.id}
          className="w-full h-full flex items-center justify-center overflow-hidden p-8"
          style={{ backgroundColor: item.textBackgroundColor || '#FFFFFF' }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: autoFitText 
                ? (() => {
                    const textContent = (item.textContent || item.formattedContent || '').replace(/<[^>]*>/g, '');
                    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
                    const numLines = Math.max(lines.length, 1);
                    const longestLine = Math.max(...lines.map(line => line.length), 1);
                    
                    const widthBasedSize = (window.innerWidth * 0.85) / (longestLine * 0.6);
                    const heightBasedSize = (window.innerHeight * 0.85) / (numLines * 1.3);
                    
                    const autoSize = Math.min(widthBasedSize, heightBasedSize);
                    const finalSize = Math.max(30, Math.min(autoSize, 500));
                    
                    const scaleFactor = textFontSize / 72;
                    return `${finalSize * scaleFactor}px`;
                  })()
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
                data-testid="projector-text-slide-content"
              />
            ) : item.textContent ? (
              <p className="text-center w-full" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} data-testid="projector-text-slide-content">
                {item.textContent}
              </p>
            ) : null}
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
              padding: `${theme.padding}rem`,
              borderRadius: '0.5rem',
            }}
          >
            {textOverlay.title && (
              <h2 className="font-bold mb-2">{textOverlay.title}</h2>
            )}
            {textOverlay.subtitle && (
              <h3 className="mb-2">{textOverlay.subtitle}</h3>
            )}
            {textOverlay.content && (
              <p className="whitespace-pre-wrap">{textOverlay.content}</p>
            )}
          </div>
        </div>
      )}

      {showLogo && logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/70">
          <img
            src={logoUrl}
            alt="Logotipo da Igreja"
            className="max-w-[70%] max-h-[70%] object-contain"
          />
        </div>
      )}

    </div>
  );
}
