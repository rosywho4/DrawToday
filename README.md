# DrawToday - 绘画练习助手

一个基于 React + TypeScript 的现代化Web应用，帮助艺术学习者管理参考图库并进行有效的绘画练习。支持移动端使用，图片持久化存储，以及灵活的画廊管理。

> 🎨 **专为艺术学习者设计** - 让每天的练习更高效、更有趣！

---

## ✨ 核心功能

### 📁 图库管理
- ✅ 创建和管理多个图片画廊
- ✅ 拖拽导入本地图片到画廊
- ✅ 自动为新画廊设置第一张图片为默认封面
- ✅ 支持自定义画廊封面
- ✅ 显示最近打开的画廊列表
- ✅ 图片标签和备注系统

### 🎨 练习功能
- ✅ 开启定时绘画/观察练习
- ✅ 自定义练习时长和图片数量
- ✅ 支持随机/顺序两种练习模式
- ✅ 自动播放画廊中的图片
- ✅ 暂停/继续/退出练习
- ✅ 记录练习进度和完成状态

### 💾 数据持久化
- ✅ 使用 IndexedDB 存储图片文件
- ✅ LocalStorage 保存应用状态
- ✅ 支持页面刷新后数据保留
- ✅ 移动端图片持久化支持

### 📊 数据统计
- ✅ 练习天数连续记录
- ✅ 总练习时长统计
- ✅ 完成作品数追踪
- ✅ 每周练习趋势图表

### 📱 移动端适配
- ✅ 响应式设计，完美支持移动端
- ✅ 触摸友好的界面交互
- ✅ Android 应用支持（Capacitor）
- ✅ PWA 就绪

---

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript 5
- **构建工具**: Vite 5
- **路由管理**: React Router v6
- **样式方案**: Tailwind CSS (CDN)
- **数据存储**: IndexedDB + LocalStorage
- **移动端**: Capacitor (Android)
- **图片查看**: yet-another-react-lightbox
- **文件拖拽**: react-dropzone
- **图标库**: Lucide React + Material Symbols

---

## 📦 快速开始

### 前提条件
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/rosywho4/DrawToday.git
   cd DrawToday
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **在浏览器中打开**
   - 访问 http://localhost:3000
   - 开始使用！

### 构建生产版本

```bash
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

构建后的文件将输出到 `dist` 目录。

---

## 🚀 使用指南

### 创建画廊
1. 点击首页的 **"创建画廊"** 按钮
2. 输入画廊名称并保存
3. 点击画廊卡片进入详情页

### 导入图片
1. 进入画廊详情页
2. 点击 **"导入图片"** 区域或拖拽图片文件
3. 支持批量导入多张图片
4. 图片会自动保存到 IndexedDB

### 设置封面
1. 在画廊详情页，长按任意图片
2. 进入选择模式
3. 选择想要的图片，设为封面
4. 返回首页查看新封面

### 开始练习
1. 进入画廊详情页
2. 点击右下角的 **练习** 按钮
3. 设置练习参数：
   - 图片数量
   - 每张图片时长
   - 练习模式（随机/顺序）
4. 点击 **"开始练习"** 开始计时
5. 练习中可以：
   - 暂停/继续
   - 标记完成
   - 提前结束

### 查看统计
1. 点击底部导航栏的 **统计** 按钮
2. 查看：
   - 连续练习天数
   - 总练习时长
   - 完成作品数
   - 每周趋势图

---

## 📁 项目结构

```
DrawToday/
├── src/
│   ├── components/      # React 组件
│   │   ├── features/   # 功能组件
│   │   ├── layout/     # 布局组件
│   │   └── ui/         # UI 组件
│   ├── contexts/       # Context 状态管理
│   ├── hooks/          # 自定义 Hooks
│   ├── pages/          # 页面组件
│   ├── types/          # TypeScript 类型
│   ├── utils/          # 工具函数
│   ├── data/           # 数据相关
│   ├── App.tsx         # 应用主组件
│   └── index.tsx       # 入口文件
├── android/            # Android 构建
├── index.html          # HTML 入口
├── package.json        # 项目配置
├── tsconfig.json       # TS 配置
├── vite.config.ts      # Vite 配置
└── README.md          # 项目文档
```

> 📖 详细的项目结构说明请查看 [PROJECTSTRUCTURE.md](./PROJECTSTRUCTURE.md)

---

## 🎯 核心特性说明

### 图片持久化机制
- 应用使用 **IndexedDB** 存储图片文件（Blob格式）
- 为每个图片生成持久化的 Blob URL
- 页面刷新后自动从数据库恢复
- 支持大量图片存储（受浏览器限制）

### 状态管理
- 使用 **React Context API** 管理全局状态
- 三个主要 Context：
  - `FoldersContext`: 画廊和图片管理
  - `SessionContext`: 练习会话管理
  - `OnboardingContext`: 用户引导管理

### 路由系统
- 使用 **React Router v6** 实现单页应用
- 支持浏览器前进/后退
- 路由参数传递画廊ID和会话信息

---

## 📱 移动端使用

### Web 移动端
- 直接在手机浏览器中访问
- 完全响应式设计
- 支持触摸操作

### Android 应用
```bash
# 同步 Web 资源到 Android
npx cap sync android

# 在 Android Studio 中打开
npx cap open android

# 构建 APK
# 在 Android Studio 中: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

---

## 🔧 开发说明

### 技术决策

1. **为什么使用 IndexedDB？**
   - 支持存储大量图片数据
   - 异步操作不阻塞UI
   - 浏览器原生支持，无需额外依赖

2. **为什么使用 Context API？**
   - 轻量级状态管理
   - React 内置，无需额外库
   - 适合中小型应用

3. **为什么使用 Tailwind CDN？**
   - 快速原型开发
   - 无需构建配置
   - 减小项目体积

### 环境变量
- 暂无需要配置的环境变量
- Gemini API 集成已预留（`services/geminiService.ts`）

---

## 🐛 已知问题

1. **Safari 浏览器兼容性**
   - IndexedDB 在 Safari 隐私模式下可能受限
   - 建议使用 Chrome/Edge 浏览器

2. **大量图片性能**
   - 单个画廊建议不超过 100 张图片
   - 图片过多可能影响加载速度

3. **移动端文件选择**
   - iOS 设备文件访问受限
   - 建议使用照片库导入

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

Copyright (c) 2024 DrawToday

---

## 🙏 致谢

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Capacitor](https://capacitorjs.com/)

---

## 📞 联系方式

- GitHub: [@rosywho4](https://github.com/rosywho4)
- Issues: [项目Issues](https://github.com/rosywho4/DrawToday/issues)

---

**Happy Drawing! 🎨**
