import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform, UIManager } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import FolderDetailScreen from './screens/FolderDetailScreen';
import PracticeConfigScreen from './screens/PracticeConfigScreen';
import PracticeSessionScreen from './screens/PracticeSessionScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Folder, PracticeSession, PracticeStats } from './types';
import { storage, mediaUtils } from './utils/storage';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<any>();

const STATIC_FOLDERS: Folder[] = [
  {
    id: '1',
    name: '解剖学 - 手部',
    lastUpdated: '昨天',
    lastOpened: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=400&auto=format&fit=crop',
    references: Array.from({ length: 48 }).map((_, i) => ({
      id: `h-${i}`,
      uri: `https://picsum.photos/seed/hand${i}/600/800`,
      completed: i % 5 === 0
    }))
  },
  {
    id: '2',
    name: '赛博朋克道具',
    lastUpdated: '3天前',
    lastOpened: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=400&auto=format&fit=crop',
    references: []
  },
  {
    id: '3',
    name: '风景研究',
    lastUpdated: '1周前',
    lastOpened: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
    references: []
  }
];

const INITIAL_STATS: PracticeStats = {
  streak: 5,
  totalHours: 12,
  totalMinutes: 45,
  totalWorks: 128,
  weeklyTrend: [
    { day: '周一', minutes: 45 },
    { day: '周二', minutes: 30 },
    { day: '周三', minutes: 60 },
    { day: '周四', minutes: 20 },
    { day: '周五', minutes: 55 },
    { day: '周六', minutes: 90 },
    { day: '周日', minutes: 40 }
  ]
};

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="PracticeConfig" component={PracticeConfigScreen} />
      <Stack.Screen name="PracticeSession" component={PracticeSessionScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<PracticeStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      const savedFolders = await storage.getFolders();
      const savedStats = await storage.getStats();
      
      if (savedFolders.length === 0) {
        await storage.saveFolders(STATIC_FOLDERS);
        setFolders(STATIC_FOLDERS);
      } else {
        setFolders(savedFolders);
      }
      
      if (savedStats) {
        setStats(savedStats);
      } else {
        await storage.saveStats(INITIAL_STATS);
      }

      await mediaUtils.requestPermissions();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFolder = useCallback(async (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      lastUpdated: '刚刚',
      lastOpened: new Date().toISOString(),
      coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop',
      references: []
    };

    const updatedFolders = [newFolder, ...folders];
    setFolders(updatedFolders);
    await storage.saveFolders(updatedFolders);
  }, [folders]);

  const handleUpdateFolder = useCallback(async (updatedFolder: Folder) => {
    const updatedFolders = folders.map(f => f.id === updatedFolder.id ? updatedFolder : f);
    setFolders(updatedFolders);
    await storage.saveFolders(updatedFolders);
  }, [folders]);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    await storage.saveFolders(updatedFolders);
  }, [folders]);

  const handleMarkImageComplete = useCallback(async (folderId: string, imageId: string) => {
    const updatedFolders = folders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          references: f.references.map(img => 
            img.id === imageId ? { ...img, completed: true } : img
          )
        };
      }
      return f;
    });
    setFolders(updatedFolders);
    await storage.saveFolders(updatedFolders);
  }, [folders]);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'HomeTab') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'StatsTab') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'SettingsTab') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'help';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6DD5ED',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        })}
      >
        <Tab.Screen name="HomeTab">
          {() => (
            <HomeStack />
          )}
        </Tab.Screen>
        <Tab.Screen name="StatsTab" component={StatisticsScreen} />
        <Tab.Screen name="SettingsTab" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
