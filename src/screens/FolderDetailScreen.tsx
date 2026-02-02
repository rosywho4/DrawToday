import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import FastImage from 'react-native-fast-image';
import { Folder, ImageReference } from '../types';
import { storage, mediaUtils } from '../utils/storage';

interface RouteParams {
  folder: Folder;
}

export default function FolderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { folder } = route.params as RouteParams;

  const [images, setImages] = useState<ImageReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setImages(folder.references);
  }, [folder]);

  const handleNavigate = useCallback((page: string, folder?: Folder) => {
    navigation.navigate(page as any, { folder });
  }, [navigation]);

  const handleUpdateFolder = useCallback(async (updatedFolder: Folder) => {
    setImages(updatedFolder.references);
  }, []);

  const handleMarkComplete = useCallback(async (imageId: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, completed: !img.completed } : img
    );
    setImages(updatedImages);
  }, [images]);

  const handleSetCover = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      handleUpdateFolder({
        ...folder,
        coverImage: image.uri,
        coverImageId: imageId,
      });
    }
    setShowCoverMenu(false);
    setSelectedImageId(null);
    Alert.alert('成功', '封面已更新');
  }, [images, folder, handleUpdateFolder]);

  const handleDeleteImage = useCallback((imageId: string) => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const updatedImages = images.filter(img => img.id !== imageId);
            handleUpdateFolder({
              ...folder,
              references: updatedImages,
            });
          },
        },
      ]
    );
    setShowCoverMenu(false);
    setSelectedImageId(null);
  }, [images, folder, handleUpdateFolder]);

  const handleImportImages = useCallback(async () => {
    try {
      setIsLoading(true);

      const hasPermission = await mediaUtils.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          '需要权限',
          '请在系统设置中允许访问相册',
          [{ text: '确定' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsLoading(true);

        const newImages: ImageReference[] = result.assets.map((asset, index) => ({
          id: `imported-${Date.now()}-${index}`,
          uri: asset.uri,
          localUri: asset.uri,
          title: asset.fileName || `图片 ${images.length + index + 1}`,
          completed: false,
        }));

        const updatedImages = [...folder.references, ...newImages];
        
        handleUpdateFolder({
          ...folder,
          references: updatedImages,
          coverImage: folder.references.length === 0 ? newImages[0].uri : folder.coverImage,
        });

        Alert.alert('成功', `成功导入 ${newImages.length} 张图片`);
      }
    } catch (error) {
      console.error('Error importing images:', error);
      Alert.alert('错误', '导入图片失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [folder, images, handleUpdateFolder]);

  const handleStartPractice = useCallback(() => {
    if (images.length === 0) {
      Alert.alert('提示', '请先导入一些图片');
      return;
    }

    const incompleteImages = images.filter(img => !img.completed);
    if (incompleteImages.length === 0) {
      Alert.alert('提示', '所有图片已完成练习');
      return;
    }

    navigation.navigate('PracticeConfig', { folder: { ...folder, references: images } });
  }, [folder, images, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderImageItem = ({ item, index }: { item: ImageReference; index: number }) => (
    <TouchableOpacity
      style={styles.imageCard}
      onPress={() => navigation.navigate('ImageViewer' as any, { images, currentIndex: index })}
      onLongPress={() => {
        setSelectedImageId(item.id);
        setShowCoverMenu(true);
      }}
      activeOpacity={0.7}
    >
      <FastImage
        source={{ uri: item.uri }}
        style={styles.image}
        resizeMode={FastImage.resizeMode.cover}
      />
      {item.completed && (
        <View style={styles.completedOverlay}>
          <Ionicons name="checkmark-circle" size={40} color="#A7D9A7" />
        </View>
      )}
      <View style={styles.imageActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleMarkComplete(item.id)}
        >
          <Ionicons 
            name={item.completed ? "checkbox" : "square-outline"} 
            size={24} 
            color={item.completed ? "#A7D9A7" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{folder.name}</Text>
          <Text style={styles.headerMeta}>{images.length} 张素材</Text>
        </View>

        <TouchableOpacity 
          style={styles.importButton}
          onPress={handleImportImages}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass" size={24} color="#FFFFFF" />
          ) : (
            <Ionicons name="add" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.imageGrid}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>还没有图片</Text>
            <Text style={styles.emptySubText}>点击右上角按钮导入图片</Text>
          </View>
        }
      />

      {images.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.practiceButton}
            onPress={handleStartPractice}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.practiceButtonText}>开始练习</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showCoverMenu}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCoverMenu(false);
          setSelectedImageId(null);
        }}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCoverMenu(false);
            setSelectedImageId(null);
          }}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => selectedImageId && handleSetCover(selectedImageId)}
            >
              <Ionicons name="image-outline" size={24} color="#333333" />
              <Text style={styles.menuText}>设为封面</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => selectedImageId && handleDeleteImage(selectedImageId)}
            >
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuText, { color: '#FF6B6B' }]}>删除</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  headerMeta: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  importButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6DD5ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    padding: 12,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  imageCard: {
    width: '48%',
    aspectRatio: 0.75,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  completedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  imageActions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6DD5ED',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#6DD5ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  practiceButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    width: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
});
