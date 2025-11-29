import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PlaylistItem } from './PlaylistItem';
import type { MediaItem } from '@shared/schema';

interface PlaylistPanelProps {
  items: MediaItem[];
  currentIndex: number;
  onReorder: (items: MediaItem[]) => void;
  onPlayItem: (index: number) => void;
  onDeleteItem: (id: string) => void;
  onSendToProjector?: (index: number) => void;
}

export function PlaylistPanel({
  items,
  currentIndex,
  onReorder,
  onPlayItem,
  onDeleteItem,
  onSendToProjector,
}: PlaylistPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum item na playlist
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Adicione arquivos para começar
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4" data-testid="playlist-container">
          {items.map((item, index) => (
            <PlaylistItem
              key={item.id}
              item={item}
              isActive={index === currentIndex}
              onPlay={() => onPlayItem(index)}
              onDelete={() => onDeleteItem(item.id)}
              onSendToProjector={onSendToProjector ? () => onSendToProjector(index) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
