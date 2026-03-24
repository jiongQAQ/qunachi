# 去哪吃 (qunachi)

发现附近美食，找到你的下一餐。

## 技术栈

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite
- **Testing**: Playwright
- **Package Manager**: Bun

## Getting Started

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：
- `AMAP_WEB_SERVICE_KEY`: 高德地图 Web API Key
- `DATABASE_URL`: SQLite 数据库路径（默认已配置）

### 3. 初始化数据库

```bash
bun run db:generate
bun run db:push
```

### 4. 启动开发服务器

```bash
bun run dev
```

访问 http://127.0.0.1:3000 查看应用。

### 5. 健康检查

```bash
curl http://127.0.0.1:3000/api/health
```

## 项目结构

```
├── app/
│   ├── api/
│   │   └── health/
│   │       └── route.ts    # 健康检查 API
│   ├── globals.css
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── prisma/
│   └── schema.prisma       # 数据库 Schema
├── tests/
│   └── example.spec.ts     # Playwright 测试
├── .env.example            # 环境变量模板
├── next.config.ts
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 可用脚本

| 脚本 | 描述 |
|------|------|
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run start` | 启动生产服务器 |
| `bun run lint` | 运行 ESLint |
| `bun run test` | 运行 Playwright 测试 |
| `bun run test:ui` | 运行 Playwright UI 模式 |
| `bun run db:generate` | 生成 Prisma Client |
| `bun run db:push` | 推送 Schema 到数据库 |
| `bun run db:studio` | 打开 Prisma Studio |

## 设计系统

项目使用基于暖橙色食欲诱发色的设计系统，详情请参阅 `.superautodev/reports/design/design-system.md`。
