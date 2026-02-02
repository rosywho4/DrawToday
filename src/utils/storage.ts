import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Folder, ImageReference } from '../types';

const FOLDERS_KEY = '@drawtoday_folders';
const STATS_KEY = '@drawtoday_stats';
const MEDIA_PERMISSIONS_KEY = '@drawtoday_media_permissions';

interface StorageData {
  folders: Folder[];
  stats: any;
}

export const STORAGE_KEYS = {
  FOLDERS: FOLDERS_KEY,
  STATS: STATS_KEY,
  MEDIA_PERMISSIONS: MEDIA_PERMISSIONS_KEY,
};

export const storage = {
  async getFolders(): Promise<Folder[]> {
    try {
      const data = await AsyncStorage.getItem(FOLDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting folders:', error);
      return [];
    }
  },

  async saveFolders(folders: Folder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
      console.error('Error saving folders:', error);
    }
  },

  async getStats() {
    try {
      const data = await AsyncStorage.getItem(STATS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  },

  async saveStats(stats: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  },

  async saveMediaPermissions(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(MEDIA_PERMISSIONS_KEY, JSON.stringify({ granted, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving media permissions:', error);
    }
  },

  async getMediaPermissionsStatus(): Promise<{ granted: boolean; timestamp?: number } | null> {
    try {
      const data = await AsyncStorage.getItem(MEDIA_PERMISSIONS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting media permissions status:', error);
      return null;
    }
  },
};

export const mediaUtils = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus !== 'granted') {
        return false;
      }
      
      const { status: existingStatus } = await MediaLibrary.getPermissionsAsync();
      if (existingStatus === 'granted') {
        await storage.saveMediaPermissions(true);
        return true;
      }
      
      return mediaStatus === 'granted';
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking media permissions:', error);
      return false;
    }
  },

  async getAllAssets(albumId?: string): Promise<MediaLibrary.Asset[]> {
    try {
      const options: MediaLibrary.GetAssetsOptions = {
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
        mediaType: [MediaLibrary.MediaType.photo],
      };

      if (albumId) {
        const album = await MediaLibrary.getAlbumAsync(albumId);
        if (album) {
          const assets = await MediaLibrary.getAssetsAsync({
            ...options,
            album: album,
          });
          return assets.assets;
        }
        return [];
      }

      const assets = await MediaLibrary.getAssetsAsync(options);
      return assets.assets;
    } catch (error) {
      console.error('Error getting assets:', error);
      return [];
    }
  },

  async getAssetById(assetId: string): Promise<MediaLibrary.Asset | null> {
    try {
      const asset = await MediaLibrary.getAssetInfoAsync(assetId);
      return asset;
    } catch (error) {
      console.error('Error getting asset by ID:', error);
      return null;
    }
  },

  async copyAssetToAppStorage(assetId: string, folderId: string): Promise<string | null> {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
      if (!assetInfo || !assetInfo.uri) {
        return null;
      }

      const fileName = `${Date.now()}-${assetId}.jpg`;
      const destUri = `${FileSystem.documentDirectory}images/${folderId}/${fileName}`;

      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images/${folderId}`);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images/${folderId}`, { intermediates: true });
      }

      await FileSystem.copyAsync({
        from: assetInfo.uri,
        to: destUri,
      });

      return destUri;
    } catch (error) {
      console.error('Error copying asset:', error);
      return null;
    }
  },

  async deleteLocalFile(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  },
};

export const imageUtils = {
  createImageReference(asset: MediaLibrary.Asset, completed: boolean = false): ImageReference {
    return {
      id: `media-${asset.id}`,
      uri: asset.uri,
      localUri: undefined,
      title: asset.filename || undefined,
      completed,
    };
  },

  async createFolderWithCover(folder: Folder, assets: MediaLibrary.Asset[]): Promise<Folder> {
    if (assets.length === 0) {
      return folder;
    }

    const coverAsset = assets[0];
    const coverUri = await mediaUtils.copyAssetToAppStorage(coverAsset.id, folder.id);

    return {
      ...folder,
      coverImage: coverUri || coverAsset.uri,
      coverImageId: `media-${coverAsset.id}`,
      references: assets.map(asset => this.createImageReference(asset)),
      mediaIds: assets.map(asset => asset.id),
    };
  },
};
