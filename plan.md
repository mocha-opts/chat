# InfiniteChat NestJS 单体迁移开发计划

## 1. 目标

在当前 ACK NestJS boilerplate 基础上，迁移 `Fork/` 目录中的 Java InfiniteChat 项目功能，形成一个可维护、可测试、可部署的 NestJS 单体后端。

硬约束：

- 直接使用当前项目 boilerplate，不重新搭建空项目。
- 不拆微服务，所有业务模块运行在一个 Nest 应用进程中。
- 数据库使用 PostgreSQL。
- Kafka 作为即时通讯事件和离线消息链路的消息队列。
- 旧 Java 项目功能全部纳入迁移范围。
- `plan.md`、`spec.md`、`AGENTS.md` 均使用中文，作为后续开发治理文档。

## 2. 当前理解

当前仓库已经是 ACK NestJS boilerplate，核心结构包括：

- `src/app`：根模块、全局异常过滤器。
- `src/common`：数据库、Redis、缓存、请求、响应、日志、文件等共享基础设施。
- `src/configs`：配置入口。
- `src/modules`：已有用户、认证、角色、策略、通知、会话、设备等模块。
- `src/queues`：当前是 Redis/BullMQ 队列，主要服务通知任务。
- `src/router`：按 public、shared、user、admin、system 组织路由。
- `prisma/schema.prisma`：已切换为 PostgreSQL provider，后续新增 IM 领域表继续按 PostgreSQL 建模。

`Fork/` 下 Java 项目是 Maven 多模块项目：

- `AuthenticationService`：用户注册、账号密码登录、验证码登录、头像更新、邮箱验证码、上传预签名 URL、初始余额。
- `ContactService`：好友搜索、好友申请、申请列表、未读申请数、通过申请、删除好友、拉黑、单聊会话、群聊创建、邀请、踢人、退群、设置管理员、群成员列表。
- `MessagingService`：发送聊天消息、单聊/群聊收件人校验、实时推送、Kafka outbox、红包发送、红包领取、红包详情、红包过期退款、余额流水。
- `RealTimeCommunicationService`：Netty WebSocket、JWT 握手鉴权、Redis 在线路由、心跳、ACK、实时推送、通知类型。
- `OfflineDataStoreService`：Kafka 消费消息、保存离线消息、按用户会话查询增量消息。
- `MomentService`：朋友圈发布、删除、点赞、取消点赞、评论、删除评论、好友可见动态列表、朋友圈通知。
- `GateWay`：旧微服务网关和路由配置，仅作为旧 API 路径参考。

关键结论：

- Java 项目虽然拆成多个服务，但大量共享同一组表和领域模型，适合迁移为 Nest 模块化单体。
- 原 Nacos、Gateway、Feign、HTTP 服务间调用不迁移。它们在单体内改为模块 service 调用。
- 原 MySQL 表模型迁移到 PostgreSQL，保留核心业务字段和语义。
- 原 Kafka 链路升级为统一 IM 事件总线，配合 outbox 保证可靠投递。
- 原 Netty WebSocket 迁移为 Nest WebSocket Gateway，保留 `/api/v1/netty` 兼容入口和 ACK 语义。

## 3. 总体技术路线

采用“三层迁移”：

1. 基础设施先行：PostgreSQL、Prisma、Kafka、Redis、WebSocket、配置和 Docker 环境先可运行。
2. 领域核心闭环：用户、好友、会话、消息、实时推送、离线消息先形成最小 IM 闭环。
3. 业务增强：红包、朋友圈、文件上传、通知补齐，最后做兼容、验证、性能和安全收口。

目标架构：

```text
Nest App
  HTTP Controllers
  WebSocket Gateway
  Kafka Consumers
  Domain Services
  Repositories
  PostgreSQL + Redis + Kafka + Object Storage
```

## 4. 功能拆解

### 4.1 用户与认证

来源：

- `Fork/AuthenticationService`
- 当前 boilerplate 的 `src/modules/auth`、`src/modules/user`、`src/modules/session`

功能点：

- 手机号注册。
- 密码登录。
- 验证码登录。
- 邮箱验证码发送和校验。
- 用户头像更新。
- 用户资料字段：昵称、手机号、邮箱、头像、签名、性别、状态。
- 注册时创建用户余额，默认余额沿用旧项目语义。
- JWT 鉴权和会话管理复用 boilerplate 能力，但对外兼容旧 API 的 token 行为。

### 4.2 联系人与会话

来源：

- `Fork/ContactService`

功能点：

- 按手机号搜索用户。
- 获取好友详情。
- 发起好友申请。
- 好友申请过期。
- 查询好友申请列表。
- 查询未读申请数。
- 好友申请置已读。
- 通过好友申请并创建双向好友关系。
- 删除好友并清理单聊会话。
- 拉黑好友。
- 创建群聊。
- 邀请好友入群。
- 踢出群成员。
- 退出群聊。
- 设置或取消群管理员。
- 查询群成员。
- 新好友、新会话、新群会话通知。

### 4.3 消息

来源：

- `Fork/MessagingService`
- `Fork/RealTimeCommunicationService`
- `Fork/OfflineDataStoreService`

功能点：

- 发送单聊消息。
- 发送群聊消息。
- 支持文本、图片、文件、视频、红包、表情类型。
- 校验发送者状态。
- 单聊校验好友关系。
- 群聊校验发送者在群内。
- 生成消息 ID。
- 消息写入 outbox 并投递 Kafka。
- 在线用户实时推送。
- 离线消息由 Kafka 消费落库。
- 离线消息查询按用户所属会话聚合。
- 查询时间点之后的增量消息。
- 红包消息 body 特殊处理。

### 4.4 实时通信

来源：

- `Fork/RealTimeCommunicationService`

功能点：

- WebSocket path：`/api/v1/netty`。
- 握手阶段校验 token。
- 连接用户和 channel 绑定。
- Redis 记录在线路由并设置 TTL。
- 心跳包刷新 TTL。
- 用户登出或断线清理 channel 和 Redis route。
- 服务端推送统一帧：`type`、`msgUuid`、`data`。
- ACK 确认。
- ACK 超时重试。
- 支持消息通知、朋友圈通知、好友申请通知、新会话通知。

### 4.5 红包

来源：

- `Fork/MessagingService`

功能点：

- 发送普通红包。
- 发送随机红包。
- 校验红包总额、数量、单个金额上下限。
- 扣减用户余额。
- 生成红包记录。
- 生成余额流水。
- Redis 预拆红包金额。
- Lua 原子领取，防止重复领取和超领。
- PostgreSQL 落库失败时补偿 Redis。
- 领取后增加用户余额。
- 查询红包详情和领取列表。
- 扫描过期红包。
- 退还剩余金额。
- 更新红包状态为已领完、已过期、退款处理中。

### 4.6 朋友圈

来源：

- `Fork/MomentService`

功能点：

- 发布朋友圈，支持文本和媒体 URL 列表。
- 删除朋友圈。
- 点赞。
- 取消点赞。
- 评论。
- 回复评论。
- 删除评论并级联标记子评论。
- 查询自己和好友的朋友圈增量。
- 返回新增动态、新增点赞、新增评论、删除动态、删除点赞、删除评论。
- 发布、点赞、评论时推送实时通知。

### 4.7 文件与验证码

来源：

- `Fork/AuthenticationService`
- 当前 boilerplate 的 `src/common/file`、`src/common/aws`

功能点：

- 邮箱验证码生成、保存、过期、校验。
- 可选短信验证码接口预留，但先以邮箱验证码实现闭环。
- 上传预签名 URL。
- 下载 URL。
- 对象存储实现优先使用 boilerplate 已有 S3 抽象，可以支持 S3 兼容服务。

## 5. 数据模型规划

第一批必须完成的 PostgreSQL 表：

- `users`
- `user_balances`
- `verification_codes`
- `friend_applications`
- `friends`
- `conversations`
- `conversation_members`
- `messages`
- `message_outboxes`
- `red_packets`
- `red_packet_receives`
- `balance_logs`
- `moments`
- `moment_likes`
- `moment_comments`

Redis 状态：

- `verify:phone:<phone>` 或 `verify:email:<email>`：验证码。
- `user:session:<userId>`：在线实时路由。
- `red_packet:amount:<redPacketId>`：预拆金额 list。
- `red_packet:users:<redPacketId>`：已领取用户 set。
- `red_packet:count:<redPacketId>`：红包过期标记或剩余数辅助 key。
- 幂等 key：发送消息、发红包等防重复提交。

Kafka topic：

- `im.message.created`
- `im.message.persist`
- `im.realtime.push`
- `im.friend.application`
- `im.conversation.created`
- `im.moment.created`
- `im.red-packet.created`
- `im.dead-letter`

## 6. 迁移阶段计划

### 阶段 0：源码审计和基线确认

目标：把旧 Java 功能、旧 API、目标 Nest 结构确认成可执行清单。

任务：

- [x] 读取 `Fork/*/controller/*.java`，整理旧 API 路由表。
- [x] 读取 `Fork/*/model/*.java` 和 `Fork/*/mapper/*.xml`，整理旧表字段。
- [x] 读取关键 service impl，确认业务规则和异常语义。
- [x] 读取当前 `src/modules`、`src/common`、`src/router`，确认可复用能力。
- [x] 在 `spec.md` 维护 API、领域模型、事件和验收标准。

验收：

- `spec.md` 中每个旧 Java controller 都有对应目标模块或明确废弃理由。
- `plan.md` 中每个领域都有落地路径。

### 阶段 1：基础设施切换

目标：把 boilerplate 从 MongoDB/BullMQ 默认栈调整到 PostgreSQL + Kafka 可运行基线。

任务：

- [x] 修改 `prisma/schema.prisma` datasource provider 为 `postgresql`。
- [x] 重建 Prisma model，先覆盖用户、好友、会话、消息、红包、朋友圈核心表。
- [x] 调整 `src/common/database/services/database.service.ts` 健康检查，从 Mongo command 改为 PostgreSQL 查询。
- [x] 调整 `src/configs/database.config.ts` 和 `.env.example` 中 `DATABASE_URL` 示例。
- [x] 新增 Kafka 配置：`src/configs/kafka.config.ts`。
- [x] 新增 Kafka 基础设施模块：`src/common/kafka/*`。
- [x] 更新 `docker-compose.yml`，用 PostgreSQL 替换 MongoDB，保留 Redis，并新增 Kafka broker。
- [x] 明确 BullMQ 只处理通知等后台任务，IM 不走 BullMQ。

备注：`重建 Prisma model` 已在用户明确授权后完成，并已执行 `pnpm db:generate`。本阶段没有执行 `pnpm db:migrate`、`pnpm db:push` 或任何数据库写入命令。

建议文件：

- `prisma/schema.prisma`
- `src/configs/database.config.ts`
- `src/configs/kafka.config.ts`
- `src/configs/index.ts`
- `src/common/database/services/database.service.ts`
- `src/common/kafka/kafka.module.ts`
- `src/common/kafka/services/kafka.producer.service.ts`
- `src/common/kafka/constants/kafka.topic.constant.ts`
- `.env.example`
- `docker-compose.yml`

验证：

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
```

### 阶段 2：用户、验证码、认证兼容

目标：完成注册、登录、验证码登录、头像更新和初始余额。

任务：

- [x] 复用或调整 `src/modules/user`，补齐旧项目用户字段。
- [x] 复用或调整 `src/modules/auth`，兼容手机号密码登录和验证码登录。
- [x] 新增 `verification` 能力，管理验证码生成、发送、校验、过期。
- [x] 注册事务中创建 `users` 和 `user_balances`。
- [x] 头像更新使用 `storage` 模块返回的 URL。
- [x] 兼容旧路径：`/api/v1/user/register`、`/api/v1/user/login`、`/api/v1/user/loginCode`、`/api/v1/user/avatar`、`/api/v1/user/common/sendMail`、`/api/v1/user/common/check`、`/api/v1/user/common/uploadUrl`。

备注：阶段 2 已在 `feat(user): add legacy auth compatibility` 中完成。验证码只持久化 hash，旧登录自动生成 device，旧注册自动生成占位邮箱。

验证：

- 注册后能登录。
- 注册后余额存在。
- 验证码过期后不能使用。
- 头像更新只允许本人操作。

### 阶段 3：联系人和会话

目标：完成好友和群聊基础业务。

任务：

- [x] 新建或扩展 `contact` 模块。
- [x] 新建 `conversation` 模块承接旧 `session` 和 `user_session`。
- [x] 好友申请写入 `friend_applications`，Redis 只做过期辅助，不作为唯一状态。
- [x] 通过好友申请时在同一事务中创建双向好友和单聊会话。
- [x] 删除好友时清理好友关系和单聊会话成员关系。
- [x] 群聊创建时创建会话、群主成员关系和普通成员关系。
- [x] 邀请、踢人、退群、设置管理员都写入 `conversation_members`。
- [ ] 好友申请、新会话、新群会话推送改为同进程 service 调用或 Kafka 事件，不再 HTTP 调用实时服务。

备注：阶段 3 基础关系和会话闭环已接入 `/api/v1/contact/**` 旧路径。实时推送等待阶段 4 的 `realtime` 模块后接入，当前实现没有恢复旧 Java 的内部 HTTP 推送调用。

验证：

- 两个用户通过好友申请后能获得相同单聊 `conversationId`。
- 非好友不能发送单聊消息。
- 普通成员不能踢管理员或设置管理员。
- 群主权限、管理员权限、成员权限符合 `spec.md`。

### 阶段 4：实时通信

目标：实现 WebSocket、在线路由、心跳、ACK 和实时推送。

任务：

- [x] 新建 `realtime` 模块。
- [x] 实现 WebSocket Gateway，path 兼容 `/api/v1/netty`。
- [x] 握手阶段解析 JWT，校验 token subject 与用户 ID。
- [x] Redis 保存在线路由和 TTL。
- [x] 心跳消息刷新 TTL 并回包。
- [x] 登出消息清理连接和待 ACK。
- [x] 推送 service 支持消息通知、朋友圈通知、好友申请通知、新会话通知。
- [x] 待 ACK 消息保存在进程内或 Redis 中，第一版可以进程内，后续根据多实例需求升级 Redis。
- [x] ACK 超时重试，超过阈值后停止实时重试，但消息仍在 PostgreSQL 中可离线拉取。

备注：阶段 4 已完成实时通信基础能力，使用 Nest WebSocket Gateway 和 `@nestjs/platform-ws` 挂载旧 `/api/v1/netty` path。握手兼容旧 `userUuid` 和 `token` header，也支持 query 参数；`userUuid` 会解析为 ACK `User.id` 后再和 JWT subject 比对。好友申请、新会话、新群会话的业务调用接入仍保持阶段 3 未完成项，等待后续把 contact、conversation、messaging 与 `RealtimeService` 或 Kafka realtime 事件连接。

验证：

- 带合法 token 能建立连接。
- 非法 token 被拒绝。
- 心跳能刷新在线路由。
- 推送后客户端 ACK 能删除待确认。
- 不 ACK 会触发重试。

### 阶段 5：消息投递和离线消息

目标：完成发送消息、实时投递、Kafka 持久化、离线拉取的完整闭环。

任务：

- [x] 新建 `messaging` 模块。
- [x] 实现发送消息 API：`POST /api/v1/chat/session`。
- [x] 单聊校验好友关系，群聊校验成员关系。
- [x] 生成 `messageId`，构造消息 body。
- [x] 在事务中写入 `messages` 或写入 `message_outboxes`，根据最终 outbox 设计保证消息不会丢。
- [x] outbox 投递 Kafka，失败记录 `retryCount`、`nextRetryAt`、`lastError`。
- [x] 定时或任务扫描未投递 outbox。
- [x] Kafka consumer 处理 `im.message.persist`，幂等落库。
- [x] `offline-message` 模块实现 `GET /api/v1/offline/message`。
- [x] 离线查询按用户会话聚合，包含发送人信息、红包消息扩展字段、时间过滤。

备注：阶段 5 已完成消息投递和离线查询的第一版闭环。发送 API 会在 PostgreSQL 事务中写入 `messages` 和 `message_outboxes`，再由 outbox 发布 Kafka；失败会保留状态并由进程内 processor 定时重试。Kafka consumer 以 `messageId` 幂等处理 `im.message.persist`。实时推送直接复用阶段 4 `RealtimeService`，离线查询直接读取 PostgreSQL 权威消息数据。

验证：

- 在线接收者收到 WebSocket 推送。
- 离线接收者上线后能拉取消息。
- Kafka 投递失败后 outbox 可重试。
- 重复消费不会重复插入消息。

### 阶段 6：红包

目标：完成发红包、抢红包、红包详情和过期退款。

任务：

- [x] 新建 `red-packet` 模块。
- [x] 表达金额字段使用 Prisma `Decimal`。
- [x] 发红包事务中扣余额、创建红包、写余额流水、初始化 Redis 预拆金额。
- [x] 普通红包和随机红包拆分逻辑从 Java 迁移并补充边界校验。
- [x] 领取红包使用 Redis Lua 原子判断重复领取和弹出金额。
- [x] PostgreSQL 更新失败时补偿 Redis。
- [x] 领取成功后增加余额、写领取记录、写余额流水、更新红包剩余金额和状态。
- [x] 查询红包详情返回领取列表、发送人、封面文案、总额、数量、剩余、状态。
- [x] 实现过期扫描和退款。

备注：阶段 6 已新增 `red-packet` 模块并挂载旧 `/api/v1/chat/redPacket/**` 路径。发红包先扣余额并创建红包，再初始化 Redis 预拆金额，随后复用阶段 5 `MessagingService` 发送红包消息。消息发送失败会退款、标记红包过期并清理 Redis。领取红包使用共享 Redis 连接执行 Lua，PostgreSQL 落库失败会补偿 Redis。过期退款由进程内 processor 定时扫描完成。

验证：

- 同一用户不能重复领取同一红包。
- 并发领取不超发。
- 金额总和等于红包总额。
- 过期红包能退还剩余金额。

### 阶段 7：朋友圈

目标：完成朋友圈发布、互动、增量列表和实时通知。

任务：

- [x] 新建 `moment` 模块。
- [x] 发布朋友圈保存文本和媒体 URL。
- [x] 删除朋友圈使用软删除语义。
- [x] 点赞、取消点赞使用软删除或状态字段，避免重复点赞。
- [x] 评论支持父评论。
- [x] 删除评论时标记子评论删除。
- [x] 查询朋友圈时只返回自己和好友可见范围。
- [x] 增量列表返回新增和删除集合。
- [x] 发布、点赞、评论通过 realtime 推送通知。

实现记录：

- 2026-07-09 已新增 `moment` 模块，挂载旧 `/api/v1/moment/**` 兼容路径。
- 用户标识兼容旧 `legacyId`、ACK UUID 和手机号，写操作校验请求用户必须等于 JWT subject。
- 朋友圈、点赞、评论的 BigInt ID 对外统一返回 string，避免 JavaScript 精度损失。
- 取消点赞、删除评论和删除朋友圈均使用软删除语义。删除朋友圈会标记关联点赞和评论删除。
- 增量列表沿用旧 `createMoment/createLike/createComment/deleteMoment/deleteLike/deleteComment` 六集合响应形状。
- 发布朋友圈通知好友，点赞和评论通知动态作者。自己操作自己的动态不通知。

验证：

- 用户只能看到自己和好友动态。
- 删除的动态、点赞、评论出现在删除列表。
- 非动态作者不能删除动态。
- 点赞和评论会通知动态作者，自己操作自己不通知。

### 阶段 8：兼容路由、文档和前端联调

目标：让旧前端或未来前端可以稳定对接。

任务：

- [x] 在 `src/router` 或 controller path 中保留旧 Java API 路径。
- [x] 为新模块补充 Swagger doc。
- [x] 统一响应格式到 ACK 的 `@Response` 体系，同时兼容旧 `Result` 的语义。
- [x] 梳理错误码和 i18n message key。
- [x] 更新 `.env.example`、`docs/*`、README 中与 MongoDB、Nacos、Feign、Gateway 冲突的内容。

实现记录：

- 2026-07-09 已新增 `docs/legacy-api.md`，集中记录旧 Java API 路由表、ACK response 映射、JWT 鉴权和 Kafka/PostgreSQL 约束。
- 已为用户、验证码、上传、联系人、群聊、消息、离线消息、红包、朋友圈兼容 controller 补充 Swagger doc 装饰器。
- 已确认 `.env.example` 使用 PostgreSQL、Kafka 和 Redis，没有 MongoDB、Nacos、Feign、Gateway 目标配置。
- README 已补充 InfiniteChat 迁移约束：单体应用、PostgreSQL 目标数据库、Kafka 负责 IM 事件、BullMQ 只处理非 IM 后台任务。
- `docs/readme.md` 和 `AGENTS.md` 的 docs 索引已加入 `legacy-api`。

验证：

- 旧路径路由表完整。
- Swagger 能列出核心接口。
- 前端可完成注册、加好友、建群、发消息、拉离线消息、发红包、发朋友圈。

### 阶段 9：质量、性能、安全收口

目标：达到可继续开发和部署的工程质量。

任务：

- [ ] 关键流程补 e2e 或集成测试：注册登录、好友、群聊、消息、红包、朋友圈。
- [ ] WebSocket 和 Kafka 写最小联调测试。
- [ ] 压测消息发送、离线拉取、红包领取。
- [x] 审计旧配置中的明文凭据并标记全部轮换。
- [x] 日志脱敏，禁止输出 token、验证码、密码、余额敏感上下文。
- [ ] 增加 PostgreSQL 索引和约束。
- [x] 增加 Kafka 消费失败和 dead-letter 监控。

实现记录：

- 2026-07-09 已新增阶段 9 第一批测试守卫：旧 API 路由表和 controller 装饰器一致性、WebSocket 兼容路径、Kafka outbox 最终失败死信投递、日志敏感字段和旧配置安全审计覆盖。它们不替代真实数据库、Redis、Kafka 和 WebSocket 联调。
- 2026-07-09 已新增 `docs/security-audit.md`，记录旧 Java 配置文件审计范围、全部旧凭据需要轮换、日志脱敏字段族和 Kafka dead-letter payload 规则，不复述任何旧明文值。
- 2026-07-09 已扩展 ACK logger redaction 字段，覆盖 token、Authorization、验证码、密码和余额敏感上下文。
- 2026-07-09 已在 Kafka outbox 达到最大重试失败时投递 `im.dead-letter`，死信 payload 只包含 outboxId、messageId、failedTopic、messageKey、retryCount、error 和 failedAt。
- 2026-07-09 已新增 `docs/quality.md` 和显式开启的质量脚本：`pnpm quality:legacy:e2e`、`pnpm quality:legacy:realtime`、`pnpm quality:legacy:perf`。脚本覆盖注册登录、好友、群聊、消息、红包、朋友圈、WebSocket 心跳、Kafka topic 和基础压测入口，但真实执行仍需要测试环境设置 `INFINITECHAT_E2E=1` 和测试账号数据。
- PostgreSQL 索引和约束需要编辑 `prisma/schema.prisma` 并生成迁移，当前红线禁止未授权编辑 Prisma schema 或运行 migration，因此保留为单独授权阶段。

验证：

```bash
pnpm typecheck
pnpm lint
pnpm spell
pnpm test
pnpm build
```

## 7. 推荐实施顺序

1. 基础设施切换：PostgreSQL + Kafka + Redis + 配置。
2. 用户和认证。
3. 联系人和会话。
4. WebSocket 实时通信。
5. 消息发送、outbox、Kafka、离线消息。
6. 红包。
7. 朋友圈。
8. 兼容路由、Swagger、错误码、文档。
9. 测试、压测、安全收口。

这个顺序的原因是：用户、好友、会话是消息的前置条件；实时通信和 Kafka 是消息闭环的前置条件；红包和朋友圈都依赖消息或实时通知能力。

## 8. 风险和处理策略

| 风险                            | 影响                         | 处理                                                 |
| ------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Prisma schema 已切到 PostgreSQL | 后续 IM 表迁移会影响现有模块 | 每批 schema 变更后运行 validate、generate、typecheck |
| Java 使用 Long 雪花 ID          | JS number 有精度风险         | 内部用 BigInt 或 string，外部统一返回 string         |
| 旧项目明文凭据出现在配置产物    | 安全风险                     | 不复制值，全部改环境变量，要求轮换                   |
| Kafka 消费重复                  | 消息重复落库或重复推送       | 使用 messageId/eventId 幂等                          |
| 红包并发领取                    | 超发、重复领取、余额错误     | Redis Lua + PostgreSQL 条件更新 + 事务补偿           |
| WebSocket 多实例                | 单进程内 ACK 表无法跨实例    | 第一版可单实例，生产多实例时升级 Redis pending ACK   |
| BullMQ 默认队列误用             | IM 链路偏离 Kafka            | 在 AGENTS 和 spec 中写死 Kafka 为 IM 事件总线        |
| 旧 Java 服务间 HTTP 调用        | 单体内不应自调 HTTP          | 改为同进程 service 调用或 Kafka 事件                 |

## 9. 里程碑验收

### M1：基础设施可运行

- PostgreSQL schema 可 generate 和 migrate。
- Kafka broker 可连接。
- Redis 可连接。
- Nest 应用可启动。
- `pnpm typecheck` 通过。

### M2：账号和关系可用

- 用户可注册登录。
- 好友申请、通过、删除、拉黑可用。
- 单聊和群聊会话可创建。

### M3：IM 闭环可用

- WebSocket 可连接。
- 在线用户可收到消息。
- 离线用户可拉取消息。
- Kafka outbox 可重试。

### M4：完整业务可用

- 红包流程完整。
- 朋友圈流程完整。
- 通知流程完整。
- 旧 API 路径基本兼容。

### M5：可持续开发

- 文档、Swagger、测试、环境配置齐全。
- MongoDB、Nacos、Feign、Gateway 的旧约束从目标文档中移除。
- 后续 agent 可以只按 `AGENTS.md`、`spec.md`、`plan.md` 推进。
