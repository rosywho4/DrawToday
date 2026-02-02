import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { Folder } from '../types';

interface HomeScreenProps {
  folders: Folder[];
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export default function HomeScreen({ folders, onAddFolder, onDeleteFolder }: HomeScreenProps) {
  const navigation = useNavigation<any>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const sortedFolders = [...folders].sort((a, b) => 
    new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
  );

  const recentFolders = sortedFolders.filter(f => 
    new Date(f.lastOpened).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  const handleFolderPress = useCallback((folder: Folder) => {
    navigation.navigate('FolderDetail', { folder });
  }, [navigation]);

  const handleAddFolder = useCallback(() => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowAddModal(false);
    }
  }, [newFolderName, onAddFolder]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    Alert.alert(
      '删除图库',
      '确定要删除这个图库吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            onDeleteFolder(folderId);
            setShowDeleteAlert(null);
          }
        },
      ]
    );
  }, [onDeleteFolder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderFolderItem = ({ item }: { item: Folder }) => (
    <TouchableOpacity 
      style={styles.folderCard}
      onPress={() => handleFolderPress(item)}
      onLongPress={() => setShowDeleteAlert(item.id)}
      activeOpacity={0.7}
    >
      <FastImage
        source={{ uri: item.coverImage }}
        style={styles.coverImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.folderInfo}>
        <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.folderMeta}>
          {item.references.length > 0 ? `${item.references.length} 张素材` : '空图库'}
        </Text>
      </View>
      {item.references.filter(r => r.completed).length > 0 && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>
            {item.references.filter(r => r.completed).length} 已完成
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecentSection = () => {
    if (recentFolders.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color="#6DD5ED" />
          <Text style={styles.sectionTitle}>最近打开</Text>
        </View>
        <FlatList
          horizontal
          data={recentFolders}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recentCard}
              onPress={() => handleFolderPress(item)}
            >
              <FastImage
                source={{ uri: item.coverImage }}
                style={styles.recentCover}
                resizeMode={FastImage.resizeMode.cover}
              />
              <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的图库</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedFolders}
        renderItem={renderFolderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderRecentSection()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>还没有图库</Text>
            <Text style={styles.emptySubText}>点击右上角创建您的第一个图库</Text>
          </View>
        }
      />

      {renderRecentSection()}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建新图库</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入图库名称"
              placeholderTextColor="#999999"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              maxLength={30}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleAddFolder}
              >
                <Text style={styles.modalConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDeleteAlert && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteAlert(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertContent}>
              <Ionicons name="warning-outline" size={50} color="#FF6B6B" />
              <Text style={styles.alertTitle}>删除图库</Text>
              <Text style={styles.alertText}>确定要删除这个图库吗？此操作不可恢复。</Text>
              <View style={styles.alertButtons}>
                <TouchableOpacity 
                  style={[styles.alertButton, styles.alertCancel]}
                  onPress={() => setShowDeleteAlert(null)}
                >
                  <Text style={styles.alertCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.alertButton, styles.alertDelete]}
                  onPress={() => handleDeleteFolder(showDeleteAlert)}
                >
                  <Text style={styles.alertDeleteText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EAF2F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6DD5ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6DD5ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  recentList: {
    paddingHorizontal: 4,
  },
  recentCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentCover: {
    width: '100%',
    height: 120,
  },
  recentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    padding: 8,
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  folderInfo: {
    padding: 16,
  },
  folderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 13,
    color: '#999999',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#A7D9A7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalConfirm: {
    backgroundColor: '#6DD5ED',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertCancel: {
    backgroundColor: '#F5F5F5',
  },
  alertCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  alertDelete: {
    backgroundColor: '#FF6B6B',
  },
  alertDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
