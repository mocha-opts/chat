# Quality Documentation

## 目标

本文件记录 InfiniteChat 迁移阶段的质量、联调和压测入口。默认 `pnpm test` 只运行本地可重复测试，不连接真实 PostgreSQL、Redis、Kafka 或 WebSocket 服务。

真实环境探测必须显式设置 `INFINITECHAT_E2E=1`，并提供测试环境 URL、测试账号和测试数据。不要对生产环境运行这些脚本。

## 脚本入口

```bash
INFINITECHAT_E2E=1 pnpm quality:legacy:e2e
INFINITECHAT_E2E=1 pnpm quality:legacy:realtime
INFINITECHAT_E2E=1 pnpm quality:legacy:perf
```

脚本不会打印 token、验证码、密码或余额值。失败信息只输出接口路径、状态和服务端 message。

## 公共环境变量

| 变量 | 说明 |
| ---- | ---- |
| `INFINITECHAT_E2E` | 必须为 `1`，防止误跑真实环境探测 |
| `INFINITECHAT_BASE_URL` | 目标 NestJS 应用地址，例如 `http://localhost:3000` |
| `INFINITECHAT_E2E_PHONE` | 已存在测试账号手机号 |
| `INFINITECHAT_E2E_PASSWORD` | 已存在测试账号密码 |
| `INFINITECHAT_E2E_TIMEOUT_MS` | WebSocket 等待超时，默认 `5000` |

## Legacy HTTP Smoke

命令：

```bash
INFINITECHAT_E2E=1 pnpm quality:legacy:e2e
```

固定必跑：

- `POST /api/v1/user/login`

按环境变量启用的场景：

| 场景 | 需要变量 |
| ---- | -------- |
| 发送验证码 | `INFINITECHAT_E2E_EMAIL`、`INFINITECHAT_E2E_PHONE` |
| 注册 | `INFINITECHAT_E2E_REGISTER_PHONE`、`INFINITECHAT_E2E_REGISTER_PASSWORD`、`INFINITECHAT_E2E_REGISTER_CODE` |
| 验证码登录 | `INFINITECHAT_E2E_LOGIN_CODE_PHONE`、`INFINITECHAT_E2E_LOGIN_CODE` |
| 更新头像 | `INFINITECHAT_E2E_AVATAR_URL` |
| 搜索用户 | `INFINITECHAT_E2E_USER_ID`、`INFINITECHAT_E2E_SEARCH_PHONE` |
| 申请好友 | `INFINITECHAT_E2E_FRIEND_USER_ID` |
| 创建群聊 | `INFINITECHAT_E2E_GROUP_MEMBER_IDS`，逗号分隔 |
| 查询群成员 | 创建群聊成功，或提供 `INFINITECHAT_E2E_GROUP_SESSION_ID` |
| 发送消息 | `INFINITECHAT_E2E_SESSION_ID`，可选 `INFINITECHAT_E2E_RECEIVER_USER_ID`、`INFINITECHAT_E2E_SESSION_TYPE` |
| 发送红包 | `INFINITECHAT_E2E_SESSION_ID`、`INFINITECHAT_E2E_RED_PACKET_AMOUNT`，可选 `INFINITECHAT_E2E_RED_PACKET_COUNT` |
| 拉离线消息 | `INFINITECHAT_E2E_OFFLINE_TIME`，格式 `YYYY-MM-DD HH:mm:ss` |
| 发布朋友圈 | `INFINITECHAT_E2E_MOMENT_TEXT`，可选 `INFINITECHAT_E2E_MOMENT_MEDIA_URLS` |

## Realtime And Kafka Smoke

命令：

```bash
INFINITECHAT_E2E=1 pnpm quality:legacy:realtime
```

检查内容：

- 使用密码登录获取 ACK access token。
- 连接 `/api/v1/netty` WebSocket。
- 发送旧客户端心跳帧 `{ type: 5, msgUuid, data }` 并等待响应。
- 如果提供 `INFINITECHAT_KAFKA_BROKERS`，使用 Kafka admin 检查 `im.message.persist`、`im.realtime.push`、`im.dead-letter` topic 存在。

`INFINITECHAT_KAFKA_BROKERS` 使用逗号分隔，例如：

```bash
INFINITECHAT_KAFKA_BROKERS=localhost:9092
```

## Performance Probe

命令：

```bash
INFINITECHAT_E2E=1 pnpm quality:legacy:perf
```

默认压测 `message` 和 `offline` 场景。可通过 `INFINITECHAT_PERF_SCENARIOS` 指定：

```bash
INFINITECHAT_PERF_SCENARIOS=message,offline,redPacket
INFINITECHAT_PERF_ITERATIONS=20
INFINITECHAT_PERF_CONCURRENCY=4
```

输出指标：

- count
- min
- max
- avg
- p95

红包压测会真实创建红包并扣减测试账号余额。只允许在可重置测试环境使用。

## 阶段 9 状态

已具备：

- 本地 Jest 守卫测试：路由表、WebSocket path、Kafka dead-letter、日志脱敏和安全审计。
- 显式启用的真实环境 smoke 和压测入口。
- PostgreSQL schema 已补齐当前兼容模块热路径所需的索引和唯一约束。

仍需真实环境执行：

- 注册登录、好友、群聊、消息、红包、朋友圈全链路 e2e。
- WebSocket 和 Kafka 联调。
- 消息发送、离线拉取、红包领取压测。

仍需部署前执行：

- 为本次 `prisma/schema.prisma` 变更生成并应用 Prisma migration。本阶段未执行 `db:migrate`、`db:push`、`migration:*` 或任何数据库写入命令。
