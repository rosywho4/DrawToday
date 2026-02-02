import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Folder, PracticeSession } from '../types';

interface RouteParams {
  folder: Folder;
}

export default function PracticeConfigScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { folder } = route.params as RouteParams;

  const [imageCount, setImageCount] = useState(10);
  const [timePerImage, setTimePerImage] = useState(30);
  const [mode, setMode] = useState<'random' | 'sequential'>('random');

  const incompleteImages = folder.references.filter(img => !img.completed);
  const maxCount = Math.min(incompleteImages.length, 50);

  const handleStartPractice = () => {
    const session: PracticeSession = {
      folderId: folder.id,
      imageCount,
      timePerImage,
      mode,
    };
    navigation.navigate('PracticeSession', { session });
  };

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
        <Text style={styles.headerTitle}>练习设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderMeta}>
            {incompleteImages.length} 张待练习图片
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>练习模式</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'random' && styles.modeButtonActive]}
              onPress={() => setMode('random')}
            >
              <Ionicons 
                name="shuffle" 
                size={24} 
                color={mode === 'random' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[styles.modeText, mode === 'random' && styles.modeTextActive]}>
                随机
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'sequential' && styles.modeButtonActive]}
              onPress={() => setMode('sequential')}
            >
              <Ionicons 
                name="list" 
                size={24} 
                color={mode === 'sequential' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[styles.modeText, mode === 'sequential' && styles.modeTextActive]}>
                顺序
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>图片数量</Text>
            <Text style={styles.sectionValue}>{imageCount} 张</Text>
          </View>
          <View style={styles.sliderContainer}>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setImageCount(Math.max(1, imageCount - 1))}
            >
              <Ionicons name="remove" size={24} color="#6DD5ED" />
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View 
                style={[styles.sliderProgress, { width: `${(imageCount / maxCount) * 100}%` }]} 
              />
              <View 
                style={[styles.sliderThumb, { left: `${(imageCount / maxCount) * 100 - 4}%` }]} 
              />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setImageCount(Math.min(maxCount, imageCount + 1))}
            >
              <Ionicons name="add" size={24} color="#6DD5ED" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>每张时间</Text>
            <Text style={styles.sectionValue}>{timePerImage} 秒</Text>
          </View>
          <View style={styles.sliderContainer}>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setTimePerImage(Math.max(10, timePerImage - 5))}
            >
              <Ionicons name="remove" size={24} color="#6DD5ED" />
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View 
                style={[styles.sliderProgress, { width: `${(timePerImage / 120) * 100}%` }]} 
              />
              <View 
                style={[styles.sliderThumb, { left: `${(timePerImage / 120) * 100 - 4}%` }]} 
              />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setTimePerImage(Math.min(120, timePerImage + 5))}
            >
              <Ionicons name="add" size={24} color="#6DD5ED" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={20} color="#6DD5ED" />
            <Text style={styles.summaryText}>
              总时长约 {(imageCount * timePerImage / 60).toFixed(1)} 分钟
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartPractice}
        >
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>开始练习</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  folderInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  folderName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 14,
    color: '#999999',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6DD5ED',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#6DD5ED',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: '#6DD5ED',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6DD5ED',
    shadowColor: '#6DD5ED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  startButton: {
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
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
