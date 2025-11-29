import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { nanoid } from 'nanoid';
import { 
  Download, 
  Upload, 
  Save, 
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
  PauseCircle,
  ImageIcon,
  ImagePlus,
  Plus,
  Check,
  Music,
  Trash2,
  Moon,
  Square,
  LogOut,
  X,
  AlertTriangle
} from 'lucide-react';
import drewLogo from '@/assets/drew-logo.png';
import equipeLogo from '@/assets/equipe-logo.png';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { db, initDB } from '@/lib/db';
import { useKeyboardShortcuts } from '@/lib/hooks';
import { MediaUpload } from '@/components/MediaUpload';
import { AddMediaButtons } from '@/components/AddMediaButtons';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { MediaPreview } from '@/components/MediaPreview';
import { TextOverlayEditor } from '@/components/TextOverlayEditor';
import { ThemeEditor } from '@/components/ThemeEditor';
import { ImageSettings } from '@/components/ImageSettings';
import { SlideSettings } from '@/components/SlideSettings';
import { HelpDialog } from '@/components/HelpDialog';
import { SupportDialog } from '@/components/SupportDialog';
import { AnnouncementsPanel } from '@/components/AnnouncementsPanel';
import { WelcomeModal } from '@/components/WelcomeModal';
import { LiveProjectorPreview } from '@/components/LiveProjectorPreview';
import { LiveProjectorView } from '@/components/LiveProjectorView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  MediaItem,
  GalleryItem,
  PlaylistItem,
  Playlist,
  Theme,
  TextOverlay,
  AppSettings,
  FitMode,
} from '@shared/schema';
import { useAuth, type UserSettings } from '@/lib/auth-context';

const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Tema Padrão',
  fontFamily: 'Arial Black, Impact, sans-serif',
  fontSize: 72,
  fontWeight: '900',
  color: '#000000',
  textAlign: 'center',
  textShadow: 'none',
  backgroundColor: 'transparent',
  padding: 0,
};

const DEFAULT_OVERLAY: TextOverlay = {
  id: 'main-overlay',
  title: '',
  subtitle: '',
  content: '',
  position: { x: 50, y: 50 },
  visible: false,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0); // Índice para preview local (não envia ao telão)
  const [isPlaying, setIsPlaying] = useState(false);
  const [showProjector, setShowProjector] = useState(false);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(true);
  const [darkScreen, setDarkScreen] = useState(false);
  const [blackScreen, setBlackScreen] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [fitMode, setFitMode] = useState<FitMode>('stretch');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [slideDuration, setSlideDuration] = useState(5); // in seconds
  const [textFontSize, setTextFontSize] = useState(72); // Tamanho da fonte para textos no telão
  const [autoFitText, setAutoFitText] = useState(false); // Auto ajustar texto para preencher a tela
  const [textOverlay, setTextOverlay] = useState<TextOverlay>(DEFAULT_OVERLAY);
  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
  const [themes, setThemes] = useState<Theme[]>([DEFAULT_THEME]);
  const [isLive, setIsLive] = useState(false);
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [loopCurrentVideo, setLoopCurrentVideo] = useState(true);
  const [transmissionPaused, setTransmissionPaused] = useState(false);
  const [waitingMessageTitle, setWaitingMessageTitle] = useState('EQUIPE DA MÍDIA');
  const [waitingMessageSubtitle, setWaitingMessageSubtitle] = useState('MODO ESPERA - AGUARDANDO CONTEÚDO');
  const [showHideProjectorDialog, setShowHideProjectorDialog] = useState(false);
  const [showEndPresentationDialog, setShowEndPresentationDialog] = useState(false);
  
  const { settings: userSettings, logout } = useAuth();

  useEffect(() => {
    if (userSettings?.churchName) {
      setWaitingMessageTitle(userSettings.churchName);
    }
  }, [userSettings?.churchName]);
  
  // Playlist presentation control
  const [activeMediaItems, setActiveMediaItems] = useState<MediaItem[]>([]);
  const [activeCurrentIndex, setActiveCurrentIndex] = useState(0);
  const [isPlaylistPresented, setIsPlaylistPresented] = useState(false);
  const [playlistRevision, setPlaylistRevision] = useState(0);
  const [syncedPlaylistRevision, setSyncedPlaylistRevision] = useState(0);
  const [contentAuthorized, setContentAuthorized] = useState(false);
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragCounterRef = useRef(0);

  const projectorWindowRef = useRef<Window | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pausedProjectorItemRef = useRef<MediaItem | null>(null);

  useEffect(() => {
    initDB().then(() => {
      loadData();
    });
  }, []);

  const loadData = async () => {
    // Load gallery items
    const gallery = await db.getGalleryItems();
    const galleryWithUrls = await Promise.all(
      gallery.map(async (item) => {
        if (item.type !== 'text' && item.id) {
          const blob = await db.getMediaBlob(item.id);
          if (blob) {
            const url = URL.createObjectURL(blob);
            return {
              ...item,
              url,
              thumbnailUrl: item.type === 'image' ? url : item.thumbnailUrl,
            };
          }
        }
        return item;
      })
    );
    setGalleryItems(galleryWithUrls.sort((a, b) => b.createdAt - a.createdAt));

    // Load playlist items
    const playlist = await db.getPlaylistItems();
    setPlaylistItems(playlist);

    // Build mediaItems from playlist items
    // Use playlistItem.id as the MediaItem.id for unique identification
    const mediaList: MediaItem[] = await Promise.all(
      playlist.map(async (pItem) => {
        const galleryItem = galleryWithUrls.find(g => g.id === pItem.galleryItemId);
        if (galleryItem) {
          return {
            ...galleryItem,
            id: pItem.id, // Use playlistItem.id as MediaItem.id for unique identification
            order: pItem.order,
          };
        }
        return null;
      })
    ).then(items => items.filter((item): item is MediaItem => item !== null));
    
    setMediaItems(mediaList.sort((a, b) => a.order - b.order));

    const playlists = await db.getPlaylists();
    if (playlists.length > 0) {
      setCurrentPlaylist(playlists[0]);
    }

    const loadedThemes = await db.getThemes();
    if (loadedThemes.length > 0) {
      setThemes([DEFAULT_THEME, ...loadedThemes]);
    }

    const settings = await db.getSettings();
    if (settings) {
      setVolume(settings.volume);
      setMuted(settings.muted);
      setShowProjector(settings.showProjector);
      setFitMode(settings.fitMode);
      setZoom(settings.zoom);
      setPanX(settings.panX);
      setPanY(settings.panY);
      setSlideDuration(settings.slideDuration || 5);
      setTextFontSize(settings.textFontSize || 72);
      setAutoFitText(settings.autoFitText || false);
      setDarkScreen(settings.darkScreen);
      setBlackScreen(settings.blackScreen || false);
      setShowLogo(settings.showLogo || false);
      setIsLive(settings.isLive || false);
      if (settings.waitingMessageTitle) {
        setWaitingMessageTitle(settings.waitingMessageTitle);
      }
      setWaitingMessageSubtitle(settings.waitingMessageSubtitle || 'MODO ESPERA - AGUARDANDO CONTEÚDO');
      
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
    }

    const logoBlob = await db.getLogoBlob();
    if (logoBlob) {
      const url = URL.createObjectURL(logoBlob);
      setLogoUrl(url);
    }
  };

  const saveSettings = useCallback(async () => {
    const settings: AppSettings = {
      volume,
      muted,
      showProjector,
      fitMode,
      zoom,
      panX,
      panY,
      slideDuration,
      textFontSize,
      autoFitText,
      darkScreen,
      blackScreen,
      showLogo,
      logoUrl,
      isLive,
      waitingMessageTitle,
      waitingMessageSubtitle,
    };
    await db.saveSettings(settings);
  }, [volume, muted, showProjector, fitMode, zoom, panX, panY, slideDuration, textFontSize, autoFitText, darkScreen, blackScreen, showLogo, logoUrl, isLive, waitingMessageTitle, waitingMessageSubtitle]);

  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  const sendToProjector = useCallback(() => {
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      let itemToSend = null;
      
      // Use activeMediaItems/activeCurrentIndex if presentation is active, otherwise use mediaItems/currentIndex
      const itemsToUse = isPlaylistPresented ? activeMediaItems : mediaItems;
      let indexToUse = isPlaylistPresented ? activeCurrentIndex : currentIndex;

      
      // Se está ao vivo mas o conteúdo não foi autorizado, não enviar item
      if (isLive && !contentAuthorized) {
        itemToSend = null;
      } else if (itemsToUse.length > 0) {
        // Guard against transient out-of-range indices - clamp to valid range
        indexToUse = Math.max(0, Math.min(indexToUse, itemsToUse.length - 1));
        
        // When pausing, cache the current item
        if (transmissionPaused && !pausedProjectorItemRef.current) {
          pausedProjectorItemRef.current = itemsToUse[indexToUse] ?? null;
        }
        
        // When resuming, clear the cache
        if (!transmissionPaused && pausedProjectorItemRef.current) {
          pausedProjectorItemRef.current = null;
        }
        
        // If paused, send the cached item; otherwise send the current item
        itemToSend = transmissionPaused 
          ? pausedProjectorItemRef.current 
          : itemsToUse[indexToUse] ?? null;
      } else {
        // If snapshot is empty, preserve pause cache or send null
        // This will show dark/black screen based on current settings
        itemToSend = transmissionPaused ? pausedProjectorItemRef.current : null;
      }
      
      projectorWindowRef.current.postMessage(
        {
          type: 'update',
          data: {
            item: itemToSend,
            showProjector: isLive || showProjector,
            darkScreen,
            blackScreen,
            fitMode,
            zoom,
            panX,
            panY,
            textOverlay,
            theme: currentTheme,
            volume,
            muted,
            isLive,
            transmissionPaused,
            showLogo,
            logoUrl,
            textFontSize,
            autoFitText,
            loop: loopCurrentVideo && !isPlaying,
            waitingMessageTitle,
            waitingMessageSubtitle,
          },
        },
        '*'
      );
    }
  }, [transmissionPaused, activeMediaItems, activeCurrentIndex, isPlaylistPresented, contentAuthorized, mediaItems, currentIndex, showProjector, darkScreen, blackScreen, fitMode, zoom, panX, panY, textOverlay, currentTheme, volume, muted, isLive, showLogo, logoUrl, textFontSize, autoFitText, loopCurrentVideo, isPlaying, waitingMessageTitle, waitingMessageSubtitle]);

  useEffect(() => {
    sendToProjector();
  }, [sendToProjector]);

  // Ensure projector visibility is always in sync
  useEffect(() => {
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.postMessage(
        {
          type: 'visibility',
          data: { showProjector },
        },
        '*'
      );
    }
  }, [showProjector]);

  // Escutar quando projetor estiver pronto e enviar dados
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'projectorReady') {
        sendToProjector();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendToProjector]);

  // Clamp activeCurrentIndex when activeMediaItems changes to prevent invalid index
  useEffect(() => {
    if (isPlaylistPresented && activeMediaItems.length > 0) {
      if (activeCurrentIndex >= activeMediaItems.length) {
        setActiveCurrentIndex(activeMediaItems.length - 1);
      } else if (activeCurrentIndex < 0) {
        setActiveCurrentIndex(0);
      }
    }
  }, [activeMediaItems, activeCurrentIndex, isPlaylistPresented]);

  const handleFilesSelected = async (files: File[]) => {
    const newItems: GalleryItem[] = [];

    for (const file of files) {
      const id = nanoid();
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image')
        ? 'image'
        : file.type.startsWith('video')
        ? 'video'
        : 'audio';

      const item: GalleryItem = {
        id,
        type,
        name: file.name,
        url,
        thumbnailUrl: type === 'image' ? url : undefined,
        createdAt: Date.now(),
      };

      if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => {
          item.duration = video.duration;
        };
      }

      // Save the file blob to IndexedDB for persistence
      await db.saveMediaBlob(id, file);
      await db.addGalleryItem(item);
      newItems.push(item);
    }

    setGalleryItems([...newItems, ...galleryItems]);
    toast({
      title: 'Arquivos adicionados à Galeria',
      description: `${newItems.length} arquivo(s) adicionado(s) à galeria permanente`,
    });
  };

  const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFiles(true);
    }
  }, []);

  const handleGlobalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }, []);

  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleGlobalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (files.length > 0) {
      handleFilesSelected(files);
    }
  }, [handleFilesSelected]);

  const handleTextSlideCreated = async (title: string, content: string, formatting: any) => {
    // Dividir conteúdo por parágrafos (quebra de linha dupla) - apenas se não tiver formatação HTML
    const hasFormatting = content.includes('<span');
    const paragraphs = hasFormatting ? [content] : content.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Se houver múltiplos parágrafos (e não tiver formatação), criar um slide para cada
    if (paragraphs.length > 1 && !hasFormatting) {
      const slides: GalleryItem[] = paragraphs.map((paragraph, index) => ({
        id: nanoid(),
        type: 'text',
        name: `${title || 'Slide de Texto'} (${index + 1}/${paragraphs.length})`,
        textTitle: title,
        textContent: paragraph.trim(),
        textColor: formatting.color,
        textBackgroundColor: formatting.backgroundColor,
        textBold: formatting.bold,
        textItalic: formatting.italic,
        textUnderline: formatting.underline,
        textSize: formatting.size > 72 ? formatting.size : undefined, // Só salva se for diferente do padrão
        createdAt: Date.now(),
      }));
      
      // Adicionar todos os slides à galeria
      for (const slide of slides) {
        await db.addGalleryItem(slide);
      }
      
      setGalleryItems([...slides, ...galleryItems]);
      toast({
        title: 'Slides de texto adicionados à Galeria',
        description: `${slides.length} slides foram adicionados à galeria permanente`,
      });
    } else {
      // Se for um único parágrafo ou tiver formatação HTML, criar apenas um slide
      const item: GalleryItem = {
        id: nanoid(),
        type: 'text',
        name: title || 'Slide de Texto',
        textTitle: title,
        textContent: content,
        textColor: formatting.color,
        textBackgroundColor: formatting.backgroundColor,
        textBold: formatting.bold,
        textItalic: formatting.italic,
        textUnderline: formatting.underline,
        textSize: formatting.size > 72 ? formatting.size : undefined, // Só salva se for diferente do padrão
        formattedContent: formatting.formattedContent,
        createdAt: Date.now(),
      };

      await db.addGalleryItem(item);
      setGalleryItems([item, ...galleryItems]);
      toast({
        title: 'Slide de texto adicionado à Galeria',
        description: 'O slide foi adicionado à galeria permanente',
      });
    }
  };

  const handleAddToPlaylist = async (galleryItemId: string) => {
    const playlistItem: PlaylistItem = {
      id: nanoid(),
      galleryItemId,
      order: playlistItems.length,
      addedAt: Date.now(),
    };

    await db.addPlaylistItem(playlistItem);
    setPlaylistItems([...playlistItems, playlistItem]);

    // Update mediaItems
    const galleryItem = galleryItems.find(g => g.id === galleryItemId);
    if (galleryItem) {
      const mediaItem: MediaItem = {
        ...galleryItem,
        id: playlistItem.id, // Use playlistItem.id as unique identifier
        order: playlistItems.length,
      };
      setMediaItems([...mediaItems, mediaItem]);
    }
    
    // Increment playlist revision
    setPlaylistRevision(prev => prev + 1);

    toast({
      title: 'Item adicionado à Lista de Reprodução',
      description: 'O item está pronto para uso no culto',
    });
  };

  const handleRemoveFromPlaylist = async (playlistItemId: string, skipRevisionIncrement = false) => {
    const updated = playlistItems.filter(p => p.id !== playlistItemId);
    
    // Renumber remaining items
    const renumbered = updated.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setPlaylistItems(renumbered);
    
    // Persist renumbered order - use updatePlaylistItems to avoid duplicates
    await db.updatePlaylistItems(renumbered);

    // Rebuild mediaItems - preserve playlistItem.id as mediaItem.id
    const mediaList: MediaItem[] = renumbered.map((pItem) => {
      const galleryItem = galleryItems.find(g => g.id === pItem.galleryItemId);
      if (galleryItem) {
        return {
          ...galleryItem,
          id: pItem.id, // Preserve playlistItem.id
          order: pItem.order,
        };
      }
      return null;
    }).filter((item): item is MediaItem => item !== null);

    setMediaItems(mediaList);
    
    // Increment playlist revision only if not skipped
    if (!skipRevisionIncrement) {
      setPlaylistRevision(prev => prev + 1);
    }

    toast({
      title: 'Item removido da Lista de Reprodução',
      description: 'O item permanece na galeria',
    });
  };

  const handleDeleteFromGallery = async (galleryItemId: string) => {
    await db.deleteGalleryItem(galleryItemId);
    setGalleryItems(galleryItems.filter(g => g.id !== galleryItemId));

    // Remove from playlist if present (skip revision increment here)
    const playlistItem = playlistItems.find(p => p.galleryItemId === galleryItemId);
    if (playlistItem) {
      await handleRemoveFromPlaylist(playlistItem.id, true);
      // Increment revision once for the whole delete operation
      setPlaylistRevision(prev => prev + 1);
    }

    toast({
      title: 'Item removido da Galeria',
      description: 'O item foi deletado permanentemente',
    });
  };

  const handleClearPlaylist = async () => {
    await db.clearPlaylistItems();
    setPlaylistItems([]);
    setMediaItems([]);
    
    // Reset presentation state completely
    setIsPlaylistPresented(false);
    setActiveMediaItems([]);
    setActiveCurrentIndex(0);
    setPlaylistRevision(prev => prev + 1);
    setSyncedPlaylistRevision(0);
    setContentAuthorized(false);
    
    toast({
      title: 'Lista de Reprodução limpa',
      description: 'Todos os itens foram removidos da lista (galeria preservada)',
    });
  };

  const handleReorder = async (items: MediaItem[]) => {
    // MediaItem.id is now playlistItem.id, so we can map directly
    const reorderedPlaylistItems = items.map((item, index) => {
      const pItem = playlistItems.find(p => p.id === item.id);
      if (pItem) {
        return {
          ...pItem,
          order: index,
        };
      }
      return null;
    }).filter((item): item is PlaylistItem => item !== null);

    setPlaylistItems(reorderedPlaylistItems);
    
    // Use updatePlaylistItems to avoid duplicates
    await db.updatePlaylistItems(reorderedPlaylistItems);

    const reordered = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    setMediaItems(reordered);
    
    // Increment playlist revision
    setPlaylistRevision(prev => prev + 1);
  };

  const handlePlayItem = (index: number) => {
    // Quando clicar no item, apenas atualiza o preview local (não envia ao telão)
    setPreviewIndex(index);
    // NÃO atualiza o currentIndex, então não envia ao telão
  };

  const handleSendToProjector = (index: number) => {
    // Envia o item direto ao telão ao vivo
    if (isPlaylistPresented) {
      setActiveCurrentIndex(index);
    } else {
      setCurrentIndex(index);
      setPreviewIndex(index);
    }
    
    toast({
      title: 'Mídia enviada ao telão',
      description: 'O item está sendo exibido no telão ao vivo',
    });
  };

  const handleSendGalleryToProjector = async (galleryItemId: string) => {
    // Verifica se o item já está na playlist procurando pelo galleryItemId
    const existingPlaylistItem = playlistItems.find(p => p.galleryItemId === galleryItemId);
    
    if (existingPlaylistItem) {
      // Item já está na playlist, encontrar seu índice nos mediaItems usando o playlistItem.id
      const playlistItemIndex = mediaItems.findIndex(m => m.id === existingPlaylistItem.id);
      if (playlistItemIndex !== -1) {
        handleSendToProjector(playlistItemIndex);
      }
    } else {
      // Item não está na playlist, adicionar primeiro
      const playlistItem: PlaylistItem = {
        id: nanoid(),
        galleryItemId,
        order: playlistItems.length,
        addedAt: Date.now(),
      };

      await db.addPlaylistItem(playlistItem);
      
      // Atualizar estado da playlist
      const newPlaylistItems = [...playlistItems, playlistItem];
      setPlaylistItems(newPlaylistItems);

      // Adicionar aos mediaItems
      const galleryItem = galleryItems.find(g => g.id === galleryItemId);
      if (galleryItem) {
        const mediaItem: MediaItem = {
          ...galleryItem,
          id: playlistItem.id,
          order: mediaItems.length,
        };
        
        const newMediaItems = [...mediaItems, mediaItem];
        setMediaItems(newMediaItems);
        
        // Incrementar revisão da playlist
        setPlaylistRevision(prev => prev + 1);
        
        // Enviar ao telão (será o último item)
        handleSendToProjector(newMediaItems.length - 1);
        
        toast({
          title: 'Item adicionado e enviado ao telão',
          description: 'O item foi adicionado à lista e está sendo exibido',
        });
      }
    }
  };

  const handleDeleteItem = async (playlistItemId: string) => {
    // ID is now the playlistItem.id, so we can use it directly
    // handleRemoveFromPlaylist already increments revision, no need to do it here
    await handleRemoveFromPlaylist(playlistItemId, false);
    if (currentIndex >= mediaItems.length - 1) {
      setCurrentIndex(Math.max(0, mediaItems.length - 2));
    }
  };

  const handlePrevious = useCallback(() => {
    if (isPlaylistPresented) {
      setActiveCurrentIndex((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentIndex((prev) => {
        const newIndex = Math.max(0, prev - 1);
        setPreviewIndex(newIndex);
        return newIndex;
      });
    }
  }, [isPlaylistPresented]);

  const handleNext = useCallback(() => {
    const itemsLength = isPlaylistPresented ? activeMediaItems.length : mediaItems.length;
    const currentIdx = isPlaylistPresented ? activeCurrentIndex : currentIndex;
    
    // Se estamos no último item
    if (currentIdx === itemsLength - 1) {
      // Se continuousPlay está ativo, volta ao início e continua
      if (continuousPlay || currentPlaylist?.loop) {
        if (isPlaylistPresented) {
          setActiveCurrentIndex(0);
        } else {
          setCurrentIndex(0);
          setPreviewIndex(0);
        }
        return;
      }
      // Se não está em modo repetir, não avança (fica no último item)
      // Não para a reprodução, apenas não avança mais
      return;
    }
    
    // Se não estamos no último item, avança normalmente
    if (isPlaylistPresented) {
      setActiveCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex((prev) => {
        const newIndex = prev + 1;
        setPreviewIndex(newIndex);
        return newIndex;
      });
    }
  }, [isPlaylistPresented, activeMediaItems.length, mediaItems.length, activeCurrentIndex, currentIndex, continuousPlay, currentPlaylist?.loop]);

  const handleToggleProjector = () => {
    // Se está visível e vai ocultar, mostrar confirmação
    if (showProjector) {
      setShowHideProjectorDialog(true);
    } else {
      // Se está oculto e vai mostrar, abrir janela e mostrar
      setShowProjector(true);
      
      // Abrir a janela do projetor se não estiver aberta
      if (!projectorWindowRef.current || projectorWindowRef.current.closed) {
        handleOpenProjector(false);
      }
    }
  };

  const handleConfirmHideProjector = () => {
    setShowProjector(false);
    setShowHideProjectorDialog(false);
    
    // Fechar a janela do projetor
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.close();
      projectorWindowRef.current = null;
    }
    
    toast({
      title: 'Telão oculto',
      description: 'A janela do telão foi fechada',
    });
  };

  const handleOpenProjector = (autoFullscreen = true) => {
    const url = autoFullscreen ? '/projector?fullscreen=true' : '/projector';
    
    // Usar window.screen.availWidth para detectar múltiplas telas
    // Se availWidth > width, há telas múltiplas
    const hasMultipleScreens = window.screen.availWidth > window.screen.width;
    
    const width = window.screen.width;
    const height = window.screen.height;
    
    // Calcular posição para segunda tela
    // A segunda tela geralmente está à direita da primeira
    let left = 0;
    let top = 0;
    
    if (hasMultipleScreens) {
      // Tentar posicionar na segunda tela (à direita)
      left = window.screen.width;
      top = 0;
    } else {
      // Se não há múltiplas telas, abrir no centro da tela atual
      left = (window.screen.width - width) / 2;
      top = (window.screen.height - height) / 2;
    }
    
    console.log('Abrindo projetor:', { 
      width, 
      height, 
      left, 
      top, 
      hasMultipleScreens,
      screenWidth: window.screen.width,
      availWidth: window.screen.availWidth,
      autoFullscreen 
    });
    
    const projectorWindow = window.open(
      url,
      'projector',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,fullscreen=yes`
    );
    
    if (projectorWindow) {
      projectorWindowRef.current = projectorWindow;
      
      // Tentar mover a janela para o monitor secundário usando moveTo
      if (hasMultipleScreens) {
        try {
          projectorWindow.moveTo(window.screen.width, 0);
        } catch (e) {
          console.log('Não foi possível mover a janela automaticamente:', e);
        }
      }
      
      // Escutar quando o projetor estiver pronto e forçar fullscreen
      if (autoFullscreen) {
        const handleProjectorReady = (event: MessageEvent) => {
          if (event.data.type === 'projectorReady' && event.source === projectorWindow) {
            console.log('Projetor pronto, solicitando fullscreen...');
            // Enviar mensagem para tentar fullscreen
            setTimeout(() => {
              projectorWindow.postMessage({ type: 'requestFullscreen' }, '*');
            }, 300);
            window.removeEventListener('message', handleProjectorReady);
          }
        };
        window.addEventListener('message', handleProjectorReady);
      }
    } else {
      toast({
        title: 'Erro ao abrir telão',
        description: 'Verifique se pop-ups estão bloqueados pelo navegador',
        variant: 'destructive',
      });
    }
  };

  const handleToggleLive = () => {
    // Se está ao vivo e vai encerrar, mostrar confirmação
    if (isLive) {
      setShowEndPresentationDialog(true);
    } else {
      // Se não está ao vivo e vai iniciar, iniciar diretamente
      setIsLive(true);
      
      // Quando iniciar apresentação ao vivo, limpar cache e resetar autorização
      pausedProjectorItemRef.current = null;
      setContentAuthorized(false);
      
      // Mostrar aviso se há mídias pendentes de aprovação
      if (mediaItems.length > 0) {
        setShowApprovalWarning(true);
      }
      
      // Quando iniciar apresentação, abrir janela do projetor se não estiver aberta
      if (!projectorWindowRef.current || projectorWindowRef.current.closed) {
        handleOpenProjector(true); // Passar true para ativar fullscreen automático
      } else {
        // Se já estiver aberto, solicitar fullscreen
        projectorWindowRef.current.postMessage({ type: 'requestFullscreen' }, '*');
      }
      // Forçar exibição do telão e desativar tela escura
      setShowProjector(true);
      setDarkScreen(false);
    }
  };

  const handleConfirmEndPresentation = () => {
    setIsLive(false);
    setShowEndPresentationDialog(false);
    
    // Ao encerrar transmissão, resetar todos os estados
    setDarkScreen(false);
    setBlackScreen(false);
    setTransmissionPaused(false);
    setIsPlaylistPresented(false);
    setActiveMediaItems([]);
    setActiveCurrentIndex(0);
    setSyncedPlaylistRevision(0);
    setContentAuthorized(false);
    pausedProjectorItemRef.current = null;
    
    // Fechar a janela do projetor
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.close();
      projectorWindowRef.current = null;
    }
    
    toast({
      title: 'Apresentação encerrada',
      description: 'A janela do telão foi fechada',
    });
  };

  const handlePresentPlaylist = () => {
    if (mediaItems.length === 0) {
      toast({
        title: 'Lista vazia',
        description: 'Adicione itens à lista de reprodução antes de apresentar',
        variant: 'destructive',
      });
      return;
    }

    // Snapshot current playlist and sync revision
    const currentRev = playlistRevision;
    setActiveMediaItems([...mediaItems]);
    setActiveCurrentIndex(currentIndex); // Preserve current position
    setIsPlaylistPresented(true);
    setSyncedPlaylistRevision(currentRev);
    
    // Open projector if not open and force visibility
    if (!projectorWindowRef.current || projectorWindowRef.current.closed) {
      handleOpenProjector();
    }
    setShowProjector(true);
    setDarkScreen(false);
    setBlackScreen(false);

    toast({
      title: 'Apresentação carregada',
      description: `${mediaItems.length} item(ns) pronto(s) para apresentação`,
    });
  };

  const handleUpdatePresentation = () => {
    if (mediaItems.length === 0) {
      toast({
        title: 'Lista vazia',
        description: 'Não é possível atualizar com lista vazia',
        variant: 'destructive',
      });
      return;
    }

    // Update snapshot with current playlist and sync revision
    const currentRev = playlistRevision;
    setActiveMediaItems([...mediaItems]);
    
    // Clamp active index to valid range - prefer keeping the same index if valid
    // This ensures we stay on the same slide number after update if possible
    const newIndex = Math.min(activeCurrentIndex, mediaItems.length - 1);
    setActiveCurrentIndex(Math.max(0, newIndex));
    
    setSyncedPlaylistRevision(currentRev);

    toast({
      title: 'Apresentação atualizada',
      description: `${mediaItems.length} item(ns) atualizado(s)`,
    });
  };

  const handleAuthorizeContent = () => {
    // Limpar cache antes de autorizar para garantir conteúdo novo
    pausedProjectorItemRef.current = null;
    setContentAuthorized(true);
    toast({
      title: 'Conteúdo autorizado',
      description: 'As mídias agora serão exibidas no telão',
    });
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      await db.saveLogoBlob(file);
      toast({
        title: 'Logotipo atualizado',
        description: 'O logotipo foi salvo com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar logotipo',
        description: 'Não foi possível salvar o logotipo',
        variant: 'destructive',
      });
    }
  };

  const handleToggleLogo = () => {
    if (!logoUrl) {
      toast({
        title: 'Logotipo não configurado',
        description: 'Por favor, faça upload de um logotipo primeiro',
        variant: 'destructive',
      });
      return;
    }
    setShowLogo((prev) => !prev);
  };

  const handleSaveTheme = async () => {
    await db.addTheme(currentTheme);
    const loadedThemes = await db.getThemes();
    setThemes([DEFAULT_THEME, ...loadedThemes]);
    toast({
      title: 'Tema salvo',
      description: `Tema "${currentTheme.name}" foi salvo com sucesso`,
    });
  };

  const handleThemeChange = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  const handleSaveData = async () => {
    await saveSettings();
    toast({
      title: 'Dados salvos',
      description: 'Todas as configurações foram salvas com sucesso',
    });
  };

  const handleExport = async () => {
    try {
      const rawGalleryItems = await db.getGalleryItems();
      
      const galleryItemsWithBlobs = await Promise.all(
        rawGalleryItems.map(async (item) => {
          let blobData: string | null = null;
          if (item.id) {
            const blob = await db.getMediaBlob(item.id);
            if (blob) {
              const arrayBuffer = await blob.arrayBuffer();
              const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              blobData = `data:${blob.type};base64,${base64}`;
            }
          }
          const { url, thumbnailUrl, ...cleanItem } = item as GalleryItem & { url?: string; thumbnailUrl?: string };
          return { ...cleanItem, blobData };
        })
      );
      
      const rawPlaylistItems = await db.getPlaylistItems();

      let logoBlobData: string | null = null;
      const logoBlob = await db.getLogoBlob();
      if (logoBlob) {
        const arrayBuffer = await logoBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        logoBlobData = `data:${logoBlob.type};base64,${base64}`;
      }

      const settings: AppSettings = {
        volume,
        muted,
        showProjector,
        fitMode,
        zoom,
        panX,
        panY,
        slideDuration,
        textFontSize,
        autoFitText,
        darkScreen,
        blackScreen,
        showLogo,
        logoUrl: '',
        isLive: false,
        waitingMessageTitle,
        waitingMessageSubtitle,
      };

      const allPlaylists = await db.getPlaylists();
      const allThemes = await db.getThemes();

      const exportData = {
        version: 2,
        playlists: allPlaylists.length > 0 ? allPlaylists : (currentPlaylist ? [currentPlaylist] : []),
        galleryItems: galleryItemsWithBlobs,
        playlistItems: rawPlaylistItems,
        themes: allThemes.filter((t) => t.id !== 'default'),
        settings,
        logoBlobData,
        currentTheme: currentTheme.id !== 'default' ? currentTheme : null,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apresentacao-completa-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportado com sucesso',
        description: `Galeria (${rawGalleryItems.length}), Playlist (${rawPlaylistItems.length}), Temas (${allThemes.length}) e Configurações exportados`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Ocorreu um erro ao exportar os dados',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const base64ToBlob = (dataUrl: string): Blob | null => {
        try {
          const [header, base64Data] = dataUrl.split(',');
          const mimeMatch = header.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new Blob([bytes], { type: mimeType });
        } catch {
          return null;
        }
      };

      galleryItems.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
      });
      mediaItems.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
        if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
      });

      let importedGallery = 0;
      let importedThemes = 0;

      if (data.galleryItems && Array.isArray(data.galleryItems)) {
        for (const item of data.galleryItems) {
          const { blobData, ...galleryItem } = item;
          await db.addGalleryItem(galleryItem);
          if (blobData && galleryItem.id) {
            const blob = base64ToBlob(blobData);
            if (blob) {
              await db.saveMediaBlob(galleryItem.id, blob);
            }
          }
          importedGallery++;
        }
      }

      if (data.playlistItems && Array.isArray(data.playlistItems)) {
        await db.clearPlaylistItems();
        for (const item of data.playlistItems) {
          await db.addPlaylistItem(item);
        }
      }

      if (data.playlists && Array.isArray(data.playlists)) {
        for (const playlist of data.playlists) {
          await db.addPlaylist(playlist);
        }
        if (data.playlists.length > 0) {
          setCurrentPlaylist(data.playlists[0]);
        }
      }

      if (data.themes && Array.isArray(data.themes)) {
        for (const theme of data.themes) {
          await db.addTheme(theme);
          importedThemes++;
        }
        const loadedThemes = await db.getThemes();
        setThemes([DEFAULT_THEME, ...loadedThemes]);
      }

      if (data.currentTheme) {
        setCurrentTheme(data.currentTheme);
      }

      if (data.logoBlobData) {
        const logoBlob = base64ToBlob(data.logoBlobData);
        if (logoBlob) {
          await db.saveLogoBlob(logoBlob);
          const url = URL.createObjectURL(logoBlob);
          setLogoUrl(url);
        }
      }

      if (data.settings) {
        const s = data.settings;
        if (s.volume !== undefined) setVolume(s.volume);
        if (s.muted !== undefined) setMuted(s.muted);
        if (s.showProjector !== undefined) setShowProjector(s.showProjector);
        if (s.fitMode !== undefined) setFitMode(s.fitMode);
        if (s.zoom !== undefined) setZoom(s.zoom);
        if (s.panX !== undefined) setPanX(s.panX);
        if (s.panY !== undefined) setPanY(s.panY);
        if (s.slideDuration !== undefined) setSlideDuration(s.slideDuration);
        if (s.textFontSize !== undefined) setTextFontSize(s.textFontSize);
        if (s.autoFitText !== undefined) setAutoFitText(s.autoFitText);
        if (s.darkScreen !== undefined) setDarkScreen(s.darkScreen);
        if (s.blackScreen !== undefined) setBlackScreen(s.blackScreen);
        if (s.showLogo !== undefined) setShowLogo(s.showLogo);
        if (s.waitingMessageTitle !== undefined) setWaitingMessageTitle(s.waitingMessageTitle);
        if (s.waitingMessageSubtitle !== undefined) setWaitingMessageSubtitle(s.waitingMessageSubtitle);
        
        await db.saveSettings(data.settings);
      }

      const loadedGallery = await db.getGalleryItems();
      const loadedPlaylistItems = await db.getPlaylistItems();
      
      const galleryWithUrls = await Promise.all(
        loadedGallery.map(async (item) => {
          if ((item.type === 'image' || item.type === 'video') && item.id) {
            const blob = await db.getMediaBlob(item.id);
            if (blob) {
              const url = URL.createObjectURL(blob);
              return { ...item, url, thumbnailUrl: url };
            }
          }
          return item;
        })
      );
      
      setGalleryItems(galleryWithUrls);
      
      if (loadedPlaylistItems.length > 0) {
        const mediaList: MediaItem[] = await Promise.all(
          loadedPlaylistItems.map(async (pItem) => {
            const galleryItem = galleryWithUrls.find(g => g.id === pItem.galleryItemId);
            if (galleryItem) {
              return {
                ...galleryItem,
                id: pItem.id,
                order: pItem.order,
              };
            }
            return null;
          })
        ).then(items => items.filter((item): item is MediaItem => item !== null));
        
        setMediaItems(mediaList.sort((a, b) => a.order - b.order));
        setPlaylistItems(loadedPlaylistItems);
      }

      toast({
        title: 'Importado com sucesso',
        description: `Galeria (${importedGallery}), Playlist (${loadedPlaylistItems.length}), Temas (${importedThemes}) e Configurações restaurados`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: 'Arquivo inválido ou corrompido',
        variant: 'destructive',
      });
    }
  };

  // Unified auto-advance logic - single source of truth for slide timing
  useEffect(() => {
    // Clear any existing timer first
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    // Check if we should schedule auto-advance
    // Play button controls if slides advance, continuousPlay only controls if it loops
    const shouldAutoAdvance = 
      isPlaying && 
      !transmissionPaused &&
      slideDuration > 0; // Requer que slideDuration seja válido (campo obrigatório)

    if (!shouldAutoAdvance) {
      return;
    }

    const items = isPlaylistPresented ? activeMediaItems : mediaItems;
    const idx = isPlaylistPresented ? activeCurrentIndex : currentIndex;
    const currentItem = items[idx];

    if (!currentItem) {
      return;
    }

    // Calculate effective slide duration in seconds
    const getEffectiveSlideDuration = () => {
      // Videos use their actual duration
      if (currentItem.type === 'video' && currentItem.duration) {
        return currentItem.duration;
      }
      
      // For images and text, use slideDuration setting
      // Fall back to playlist autoPlayInterval for legacy data compatibility
      return slideDuration || currentPlaylist?.autoPlayInterval || 5;
    };

    const effectiveDurationSec = getEffectiveSlideDuration();
    
    // Schedule next advance (convert to milliseconds only here)
    autoPlayTimerRef.current = setTimeout(() => {
      handleNext();
    }, effectiveDurationSec * 1000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [
    isPlaying,
    transmissionPaused,
    currentIndex,
    activeCurrentIndex,
    isPlaylistPresented,
    currentPlaylist,
    continuousPlay,
    mediaItems,
    activeMediaItems,
    handleNext,
    slideDuration,
  ]);

  const keyboardHandlers = useMemo(() => ({
    onToggleProjector: handleToggleProjector,
    onF1: () => {
      // F1 inicia a apresentação se não estiver ao vivo
      if (!isLive) {
        handleToggleLive();
      }
    },
    onF2: () => {
      // F2 para a apresentação se estiver ao vivo
      if (isLive) {
        handleToggleLive();
      }
    },
    onF9: () => setIsPlaying((prev) => !prev),
    onArrowLeft: handlePrevious,
    onArrowRight: handleNext,
    onPauseTransmission: () => setTransmissionPaused((prev) => !prev),
  }), [isLive, handleToggleProjector, handleToggleLive, handlePrevious, handleNext]);

  useKeyboardShortcuts(keyboardHandlers);

  // Listen for messages from projector window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'toggleProjector') {
        handleToggleProjector();
      } else if (event.data.type === 'togglePlay') {
        setIsPlaying((prev) => !prev);
      } else if (event.data.type === 'next') {
        handleNext();
      } else if (event.data.type === 'previous') {
        handlePrevious();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleToggleProjector, handleNext, handlePrevious]);

  // Get current item based on whether presentation is active (para o telão)
  const currentItem = isPlaylistPresented 
    ? (activeMediaItems[activeCurrentIndex] || null)
    : (mediaItems[currentIndex] || null);

  // Get preview item (para o preview local - pode ser diferente do telão)
  const previewItem = isPlaylistPresented 
    ? (activeMediaItems[activeCurrentIndex] || null)
    : (mediaItems[previewIndex] || null);

  // Get live preview item (para a prévia do telão ao vivo - respeita contentAuthorized)
  const livePreviewItem = (isLive && !contentAuthorized) ? null : currentItem;

  // Relógio de Brasília ao vivo
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatBrasiliaTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Desconectado',
        description: 'Você foi desconectado com sucesso',
      });
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao desconectar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-background overflow-hidden relative"
      onDragEnter={handleGlobalDragEnter}
      onDragLeave={handleGlobalDragLeave}
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      {/* Overlay de arrastar e soltar */}
      {isDraggingFiles && (
        <div 
          className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          data-testid="drop-zone-overlay"
        >
          <div className="bg-card border-4 border-dashed border-primary rounded-2xl p-12 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">Solte aqui</p>
              <p className="text-muted-foreground mt-2">Imagens e vídeos serão adicionados à galeria</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Esquerda - Controles Principais */}
        <aside className="hidden md:flex w-64 lg:w-80 border-r bg-card flex-col">
        <div className="p-3 border-b">
          {/* Botões de navegação */}
          <div className="flex items-center justify-end gap-1 mb-2">
            <Button 
              size="sm"
              variant="ghost" 
              onClick={() => setLocation('/user/home')}
              data-testid="button-back-header"
              className="h-6 px-2 text-xs"
            >
              Voltar
            </Button>
            <Button 
              size="sm"
              variant="ghost" 
              onClick={handleLogout}
              data-testid="button-logout-header"
              className="h-6 px-2 text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Sair
            </Button>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            {isLive && (
              <div className="w-full py-1 px-2 bg-destructive/90 rounded-sm" data-testid="banner-live-header">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-semibold text-xs" data-testid="text-live-header">
                    AO VIVO
                  </span>
                </div>
              </div>
            )}
            <p className="text-3xl font-bold text-foreground tabular-nums tracking-wider" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{formatBrasiliaTime(currentTime)}</p>
          </div>
          
          {transmissionPaused && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
              <PauseCircle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 font-bold text-sm" data-testid="text-transmission-paused">
                TRANSMISSÃO PAUSADA
              </span>
            </div>
          )}
          
          {isLive && !contentAuthorized && mediaItems.length > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-600 text-xs" data-testid="text-approval-warning">
                Autorize as mídias para transmitir no projetor
              </span>
            </div>
          )}
          
          {mediaItems.length === 0 && galleryItems.length === 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-600 text-xs" data-testid="text-empty-gallery-warning">
                Adicione mídias na galeria para iniciar uma apresentação no projetor
              </span>
            </div>
          )}
          
          {isLive && mediaItems.length === 0 && galleryItems.length > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-amber-600 text-xs" data-testid="text-empty-playlist-warning">
                Adicione mídias da galeria na lista de reprodução para transmitir
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* Preview AO VIVO - Cópia Exata do Telão */}
          <div className="sticky top-0 bg-background z-10 space-y-2 pb-3 pt-2 -mx-4 px-4 border-b shadow-md">
            <h3 className="font-semibold text-xs flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              TELÃO AO VIVO
            </h3>
            <LiveProjectorView
              item={livePreviewItem}
              showProjector={showProjector}
              darkScreen={darkScreen}
              blackScreen={blackScreen}
              fitMode={fitMode}
              zoom={zoom}
              panX={panX}
              panY={panY}
              textOverlay={textOverlay}
              theme={currentTheme}
              isLive={isLive}
              showLogo={showLogo}
              logoUrl={logoUrl}
              transmissionPaused={transmissionPaused}
              textFontSize={textFontSize}
              autoFitText={autoFitText}
              waitingMessageTitle={waitingMessageTitle}
              waitingMessageSubtitle={waitingMessageSubtitle}
              loop={loopCurrentVideo && !isPlaying}
              isPreview={true}
            />
            
            {/* Controles do Projetor - Ícones */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                size="icon"
                variant={showProjector ? 'default' : 'outline'}
                onClick={handleToggleProjector}
                data-testid="button-toggle-projector"
                title={showProjector ? 'Fechar Telão' : 'Abrir Telão'}
              >
                {showProjector ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <MonitorPlay className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant={darkScreen ? 'destructive' : 'outline'}
                onClick={() => {
                  setDarkScreen((prev) => !prev);
                  if (!darkScreen) setBlackScreen(false);
                }}
                data-testid="button-dark-screen"
                title={darkScreen ? 'Desativar Modo de Espera' : 'Ativar Modo de Espera'}
              >
                <Moon className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={blackScreen ? 'destructive' : 'outline'}
                onClick={() => {
                  setBlackScreen((prev) => !prev);
                  if (!blackScreen) setDarkScreen(false);
                }}
                data-testid="button-black-screen"
                title={blackScreen ? 'Desativar Tela Preta' : 'Ativar Tela Preta'}
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={transmissionPaused ? 'destructive' : 'outline'}
                onClick={() => setTransmissionPaused((prev) => !prev)}
                data-testid="button-pause-transmission"
                title={transmissionPaused ? 'Retomar Transmissão' : 'Pausar Transmissão'}
              >
                <PauseCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Controles de Apresentação */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm">Apresentação</h3>
            <Button
              variant="ghost"
              className={`w-full font-bold transition-all duration-300 rounded-full ${
                isLive 
                  ? '!bg-red-600 hover:!bg-red-700 text-white' 
                  : 'heartbeat-button !bg-emerald-500 hover:!bg-emerald-600 text-white !border-0'
              }`}
              onClick={handleToggleLive}
              data-testid="button-toggle-live"
              size="lg"
            >
              <Radio className="w-4 h-4 mr-2" />
              {isLive ? 'Encerrar Apresentação' : 'Iniciar Apresentação'}
            </Button>
          </div>

          <Separator />

          {/* Controles de Logotipo */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm">Logotipo</h3>
            <div className="space-y-1.5">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="logo-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('logo-upload')?.click()}
                data-testid="button-upload-logo"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {logoUrl ? 'Alterar Logotipo' : 'Carregar Logotipo'}
              </Button>
              <Button
                variant={showLogo ? 'default' : 'outline'}
                className="w-full"
                onClick={handleToggleLogo}
                data-testid="button-toggle-logo"
                disabled={!logoUrl}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {showLogo ? 'Ocultar Logotipo' : 'Exibir Logotipo'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Controles de Reprodução */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm">Slides e texto</h3>
            <Button
              variant="default"
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                }
              }}
              data-testid="button-play-pause"
              className="w-full"
              disabled={!slideDuration || slideDuration < 1}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Reproduzir
                </>
              )}
            </Button>
            {(!slideDuration || slideDuration < 1) && (
              <p className="text-xs text-destructive">
                ⚠️ Defina a duração dos slides na aba "Slides"
              </p>
            )}
            <Button
              variant={continuousPlay ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setContinuousPlay((prev) => !prev)}
              data-testid="button-continuous-play"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Repetir tudo
            </Button>
            <Button
              variant={loopCurrentVideo ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setLoopCurrentVideo((prev) => !prev)}
              data-testid="button-loop-video"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Repetir vídeo atual
            </Button>
          </div>

          <Separator />

          {/* Controles de Volume */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm">Volume</h3>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMuted((prev) => !prev)}
                data-testid="button-mute"
                className={muted ? 'text-destructive hover:text-destructive' : ''}
              >
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
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

          <Separator />

          {/* Ações Rápidas */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm">Ações</h3>
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="import-playlist"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('import-playlist')?.click()}
              data-testid="button-import"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSaveData}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Tudo
            </Button>
          </div>
        </div>

        <div className="px-3 py-2 border-t flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground">EQUIPE DA MÍDIA</span>
          <div className="flex items-center gap-1">
            <AnnouncementsPanel />
            <HelpDialog />
            <SupportDialog triggerVariant="icon" />
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col p-4 md:p-6 gap-4 md:gap-6">
          {/* Preview e Playlist lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Coluna Esquerda - Preview e Upload */}
            <div className="flex flex-col gap-4">
              <div className="flex-shrink-0">
                <h2 className="text-lg font-semibold mb-2">Prévia da apresentação</h2>
                <MediaPreview
                  item={previewItem}
                  fitMode={fitMode}
                  zoom={zoom}
                  panX={panX}
                  panY={panY}
                  textOverlay={textOverlay}
                  theme={currentTheme}
                  volume={volume}
                  muted={muted}
                  darkScreen={darkScreen}
                  blackScreen={blackScreen}
                  textFontSize={textFontSize}
                  loop={loopCurrentVideo && !isPlaying}
                  onVideoEnd={continuousPlay ? handleNext : undefined}
                />
              </div>

              <div className="flex-shrink-0">
                <AddMediaButtons 
                  onFilesSelected={handleFilesSelected}
                  onTextSlideCreated={handleTextSlideCreated}
                />
              </div>

              {/* Configurações Avançadas */}
              <div>
                <Tabs defaultValue="image" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="image" className="text-xs md:text-sm">Imagem</TabsTrigger>
                    <TabsTrigger value="slides" className="text-xs md:text-sm">Slides e texto</TabsTrigger>
                    <TabsTrigger value="messages" className="text-xs md:text-sm">Tela de espera</TabsTrigger>
                  </TabsList>

                  <TabsContent value="image">
                    <ImageSettings
                      fitMode={fitMode}
                      zoom={zoom}
                      panX={panX}
                      panY={panY}
                      onFitModeChange={setFitMode}
                      onZoomChange={setZoom}
                      onPanXChange={setPanX}
                      onPanYChange={setPanY}
                      onReset={() => {
                        setFitMode('contain');
                        setZoom(1);
                        setPanX(0);
                        setPanY(0);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="slides">
                    <SlideSettings
                      slideDuration={slideDuration}
                      onDurationChange={setSlideDuration}
                      textFontSize={textFontSize}
                      onTextFontSizeChange={setTextFontSize}
                      autoFitText={autoFitText}
                      onAutoFitTextChange={setAutoFitText}
                    />
                  </TabsContent>

                  <TabsContent value="messages">
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título da Mensagem</label>
                        <input
                          type="text"
                          value={waitingMessageTitle}
                          onChange={(e) => setWaitingMessageTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                          placeholder="Digite o título da mensagem"
                          data-testid="input-waiting-message-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subtítulo da Mensagem</label>
                        <input
                          type="text"
                          value={waitingMessageSubtitle}
                          onChange={(e) => setWaitingMessageSubtitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                          placeholder="Digite o subtítulo da mensagem"
                          data-testid="input-waiting-message-subtitle"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Essas mensagens aparecem no telão quando está em modo de espera (sem conteúdo exibido).
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Coluna Direita - Galeria e Lista de Reprodução */}
            <div className="flex flex-col">
              <Tabs defaultValue="playlist" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="playlist" data-testid="tab-playlist">
                    Lista de Reprodução ({mediaItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="gallery" data-testid="tab-gallery">
                    Galeria ({galleryItems.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="playlist" className="mt-4">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      ITENS PARA O CULTO
                    </h2>
                    <div className="flex items-center gap-2">
                      {isPlaylistPresented && playlistRevision !== syncedPlaylistRevision && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleUpdatePresentation}
                          data-testid="button-update-presentation"
                        >
                          Atualizar Apresentação
                        </Button>
                      )}
                      {isLive && !contentAuthorized && mediaItems.length > 0 && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleAuthorizeContent}
                          data-testid="button-authorize-content"
                        >
                          Autorizar Exibição
                        </Button>
                      )}
                      {mediaItems.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearPlaylist}
                          data-testid="button-clear-playlist"
                        >
                          Limpar Lista
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-card rounded-lg border">
                    <PlaylistPanel
                      items={mediaItems}
                      currentIndex={previewIndex}
                      onReorder={handleReorder}
                      onPlayItem={handlePlayItem}
                      onDeleteItem={handleDeleteItem}
                      onSendToProjector={handleSendToProjector}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="gallery" className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      MÍDIA PERMANENTE
                    </h2>
                  </div>
                  <div className="bg-card rounded-lg border p-4 max-h-[600px] overflow-y-auto">
                    {galleryItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>Nenhum item na galeria</p>
                        <p className="text-sm mt-2">Use os botões de upload acima para adicionar mídia</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {galleryItems.map((item) => {
                          const isInPlaylist = playlistItems.some(p => p.galleryItemId === item.id);
                          return (
                            <Card
                              key={item.id}
                              className="overflow-hidden"
                              data-testid={`gallery-item-${item.id}`}
                            >
                              <div className="aspect-square bg-black relative overflow-hidden">
                                {item.type === 'image' && item.thumbnailUrl && (
                                  <img
                                    src={item.thumbnailUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                {item.type === 'video' && item.url && (
                                  <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                  />
                                )}
                                {item.type === 'video' && !item.url && (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <Play className="w-12 h-12 text-white/30" />
                                  </div>
                                )}
                                {item.type === 'audio' && (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                                    <div className="text-center p-4">
                                      <Music className="w-12 h-12 text-white mx-auto mb-2" />
                                      <p className="text-white text-xs line-clamp-2">{item.name}</p>
                                    </div>
                                  </div>
                                )}
                                {item.type === 'text' && (
                                  <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/5">
                                    <p className="text-xs text-center line-clamp-6">{item.textTitle || item.textContent}</p>
                                  </div>
                                )}
                              </div>
                              <div className="p-2 flex justify-center gap-1">
                                {!isInPlaylist ? (
                                  <Button
                                    size="icon"
                                    variant="default"
                                    onClick={() => handleAddToPlaylist(item.id)}
                                    data-testid={`button-add-to-playlist-${item.id}`}
                                    title="Adicionar à lista"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    disabled
                                    title="Já está na lista"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {isLive && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSendGalleryToProjector(item.id)}
                                    data-testid={`button-send-to-projector-${item.id}`}
                                    title="Enviar para projetor"
                                  >
                                    <MonitorPlay className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteFromGallery(item.id)}
                                  data-testid={`button-delete-gallery-${item.id}`}
                                  title="Excluir da galeria"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <footer className="bg-black text-white py-6 px-6 mt-8">
          <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Primeira imagem com texto */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-white/80 text-center">Sistema produzido por:</p>
              <img 
                src={drewLogo} 
                alt="Drew Arte Digital" 
                className="h-20 w-auto object-contain"
                data-testid="img-footer-logo-drew"
              />
            </div>

            {/* Segunda imagem com texto */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-white/80 text-center">Somos uma só equipe!</p>
              <img 
                src={equipeLogo} 
                alt="Equipe da Mídia" 
                className="h-20 w-auto object-contain"
                data-testid="img-footer-logo-equipe"
              />
            </div>
          </div>

          {/* Mensagem de sugestão */}
          <div className="border-t border-white/20 pt-4 pb-4 text-center">
            <p className="text-sm text-white/90 font-semibold mb-2" data-testid="text-footer-suggestion">
              SUGESTÃO: Para transmissão de textos da Bíblia e da Harpa Cristã, sugerimos o sistema{' '}
              <a 
                href="https://holyrics.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
                data-testid="link-holyrics"
              >
                holyrics.com.br
              </a>
            </p>
            <p className="text-xs text-white/70 mb-1" data-testid="text-footer-purpose">
              Esse sistema foi desenvolvido exclusivamente para transmissão de imagens e vídeos.
            </p>
            <p className="text-xs text-white/70" data-testid="text-footer-license">
              Esse sistema é totalmente gratuito e sua venda ou comercialização é totalmente proibida.
            </p>
          </div>

          {/* Suporte */}
          <div className="border-t border-white/20 pt-4 pb-4 text-center">
            <SupportDialog triggerVariant="button" triggerClassName="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600" />
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-4 text-center">
            <p className="text-xs text-white/60" data-testid="text-footer-copyright">
              © Projetor Igreja 2025
            </p>
            <p className="text-xs text-white/60 mt-1">
              Todos os direitos reservados - projetorigreja.shop
            </p>
          </div>
          </div>
        </footer>
      </main>
      </div>

      {/* Diálogo de confirmação para ocultar telão */}
      <AlertDialog open={showHideProjectorDialog} onOpenChange={setShowHideProjectorDialog}>
        <AlertDialogContent data-testid="dialog-hide-projector">
          <AlertDialogHeader>
            <AlertDialogTitle>Ocultar Telão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja ocultar o telão? A janela será fechada imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-hide-projector">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmHideProjector}
              data-testid="button-confirm-hide-projector"
            >
              Sim, ocultar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para encerrar apresentação */}
      <AlertDialog open={showEndPresentationDialog} onOpenChange={setShowEndPresentationDialog}>
        <AlertDialogContent data-testid="dialog-end-presentation">
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Apresentação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar a apresentação? O telão será fechado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-presentation">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmEndPresentation}
              data-testid="button-confirm-end-presentation"
            >
              Sim, encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de boas-vindas para novos usuários */}
      <WelcomeModal />
    </div>
  );
}
