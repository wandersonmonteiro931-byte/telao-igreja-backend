import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Eye, MonitorPlay, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MediaItem } from '@shared/schema';
import { useRef, useEffect } from 'react';

interface PlaylistItemProps {
  item: MediaItem;
  isActive: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onSendToProjector?: () => void;
}

export function PlaylistItem({ item, isActive, onPlay, onDelete, onSendToProjector }: PlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const videoRef = useRef<HTMLVideoElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (videoRef.current && item.type === 'video') {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [item.type]);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden hover-elevate ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      data-testid={`playlist-item-${item.id}`}
    >
      {/* Área de drag handle no topo */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-0 left-0 right-0 z-10 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        data-testid={`drag-handle-${item.id}`}
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* Miniatura do item */}
      <div className="aspect-square relative bg-black overflow-hidden">
        {item.type === 'image' && item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            data-testid={`thumbnail-${item.id}`}
          />
        )}
        
        {item.type === 'video' && item.url && (
          <video
            ref={videoRef}
            src={item.url}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            data-testid={`video-preview-${item.id}`}
          />
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
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            style={{ backgroundColor: item.textBackgroundColor || '#1e40af' }}
          >
            <p 
              className="text-center text-xs line-clamp-4"
              style={{ 
                color: item.textColor || '#ffffff',
                fontWeight: item.textBold ? 'bold' : 'normal',
                fontStyle: item.textItalic ? 'italic' : 'normal',
                textDecoration: item.textUnderline ? 'underline' : 'none',
              }}
            >
              {item.textTitle || item.textContent}
            </p>
          </div>
        )}

        {/* Badge de indicador ativo */}
        {isActive && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            VISUALIZANDO
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onPlay}
            title="Visualizar prévia"
            data-testid={`button-play-${item.id}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          {onSendToProjector && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onSendToProjector}
              title="Jogar no telão ao vivo"
              data-testid={`button-send-to-projector-${item.id}`}
            >
              <MonitorPlay className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/20"
            onClick={onDelete}
            title="Remover da lista"
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
