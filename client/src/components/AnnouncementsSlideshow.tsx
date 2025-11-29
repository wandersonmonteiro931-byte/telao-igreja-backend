import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Image, Video, FileText } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import type { Announcement, SystemSettings } from '@shared/schema';

interface AnnouncementsSlideshowProps {
  showControls?: boolean;
  compact?: boolean;
}

export function AnnouncementsSlideshow({ 
  showControls = true,
  compact = false
}: AnnouncementsSlideshowProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [announcementsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/announcements`),
          fetch(`${API_BASE_URL}/api/system-settings`),
        ]);
        
        if (announcementsRes.ok && isMounted) {
          const data = await announcementsRes.json();
          const activeAnnouncements = Array.isArray(data) 
            ? data.filter((a: Announcement) => a.active)
            : [];
          setAnnouncements(activeAnnouncements);
        }
        
        if (settingsRes.ok && isMounted) {
          try {
            const settings: SystemSettings = await settingsRes.json();
            if (settings && settings.slideshowInterval) {
              setSlideshowInterval(settings.slideshowInterval);
            }
          } catch {
            // Use default interval if settings not available
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Atualiza as notícias a cada 30 segundos
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        fetchData();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, slideshowInterval);

    return () => clearInterval(interval);
  }, [announcements.length, slideshowInterval, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className="p-4 text-center" data-testid="announcements-empty">
        <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhuma notícia disponível no momento
        </p>
      </Card>
    );
  }

  const currentAnnouncement = announcements[currentIndex];
  const TypeIcon = getTypeIcon(currentAnnouncement.type);
  const contentHeight = compact ? 'max-h-[120px]' : 'max-h-[200px]';

  return (
    <Card 
      className="overflow-hidden relative"
      role="region"
      aria-label="Últimas Notícias"
      aria-live="polite"
      data-testid="announcements-slideshow"
    >
      <div className="flex items-center gap-2 p-2 border-b bg-primary/5">
        <Bell className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-medium">Últimas Notícias</span>
        <div className="flex-1" />
        <div className="flex gap-1" role="tablist" aria-label="Navegação de notícias">
          {announcements.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Ir para notícia ${index + 1} de ${announcements.length}`}
              className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                index === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
              data-testid={`slideshow-dot-${index}`}
            />
          ))}
        </div>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="p-3"
          >
            <ScrollArea className={contentHeight}>
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                  <TypeIcon className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1" data-testid="slideshow-title">
                    {currentAnnouncement.title}
                  </h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3" data-testid="slideshow-content">
                    {currentAnnouncement.content}
                  </p>
                </div>
              </div>

              {currentAnnouncement.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden">
                  <img
                    src={currentAnnouncement.imageUrl}
                    alt={currentAnnouncement.title}
                    className="w-full max-h-[80px] object-contain bg-muted"
                    data-testid="slideshow-image"
                  />
                </div>
              )}

              {currentAnnouncement.videoUrl && (
                <div className="mt-2 rounded-md overflow-hidden">
                  <video
                    src={currentAnnouncement.videoUrl}
                    controls
                    className="w-full max-h-[80px]"
                    aria-label={`Video: ${currentAnnouncement.title}`}
                    data-testid="slideshow-video"
                  />
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </AnimatePresence>

      </div>
    </Card>
  );
}
