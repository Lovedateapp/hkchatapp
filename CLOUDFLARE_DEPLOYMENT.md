# Cloudflare Pages 和 D1 部署指南

本指南将帮助你将 HKChat 应用程序部署到 Cloudflare Pages，并使用 Cloudflare D1 作为数据库。

## 前提条件

1. 一个 Cloudflare 账户
2. 安装了 Node.js 和 npm/pnpm
3. 安装了 Wrangler CLI（Cloudflare 的命令行工具）

如果尚未安装 Wrangler，可以通过以下命令安装：

```bash
npm install -g wrangler
```

## 步骤 1：登录到 Cloudflare

首先，使用 Wrangler 登录到你的 Cloudflare 账户：

```bash
wrangler login
```

这将打开浏览器，要求你授权 Wrangler 访问你的 Cloudflare 账户。

## 步骤 2：创建 D1 数据库

使用以下命令创建一个新的 D1 数据库：

```bash
npm run d1:create
```

这将创建一个名为 `hkchat-db` 的 D1 数据库。创建成功后，你将看到一个数据库 ID。请将此 ID 复制到 `wrangler.toml` 文件中的 `database_id` 字段。

## 步骤 3：应用数据库迁移

创建数据库后，需要应用迁移脚本来创建表结构：

```bash
npm run d1:migrate
```

这将执行 `migrations` 目录中的 SQL 脚本，创建必要的表结构。

## 步骤 4：构建应用程序

构建 Next.js 应用程序：

```bash
npm run build
```

这将生成静态文件到 `out` 目录。

## 步骤 5：本地测试（可选）

在部署之前，你可以在本地测试应用程序：

```bash
npm run pages:dev
```

这将启动一个本地开发服务器，模拟 Cloudflare Pages 环境，包括 D1 数据库连接。

## 步骤 6：部署到 Cloudflare Pages

准备就绪后，使用以下命令部署应用程序：

```bash
npm run build:cloudflare
```

这将构建应用程序并将其部署到 Cloudflare Pages。

## 步骤 7：配置环境变量（如果需要）

如果你的应用程序需要环境变量，可以在 Cloudflare Pages 仪表板中设置：

1. 登录到 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 导航到 Pages > 你的项目
3. 点击 "Settings" > "Environment variables"
4. 添加必要的环境变量

## 故障排除

### 数据库连接问题

如果遇到数据库连接问题，请检查：

1. `wrangler.toml` 中的 `database_id` 是否正确
2. 确保已经运行了数据库迁移
3. 检查 Cloudflare Pages 函数中的 D1 绑定是否正确

### 部署失败

如果部署失败，请检查：

1. 构建日志中的错误信息
2. 确保 `wrangler.toml` 配置正确
3. 验证 `next.config.mjs` 中的 `output: 'export'` 设置

### API 路由不工作

如果 API 路由不工作，请确保：

1. 所有 API 路由都已转换为 Cloudflare Pages 函数
2. 函数路径与 API 路径匹配
3. 检查浏览器控制台中的错误

## 其他资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
