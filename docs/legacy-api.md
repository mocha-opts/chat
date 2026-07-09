# Legacy API Compatibility Documentation

## Overview

This document records the Java InfiniteChat compatibility surface exposed by the NestJS monolith. These routes are kept so old clients and future frontend work can target a stable API while the implementation uses ACK NestJS modules, PostgreSQL, Redis, Kafka, and the shared response system.

## Compatibility Rules

- The target runtime is one NestJS application. These routes are not split into microservices.
- PostgreSQL remains the authoritative business database.
- Kafka carries IM message persistence and realtime event delivery. BullMQ remains limited to background jobs such as notification processing.
- Redis remains available for sessions, cache, verification codes, online routing, and low-latency state.
- Every HTTP route uses ACK `@Response` or equivalent response handling. The old Java `Result` semantics are mapped to the ACK envelope: message, status code, and data.
- Protected routes use ACK JWT sessions and validate that legacy user identifiers resolve to the JWT subject.
- Legacy Java `Long` business IDs are returned as strings when they can exceed JavaScript safe integer precision.

## Route Table

| Method | Path | Module | Description |
| ------ | ---- | ------ | ----------- |
| POST | `/api/v1/user/register` | `user` | Register with phone, password, and verification code |
| POST | `/api/v1/user/login` | `user` | Password login by phone |
| POST | `/api/v1/user/loginCode` | `user` | Verification-code login by phone |
| PATCH | `/api/v1/user/avatar` | `user` | Update authenticated user avatar |
| POST | `/api/v1/user/common/sendMail` | `verification` | Send verification code |
| POST | `/api/v1/user/common/check` | `verification` | Check verification code |
| POST | `/api/v1/user/common/uploadUrl` | `storage` | Get S3-compatible upload URL |
| GET | `/api/v1/contact/{userId}/user` | `contact` | Search user |
| POST | `/api/v1/contact/{userId}/friend/{receiverId}` | `contact` | Apply to add friend |
| GET | `/api/v1/contact/{userId}/friend/{friendId}` | `contact` | Get friend detail |
| GET | `/api/v1/contact/{userId}/applyCount` | `contact` | Count unread applications |
| GET | `/api/v1/contact/{userId}/apply` | `contact` | List friend applications |
| POST | `/api/v1/contact/{userId}/application/{status}` | `contact` | Update friend application status |
| DELETE | `/api/v1/contact/{userId}/friend/{receiverId}` | `contact` | Delete friend |
| POST | `/api/v1/contact/{userId}/block/{receiverId}` | `contact` | Block friend |
| POST | `/api/v1/contact/groups` | `conversation` | Create group conversation |
| POST | `/api/v1/contact/group/invite` | `conversation` | Invite group members |
| POST | `/api/v1/contact/group/kick` | `conversation` | Kick group members |
| POST | `/api/v1/contact/group/exit` | `conversation` | Exit group |
| GET | `/api/v1/contact/group/{conversationId}/members` | `conversation` | List group members |
| POST | `/api/v1/contact/group/setAdmin` | `conversation` | Set group admin |
| POST | `/api/v1/chat/session` | `messaging` | Send message |
| POST | `/api/v1/chat/redPacket/send` | `red-packet` | Send red packet |
| POST | `/api/v1/chat/redPacket/receive` | `red-packet` | Receive red packet |
| GET | `/api/v1/chat/redPacket/{redPacketId}` | `red-packet` | Get red packet detail |
| GET | `/api/v1/offline/message` | `offline-message` | List offline messages |
| POST | `/api/v1/moment` | `moment` | Create moment |
| DELETE | `/api/v1/moment/{momentId}` | `moment` | Delete moment |
| POST | `/api/v1/moment/like/{momentId}` | `moment` | Like moment |
| DELETE | `/api/v1/moment/like/{momentId}` | `moment` | Delete moment like |
| POST | `/api/v1/moment/comment/{momentId}` | `moment` | Create moment comment |
| DELETE | `/api/v1/moment/comment/{momentId}` | `moment` | Delete moment comment |
| GET | `/api/v1/moment/list/{userId}` | `moment` | Incremental moment list |
| WS | `/api/v1/netty` | `realtime` | Legacy WebSocket endpoint |

## Swagger Coverage

The core legacy HTTP routes above are documented with the ACK doc decorators:

- `@Doc` provides summaries and operation metadata.
- `@DocRequest` documents body, params, and query inputs.
- `@DocAuth` documents JWT access-token protection.
- `@DocResponse` documents the ACK response envelope and legacy response DTOs.

Swagger is served by the existing application documentation setup. Production disables documentation according to the normal ACK environment rules.
