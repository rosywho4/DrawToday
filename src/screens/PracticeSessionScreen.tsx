import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PracticeSession, ImageReference } from '../types';

interface RouteParams {
  session: PracticeSession;
}

export default function PracticeSessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = route.params as RouteParams;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(session.timePerImage);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressImages, setProgressImages] = useState<ImageReference[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeSession = () => {
    const storedImages = getImagesFromStorage();
    const shuffled = session.mode === 'random' 
      ? storedImages.sort(() => Math.random() - 0.5)
      : storedImages;
    const selected = shuffled.slice(0, session.imageCount);
    setProgressImages(selected);
    setCurrentIndex(0);
    setTimeLeft(session.timePerImage);
    setIsCompleted(false);
    progressAnim.setValue(0);
  };

  const getImagesFromStorage = (): ImageReference[] => {
    return Array.from({ length: session.imageCount }).map((_, i) => ({
      id: `practice-${i}`,
      uri: `https://picsum.photos/seed/${Date.now() + i}/600/800`,
      completed: false,
    }));
  };

  useEffect(() => {
    if (!isPaused && !isCompleted && progressImages.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNext();
            return session.timePerImage;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isCompleted, progressImages.length]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: session.timePerImage * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < progressImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(session.timePerImage);
      progressAnim.setValue(0);
    } else {
      setIsCompleted(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [currentIndex, progressImages.length, session.timePerImage]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleQuit = () => {
    Alert.alert(
      '退出练习',
      '确定要退出练习吗？进度将不会保存。',
      [
        { text: '继续练习', style: 'cancel' },
        { 
          text: '退出', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        },
      ]
    );
  };

  const currentImage = progressImages[currentIndex];
  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.completedContainer}>
          <View style={styles.completedIcon}>
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.completedTitle}>练习完成！</Text>
          <Text style={styles.completedText}>
            你已经完成了 {session.imageCount} 张图片的练习
          </Text>
          <View style={styles.completedStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.ceil(session.imageCount * session.timePerImage / 60)}
              </Text>
              <Text style={styles.statLabel}>练习分钟</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>返回图库</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.quitButton}
          onPress={handleQuit}
        >
          <Ionicons name="close" size={24} color="#333333" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[styles.progressFill, { width: progress }]} 
            />
          </View>
          <Text style={styles.timeText}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.pauseButton}
          onPress={handlePause}
        >
          <Ionicons 
            name={isPaused ? "play" : "pause"} 
            size={24} 
            color="#333333" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Animated.Image
          source={{ uri: currentImage.uri }}
          style={styles.image}
          resizeMode="contain"
        />
        {isPaused && (
          <View style={styles.pausedOverlay}>
            <View style={styles.pausedContent}>
              <Ionicons name="pause-circle" size={80} color="#FFFFFF" />
              <Text style={styles.pausedText}>已暂停</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {session.imageCount}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const updated = [...progressImages];
              updated[currentIndex] = { ...updated[currentIndex], completed: true };
              setProgressImages(updated);
              handleNext();
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={48} color="#A7D9A7" />
            <Text style={styles.actionText}>完成</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Ionicons name="arrow-forward" size={32} color="#FFFFFF" />
            <Text style={styles.nextText}>下一张</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  quitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6DD5ED',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedContent: {
    alignItems: 'center',
  },
  pausedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  counter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A7D9A7',
    marginTop: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6DD5ED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#6DD5ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A7D9A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  completedStats: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6DD5ED',
  },
  statLabel: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#6DD5ED',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#6DD5ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
