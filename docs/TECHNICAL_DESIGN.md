# 双人共享网址导航站技术方案

## 1. 方案概述

本项目采用 React 单页应用和 Supabase 云服务，实现邮箱登录、共享收藏夹、网址管理、实时同步、导入导出和主题切换。前端继续部署在 GitHub Pages，Supabase 提供 Auth、Postgres 数据库和 Realtime。

技术方案重点关注以下目标：

- 保持项目轻量，降低开发和部署成本。
- 使用 TypeScript 和数据校验减少运行时错误。
- 将界面、业务逻辑和云端同步分层，限制数据只能由收藏夹成员访问。
- 为核心逻辑和主要用户流程建立自动化测试。
- 保证桌面端、移动端和键盘操作的基本可用性。

## 2. 技术栈

| 领域           | 技术                     | 用途                           |
| -------------- | ------------------------ | ------------------------------ |
| 运行环境       | Node.js 22+              | 本地开发、构建和测试           |
| 包管理         | pnpm                     | 管理项目依赖和运行脚本         |
| 前端框架       | React + TypeScript       | 构建组件和交互逻辑             |
| 构建工具       | Vite                     | 开发服务器、打包和静态资源处理 |
| 样式           | Tailwind CSS             | 响应式布局、主题和界面样式     |
| 数据校验       | Zod                      | 表单、网址和导入文件校验       |
| 拖拽排序       | dnd-kit                  | 卡片的鼠标、触摸和键盘排序     |
| 图标           | Lucide React             | 提供统一的操作图标             |
| 单元及组件测试 | Vitest + Testing Library | 验证业务逻辑和组件行为         |
| 端到端测试     | Playwright               | 验证主要用户操作流程           |
| 云端服务       | Supabase                 | 邮箱登录、数据库和实时同步     |
| 代码质量       | ESLint + Prettier        | 静态检查和代码格式化           |

不额外建设自有服务器。浏览器使用 Supabase Publishable key 连接服务，数据库通过 Row Level Security 判断登录用户是否属于目标收藏夹。

## 3. 总体架构

项目按照展示层、业务层和数据层进行划分：

```text
React 页面与组件
        ↓
状态管理与业务服务
        ↓
数据校验与序列化
        ↓
Supabase Auth + Postgres + Realtime
```

- 展示层负责页面布局、表单、弹窗、网址卡片和用户反馈。
- 业务层负责增删改查、搜索、分类、排序和主题切换。
- 数据层负责登录、成员权限、云端读取、实时同步、导入和导出。
- 所有外部输入在进入业务状态前都必须经过 Zod 校验。

## 4. 推荐目录结构

```text
src/
├─ components/        # 通用组件、网址卡片、弹窗和表单
├─ features/
│  ├─ bookmarks/      # 网址管理、搜索和排序
│  ├─ categories/     # 分类管理
│  ├─ import-export/  # 数据导入与导出
│  └─ theme/          # 主题设置
├─ hooks/             # 可复用 React Hooks
├─ schemas/           # Zod 数据结构与校验规则
├─ services/          # Supabase、云端同步及本地文件处理
├─ types/             # TypeScript 类型
├─ utils/             # 网址规范化等纯函数
├─ App.tsx
└─ main.tsx
tests/                # 单元及组件测试
e2e/                  # Playwright 端到端测试
docs/                 # 产品与技术文档
supabase/             # 数据表、函数和 RLS 权限脚本
```

## 5. 核心数据模型

```ts
type Bookmark = {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  note?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  order: number;
};

type AppData = {
  version: number;
  bookmarks: Bookmark[];
  categories: Category[];
  settings: {
    theme: "light" | "dark" | "system";
  };
};
```

所有记录使用 `crypto.randomUUID()` 生成 ID。时间字段使用 ISO 8601 字符串，`version` 用于未来的数据结构迁移。

## 6. 状态与存储方案

### 状态管理

首版使用 React Hooks、Context 和 `useReducer` 管理全局状态，不额外引入 Redux。搜索关键词、弹窗开关等临时状态保留在对应组件内部。

### 云端持久化

- Supabase Auth 负责邮箱注册、确认和密码登录。
- `workspaces` 和 `workspace_members` 表管理共享收藏夹与成员关系。
- `bookmarks` 表保存网址，Realtime 将成员改动通知另一位用户。
- 创建和加入收藏夹通过受控数据库函数完成。
- 所有表启用 RLS，只有目标收藏夹成员可以读取或修改网址。
- `localStorage` 仅用于离线演示模式和本地测试，不保存线上共享数据。

## 7. 核心功能实现

### 网址管理

- 添加和编辑共用同一个表单组件。
- 自动去除首尾空格，并在缺少协议时补全 `https://`。
- 仅允许 `http:` 和 `https:` 协议，禁止 `javascript:` 等危险协议。
- 删除前使用确认弹窗，确认后再更新状态和云端数据。
- 打开外部网址时使用新标签页，并设置 `noopener,noreferrer`。

### 搜索与分类

- 搜索范围包括名称、网址和备注，默认忽略大小写。
- 分类筛选和搜索条件可以同时生效。
- 搜索和筛选结果由当前状态即时计算，不额外写入本地存储。

### 拖拽排序

- 使用 dnd-kit 的 sortable 能力更新卡片顺序。
- 同时配置 Pointer、Touch 和 Keyboard Sensor。
- 拖拽结束后重新计算 `order` 并持久化。
- 为不能或不便拖拽的用户保留键盘排序能力。

### 导入与导出

- 导出时生成包含版本号的 UTF-8 JSON 文件。
- 导入时限制文件类型和合理大小，并完整校验数据结构。
- 导入前展示数据摘要，并要求用户确认是否覆盖现有数据。
- 校验失败时不修改当前数据，并给出具体错误提示。

### 主题

- 支持浅色、深色和跟随系统三种模式。
- 使用 CSS 类和 `prefers-color-scheme` 控制主题。
- 用户选择写入本地设置，避免刷新后丢失。

## 8. 可用性与安全要求

- 所有可点击操作使用语义化按钮或链接，并提供明确的焦点样式。
- 弹窗需要支持焦点管理、Esc 关闭和键盘操作。
- 图标按钮必须包含可访问名称，状态变化应提供文字反馈。
- 移动端触控目标保持足够大小，页面在常见屏幕宽度下不得横向溢出。
- 用户输入以普通文本渲染，不使用未经处理的 HTML。
- 外部链接只允许 HTTP(S) 协议，并使用安全的新窗口参数。
- 从第三方获取网站图标失败时显示本地占位图标，不影响网址打开。

## 9. 测试与验证方案

### 单元测试

重点覆盖：

- 网址补全及协议白名单校验。
- 网址的添加、编辑、删除和排序逻辑。
- 搜索和分类筛选逻辑。
- 本地数据读取、写入、异常及版本处理。
- JSON 导入校验和导出内容生成。

### 组件测试

重点覆盖表单校验、确认弹窗、网址卡片操作、空状态和主题切换。

### 端到端测试

使用 Playwright 验证以下主要流程：

1. 注册、登录、创建或加入共享收藏夹。
2. 添加网址并在另一位成员的页面中同步。
3. 编辑和删除已有网址。
4. 搜索、分类筛选和拖拽排序。
5. 导出数据后重新导入。
6. 切换主题并在刷新后保持。
7. 在桌面和移动端视口完成核心操作。

每次交付前至少运行类型检查、代码检查、单元测试、生产构建和核心端到端测试。

## 10. 构建与部署

项目通过 GitHub Actions 构建并部署到 GitHub Pages。构建时注入 Supabase Project URL 和 Publishable key；Secret key 不得进入浏览器、仓库或构建产物。

建议提供以下 npm 脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format:check": "prettier --check ."
  }
}
```

## 11. 后续扩展

后续可以增加收藏夹切换、所有者移除成员、密码重置、操作记录和更细的冲突处理。涉及成员权限的功能必须继续通过数据库函数和 RLS 实现，不能只依赖前端隐藏按钮。
