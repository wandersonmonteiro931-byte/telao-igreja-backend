import { useState } from 'react';
import { FileImage, FileVideo, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextSlideDialog, TextFormatting } from './TextSlideDialog';

interface AddMediaButtonsProps {
  onFilesSelected: (files: File[]) => void;
  onTextSlideCreated: (title: string, content: string, formatting: TextFormatting) => void;
}

export function AddMediaButtons({ onFilesSelected, onTextSlideCreated }: AddMediaButtonsProps) {
  const [showTextDialog, setShowTextDialog] = useState(false);

  const handleFileSelect = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    };
    input.click();
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Adicionar mídia</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => handleFileSelect('image/*')}
          data-testid="button-add-image"
        >
          <FileImage className="w-8 h-8" />
          <span className="text-sm">Foto</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => handleFileSelect('video/*')}
          data-testid="button-add-video"
        >
          <FileVideo className="w-8 h-8" />
          <span className="text-sm">Vídeo</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => setShowTextDialog(true)}
          data-testid="button-add-text"
        >
          <FileText className="w-8 h-8" />
          <span className="text-sm">Texto</span>
        </Button>

        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => handleFileSelect('image/*,video/*,audio/*')}
          data-testid="button-add-all"
        >
          <Upload className="w-8 h-8" />
          <span className="text-sm">Arquivo</span>
        </Button>
      </div>

      <TextSlideDialog
        open={showTextDialog}
        onOpenChange={setShowTextDialog}
        onSave={onTextSlideCreated}
      />
    </Card>
  );
}
