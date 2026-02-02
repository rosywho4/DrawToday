import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有缓存数据吗？此操作不会删除您的图库数据。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '清除', 
          style: 'destructive',
          onPress: () => Alert.alert('成功', '缓存已清除')
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      '导出数据',
      '数据导出功能开发中...',
      [{ text: '确定' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      '关于 DrawToday',
      'DrawToday v1.0.0\n\n一个帮助您提升绘画观察力的应用。',
      [{ text: '确定' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    iconColor, 
    title, 
    subtitle, 
    onPress, 
    showSwitch,
    switchValue 
  }: {
    icon: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onPress}
          trackColor={{ false: '#E5E7EB', true: '#6DD5ED' }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通用</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications"
              iconColor="#6DD5ED"
              title="练习提醒"
              subtitle="每天提醒您进行练习"
              showSwitch
              switchValue={notifications}
              onPress={() => setNotifications(!notifications)}
            />
            <SettingItem
              icon="moon"
              iconColor="#8B5CF6"
              title="深色模式"
              subtitle="切换深色/浅色主题"
              showSwitch
              switchValue={darkMode}
              onPress={() => setDarkMode(!darkMode)}
            />
            <SettingItem
              icon="save"
              iconColor="#10B981"
              title="自动保存"
              subtitle="自动保存练习进度"
              showSwitch
              switchValue={autoSave}
              onPress={() => setAutoSave(!autoSave)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="cloud-upload"
              iconColor="#3B82F6"
              title="导出数据"
              subtitle="备份您的图库数据"
              onPress={handleExportData}
            />
            <SettingItem
              icon="trash"
              iconColor="#EF4444"
              title="清除缓存"
              subtitle="释放存储空间"
              onPress={handleClearCache}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle"
              iconColor="#F59E0B"
              title="关于 DrawToday"
              onPress={handleAbout}
            />
            <SettingItem
              icon="document-text"
              iconColor="#6366F1"
              title="使用条款"
              onPress={() => Alert.alert('提示', '功能开发中')}
            />
            <SettingItem
              icon="lock-closed"
              iconColor="#8B5CF6"
              title="隐私政策"
              onPress={() => Alert.alert('提示', '功能开发中')}
            />
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>DrawToday v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 DrawToday. All rights reserved.</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EAF2F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  copyrightText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
  },
});
