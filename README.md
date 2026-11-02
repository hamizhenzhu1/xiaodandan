# 栖页 LinkHaven

一个简洁的双人共享网址导航站。你和朋友可以分别注册登录，在同一个收藏夹中保存天猫、京东和得物网址，并共同搜索、整理和维护收藏。

## 共享收藏配置

1. 在 Supabase 项目的 SQL Editor 中运行 [`supabase/schema.sql`](supabase/schema.sql)。
2. 在 Authentication → URL Configuration 中，把 Site URL 设为 `https://hamizhenzhu1.github.io/xiaodandan/`，并把同一地址加入 Redirect URLs。
3. 本地开发时复制 `.env.example` 为 `.env.local`，填写 Project URL 和 Publishable key。
4. 第一个用户注册登录并创建收藏夹，再把页面顶部的邀请码发给朋友。
5. 朋友注册登录后输入邀请码，即可加入同一份收藏。

Publishable key 可以用于浏览器；不要把数据库密码或 Secret key 写进项目。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 验证

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm format:check
```

详细产品要求见 [PRODUCT_DESIGN.md](./PRODUCT_DESIGN.md)，技术方案见 [docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md)。
