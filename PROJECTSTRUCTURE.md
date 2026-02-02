# DrawToday 项目结构文档

## 📁 项目架构

```
DrawToday/
├── src/                          # 主源代码目录
│   ├── components/               # React 组件
│   │   ├── features/            # 功能组件
│   │   │   └── OnboardingGuide.tsx
│   │   ├── layout/              # 布局组件
│   │   │   ├── BottomNav.tsx   # 底部导航栏
│   │   │   └── Header.tsx       # 页面头部
│   │   └── ui/                  # UI 基础组件
│   │       └── Button.tsx
│   │
│   ├── contexts/                # React Context 状态管理
│   │   ├── FoldersContext.tsx  # 文件夹管理
│   │   ├── OnboardingContext.tsx # 引导流程
│   │   └── SessionContext.tsx   # 练习会话
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useFolderImages.ts  # 文件夹图片管理
│   │   ├── useHomePage.ts       # 首页逻辑
│   │   └── useImageViewer.ts    # 图片查看器
│   │
│   ├── pages/                   # 页面组件
│   │   ├── HomePage.tsx         # 首页
│   │   ├── FolderDetailPage.tsx # 文件夹详情
│   │   ├── PracticeConfigPage.tsx # 练习配置
│   │   ├── PracticeSessionPage.tsx # 练习会话
│   │   ├── StatisticsPage.tsx   # 统计页面
│   │   └── SettingsPage.tsx     # 设置页面
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── utils/                   # 工具函数
│   │   ├── indexedDB.ts        # IndexedDB 操作（集中管理）
│   │   └── platform.ts          # 平台检测
│   │
│   ├── data/                    # 数据相关
│   │   └── mockData.ts
│   │
│   ├── App.tsx                  # 应用主组件（使用 React Router）
│   ├── index.tsx                # 应用入口
│   └── capacitor-utils.ts       # Capacitor 工具
│
├── android/                     # Android 构建配置
│   └── app/                     # Android 应用代码
│
├── index.html                   # HTML 入口（使用 Tailwind CDN）
├── package.json                 # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 构建配置
├── capacitor.config.ts         # Capacitor 配置
└── vercel.json                 # Vercel 部署配置
```

---

## 🏗️ 架构设计

### 1. **状态管理**
- 使用 **React Context API** 管理全局状态
- 三个主要 Context:
  - `FoldersContext`: 文件夹和图片数据
  - `SessionContext`: 练习会话状态
  - `OnboardingContext`: 用户引导状态

### 2. **路由系统**
- 使用 **React Router v6**
- 路由配置在 `src/App.tsx`
- 主要路由:
  - `/` - 首页
  - `/folder/:folderId` - 文件夹详情
  - `/folder/:folderId/practice` - 练习配置
  - `/folder/:folderId/session` - 练习会话
  - `/statistics` - 统计
  - `/settings` - 设置

### 3. **数据持久化**
- **IndexedDB**: 存储图片文件（Blob）
  - 数据库名: `DrawTodayDB`
  - 对象存储: `Images`
  - 所有操作集中在 `src/utils/indexedDB.ts`
  
- **LocalStorage**: 存储应用状态
  - 文件夹数据
  - 用户设置
  - 引导状态

### 4. **样式方案**
- **Tailwind CSS** (CDN 方式)
- 配置在 `index.html` 中
- 自定义颜色主题:
  - `primary`: #6DD5ED (青色)
  - `secondary`: #A7D9A7 (绿色)
  - `bg-serenity`: #EAF2F6 (背景色)

---

## 🔧 核心功能模块

### 文件夹管理 (`FoldersContext`)
- 创建/编辑/删除文件夹
- 导入图片到文件夹
- 设置文件夹封面
- 追踪最近打开

### 图片管理 (`useFolderImages Hook`)
- IndexedDB 存储
- Blob URL 生成和管理
- 图片元数据（标签、备注、完成状态）
- 批量操作

### 练习系统
- 自定义练习时长
- 随机/顺序模式
- 进度追踪
- 完成标记

### 数据统计
- 练习时长统计
- 完成作品数
- 连续天数
- 周趋势图

---

## 📝 命名规范

### 文件命名
- 页面组件: `XxxPage.tsx` (PascalCase + Page后缀)
- 普通组件: `XxxComponent.tsx` (PascalCase)
- Hooks: `useXxx.ts` (camelCase + use前缀)
- 工具函数: `xxx.ts` (camelCase)
- Context: `XxxContext.tsx` (PascalCase + Context后缀)

### 代码规范
- 组件使用函数式组件
- 优先使用 Hooks
- TypeScript 严格模式关闭（历史原因）
- 使用 ES模块导入

---

## 🚀 构建和部署

### 开发环境
```bash
npm run dev          # 启动开发服务器 (Vite)
```

### 生产构建
```bash
npm run build        # TypeScript编译 + Vite构建
npm run preview      # 预览生产构建
```

### Android 构建
```bash
npx cap sync android    # 同步web资源到Android
npx cap open android    # 打开Android Studio
```

---

## ⚙️ 配置文件说明

### `tsconfig.json`
- 仅包含 `src` 目录
- 路径别名: `@/*` → `src/*`
- 严格模式关闭

### `vite.config.ts`
- 基础路径: `./` (相对路径，适配Android WebView)
- 构建输出: `dist/`
- Source map 开启

### `capacitor.config.ts`
- Android 平台集成
- WebView 配置

---

## 🔒 数据流程

### 图片导入流程
1. 用户选择文件 → `useFolderImages.importImages()`
2. 生成唯一ID → 存入IndexedDB (`saveImageToDB`)
3. 创建Blob URL → 更新组件状态
4. 更新Folder引用 → 持久化到localStorage

### 练习流程
1. 配置页面选择参数 → `PracticeConfigPage`
2. 创建会话 → `SessionContext.startSession()`
3. 进入练习 → `PracticeSessionPage`
4. 标记完成 → 更新IndexedDB元数据
5. 结束会话 → 统计数据

---

## 🐛 已知问题和注意事项

1. **TypeScript严格模式关闭**
   - 部分代码需要重构以支持严格模式
   - 注意类型安全

2. **Blob URL 生命周期**
   - 需要手动清理（使用 `URL.revokeObjectURL`）
   - `useFolderImages` Hook 中有cleanup逻辑

3. **Android WebView**
   - 使用相对路径构建
   - 注意文件访问权限

4. **IndexedDB 浏览器兼容性**
   - Safari 有限制
   - 需要用户交互触发

---

## 📚 技术栈版本

- React: 18.2.0
- TypeScript: 5.3.2
- Vite: 5.0.8
- React Router: 6.20.0
- Tailwind CSS: 3.3.6 (CDN)
- Capacitor: (Android 集成)

---

## 🎯 未来优化方向

1. 启用 TypeScript 严格模式
2. 添加单元测试
3. 优化IndexedDB性能（批量操作）
4. 添加图片压缩功能
5. 支持云同步（可选）
6. PWA 支持
7. 国际化支持
