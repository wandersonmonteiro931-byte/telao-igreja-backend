import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => void;
}

const ACCEPTED_MEDIA = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'audio/*': ['.mp3', '.m4a', '.wav', '.ogg'],
};

export function MediaUpload({ onFilesSelected }: MediaUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_MEDIA,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <Card
      {...getRootProps()}
      className={`border-2 border-dashed transition-colors cursor-pointer ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-accent/30'
      }`}
      data-testid="media-upload-zone"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3 p-8 min-h-[200px]">
        <div className="flex items-center gap-2">
          <FileImage className="w-8 h-8 text-muted-foreground" />
          <FileVideo className="w-8 h-8 text-muted-foreground" />
          <FileAudio className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-medium">
            {isDragActive
              ? 'Solte os arquivos aqui...'
              : 'Arraste arquivos de mídia para cá'}
          </p>
          <p className="text-sm text-muted-foreground">
            Imagens (JPG, PNG, GIF) • Vídeos (MP4, WebM, MOV) • Áudio (MP3, M4A)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={open}
          data-testid="button-browse-files"
        >
          <Upload className="w-4 h-4 mr-2" />
          Escolher Arquivos
        </Button>
      </div>
    </Card>
  );
}
