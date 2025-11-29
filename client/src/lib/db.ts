import { openDB, type IDBPDatabase } from 'idb';
import type {
  MediaItem,
  GalleryItem,
  PlaylistItem,
  Playlist,
  Theme,
  AppSettings,
} from '@shared/schema';

const DB_NAME = 'church-presentation-db';
const DB_VERSION = 4;

interface ChurchPresentationDB {
  mediaItems: {
    key: string;
    value: MediaItem;
  };
  galleryItems: {
    key: string;
    value: GalleryItem;
  };
  playlistItems: {
    key: string;
    value: PlaylistItem;
  };
  mediaBlobs: {
    key: string;
    value: Blob;
  };
  playlists: {
    key: string;
    value: Playlist;
  };
  themes: {
    key: string;
    value: Theme;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbInstance: IDBPDatabase<ChurchPresentationDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<ChurchPresentationDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ChurchPresentationDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('mediaItems')) {
        db.createObjectStore('mediaItems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('galleryItems')) {
        db.createObjectStore('galleryItems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlistItems')) {
        db.createObjectStore('playlistItems', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mediaBlobs')) {
        db.createObjectStore('mediaBlobs');
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('themes')) {
        db.createObjectStore('themes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

export const db = {
  async getMediaItems(): Promise<MediaItem[]> {
    const db = await initDB();
    return db.getAll('mediaItems');
  },

  async getMediaItem(id: string): Promise<MediaItem | undefined> {
    const db = await initDB();
    return db.get('mediaItems', id);
  },

  async addMediaItem(item: MediaItem): Promise<void> {
    const db = await initDB();
    await db.put('mediaItems', item);
  },

  async deleteMediaItem(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('mediaItems', id);
    // Also delete the blob if it exists
    await db.delete('mediaBlobs', id);
  },

  async saveMediaBlob(id: string, blob: Blob): Promise<void> {
    const db = await initDB();
    await db.put('mediaBlobs', blob, id);
  },

  async getMediaBlob(id: string): Promise<Blob | undefined> {
    const db = await initDB();
    return db.get('mediaBlobs', id);
  },

  async getPlaylists(): Promise<Playlist[]> {
    const db = await initDB();
    return db.getAll('playlists');
  },

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const db = await initDB();
    return db.get('playlists', id);
  },

  async addPlaylist(playlist: Playlist): Promise<void> {
    const db = await initDB();
    await db.put('playlists', playlist);
  },

  async deletePlaylist(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('playlists', id);
  },

  async getThemes(): Promise<Theme[]> {
    const db = await initDB();
    return db.getAll('themes');
  },

  async getTheme(id: string): Promise<Theme | undefined> {
    const db = await initDB();
    return db.get('themes', id);
  },

  async addTheme(theme: Theme): Promise<void> {
    const db = await initDB();
    await db.put('themes', theme);
  },

  async deleteTheme(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('themes', id);
  },

  async getSettings(): Promise<AppSettings | undefined> {
    const db = await initDB();
    return db.get('settings', 'appSettings');
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await initDB();
    await db.put('settings', settings, 'appSettings');
  },

  async saveLogoBlob(blob: Blob): Promise<void> {
    const db = await initDB();
    await db.put('mediaBlobs', blob, 'church-logo');
  },

  async getLogoBlob(): Promise<Blob | undefined> {
    const db = await initDB();
    return db.get('mediaBlobs', 'church-logo');
  },

  async deleteLogoBlob(): Promise<void> {
    const db = await initDB();
    await db.delete('mediaBlobs', 'church-logo');
  },

  // Gallery Items - Armazenamento permanente
  async getGalleryItems(): Promise<GalleryItem[]> {
    const db = await initDB();
    return db.getAll('galleryItems');
  },

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const db = await initDB();
    return db.get('galleryItems', id);
  },

  async addGalleryItem(item: GalleryItem): Promise<void> {
    const db = await initDB();
    await db.put('galleryItems', item);
  },

  async deleteGalleryItem(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('galleryItems', id);
    // Delete associated blob if exists
    await db.delete('mediaBlobs', id);
  },

  // Playlist Items - Lista de reprodução do culto
  async getPlaylistItems(): Promise<PlaylistItem[]> {
    const db = await initDB();
    const items = await db.getAll('playlistItems');
    return items.sort((a, b) => a.order - b.order);
  },

  async getPlaylistItem(id: string): Promise<PlaylistItem | undefined> {
    const db = await initDB();
    return db.get('playlistItems', id);
  },

  async addPlaylistItem(item: PlaylistItem): Promise<void> {
    const db = await initDB();
    await db.put('playlistItems', item);
  },

  async deletePlaylistItem(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('playlistItems', id);
  },

  async clearPlaylistItems(): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('playlistItems', 'readwrite');
    await tx.store.clear();
    await tx.done;
  },

  async updatePlaylistItems(items: PlaylistItem[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('playlistItems', 'readwrite');
    
    // Clear all existing items
    await tx.store.clear();
    
    // Add all new items
    await Promise.all(items.map(item => tx.store.put(item)));
    
    await tx.done;
  },
};
