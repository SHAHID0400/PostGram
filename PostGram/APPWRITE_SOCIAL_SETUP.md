# PostGram social collections (Appwrite)

User search, public profiles, follows and chat read/write **real Appwrite data**
only. The client SDK cannot create collections, so create these three in the
same database as `VITE_APPWRITE_DATABASE_ID`. Collection IDs can be overridden
with the env vars listed below.

## 1. `profiles`

Public identity for every account. The document ID is the Appwrite user ID.

| Attribute      | Type   | Size | Required |
| -------------- | ------ | ---- | -------- |
| `userId`       | string | 36   | yes      |
| `name`         | string | 128  | no       |
| `username`     | string | 36   | no       |
| `bio`          | string | 255  | no       |
| `avatarFileId` | string | 36   | no       |

Permissions: **read: Any**, **create: Users**, **update/delete: Users**
(enable document security so each user can edit their own document).

Index: `userId` (ascending), `username` (ascending).

## 2. `follows`

One document per follow edge.

| Attribute     | Type   | Size | Required |
| ------------- | ------ | ---- | -------- |
| `followerId`  | string | 36   | yes      |
| `followingId` | string | 36   | yes      |

Permissions: **read: Users**, **create: Users**, **delete: Users**.

Indexes: `followerId`, `followingId`.

## 3. `messages`

1-on-1 chat messages. Realtime is enabled automatically on the collection.

| Attribute        | Type   | Size | Required |
| ---------------- | ------ | ---- | -------- |
| `conversationId` | string | 64   | yes      |
| `senderId`       | string | 36   | yes      |
| `receiverId`     | string | 36   | yes      |
| `body`           | string | 2048 | yes      |

Permissions: **read: Users**, **create: Users**. Do not allow anonymous read.

Index: `conversationId` (ascending), `senderId`, `receiverId`.

## Optional env overrides

```env
VITE_APPWRITE_PROFILES_COLLECTION_ID="profiles"
VITE_APPWRITE_FOLLOWS_COLLECTION_ID="follows"
VITE_APPWRITE_MESSAGES_COLLECTION_ID="messages"
```

Until `messages` exists, `/chat` shows an explicit setup notice and never
displays fake conversations. Until `follows` exists, follow counts show `—` and
the Follow action reports the missing collection.
