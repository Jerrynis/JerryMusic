# Music Station - 独立音乐站

一个基于 React + Vite + Tailwind CSS 构建的现代化网易云音乐客户端，支持深浅色主题切换。

## 功能特性

- **音乐播放** - 完整的播放器体验，支持播放/暂停、上一首/下一首、进度拖拽、音量控制、四种播放模式（顺序/列表循环/单曲循环/随机）
- **歌词显示** - 实时逐行歌词同步，支持翻译
- **歌曲搜索** - 支持搜索单曲、歌手、专辑、歌单，带热搜推荐和搜索防抖
- **登录系统** - 支持网易云音乐扫码登录和手机号登录
- **个人中心** - 查看用户信息、歌单列表、播放记录
- **发现页** - 推荐歌单、每日推荐、新歌速递、热门榜单
- **深浅色主题** - 支持深色/浅色主题切换，自动跟随系统偏好
- **播放队列** - 查看和管理当前播放列表

## 技术栈

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Zustand (状态管理)
- React Router 6
- Lucide React (图标)

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发预览
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

本地开发服务器运行在 `http://localhost:3000`

## Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入该项目
3. Vercel 会自动检测 Vite 框架并配置构建
4. 点击 Deploy 即可

API 代理通过 `/api/[...path].js` Serverless Function 实现，无需额外配置。

## 项目结构

```
├── api/
│   └── [...path].js          # Vercel Serverless API 代理
├── src/
│   ├── components/            # UI 组件
│   │   ├── LoginModal.tsx    # 登录弹窗（扫码+手机）
│   │   ├── Player.tsx        # 底部播放器
│   │   ├── PlaylistCard.tsx  # 歌单卡片
│   │   ├── Sidebar.tsx       # 侧边导航栏
│   │   └── SongTable.tsx     # 歌曲列表
│   ├── pages/                 # 页面
│   │   ├── Home.tsx          # 首页
│   │   ├── Search.tsx        # 搜索页
│   │   ├── PlaylistDetail.tsx # 歌单详情
│   │   ├── Profile.tsx       # 个人中心
│   │   └── Explore.tsx       # 发现页
│   ├── stores/               # Zustand 状态管理
│   │   ├── playerStore.ts    # 播放器状态
│   │   ├── userStore.ts      # 用户状态
│   │   └── themeStore.ts     # 主题状态
│   ├── lib/
│   │   ├── api.ts            # API 客户端
│   │   └── utils.ts          # 工具函数
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── vite.config.ts            # Vite 配置（含 API 代理）
├── vercel.json               # Vercel 部署配置
└── tailwind.config.js        # Tailwind 配置
```

## API

基于 [NeteaseCloudMusicAPI Enhanced](https://music-api.jerry-nis.top/docs/) 提供的接口。

- 开发环境：Vite 代理 `/api` -> `https://music-api.jerry-nis.top`
- 生产环境：Vercel Serverless Function 代理
