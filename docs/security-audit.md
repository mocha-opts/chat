# InfiniteChat Security Audit

## 目标

本文件记录 InfiniteChat Java 旧项目迁移过程中的安全审计结论。它只记录风险位置和处置要求，不保存、不复述任何旧明文凭据。

## 旧配置凭据审计

已检查 `Fork/` 下各 Java 服务的 `src/main/resources/application.yml` 和 `target/classes/application.yml`。这些文件属于旧系统配置来源或编译产物，可能包含数据库、Redis、对象存储、邮件、服务注册、JWT 或第三方集成相关的旧明文配置。

需要轮换的旧服务配置范围：

- `AuthenticationService`
- `ContactService`
- `GateWay`
- `MessagingService`
- `MomentService`
- `OfflineDataStoreService`
- `RealTimeCommunicationService`

处置规则：

- 不把旧配置里的明文值复制到 NestJS 代码、文档、测试或 `.env.example`。
- 新项目只通过环境变量读取 PostgreSQL、Kafka、Redis、邮箱、对象存储和 JWT 配置。
- 旧环境里出现过的数据库账号、Redis 密码、邮箱授权、对象存储密钥、JWT 密钥、服务注册凭据和第三方 token 全部需要轮换。
- `Fork/*/target/classes/application.yml` 是编译产物，不能作为目标配置事实来源。

## 日志脱敏要求

日志必须继续使用 ACK Pino logger 和统一 redaction 列表。以下字段族必须被视为敏感上下文：

- password、newPassword、oldPassword。
- code、verificationCode、otpCode、twoFactorCode、backupCode。
- token、authorization、x-api-key、apiKey、refreshToken、accessToken。
- privateKey、secretKey、secret、credential、jwt。
- amount、balance、beforeBalance、afterBalance、totalAmount、remainingAmount、redPacketAmount。

业务日志允许记录 ID、状态、topic、outboxId、messageId 和 retryCount，但不要记录验证码明文、密码、token、完整 Authorization header、红包拆分明细或用户余额快照。

## Kafka 失败监控

IM 消息投递仍遵循 PostgreSQL outbox 策略。Kafka publish 失败先标记 outbox failed 并等待重试；达到最大重试次数后投递 `im.dead-letter`，死信 payload 只包含定位和诊断字段，不包含原始消息 payload。

死信事件字段：

- outboxId
- messageId
- failedTopic
- messageKey
- retryCount
- error
- failedAt

## 仍需单独授权的事项

PostgreSQL 索引和约束需要编辑 `prisma/schema.prisma` 并生成迁移。当前项目红线要求没有用户明确授权时不能编辑 Prisma schema，也不能运行 migration 或 db push，所以该项保留到单独阶段执行。
