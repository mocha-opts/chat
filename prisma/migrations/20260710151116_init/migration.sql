-- CreateEnum
CREATE TYPE "EnumUserGender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "EnumUserStatus" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "EnumUserSignUpFrom" AS ENUM ('system', 'admin', 'website', 'mobile');

-- CreateEnum
CREATE TYPE "EnumUserSignUpWith" AS ENUM ('credential', 'socialGoogle', 'socialApple');

-- CreateEnum
CREATE TYPE "EnumUserLoginFrom" AS ENUM ('website', 'mobile');

-- CreateEnum
CREATE TYPE "EnumUserLoginWith" AS ENUM ('credential', 'socialGoogle', 'socialApple');

-- CreateEnum
CREATE TYPE "EnumRoleType" AS ENUM ('superAdmin', 'admin', 'user');

-- CreateEnum
CREATE TYPE "EnumApiKeyType" AS ENUM ('system', 'default');

-- CreateEnum
CREATE TYPE "EnumTermPolicyType" AS ENUM ('termsOfService', 'privacy', 'cookies', 'marketing');

-- CreateEnum
CREATE TYPE "EnumTermPolicyStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "EnumVerificationType" AS ENUM ('mobileNumber', 'email');

-- CreateEnum
CREATE TYPE "EnumPasswordHistoryType" AS ENUM ('signUp', 'forgot', 'admin', 'profile');

-- CreateEnum
CREATE TYPE "EnumActivityLogAction" AS ENUM ('userCreated', 'userBlocked', 'userUpdateStatus', 'userUpdateProfile', 'userUpdateNotificationSetting', 'userUpdatePhotoProfile', 'userChangePassword', 'userDeleteSelf', 'userAddMobileNumber', 'userUpdateMobileNumber', 'userDeleteMobileNumber', 'userClaimUsername', 'userUpdatePasswordByAdmin', 'userLoginCredential', 'userLoginGoogle', 'userLoginApple', 'userRefreshToken', 'userVerifiedEmail', 'userSendVerificationEmail', 'userSignedUp', 'userResetPassword', 'userRevokeSession', 'userRevokeSessionByAdmin', 'userRevokeAllSessions', 'userRevokeAllSessionsByAdmin', 'userRemoveDevice', 'userAcceptTermPolicy', 'userForgotPassword', 'userReachMaxPasswordAttempt', 'userSetupTwoFactor', 'userEnableTwoFactor', 'userDisableTwoFactor', 'userVerifyTwoFactor', 'userRegenerateTwoFactorBackupCodes', 'userDeviceRefresh', 'userLogout', 'adminSessionRevoke', 'adminApiKeyCreate', 'adminApiKeyReset', 'adminApiKeyUpdate', 'adminApiKeyUpdateDate', 'adminApiKeyUpdateStatus', 'adminApiKeyDelete', 'adminRoleCreate', 'adminRoleUpdate', 'adminRoleDelete', 'adminTermPolicyCreate', 'adminTermPolicyDelete', 'adminTermPolicyUpdateContent', 'adminTermPolicyAddContent', 'adminTermPolicyRemoveContent', 'adminTermPolicyPublish', 'adminUserCreate', 'adminUserUpdateStatus', 'adminUserUpdatePassword', 'adminUserResetTwoFactor', 'adminUserImport', 'adminDeviceRemove');

-- CreateEnum
CREATE TYPE "EnumDevicePlatform" AS ENUM ('ios', 'android', 'web');

-- CreateEnum
CREATE TYPE "EnumDeviceNotificationProvider" AS ENUM ('fcm', 'apns');

-- CreateEnum
CREATE TYPE "EnumNotificationType" AS ENUM ('securityAlert', 'transactional', 'userActivity', 'marketing');

-- CreateEnum
CREATE TYPE "EnumNotificationChannel" AS ENUM ('push', 'email', 'inApp', 'silent');

-- CreateEnum
CREATE TYPE "EnumNotificationPriority" AS ENUM ('low', 'normal', 'high', 'critical');

-- CreateEnum
CREATE TYPE "EnumBiometricType" AS ENUM ('fingerprint', 'faceId');

-- CreateEnum
CREATE TYPE "EnumVerificationCodeChannel" AS ENUM ('sms', 'email');

-- CreateEnum
CREATE TYPE "EnumVerificationCodePurpose" AS ENUM ('register', 'login', 'resetPassword');

-- CreateEnum
CREATE TYPE "EnumFriendApplicationStatus" AS ENUM ('unread', 'accepted', 'rejected', 'read', 'expired');

-- CreateEnum
CREATE TYPE "EnumFriendStatus" AS ENUM ('normal', 'blocked', 'deleted');

-- CreateEnum
CREATE TYPE "EnumConversationType" AS ENUM ('single', 'group');

-- CreateEnum
CREATE TYPE "EnumConversationStatus" AS ENUM ('normal', 'deleted');

-- CreateEnum
CREATE TYPE "EnumConversationMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "EnumConversationMemberStatus" AS ENUM ('normal', 'deleted');

-- CreateEnum
CREATE TYPE "EnumMessageType" AS ENUM ('text', 'picture', 'file', 'video', 'redPacket', 'emoticon');

-- CreateEnum
CREATE TYPE "EnumMessageOutboxStatus" AS ENUM ('init', 'pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "EnumRedPacketType" AS ENUM ('normal', 'random');

-- CreateEnum
CREATE TYPE "EnumRedPacketStatus" AS ENUM ('unclaimed', 'claimed', 'expired', 'refunding');

-- CreateEnum
CREATE TYPE "EnumBalanceLogType" AS ENUM ('sendRedPacket', 'receiveRedPacket', 'refundRedPacket');

-- CreateTable
CREATE TABLE "ApiKeys" (
    "id" UUID NOT NULL,
    "type" "EnumApiKeyType" NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "ApiKeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EnumRoleType" NOT NULL DEFAULT 'user',
    "abilities" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Countries" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "alpha2Code" TEXT NOT NULL,
    "alpha3Code" TEXT NOT NULL,
    "phoneCode" TEXT[],
    "continent" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "Countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMobiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "countryId" UUID NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "UserMobiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "password" TEXT,
    "passwordExpired" TIMESTAMP(3),
    "passwordCreated" TIMESTAMP(3),
    "passwordAttempt" INTEGER,
    "signUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signUpFrom" "EnumUserSignUpFrom" NOT NULL,
    "signUpWith" "EnumUserSignUpWith" NOT NULL,
    "status" "EnumUserStatus" NOT NULL DEFAULT 'active',
    "gender" "EnumUserGender",
    "countryId" UUID NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lastIPAddress" TEXT,
    "lastLoginFrom" "EnumUserLoginFrom",
    "lastLoginWith" "EnumUserLoginWith",
    "termPolicy" JSONB NOT NULL,
    "photo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" UUID,
    "legacy_id" BIGINT,
    "avatar" TEXT,
    "signature" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mobileNumberId" UUID,
    "to" TEXT NOT NULL,
    "type" "EnumVerificationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "Verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordHistories" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "password" TEXT NOT NULL,
    "type" "EnumPasswordHistoryType" NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "PasswordHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLogs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "EnumActivityLogAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "geoLocation" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "ActivityLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceOwnershipId" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" JSONB NOT NULL,
    "geoLocation" JSONB,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devices" (
    "id" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "platform" "EnumDevicePlatform" NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationToken" TEXT,
    "notificationProvider" "EnumDeviceNotificationProvider",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "Devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceOwnerships" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedById" UUID,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "biometricToken" TEXT,
    "biometricType" "EnumBiometricType",
    "biometricEnabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "DeviceOwnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactors" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "secret" TEXT,
    "iv" TEXT,
    "backupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "requiredSetup" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "TwoFactors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermPolicies" (
    "id" UUID NOT NULL,
    "type" "EnumTermPolicyType" NOT NULL,
    "contents" JSONB[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "EnumTermPolicyStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "TermPolicies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermPolicyUserAcceptances" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "termPolicyId" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "TermPolicyUserAcceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "FeatureFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForgotPasswords" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "to" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "resetAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "ForgotPasswords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "EnumNotificationType" NOT NULL,
    "priority" "EnumNotificationPriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeliveries" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "channel" "EnumNotificationChannel" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDeliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationUserSettings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "EnumNotificationChannel" NOT NULL,
    "type" "EnumNotificationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "NotificationUserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_balances" (
    "userId" UUID NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 1000.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_balances_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" BIGSERIAL NOT NULL,
    "target" TEXT NOT NULL,
    "channel" "EnumVerificationCodeChannel" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "EnumVerificationCodePurpose" NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_applications" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "message" TEXT,
    "status" "EnumFriendApplicationStatus" NOT NULL DEFAULT 'unread',
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "friend_id" UUID NOT NULL,
    "status" "EnumFriendStatus" NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EnumConversationType" NOT NULL,
    "status" "EnumConversationStatus" NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "EnumConversationMemberRole" NOT NULL DEFAULT 'member',
    "status" "EnumConversationMemberStatus" NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" BIGINT NOT NULL,
    "sender_id" UUID NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "conversation_type" "EnumConversationType" NOT NULL,
    "type" "EnumMessageType" NOT NULL,
    "content" TEXT,
    "body" JSONB NOT NULL,
    "reply_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "message_outboxes" (
    "id" BIGSERIAL NOT NULL,
    "message_id" BIGINT NOT NULL,
    "topic" TEXT NOT NULL,
    "message_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EnumMessageOutboxStatus" NOT NULL DEFAULT 'init',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_outboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "red_packets" (
    "red_packet_id" BIGINT NOT NULL,
    "sender_id" UUID NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "wrapper_text" TEXT NOT NULL,
    "type" "EnumRedPacketType" NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "total_count" INTEGER NOT NULL,
    "remaining_amount" DECIMAL(18,2) NOT NULL,
    "remaining_count" INTEGER NOT NULL,
    "status" "EnumRedPacketStatus" NOT NULL DEFAULT 'unclaimed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expire_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "red_packets_pkey" PRIMARY KEY ("red_packet_id")
);

-- CreateTable
CREATE TABLE "red_packet_receives" (
    "red_packet_receive_id" BIGSERIAL NOT NULL,
    "red_packet_id" BIGINT NOT NULL,
    "receiver_id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "red_packet_receives_pkey" PRIMARY KEY ("red_packet_receive_id")
);

-- CreateTable
CREATE TABLE "balance_logs" (
    "balance_log_id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "EnumBalanceLogType" NOT NULL,
    "related_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_logs_pkey" PRIMARY KEY ("balance_log_id")
);

-- CreateTable
CREATE TABLE "moments" (
    "moment_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "text" TEXT,
    "media_urls" JSONB NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3) NOT NULL,
    "delete_time" TIMESTAMP(3),

    CONSTRAINT "moments_pkey" PRIMARY KEY ("moment_id")
);

-- CreateTable
CREATE TABLE "moment_likes" (
    "like_id" BIGSERIAL NOT NULL,
    "moment_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_likes_pkey" PRIMARY KEY ("like_id")
);

-- CreateTable
CREATE TABLE "moment_comments" (
    "comment_id" BIGSERIAL NOT NULL,
    "moment_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_comment_id" BIGINT,
    "comment" TEXT NOT NULL,
    "is_delete" BOOLEAN NOT NULL DEFAULT false,
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateIndex
CREATE INDEX "ApiKeys_isActive_type_createdAt_idx" ON "ApiKeys"("isActive", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApiKeys_name_idx" ON "ApiKeys"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_key_key" ON "ApiKeys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_hash_key" ON "ApiKeys"("hash");

-- CreateIndex
CREATE INDEX "Roles_type_createdAt_idx" ON "Roles"("type", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE INDEX "Countries_continent_idx" ON "Countries"("continent");

-- CreateIndex
CREATE INDEX "Countries_name_idx" ON "Countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_alpha2Code_key" ON "Countries"("alpha2Code");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_alpha3Code_key" ON "Countries"("alpha3Code");

-- CreateIndex
CREATE INDEX "UserMobiles_userId_isVerified_idx" ON "UserMobiles"("userId", "isVerified");

-- CreateIndex
CREATE INDEX "UserMobiles_number_isVerified_idx" ON "UserMobiles"("number", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "UserMobiles_userId_countryId_phoneCode_number_key" ON "UserMobiles"("userId", "countryId", "phoneCode", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Users_legacy_id_key" ON "Users"("legacy_id");

-- CreateIndex
CREATE INDEX "Users_id_deletedAt_idx" ON "Users"("id", "deletedAt");

-- CreateIndex
CREATE INDEX "Users_email_deletedAt_idx" ON "Users"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "Users_status_deletedAt_createdAt_idx" ON "Users"("status", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Users_roleId_status_deletedAt_idx" ON "Users"("roleId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Users_countryId_status_signUpAt_idx" ON "Users"("countryId", "status", "signUpAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Verifications_token_expiredAt_isUsed_type_idx" ON "Verifications"("token", "expiredAt", "isUsed", "type");

-- CreateIndex
CREATE INDEX "Verifications_userId_type_isUsed_idx" ON "Verifications"("userId", "type", "isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "Verifications_reference_key" ON "Verifications"("reference");

-- CreateIndex
CREATE INDEX "PasswordHistories_userId_expiredAt_idx" ON "PasswordHistories"("userId", "expiredAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLogs_userId_createdAt_idx" ON "ActivityLogs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLogs_userId_action_createdAt_idx" ON "ActivityLogs"("userId", "action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Sessions_userId_expiredAt_isRevoked_idx" ON "Sessions"("userId", "expiredAt" DESC, "isRevoked");

-- CreateIndex
CREATE INDEX "Sessions_isRevoked_expiredAt_idx" ON "Sessions"("isRevoked", "expiredAt" ASC);

-- CreateIndex
CREATE INDEX "Sessions_userId_deviceOwnershipId_isRevoked_idx" ON "Sessions"("userId", "deviceOwnershipId", "isRevoked");

-- CreateIndex
CREATE INDEX "Sessions_deviceOwnershipId_idx" ON "Sessions"("deviceOwnershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_userId_jti_key" ON "Sessions"("userId", "jti");

-- CreateIndex
CREATE UNIQUE INDEX "Devices_fingerprint_key" ON "Devices"("fingerprint");

-- CreateIndex
CREATE INDEX "DeviceOwnerships_deviceId_revokedAt_idx" ON "DeviceOwnerships"("deviceId", "revokedAt");

-- CreateIndex
CREATE INDEX "DeviceOwnerships_userId_isRevoked_idx" ON "DeviceOwnerships"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "DeviceOwnerships_userId_revokedAt_idx" ON "DeviceOwnerships"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "DeviceOwnerships_deviceId_userId_revokedAt_idx" ON "DeviceOwnerships"("deviceId", "userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactors_userId_key" ON "TwoFactors"("userId");

-- CreateIndex
CREATE INDEX "TermPolicies_type_status_publishedAt_idx" ON "TermPolicies"("type", "status", "publishedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TermPolicies_type_version_key" ON "TermPolicies"("type", "version");

-- CreateIndex
CREATE INDEX "TermPolicyUserAcceptances_termPolicyId_acceptedAt_idx" ON "TermPolicyUserAcceptances"("termPolicyId", "acceptedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TermPolicyUserAcceptances_userId_termPolicyId_key" ON "TermPolicyUserAcceptances"("userId", "termPolicyId");

-- CreateIndex
CREATE INDEX "FeatureFlags_isEnable_idx" ON "FeatureFlags"("isEnable");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlags_key_key" ON "FeatureFlags"("key");

-- CreateIndex
CREATE INDEX "ForgotPasswords_token_expiredAt_isUsed_idx" ON "ForgotPasswords"("token", "expiredAt", "isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPasswords_reference_key" ON "ForgotPasswords"("reference");

-- CreateIndex
CREATE INDEX "Notifications_userId_isRead_createdAt_idx" ON "Notifications"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notifications_userId_type_createdAt_idx" ON "Notifications"("userId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notifications_userId_priority_isRead_createdAt_idx" ON "Notifications"("userId", "priority", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "NotificationDeliveries_channel_createdAt_idx" ON "NotificationDeliveries"("channel", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDeliveries_notificationId_channel_key" ON "NotificationDeliveries"("notificationId", "channel");

-- CreateIndex
CREATE INDEX "NotificationUserSettings_userId_isActive_idx" ON "NotificationUserSettings"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationUserSettings_userId_channel_type_key" ON "NotificationUserSettings"("userId", "channel", "type");

-- CreateIndex
CREATE INDEX "verification_codes_target_channel_purpose_expired_at_idx" ON "verification_codes"("target", "channel", "purpose", "expired_at");

-- CreateIndex
CREATE INDEX "verification_codes_target_channel_purpose_used_at_created_a_idx" ON "verification_codes"("target", "channel", "purpose", "used_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_codes_target_channel_used_at_created_at_idx" ON "verification_codes"("target", "channel", "used_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_codes_purpose_used_at_idx" ON "verification_codes"("purpose", "used_at");

-- CreateIndex
CREATE INDEX "friend_applications_sender_id_receiver_id_status_created_at_idx" ON "friend_applications"("sender_id", "receiver_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "friend_applications_sender_id_created_at_idx" ON "friend_applications"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "friend_applications_receiver_id_status_created_at_idx" ON "friend_applications"("receiver_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "friend_applications_receiver_id_created_at_idx" ON "friend_applications"("receiver_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "friends_friend_id_status_idx" ON "friends"("friend_id", "status");

-- CreateIndex
CREATE INDEX "friends_user_id_status_created_at_idx" ON "friends"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_id_friend_id_key" ON "friends"("user_id", "friend_id");

-- CreateIndex
CREATE INDEX "conversations_type_status_created_at_idx" ON "conversations"("type", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_members_user_id_status_idx" ON "conversation_members"("user_id", "status");

-- CreateIndex
CREATE INDEX "conversation_members_conversation_id_role_status_idx" ON "conversation_members"("conversation_id", "role", "status");

-- CreateIndex
CREATE INDEX "conversation_members_conversation_id_status_created_at_idx" ON "conversation_members"("conversation_id", "status", "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversation_id_user_id_key" ON "conversation_members"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_sender_id_created_at_idx" ON "messages"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_type_type_created_at_idx" ON "messages"("conversation_type", "type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "message_outboxes_status_next_retry_at_idx" ON "message_outboxes"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "message_outboxes_status_retry_count_next_retry_at_created_a_idx" ON "message_outboxes"("status", "retry_count", "next_retry_at", "created_at" ASC);

-- CreateIndex
CREATE INDEX "message_outboxes_status_updated_at_created_at_idx" ON "message_outboxes"("status", "updated_at", "created_at" ASC);

-- CreateIndex
CREATE INDEX "message_outboxes_topic_status_created_at_idx" ON "message_outboxes"("topic", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "message_outboxes_message_id_topic_key" ON "message_outboxes"("message_id", "topic");

-- CreateIndex
CREATE INDEX "red_packets_sender_id_created_at_idx" ON "red_packets"("sender_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "red_packets_conversation_id_created_at_idx" ON "red_packets"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "red_packets_status_expire_at_idx" ON "red_packets"("status", "expire_at");

-- CreateIndex
CREATE INDEX "red_packet_receives_red_packet_id_received_at_idx" ON "red_packet_receives"("red_packet_id", "received_at" ASC);

-- CreateIndex
CREATE INDEX "red_packet_receives_receiver_id_received_at_idx" ON "red_packet_receives"("receiver_id", "received_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "red_packet_receives_red_packet_id_receiver_id_key" ON "red_packet_receives"("red_packet_id", "receiver_id");

-- CreateIndex
CREATE INDEX "balance_logs_user_id_created_at_idx" ON "balance_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "balance_logs_type_related_id_idx" ON "balance_logs"("type", "related_id");

-- CreateIndex
CREATE INDEX "moments_user_id_delete_time_create_time_idx" ON "moments"("user_id", "delete_time", "create_time" DESC);

-- CreateIndex
CREATE INDEX "moments_user_id_update_time_create_time_idx" ON "moments"("user_id", "update_time" ASC, "create_time" DESC);

-- CreateIndex
CREATE INDEX "moments_create_time_idx" ON "moments"("create_time" DESC);

-- CreateIndex
CREATE INDEX "moment_likes_moment_id_is_delete_idx" ON "moment_likes"("moment_id", "is_delete");

-- CreateIndex
CREATE INDEX "moment_likes_user_id_is_delete_create_time_idx" ON "moment_likes"("user_id", "is_delete", "create_time" DESC);

-- CreateIndex
CREATE INDEX "moment_likes_user_id_update_time_idx" ON "moment_likes"("user_id", "update_time" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "moment_likes_moment_id_user_id_key" ON "moment_likes"("moment_id", "user_id");

-- CreateIndex
CREATE INDEX "moment_comments_moment_id_is_delete_create_time_idx" ON "moment_comments"("moment_id", "is_delete", "create_time" DESC);

-- CreateIndex
CREATE INDEX "moment_comments_moment_id_parent_comment_id_is_delete_idx" ON "moment_comments"("moment_id", "parent_comment_id", "is_delete");

-- CreateIndex
CREATE INDEX "moment_comments_user_id_is_delete_create_time_idx" ON "moment_comments"("user_id", "is_delete", "create_time" DESC);

-- CreateIndex
CREATE INDEX "moment_comments_user_id_update_time_idx" ON "moment_comments"("user_id", "update_time" ASC);

-- CreateIndex
CREATE INDEX "moment_comments_parent_comment_id_idx" ON "moment_comments"("parent_comment_id");

-- AddForeignKey
ALTER TABLE "UserMobiles" ADD CONSTRAINT "UserMobiles_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMobiles" ADD CONSTRAINT "UserMobiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifications" ADD CONSTRAINT "Verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifications" ADD CONSTRAINT "Verifications_mobileNumberId_fkey" FOREIGN KEY ("mobileNumberId") REFERENCES "UserMobiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHistories" ADD CONSTRAINT "PasswordHistories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_deviceOwnershipId_fkey" FOREIGN KEY ("deviceOwnershipId") REFERENCES "DeviceOwnerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceOwnerships" ADD CONSTRAINT "DeviceOwnerships_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceOwnerships" ADD CONSTRAINT "DeviceOwnerships_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceOwnerships" ADD CONSTRAINT "DeviceOwnerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactors" ADD CONSTRAINT "TwoFactors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermPolicyUserAcceptances" ADD CONSTRAINT "TermPolicyUserAcceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermPolicyUserAcceptances" ADD CONSTRAINT "TermPolicyUserAcceptances_termPolicyId_fkey" FOREIGN KEY ("termPolicyId") REFERENCES "TermPolicies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgotPasswords" ADD CONSTRAINT "ForgotPasswords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDeliveries" ADD CONSTRAINT "NotificationDeliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationUserSettings" ADD CONSTRAINT "NotificationUserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_applications" ADD CONSTRAINT "friend_applications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_applications" ADD CONSTRAINT "friend_applications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "messages"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_outboxes" ADD CONSTRAINT "message_outboxes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_packets" ADD CONSTRAINT "red_packets_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_packets" ADD CONSTRAINT "red_packets_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_packet_receives" ADD CONSTRAINT "red_packet_receives_red_packet_id_fkey" FOREIGN KEY ("red_packet_id") REFERENCES "red_packets"("red_packet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_packet_receives" ADD CONSTRAINT "red_packet_receives_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_logs" ADD CONSTRAINT "balance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_likes" ADD CONSTRAINT "moment_likes_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("moment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_likes" ADD CONSTRAINT "moment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("moment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "moment_comments"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE;
