# PostGram social collections (Appwrite)

User search, public profiles, follows and chat read/write **real Appwrite data**
only. The client SDK cannot create collections, so create these three in the
same database as `VITE_APPWRITE_DATABASE_ID`. Collection IDs can be overridden
with the env vars listed below.

## 1. `profiles`

Public identity for every account. Profiles are looked up with
`Query.equal("userId", currentUser.$id)`, so new documents are created with
`ID.unique()`. Documents created by older builds used the Appwrite user ID as
the document ID; the client still reads those through a direct lookup.

| Attribute      | Type   | Size | Required |
| -------------- | ------ | ---- | -------- |
| `userId`       | string | 36   | yes      |
| `name`         | string | 128  | no       |
| `displayName`  | string | 128  | no       |
| `username`     | string | 36   | no       |
| `bio`          | string | 255  | no       |
| `avatarFileId` | string | 36   | no       |

The client writes the display name to both `name` and `displayName` when the
schema has both, and falls back to whichever attribute exists. Include at
least one of them.

Permissions: **read: Any**, **create: Users**, **update/delete: Users**
(enable document security so each user can edit their own document).

Indexes: **`userId` (ascending) is required** for the profile lookup query;
add `username` (ascending) if you search by handle in the console.

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
| `senderName`     | string | 128  | no       |
| `senderUsername` | string | 36   | no       |
| `senderAvatarFileId` | string | 36 | no     |

The three `sender*` attributes are optional sender snapshots. When they exist,
chat can show a real name, handle and avatar even if the profiles collection is
missing. If the collection only has the four core attributes, message sending
retries without the snapshot and still works.

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
