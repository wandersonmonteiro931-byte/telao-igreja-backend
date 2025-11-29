import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, X, FileText, Image, Video, ChevronRight } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';
import type { Announcement } from '@shared/schema';

export function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await authenticatedFetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
        
        const lastSeenTime = localStorage.getItem('lastSeenAnnouncementsTime');
        if (data.length > 0) {
          const latestAnnouncementTime = new Date(data[0].createdAt).getTime();
          if (!lastSeenTime || latestAnnouncementTime > parseInt(lastSeenTime)) {
            setHasNewAnnouncements(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPanel = () => {
    setShowPanel(true);
    setHasNewAnnouncements(false);
    localStorage.setItem('lastSeenAnnouncementsTime', Date.now().toString());
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
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpenPanel}
        className={`relative ${hasNewAnnouncements ? 'animate-pulse' : ''}`}
        data-testid="button-announcements"
      >
        <Bell className={`w-5 h-5 ${hasNewAnnouncements ? 'text-red-500' : ''}`} />
        {hasNewAnnouncements && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
        {hasNewAnnouncements && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </Button>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Últimas Notícias
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma notícia disponível</p>
                </div>
              ) : (
                announcements.map((announcement) => {
                  const TypeIcon = getTypeIcon(announcement.type);
                  return (
                    <Card
                      key={announcement.id}
                      className="p-3 cursor-pointer hover-elevate"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      data-testid={`card-announcement-${announcement.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10 shrink-0">
                          <TypeIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{announcement.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = getTypeIcon(selectedAnnouncement.type);
                    return <TypeIcon className="w-5 h-5" />;
                  })()}
                  {selectedAnnouncement.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {selectedAnnouncement.imageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedAnnouncement.imageUrl}
                      alt={selectedAnnouncement.title}
                      className="w-full max-h-[300px] object-contain bg-muted"
                    />
                  </div>
                )}

                {selectedAnnouncement.videoUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <video
                      src={selectedAnnouncement.videoUrl}
                      controls
                      className="w-full max-h-[300px]"
                    />
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
