# Database Documentation

This documentation explains the features and usage of **Database Module**: Located at `src/common/database`

## Overview

This documentation explains the database architecture and features in ACK NestJS Boilerplate:

## Related Documents

- [Installation Documentation][ref-doc-installation] - For complete project setup and dependencies
- [Environment Documentation][ref-doc-environment] - For database connection and environment variables
- [Configuration Documentation][ref-doc-configuration] - For understanding the config module structure

## Table of Contents

- [Overview](#overview)
- [Related Documents](#related-documents)
- [Prerequisites](#prerequisites)
- [Migration](#migration)
- [Generate Database Client](#generate-database-client)
- [Seeding](#seeding)
    - [Database Seeds](#database-seeds)
    - [Template Seeds](#template-seeds)
    - [AWS S3 Configuration Seed](#aws-s3-configuration-seed)
- [Initial Seeded Data](#initial-seeded-data)
    - [API Keys](#api-keys)
    - [Roles](#roles)
    - [Users](#users)
    - [Feature Flags](#feature-flags)
    - [Term Policies](#term-policies)
- [Composite Types](#composite-types)
    - [GeoLocation](#geolocation)
    - [UserAgent](#useragent)
    - [UserTermPolicy](#usertermpolicy)
    - [UserPhoto](#userphoto)
    - [RoleAbility](#roleability)
    - [TermPolicyContent](#termpolicycontent)
- [Docker](#docker)
- [Database Tools](#database-tools)
    - [Prisma ORM](#prisma-orm)
    - [Why Prisma for Repository Design Pattern?](#why-prisma-for-repository-design-pattern)
    - [Change DB with Minimal Effort](#change-db-with-minimal-effort)

## Prerequisites

> **💡 Tip:** Use Docker setup from the installation guide for local PostgreSQL and Redis.

**PostgreSQL 16.x** running locally or through Docker.

## Migration

Prisma migrations are the source of truth for PostgreSQL schema changes. Use `pnpm db:migrate` during local development to create and apply migrations from `prisma/schema.prisma`.

For shared environments, use generated migration files and apply them through your deployment pipeline. Do not use `prisma db push` as the project migration path.

For details, see the official Prisma documentation: [Prisma Migrate][ref-prisma-migrate]

## Generate Database Client

Prisma uses a generated client to provide type-safe database access and query building. You must generate the Prisma Client every time you change your Prisma schema (`prisma/schema.prisma`).

**When to Generate Prisma client?**

- After any change to your Prisma schema (e.g., adding, removing, or updating models/fields).
- After pulling schema changes from version control.

**How to Generate Prisma Client:**

```bash
pnpm db:generate
```

This command will read your Prisma schema and generate the client code in `generated/prisma-client`. The generated client is required for your application to interact with the database using Prisma.

## Seeding

Seeding in ACK NestJS Boilerplate is handled using [Commander.js][ref-commander]. All seed commands are implemented in `src/migration/seeds/*`.

### Database Seeds

ACK NestJS Boilerplate provides ready-to-use seed scripts to help you quickly initialize or remove data for development and testing. Database seeding is used to populate the database with initial or test data, making development and testing easier.

**Seed Data Location:**

- All seed data is stored in `src/migration/data/*`.

**How to Run All Seeds:**

- `pnpm migration:seed` — runs all seed commands to populate initial data.
- `pnpm migration:remove` — removes all seeded data from the database.
- `pnpm migration:fresh` — force-resets the PostgreSQL database through Prisma Migrate, then immediately re-seeds all data. Useful during development when you need a clean slate.

**How to Seed/Remove a Specific Module:**
Run the command:

- Seed: `pnpm migration {module} --type seed`
- Remove: `pnpm migration {module} --type remove`

**Available Types:**

- `seed` (add data)
- `remove` (delete data)

**Available Modules:**

- `apiKey`: Inserts default and system API keys for authentication and service access.
- `country`: Inserts country data (name, codes, phone code, continent, timezone).
- `featureFlag`: Inserts feature flags to enable/disable features (e.g., login methods, sign up, change password).
- `role`: Inserts user roles (superadmin, admin, user) with abilities and permissions.
- `termPolicy`: Inserts term policy documents (cookies, marketing, privacy, terms of service) with version and content.
- `user`: Inserts initial user accounts (Super Admin, Admin, User) with country, role, and credentials.

### Template Seeds

Template seeding uses the same script and commands as Database Seeds, but is specifically for template files like email and term policies.

**Available Types:**

- `seed` (add template data)
- `remove` (delete template data)

#### Email Templates

Every time you run the email template seed, the templates will be inserted into AWS SES automatically.

**How to Run Email Template Seeds:**

- Seed: `pnpm migration template-email-notification --type seed`
- Remove: `pnpm migration template-email-notification --type remove`

#### Term Policy Templates

Every time you run the term policy template seed, the policy documents will be linked to the database records automatically.

**How to Run Term Policy Template Seeds:**

- Seed: `pnpm migration template-termPolicy --type seed`
- Remove: `pnpm migration template-termPolicy --type remove` _(no-op — term policy removal is intentionally skipped)_

### AWS S3 Configuration Seed

The migration script is a special seed command that configures AWS S3 bucket policies and settings for both public and private buckets. Unlike other seed commands, this migration doesn't populate database data but instead configures your AWS infrastructure.

**What It Does:**

This script automatically configures essential S3 bucket settings in the correct order:

1. **Block Public Access Configuration** - Controls public access restrictions
2. **Disable ACL Configuration** - Enforces bucket owner ownership controls
3. **Bucket Policy** - Sets read/write permissions based on bucket accessibility
4. **CORS Configuration** - Configures Cross-Origin Resource Sharing rules
5. **Lifecycle Configuration** - Automatically deletes incomplete multipart uploads

**Why Sequential Configuration Matters:**

The configuration must be applied in a specific order because AWS S3 policies have dependencies.
For example, you must configure public access blocks before setting bucket policies.

**How to Run:**

```bash
# Configure both public and private buckets
pnpm migration aws-s3-config --type seed
```

**Important Notes:**

- This migration runs configurations for **both public and private buckets** simultaneously
- The `--type remove` option is intentionally skipped (no removal operation)
- Requires valid AWS credentials and appropriate IAM permissions
- Bucket names and ARNs must be properly configured in your environment variables

**Configuration Applied:**

For **Public Buckets**:

- Public read access (`s3:GetObject`) for all objects
- Full IAM user access for management operations
- CORS rules allowing GET/HEAD from any origin
- CORS rules allowing PUT/POST/DELETE from whitelisted origins

For **Private Buckets**:

- Blocks all public access
- CORS rules only allow whitelisted origins for all methods
- Full IAM user access required for all operations

## Initial Seeded Data

When you run `pnpm migration:seed`, the following initial data will be created in your database. This data is essential for testing and development purposes.

### API Keys

> [!WARNING]
> These are development keys. Always regenerate API keys for production environments.

Two API keys are created for authentication and service access:

| Name            | Type      | Key                         | Secret                                               | Usage                       |
| --------------- | --------- | --------------------------- | ---------------------------------------------------- | --------------------------- |
| Api Key Default | `default` | `fyFGb7ywyM37TqDY8nuhAmGW5` | `qbp7LmCxYUTHFwKvHnxGW1aTyjSNU6ytN21etK89MaP2Dj2KZP` | For general API access      |
| Api Key System  | `system`  | `UTDH0fuDMAbd1ZVnwnyrQJd8Q` | `qbp7LmCxYUTHFwKvHnxGW1aTyjSNU6ytN21etK89MaP2Dj2KZP` | For system-level operations |

**API Key Prefix Convention:**

All generated API keys automatically include an environment prefix to help identify which environment they belong to. The format is:

```
{environment}_{random_string}
```

**Examples:**

- `local_abc123xyz` - API key for local/development environment
- `development_def456uvw` - API key for development environment
- `staging_ghi789rst` - API key for staging environment
- `production_jkl012mno` - API key for production environment

This prefix is automatically added based on the `APP_ENV` environment variable when creating new API keys, ensuring easy identification and preventing accidental cross-environment usage.

### Roles

Three user roles are created with different permission levels:

| Role       | Type         | Description      | Abilities                             |
| ---------- | ------------ | ---------------- | ------------------------------------- |
| superadmin | `superAdmin` | Super Admin Role | Full system access (unrestricted)     |
| admin      | `admin`      | Admin Role       | All CRUD operations on all subjects   |
| user       | `user`       | User Role        | Limited access (no special abilities) |

**Admin Role Abilities**: The admin role has full CRUD permissions (`create`, `read`, `update`, `delete`) on all policy subjects defined in the system.

### Users

> [!WARNING]
> These are test accounts with default passwords. Change or remove these accounts in production environments.

The seeded users differ per environment. This is controlled by `migrationUserData` in `src/migration/data/migration.user.data.ts`:

| Environment   | Seeded Users              |
| ------------- | ------------------------- |
| `local`       | superadmin + admin + user |
| `development` | superadmin + admin only   |
| `staging`     | superadmin + admin only   |
| `production`  | superadmin + admin only   |

**User accounts:**

| Email               | Name        | Role       | Password   | Country        | Environments |
| ------------------- | ----------- | ---------- | ---------- | -------------- | ------------ |
| superadmin@mail.com | Super Admin | superadmin | `aaAA@123` | ID (Indonesia) | all          |
| admin@mail.com      | Admin       | admin      | `aaAA@123` | ID (Indonesia) | all          |
| user@mail.com       | User        | user       | `aaAA@123` | ID (Indonesia) | `local` only |

### Feature Flags

Five feature flags are created to control authentication and user features:

| Key                   | Description                    | Enabled | Rollout | Metadata              |
| --------------------- | ------------------------------ | ------- | ------- | --------------------- |
| `loginWithGoogle`     | Enable login with Google       | ✅ Yes  | 100%    | `signUpAllowed: true` |
| `loginWithApple`      | Enable login with Apple        | ✅ Yes  | 100%    | `signUpAllowed: true` |
| `loginWithCredential` | Enable login with Credential   | ✅ Yes  | 100%    | -                     |
| `signUp`              | Enable user sign up            | ✅ Yes  | 100%    | -                     |
| `changePassword`      | Enable change password feature | ✅ Yes  | 100%    | `forgotAllowed: true` |

All features are enabled by default with 100% rollout for development convenience.

### Term Policies

Four term policy documents are created:

| Type             | Version | Language | Description               |
| ---------------- | ------- | -------- | ------------------------- |
| `cookies`        | 1       | EN       | Cookie policy document    |
| `marketing`      | 1       | EN       | Marketing terms document  |
| `privacy`        | 1       | EN       | Privacy policy document   |
| `termsOfService` | 1       | EN       | Terms of Service document |

The actual content for these policies is stored as file references in `src/migration/data/term-policy/*`. The files are not automatically linked to the database records. You must run the term policy migration script to link the files and update the content keys in the database.

For more details on how seeding works, see: [Template Seeds](#template-seeds)

## JSON Fields

PostgreSQL stores structured values as `jsonb` through Prisma `Json` or `Json[]` fields. The previous ACK baseline used Prisma composite `type` blocks for these shapes. Do not reintroduce those composite types for PostgreSQL.

| Shape             | Prisma field                                     | Storage         |
| ----------------- | ------------------------------------------------ | --------------- |
| GeoLocation       | `Session.geoLocation`, `ActivityLog.geoLocation` | nullable `Json` |
| UserAgent         | `Session.userAgent`, `ActivityLog.userAgent`     | `Json`          |
| UserTermPolicy    | `User.termPolicy`                                | `Json`          |
| UserPhoto         | `User.photo`                                     | nullable `Json` |
| RoleAbility       | `Role.abilities`                                 | `Json[]`        |
| TermPolicyContent | `TermPolicy.contents`                            | `Json[]`        |

`GeoLocation` and `UserAgent` are resolved once per request into the request store (`RequestLogStoreKey`, as part of `IRequestLog`). The audit service reads them from the store and threads `IRequestLog` to its repository as the last method parameter. See [Security and Middleware Documentation][ref-doc-security-and-middleware] for details.

## Docker

Running database commands inside Docker containers from your host machine:

**Generate Prisma Client inside container:**

```bash
docker-compose exec apis pnpm db:generate
```

**Run database migration inside container:**

```bash
docker-compose exec apis pnpm db:migrate
```

**Run all seeds inside container:**

```bash
docker-compose exec apis pnpm migration:seed
```

**Remove all seeded data inside container:**

```bash
docker-compose exec apis pnpm migration:remove
```

These commands execute directly in the running Docker container without needing to enter the container shell. Ensure Docker Compose is running with `docker-compose up -d` before executing these commands.

## Database Tools

### **Prisma ORM**

ACK NestJS Boilerplate uses **[Prisma][ref-prisma] v6.19.x** as the primary database toolkit. Prisma is not just an ORM - it's a complete database toolkit that provides the foundation for implementing clean architecture patterns.

### **Why Prisma for Repository Design Pattern?**

Prisma perfectly enables **Repository Design Pattern** implementation:

- **Type-Safe Repository Layer**: Auto-generated TypeScript types ensure compile-time validation throughout repositories
- **Clean Architecture**: PrismaClient provides foundation for clean separation between database and business logic
- **Easy Implementation**: Consistent query API and transaction support simplify repository development
- **Database Agnostic**: Repository boundaries keep most business logic independent from the database engine

### Change DB with Minimal Effort

Prisma, combined with the Repository Pattern, allows you to switch databases with minimal effort and maximum codebase stability. The data access layer is fully abstracted, so your service and business logic remain unchanged regardless of the underlying database engine.

#### Supported Databases

| Database       | Best For                         | Transaction Support |
| -------------- | -------------------------------- | ------------------- |
| **PostgreSQL** | Relational Database, reliability | ✅ Yes              |

**Other supported databases:** MySQL, SQLite, SQL Server, CockroachDB

#### Current PostgreSQL Baseline

**1. Prisma Schema** (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid()) @db.Uuid
}
```

**2. Environment** (`.env`):

```bash
DATABASE_URL=postgresql://ack:ack_password@localhost:5432/ACKNestJs?schema=public
```

**3. Generate Migration and Client:**

```bash
pnpm db:migrate
pnpm db:generate
```

**4. DatabaseService Code:**

- **DatabaseService** (`src/common/database/services/database.service.ts`) uses SQL health checks.
- **DatabaseUtil** (`src/common/database/utils/database.util.ts`) creates and validates UUIDs.

**5. Re-seed Database:**

```bash
pnpm migration:seed
```

#### Learn More

- [Prisma Migrate][ref-prisma-migrate]
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

<!-- REFERENCES -->

[ref-prisma-migrate]: https://www.prisma.io/docs/orm/prisma-migrate
[ref-commander]: https://nest-commander.jaymcdoniel.dev
[ref-doc-installation]: installation.md
[ref-doc-environment]: environment.md
[ref-doc-configuration]: configuration.md
[ref-doc-security-and-middleware]: security-and-middleware.md
[ref-doc-authorization]: authorization.md
