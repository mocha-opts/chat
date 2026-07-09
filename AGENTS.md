# InfiniteChat NestJS 单体迁移 Agent 文档

> 本文件是后续 agent 的执行入口。先读 `AGENTS.md`，再按本文件要求读取 `docs/*`、`spec.md`、`plan.md` 和真实源码。不要只凭聊天记录、文件名或旧 boilerplate 默认配置做决定。

## 项目硬性目标

把当前仓库内 `Fork/` 目录的 Java InfiniteChat 项目迁移到当前 ACK NestJS boilerplate 上，实现旧项目的全部核心功能，同时保持一个可部署后端应用。

硬性决策：

- 目标技术栈是当前仓库的 ACK NestJS boilerplate，不重新起一个独立 Nest 项目。
- 不做微服务。Java 旧项目里的 `AuthenticationService`、`ContactService`、`MessagingService`、`RealTimeCommunicationService`、`OfflineDataStoreService`、`MomentService`、`GateWay` 只能作为领域边界参考，不能变成多个部署单元。
- 数据库使用 PostgreSQL。当前 boilerplate 和部分 `docs/*` 中的 MongoDB 默认描述不是目标状态。
- Kafka 是即时通讯消息投递、离线消息落库、跨实时节点通知的消息队列基础设施。
- Redis 可以保留用于缓存、验证码、会话校验、在线路由、限流、红包原子领取等低延迟状态，但不能替代 PostgreSQL 的权威数据，也不能把 IM 事件总线改回 BullMQ。
- `Fork/` 下的 Java 源码是功能迁移来源。当前 `src/` 下的 Nest boilerplate 是目标工程骨架。

## 0. 行动前硬门禁

每一个任务都必须按顺序执行这些步骤。无例外。写代码、建议变更或回答设计问题之前都要做。

1. 扫描 `docs/*`。列出 `docs/`，并阅读和当前任务相关的每一份文档。细节在文档里，不在本文件里。
2. 任务涉及本项目文档时，始终忽略 `docs/superpowers/*`。它只属于本地计划和临时规格，不是项目文档。不要读取、更新或引用它作为事实来源。
3. 阅读真实源码。打开实际文件。绝不假设结构、签名、类名、函数名或路径。
4. 明确范围。只做用户要求的事，遵守 YAGNI。不确定就问，不要猜着构建。
5. 对照第 2 到第 8 节做计划。确认变更符合原则、架构、命名、装饰器、空值、代码风格、错误响应和配置规则后再动手。

### docs 索引

当前 `docs/` 项目文档索引，以真实目录为准：

`activity-log` · `analytics` · `authentication` · `authorization` · `cache` · `configuration` · `database` · `device` · `doc` · `environment` · `feature-flag` · `file-upload` · `handling-error` · `installation` · `legacy-api` · `logger` · `message` · `notification` · `pagination` · `presign` · `project-structure` · `queue` · `readme` · `request-validation` · `response` · `security-audit` · `security-and-middleware` · `term-policy` · `third-party-integration` · `two-factor` · `vault`

不确定行为时，匹配的 `docs/*.md` 是事实来源。触碰代码前先读对应文档。例外只有 `docs/superpowers/*`，它是本地计划，不是项目文档。

每次开始前还必须读取：

- `spec.md` 和 `plan.md` 的相关章节。
- Java 来源：`Fork/<JavaService>/src/main/java/**`。
- Nest 目标：`src/app`、`src/common`、`src/configs`、`src/modules`、`src/queues`、`src/router`。
- Prisma：只读 `prisma/schema.prisma`。不要编辑。
- 如果任务涉及 NestJS、Prisma、Kafka、WebSocket 或 PostgreSQL 具体 API，先查官方文档或 Context7，再写实现。

## 1. 红线

### 1.1 Git

- 每个功能、修复、迁移阶段或计划文档都必须新建独立分支，默认分支名使用 `codex/<task-slug>`。
- 不要直接在 `main` 上开发。发现自己在 `main` 且需要改文件时，先创建任务分支。
- 分支完成并验证通过后，按用户明确要求提交并合入主分支。
- 不要自行运行 `git add`、`git commit`、stage、unstage。
- 保持用户的 index 原样。已经 staged 的文件保持 staged，unstaged 的文件保持 unstaged。
- 只有用户明确要求时，才 stage 或 commit，而且只能处理用户点名的文件。
- 用户要求 commit 时，先读 `.commitlintrc`，再提出 commit message，等待用户批准。用户没有接受前绝不提交。
- commit message 必须通过 commitlint。
- commit message 只写单行 subject。不要 body、bullet list、`Co-Authored-By` footer。
- 遵守仓库约定：`type(scope): summary`，保持简短。

### 1.2 Prisma 和数据库

- 不要编辑 Prisma schema。
- 不要运行 schema 或数据库变更命令：`db:migrate`、`db:push`、`migration:*`、`db:generate`。
- 需要 schema 变化时，停下并告诉用户，不要自己改。
- InfiniteChat 的目标数据库是 PostgreSQL。旧 boilerplate 或 docs 中的 MongoDB 描述不能覆盖这个目标。
- 只有用户明确授权时，才能执行会改变数据库状态或生成数据库客户端的命令。

### 1.3 安全和凭据

- 禁止把 `Fork/*/target/classes/application.yml` 里的旧环境凭据写进新文档或新配置。
- 发现旧明文凭据时，只记录“需要轮换”，不要复述具体值。
- 禁止记录 password、token、apiKey、secret、private key。

## 2. 原则

以下四项是强制原则，不是建议。任何一项违反都应被 reviewer 拒绝。

### 2.1 SOLID

- S：一个 class 只有一个变化理由。Controller 负责路由，Service 负责业务，Repository 负责数据访问。
- O：通过新 class、strategy、decorator 扩展，不要在稳定代码里用 `if/switch` 类型判断堆分支。
- L：子类或实现必须能替换基类或接口。不能缩窄行为，不能制造意外 throw。
- I：接口要小而聚焦。不要让实现类被迫实现无用方法。
- D：依赖抽象。Service 依赖注入的 class 或 interface，不直接依赖 `DatabaseService`。

### 2.2 DRY

- 禁止复制粘贴业务逻辑。
- 配置、连接、常量只能有一个事实来源。
- 同一段逻辑写到第二次时，应抽到 base class、util 或 shared module。

### 2.3 KISS

- 使用能工作的最简单方案。
- 不写聪明的一行流，不加没必要的层，不提前泛型化。
- 可读性优先于炫技。

### 2.4 YAGNI

- 只构建当前任务需要的内容。
- 不加 future-proof 参数、未使用 flag、推测性 hook、死分支。
- 未使用代码应删除。

### 2.5 冲突解决顺序

原则互相拉扯时，按这个顺序解决：

1. 正确性和安全性。永远第一。
2. YAGNI 和 KISS。先判断结构是否真的需要。
3. SOLID 和 DRY。结构有必要时，再把形状做好。

重复有时胜过错误抽象。不要为了 DRY 或 SOLID 违背 YAGNI 和 KISS。

### 2.6 Boilerplate 无兼容负担

- 当前没有外部客户端依赖这个仓库。破坏性变更可以接受。
- 不要为了兼容保留更差设计。
- 默认使用当前社区最佳实践。
- 现有代码只作为差异检查。最佳实践和既有模式强冲突时，先警告用户，不要静默应用。小范围局部差异可以直接推进。

## 3. 架构

### 3.1 模块化单体目标

目标是一个 NestJS 单体应用：

```text
HTTP API + WebSocket Gateway + Kafka producer/consumer
    -> Nest modules
        -> controllers / gateways / processors
        -> services
        -> repositories
        -> PostgreSQL / Redis / Kafka / object storage
```

禁止把目标后端拆成多个 Nest 应用、多个服务仓库或多个独立部署进程。旧 Java 的 Nacos、Gateway、Feign、Netty 服务注册架构只能帮助理解历史行为，不能照搬。

### 3.2 目标领域模块

Nest 模块按领域组织在 `src/modules/*`：

- `user`：用户注册、登录、验证码登录、头像、用户资料、初始余额。
- `contact`：好友搜索、申请、申请列表、未读申请、通过申请、删除好友、拉黑。
- `conversation`：单聊会话、群聊创建、邀请、踢人、退群、管理员、成员列表。
- `messaging`：发送文本、图片、文件、视频、表情、红包消息，消息持久化，Kafka outbox。
- `realtime`：WebSocket 接入、JWT 鉴权、心跳、ACK、在线路由、实时推送。
- `offline-message`：Kafka 消费、离线消息查询、按会话组装增量消息。
- `red-packet`：发红包、抢红包、红包详情、过期退款、余额流水。
- `moment`：朋友圈发布、删除、点赞、取消点赞、评论、删除评论、增量动态列表。
- `verification`：短信或邮箱验证码生成、校验、过期。
- `storage`：上传预签名 URL 和对象访问 URL。
- `notification`：复用或扩展 boilerplate 通知能力，承接好友、会话、朋友圈通知。

### 3.3 共享基础设施

共享基础设施按 ACK boilerplate 位置放置：

- `src/common/database`：Prisma PostgreSQL 客户端封装。
- `src/common/redis`：Redis 连接与低延迟状态封装。
- `src/common/kafka`：Kafka client、producer、consumer 注册和 topic 常量。
- `src/configs`：PostgreSQL、Redis、Kafka、JWT、对象存储、验证码、红包等配置。
- `src/router`：路由挂载与兼容路径。
- `src/queues`：只保留非 IM 后台任务处理，不承担聊天消息事件总线。

### 3.4 依赖方向

所有实现必须遵守：

```text
controllers -> services -> repositories
gateways -> services -> repositories
processors -> services -> repositories
repositories -> DatabaseService / Redis / Kafka client
```

规则：

- Controller 只处理 HTTP 输入输出、鉴权装饰器、DTO、状态码，不写业务。
- Gateway 只处理连接生命周期、消息帧输入输出、鉴权和心跳，不直接写数据库。
- Processor 或 Kafka handler 只反序列化事件并调用 service。
- Service 编排业务流程和事务，不直接注入 `DatabaseService`。
- Repository 负责 Prisma 查询、Redis 原子操作、数据库条件更新、分页查询。
- 跨领域调用优先通过同进程 service，不用 HTTP 自调用，不用 Feign 式 client。

### 3.5 Repository pattern

- `Repository` 只做数据访问。
- Repository 直接注入 `DatabaseService`，不要使用 `@Inject`。
- Repository 不需要 interface。
- `Service` 只做业务逻辑。
- Service 直接注入 repository class。
- Service 必须实现 interface，例如 `IUserService`。
- 永远不要在 Service 注入 `DatabaseService`。
- Repository 负责在调用 Prisma 前把 filter 参数的 `null` 规范化为 `{}`，不要让 caller 做。

### 3.6 Path aliases

禁止跨模块相对路径 import。始终使用 path alias：

- `@app/*`
- `@common/*`
- `@config`
- `@configs/*`
- `@modules/*`
- `@queues/*`
- `@routes/*`
- `@router`
- `@migration/*`
- `@test/*`
- `@generated/*`
- `@package`
- `@prisma/client`，实际指向 `generated/prisma-client`

### 3.7 Module layout

创建或调整模块前，先读 `docs/project-structure.md`。不要发明结构。

标准模块目录按需创建：

```text
src/modules/<module>
  constants
  controllers
  decorators
  docs
  dtos/request
  dtos/response
  enums
  exceptions
  factories
  guards
  indicators
  interceptors
  interfaces
  processors
  repositories
  services
  templates
  utils
  validations
  <module>.module.ts
```

不是每个模块都需要所有目录。缺什么再建什么。

### 3.8 数据库规则

- PostgreSQL 是唯一业务数据库。
- 当前 `prisma/schema.prisma` 必须保持 PostgreSQL provider。不要在没有用户明确授权时编辑。
- 旧 Java 的 `Long` 雪花 ID 可以迁移为 PostgreSQL `BigInt`，对外响应统一转成 string，避免 JavaScript 精度损失。
- 所有余额、红包、消息、会话成员关系必须通过事务和条件更新保证一致性。
- 余额字段使用 `Decimal`，不要用 JS number 表示金额。
- `message_outbox` 是 Kafka 可靠投递的事务 outbox 表，不要跳过。
- 数据库表名可以沿用旧表语义，但字段名和 Prisma model 要在 `spec.md` 中保持一致。

### 3.9 Kafka 规则

Kafka 用于 IM 事件，不用于拆服务：

- 同一个 Nest HTTP 应用可以通过 hybrid app 方式连接 Kafka transport，或者通过共享 Kafka client 注册 producer/consumer。
- 即使 Nest 官方文档称 transport 为 microservice，本项目也只允许作为同一进程内的 Kafka 能力使用，不创建独立部署单元。
- Topic 命名统一在 `src/common/kafka` 或 `src/modules/messaging/constants` 中声明。
- 消息发送流程必须先写 PostgreSQL，再写 outbox，再投递 Kafka。
- Kafka 消费端必须幂等。以 `messageId`、`eventId` 或业务唯一键去重。
- 消费失败不能丢消息。使用 Kafka 重试、死信 topic 或 outbox 重试策略，具体策略写进代码和文档。

建议 topic：

- `im.message.created`
- `im.message.persist`
- `im.realtime.push`
- `im.friend.application`
- `im.conversation.created`
- `im.moment.created`
- `im.red-packet.created`
- `im.dead-letter`

### 3.10 实时通信规则

旧 Java 使用 Netty WebSocket，目标 Nest 使用 Nest WebSocket Gateway 或 `ws` adapter 实现同等能力。

必须支持：

- WebSocket path 兼容 `/api/v1/netty`。
- 握手时校验 JWT，用户 ID 必须和 token subject 匹配。
- Redis 记录在线路由：`user:session:<userId> -> nodeId/route`，有 TTL。
- 心跳刷新路由 TTL。
- 同一用户新连接上线时关闭或替换旧连接。
- 服务端推送包含 `type`、`msgUuid`、`data`。
- 客户端 ACK 根据 `msgUuid` 删除待确认记录。
- ACK 超时重试，超过最大次数后放弃实时投递，但不能删除已持久化消息。

### 3.11 旧 Java 功能来源

迁移时按以下文件核对功能，不要只看 controller：

- 认证与公共能力：`Fork/AuthenticationService/src/main/java/com/lou/authenticationservice/**`
- 好友与群聊：`Fork/ContactService/src/main/java/com/lou/contactservice/**`
- 消息与红包：`Fork/MessagingService/src/main/java/com/lou/messagingservice/**`
- 实时连接：`Fork/RealTimeCommunicationService/src/main/java/com/lou/realtimecommunicationservice/**`
- 离线消息：`Fork/OfflineDataStoreService/src/main/java/com/lou/offlinedatastoreservice/**`
- 朋友圈：`Fork/MomentService/src/main/java/com/lou/momentservice/**`
- 旧网关：`Fork/GateWay/**` 只用于理解旧路由，不迁移 Nacos Gateway 架构。

## 4. 命名

### 4.1 文件

文件名模式：

```text
<module>.<noun-or-action>[.<sub>].<role>.ts
```

规则：

- 每个文件都以 `<module>.` 前缀开始。无例外。
- 点号 `.` 分隔语义段。
- 横线 `-` 只允许出现在复合名词段内，例如 `user.mobile-number.dto.ts`、`notification.email.processor.ts`。
- 文件夹使用 lowercase kebab-case。
- role suffix 必须匹配 artifact：`.service`、`.repository`、`.controller`、`.guard`、`.decorator`、`.interceptor`、`.dto`、`.enum`、`.constant`、`.interface`、`.doc`、`.util`、`.module`、`.processor`、`.filter`。
- DTO 文件必须以 `.dto.ts` 结尾。
- 请求 DTO 放 `dtos/request/`，响应 DTO 放 `dtos/response/`。
- DTO 文件示例：`user.create.request.dto.ts`、`user.profile.response.dto.ts`。

### 4.2 标识符

| 类型              | 规则                                      | 示例                            |
| ----------------- | ----------------------------------------- | ------------------------------- |
| Class             | PascalCase，module-prefixed               | `UserService`                   |
| Interface         | `I` + PascalCase                          | `IUser`、`IUserService`         |
| Enum name         | `Enum` + PascalCase                       | `EnumQueue`                     |
| Enum keys/values  | camelCase                                 | `notFound`、`notificationEmail` |
| Constants         | PascalCase，object 和 primitive 都一样    | `AuthJwtAccessGuardKey`         |
| Methods/vars      | camelCase                                 | `findById`                      |
| Payload interface | `I` + `<Module>` + `<Action>` + `Payload` | `INotificationSendPushPayload`  |
| Request DTO       | `<Module>...RequestDto`                   | `UserCreateRequestDto`          |
| Response DTO      | `<Module>...ResponseDto`                  | `UserProfileResponseDto`        |

### 4.3 命名硬规则

- 所有 type 都以 `I` 开头。Interface、payload shape、service contract 都一样。
- 禁止裸 type name。使用 `IUser`、`IUserService`、`INotificationVerificationEmailPayload`。
- Enum 使用 `Enum` 前缀和 PascalCase 名称。
- Enum key 和 value 都用 camelCase，不用 `UPPER_CASE`。
- 一个 enum 文件只表达一个 enum concern。
- Error-code enum 使用 numeric value。
- Constants 全部使用 PascalCase，包括 typed object、array 和单个 primitive。
- 禁止 `UPPER_SNAKE_CASE` 常量。
- DI token 很少需要。优先直接 class injection。
- 真需要 token 时，用 PascalCase 命名，并把值包在 `Symbol()` 中。
- DTO class name 和 file name 都必须带 `Dto` 后缀。
- 没有 usecase layer。

## 5. 装饰器顺序

Controller 装饰器顺序是硬规则，不能重排：

```typescript
@ExampleDoc() // 1. Swagger doc
@TermPolicyAcceptanceProtected(...) // 2. Term policy
@PolicyAbilityProtected({...}) // 3. CASL policy
@RoleProtected(...) // 4. Role
@ActivityLog(...) // 5. Activity log
@UserProtected() // 6. User status
@AuthJwtAccessProtected() // 7. JWT
@FeatureFlagProtected(...) // 8. Feature flag
@ApiKeyProtected() // 9. API key
@HttpCode(HttpStatus.OK) // 10. HTTP status, only when needed
@Get('/endpoint') // 11. HTTP method, always last
```

规则：

- Guard 和 protection 语义先读 `docs/authorization.md`。
- `@ActivityLog` 需要 `@AuthJwtAccessProtected`。
- `@ActivityLog` 记录成功和失败。
- Activity log metadata 通过 `RequestStoreService.merge(ActivityLogMetadataStoreKey, ...)` 设置，不要放进 response shape。
- 永远不要记录 secret。细节见 `docs/activity-log.md`。

## 6. 严格空值类型

- `undefined` 只允许出现在 input boundary：Request DTO body 和 Query DTO。
- 更深层统一使用 `null`。

| Layer                                              | Convention                                                  |
| -------------------------------------------------- | ----------------------------------------------------------- |
| Request/Query DTO input boundary                   | `field?: Type`                                              |
| Response DTO wrapper/structural                    | `field?: Type`                                              |
| Response DTO domain data                           | `field: Type \| null`                                       |
| Domain interface data                              | `field: Type \| null`                                       |
| Domain interface request lifecycle / external spec | `field?: Type`                                              |
| Exception/options bag                              | `field?: Type`                                              |
| Config interface under `src/configs/`              | `field: Type \| null`                                       |
| Service/Repository data param                      | `param: Type \| null`                                       |
| Service/Repository filter param                    | `param: Type \| null`，additive service filter 可以使用 `?` |
| Prisma return                                      | `Type \| null`                                              |

硬规则：

- 永远不要写 `field?: Type | null`。语义不清，必须二选一。
- Controller 在调用 Service 前把 `undefined` 规范化为 `null`，例如 `service.update(id, dto.bio ?? null)`。
- 不要使用 `any`。
- 不要忽略 null checks。
- TypeScript 必须保持 `strictNullChecks` 和 `noImplicitAny`。

## 7. 代码风格

### 7.1 NestJS idiomatic

- 使用 NestJS 的模块、DI、provider、guard、pipe、interceptor、decorator。
- 不要手写 Nest 已经提供的替代品。
- 保持 Controller、Service、Repository 分层清楚。

### 7.2 测试

- 不要主动编写或 scaffold 单元测试。
- 用户明确要求时才添加测试。
- 如果用户只要求实现功能，不要顺手创建测试文件。

### 7.3 注释

- 用户不喜欢注释噪音。默认零注释。
- 只有代码无法表达关键原因时才写注释，例如复杂不变量、安全原因、刻意偏离。
- 不要解释 cast、type subset、显而易见的调用或下一行做什么。
- 需要 note 时，使用 `// @note <text>`。
- 如果 symbol 已有 JSDoc block，把 note 放进 JSDoc，不要额外加 `// @note`。
- 禁止 trailing comment。不要在代码行右侧或行尾写 `//`。
- 注释放在代码上一行。声明文档使用 JSDoc。

### 7.4 JSDoc

- JSDoc 直接放在 symbol 上方。
- Symbol 有 decorator 时，JSDoc 放在第一个 decorator 上方。
- JSDoc 最多一到两行。
- 只描述重要的 what 和非显而易见的 why。
- 禁止 `@example`、`@param`、`@returns`、`@template`、`@throws`、`@private`、`@export`、`@class`、`@implements`、`@constraint`、`@remarks`。
- Module class 有 `forRoot()` 或 `forRootAsync()` 时，只在 class level 文档一次，不单独文档方法。
- Interface 不写 JSDoc。数据结构、payload、options、service contract 都一样。
- 如果 interface 字段有真正关键的不变量或刻意类型覆盖，改用一行简短 `// @note`。
- 自解释 symbol 不写 JSDoc。
- Constants 最多一行 JSDoc，而且只有 value rationale 不明显时才写。
- Self-evident constants 和 DI tokens 不写 JSDoc。
- Enum 只有 value 含义不明显时才补充说明。
- DTO class 可以有一行 JSDoc。字段已有 `@ApiProperty` 时不要再写。
- `controllers/`、`docs/`、`repositories/`、`services/` 层不要写 JSDoc。它们的角色由模式决定，已经足够清楚。
- `// @note` 和 `// TODO` 行注释可以保留。

### 7.5 Markdown 文档

- `docs/*.md` prose 中禁止使用 em dash 字符 `U+2014`。
- 使用句号、逗号、分号、冒号或括号替代。
- 复合词可以使用普通 hyphen，例如 `dev-mode`、`in-memory`。
- 不要滥用 hyphen。
- 唯一例外：现有结构化列表的每一项都已经用 `U+2014` 做分隔时，为一致性可以沿用。

## 8. 错误、响应、校验、配置

细节以对应 docs 为准。实现前必须阅读匹配文档。

- Errors：抛 Nest exception，结构为 `{ statusCode, message: '<i18n.key>', messageProperties?, data? }`。见 `docs/handling-error.md` 和 `docs/message.md`。
- i18n：使用 nested JSON。文件名等于 prefix，例如 `user.error.notFound` 对应 `languages/en/user.json`。
- Responses：使用 `@Response` 或 `@ResponsePaging`。返回 `{ data, metadata? }`。见 `docs/response.md`。
- Validation：使用 `class-validator` 和 `@Expose`。见 `docs/request-validation.md`。
- Config：每个 `src/configs/*` 文件都要在 `registerAs` 旁边导出 TS interface。见 `docs/configuration.md` 和 `docs/environment.md`。
- Transactions：简单顺序操作使用 array form，有条件逻辑使用 callback form。见 `docs/database.md`。ACK 文档中的 MongoDB 事务语境不能覆盖本项目 PostgreSQL 决策。
- Logging：使用 `new Logger(ClassName.name)`。
- Logging 调用顺序：object first，然后 message，例如 `logger.error(error, 'msg')`。
- Pino 会自动 redact secrets，但代码仍然不能主动 log secret。

## 9. 完成前硬门禁

完成前必须按顺序运行并确认结果。不要假设。

1. `pnpm typecheck`，必须零错误。
2. `pnpm lint`，必须零错误。可自动修复时使用 `pnpm lint:fix`。
3. `pnpm spell`，修复 unknown words 或加入 `cspell.json`。
4. 重新检查 diff 是否违反第 10 节。命中任何项就修。

规则：

- 真实报告失败输出。
- 没运行就不要说通过。
- 有性能、兼容既有代码或其他刻意偏离时，回复中说明。
- 不要 commit 或 stage。验证结果留给用户自己决定是否提交。

## 10. 反模式清单

以下情况永远拒绝：

- 未经用户明确要求就 commit、stage 或 unstage。
- 未提出 commitlint-valid message 并获得用户批准就 commit。
- 编辑 Prisma schema 或运行 schema/DB 命令。
- 在 Service 注入 `DatabaseService`。
- 使用相对路径 import。
- 创建多个 Redis connection。使用共享 `RedisCacheModule`。
- 重排 protection decorator。
- 使用 flat i18n keys。
- 明确 log secret，例如 password、token、apiKey。
- 密码修改、重置、登出、设备移除后跳过 session invalidation。
- 使用 `UPPER_SNAKE_CASE` enum。Enum name 用 PascalCase，keys 和 values 用 camelCase。
- 有条件逻辑却使用 array transaction。应使用 callback form。
- 使用 `any` 或忽略 null checks。
- Repository 使用 `@Inject`。应直接 class injection。
- `undefined` 穿过 input boundary。
- 写 `field?: Type | null`。
- 在 caller 规范化 filter params。Repository 负责。
- 未经用户要求写单元测试。
- 对显而易见代码过度注释。
- 非 idiomatic NestJS。不要手写框架已有机制。
- 复制粘贴逻辑。
- 推测性参数、过早抽象、future-proof hook。
- 跳过读取 `docs/*` 就行动。
- 把目标应用拆成微服务。
- 把 PostgreSQL 换回 MongoDB。
- 把 Kafka IM 链路换成 BullMQ。
- 新增 `stores/` 目录。缓存、在线状态和 Redis 访问放在 repository 或共享基础设施里。

## 11. 交付口径

回复用户时要说明：

- 改了哪些文件。
- 迁移决策是否仍满足“不做微服务、PostgreSQL、Kafka、直接使用 boilerplate”。
- 哪些验证已经运行，哪些没运行。
- 剩余风险和下一步最小可执行任务。

不要把尚未实现的功能说成已经完成。不要把计划说成代码。
