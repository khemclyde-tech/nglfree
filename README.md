# nglfree

一个基于 **Cloudflare Workers + D1 + 静态资源** 的极简匿名留言服务。

当前项目包含：

- 一个 Worker 入口，负责 API 路由与静态资源分发
- 一个 D1 数据库表，用于存储匿名消息
- 一个简单前端页面，用于展示头像、昵称、提示语，并提交匿名消息
- 管理接口，用于拉取、回复和删除消息

---

## 1. 项目结构

```text
.
├── public/
│   └── index.html          # 前端页面
├── src/
│   ├── index.js            # Worker 入口与路由
│   ├── constants.js        # 常量配置
│   ├── http.js             # 响应与安全头
│   ├── auth.js             # 管理员 token 校验
│   ├── turnstile.js        # Turnstile 验证
│   ├── services/
│   │   └── mail-proxy.js   # 发送 ntfy 通知
│   ├── data/
│   │   └── messages.js     # D1 数据访问
│   └── handlers/
│       ├── config.js       # /api/config
│       ├── profile.js      # /api/profile
│       ├── send.js         # /api/send
│       ├── reply.js        # /api/reply
│       ├── delete.js       # /api/delete
│       ├── pull.js         # /api/pull
│       └── shared.js       # handler 公共工具
├── schema.sql              # D1 表结构
├── wrangler.example.toml   # 可公开的 Cloudflare Workers 配置模板
└── package.json
```

---

## 2. 运行要求

- Node.js 18+
- npm
- Cloudflare 账号
- Wrangler CLI（本项目已通过 `devDependencies` 安装）

安装依赖：

```bash
npm install
```

---

## 3. Cloudflare 资源准备

### 3.1 创建 D1 数据库

先创建数据库：

```bash
npx wrangler d1 create ngl-db
```

复制配置模板，并把创建后返回的数据库 ID 填入本地 `wrangler.toml`：

```bash
cp wrangler.example.toml wrangler.toml
```

```toml
[[d1_databases]]
binding = "DB"
database_name = "ngl-db"
database_id = "YOUR_D1_DATABASE_ID"
```

### 3.2 初始化数据库表

本地初始化：

```bash
npm run db:init
```

这条命令会执行：

```bash
wrangler d1 execute ngl-db --local --file=schema.sql
```

如果你要初始化远程数据库，可以手动执行：

```bash
npx wrangler d1 execute ngl-db --remote --file=schema.sql
```

---

## 4. 配置项说明

### 4.1 `wrangler.toml` 中的非敏感变量

```toml
[vars]
PROFILE_NICKNAME = "@your_name"
PROFILE_PROMPT = "Say something..."
MAIL_PROXY_NOTIFY_PRIORITY = "3"
```

可选含义：

- `PROFILE_NICKNAME`：页面展示的昵称
- `PROFILE_PROMPT`：页面上的引导文案
- `MAIL_PROXY_NOTIFY_PRIORITY`：新留言通知优先级

### 4.2 Secret 配置

项目依赖以下 Secret：

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SITE_KEY
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put PROFILE_AVATAR_URL
```

含义如下：

- `ADMIN_TOKEN`：管理接口认证 token
- `TURNSTILE_SITE_KEY`：Cloudflare Turnstile 前端 site key
- `TURNSTILE_SECRET`：Cloudflare Turnstile 服务端 secret
- `PROFILE_AVATAR_URL`：头像地址，未设置时默认使用 `/avatar.jpg`

`MAIL_PROXY_TOKEN` 不建议单独明文保存。当前项目默认可通过 Secrets Store 复用 mail-proxy token。请只在本地 `wrangler.toml` 中填写你自己的 `store_id` 和 `secret_name`：

```toml
[[services]]
binding = "MAIL_PROXY"
service = "YOUR_MAIL_PROXY_WORKER_NAME"

[[secrets_store_secrets]]
binding = "MAIL_PROXY_TOKEN"
store_id = "YOUR_SECRETS_STORE_ID"
secret_name = "YOUR_MAIL_PROXY_SECRET_NAME"
```

这样在 `/api/send` 写库成功后，Worker 会通过内部 Service Binding 调用 `mail-proxy` 的 `POST /notify`，并强制传递 `topic: "NGL-Free"`，无需走公网。

> 注意：`TURNSTILE_SITE_KEY` 虽然是前端会读取到的配置，但当前实现仍通过 Worker 的 `/api/config` 返回它，而不是直接写死在前端页面里。

---

## 5. 本地开发

启动本地开发：

```bash
npm run dev
```

这会执行：

```bash
wrangler dev
```

启动后可访问本地 Worker 地址，在浏览器中打开首页测试匿名留言页面。

---

## 6. 部署

部署到 Cloudflare：

```bash
npm run deploy
```

这会执行：

```bash
wrangler deploy
```

部署前建议确认：

1. `wrangler.toml` 中的 `database_id` 已替换为真实值
2. 所有必需 secret 都已设置
3. D1 表结构已初始化

---

## 7. 校验命令

项目当前提供了一个最小语法校验命令：

```bash
npm run check
```

它会对当前所有 Worker 源文件执行 `node --check`，用于快速检查语法和模块导入是否正常。

> 说明：当前项目还没有自动化测试，这个命令只能做最基础的语法校验，不能替代接口测试或端到端测试。

---

## 8. API 说明

### 8.1 `GET /api/config`

返回前端需要的公开配置。

示例返回：

```json
{
  "turnstileSiteKey": "your-site-key"
}
```

---

### 8.2 `GET /api/profile`

返回页面展示所需的资料信息。

示例返回：

```json
{
  "avatarUrl": "https://example.com/avatar.jpg",
  "nickname": "@user",
  "prompt": "说点什么..."
}
```

---

### 8.3 `POST /api/send`

提交匿名消息。

说明：

- `ts` 由服务端写入，客户端提交的时间戳会被忽略
- JSON 请求体最大 `8 KB`
- `meta.ua` / `meta.ref` / `meta.tz` / `meta.lang` 会做长度限制

请求体：

```json
{
  "text": "你好",
  "token": "turnstile-token",
  "meta": {
    "ua": "Mozilla/5.0 ...",
    "lang": "zh-CN"
  }
}
```

成功返回：

```json
{
  "ok": true,
  "id": "msg:1712345678901:abcd1234",
  "createdAt": "2026-03-21T12:34:56.789Z"
}
```

常见失败返回：

- `bad_json`
- `body_too_large`
- `text_missing`
- `text_too_long`
- `meta_too_long`
- `missing_token`
- `turnstile_failed`
- `db_insert_failed`

---

### 8.4 `GET /api/pull`

拉取消息列表。该接口需要管理员认证。

支持的请求头：

- `x-admin-token: <token>`
- 或 `Authorization: Bearer <token>`

查询参数：

- `limit`：每次拉取数量，默认 `50`，最大 `200`
- `offset`：分页偏移，默认 `0`
- `mode`：
  - `unreplied`：默认，仅返回 `status != replied` 的消息
  - `all`：返回所有消息

该接口会把本次返回的消息标记为 `pulled = 1`。

示例请求：

```bash
curl "https://your-domain/api/pull?limit=20&offset=0&mode=all" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

示例返回：

```json
{
  "items": [
    {
      "id": "msg:1712345678901:abcd1234",
      "text": "你好",
      "ts": 1712345678901,
      "receivedAt": "2026-03-21T12:34:56.789Z",
      "reply": null,
      "status": "new",
      "pulled": true
    }
  ],
  "nextOffset": 1,
  "total": 1
}
```

---

### 8.5 `POST /api/reply`

给消息写入管理员回复，并将其状态更新为 `replied`。该接口需要管理员认证。

支持的请求头：

- `x-admin-token: <token>`
- 或 `Authorization: Bearer <token>`

请求体：

```json
{
  "id": "msg:xxx",
  "reply": "谢谢反馈"
}
```

示例请求：

```bash
curl -X POST "https://your-domain/api/reply" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"id":"msg:xxx","reply":"谢谢反馈"}'
```

成功返回：

```json
{
  "ok": true,
  "id": "msg:xxx",
  "reply": "谢谢反馈",
  "status": "replied"
}
```

常见失败返回：

- `bad_json`
- `body_too_large`
- `bad_id`
- `reply_missing`
- `reply_too_long`
- `update_failed`

---

### 8.6 `POST /api/delete`

删除消息。该接口需要管理员认证。

支持两种传参方式：

#### 方式一：Query 参数

```bash
curl -X POST "https://your-domain/api/delete?id=msg:xxx" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

#### 方式二：JSON Body

```bash
curl -X POST "https://your-domain/api/delete" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"id":"msg:xxx"}'
```

请求体示例：

```json
{
  "id": "msg:xxx"
}
```

成功返回：

```json
{
  "ok": true,
  "id": "msg:xxx"
}
```

也支持 `DELETE /api/delete`。

---

## 9. 数据表结构

当前 D1 使用单表 `messages`：

- `id`：消息主键
- `text`：消息内容
- `ts`：消息时间戳
- `receivedAt`：接收时间 ISO 字符串
- `ip`：来源 IP
- `meta_ua` / `meta_ref` / `meta_tz` / `meta_lang` / `meta_colo` / `meta_country`：元数据
- `status`：消息状态，默认 `new`
- `pulled`：是否已拉取
- `reply`：回复内容

索引：

- `idx_messages_ts`
- `idx_messages_status`

---

## 10. 前端页面行为

首页会：

1. 调用 `/api/config` 获取 Turnstile site key
2. 调用 `/api/profile` 获取头像、昵称和提示语
3. 渲染 Turnstile 组件
4. 提交匿名消息到 `/api/send`

当前前端是单文件静态页，样式和脚本都在 `public/index.html` 内联。

---

## 11. 当前限制与注意事项

- 当前项目没有自动化测试
- 当前 `npm run check` 只做语法检查
- 管理接口依赖 `ADMIN_TOKEN`
- 所有 API 响应都会返回 CORS 头，便于独立管理前端调用
- 头像默认回退到 `/avatar.png`，如果项目中没有这个文件，请自行补充静态资源或设置 `PROFILE_AVATAR_URL`
- 本项目适合轻量匿名留言场景，若要继续扩展，建议优先补测试与运维文档

---

## 12. 常用命令速查

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 初始化本地 D1 schema
npm run db:init

# 语法检查
npm run check

# 部署
npm run deploy
```
