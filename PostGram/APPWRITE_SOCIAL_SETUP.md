# PostGram social collections (Appwrite)

User search, public profiles, follows, chat and post comments read/write **real
Appwrite data** only. The client SDK cannot create collections, so create these
in the same database as `VITE_APPWRITE_DATABASE_ID`. Collection IDs can be
overridden with the env vars listed below.

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

## 4. `comments`

Every comment is one document, which is what makes the discussion stream live
on all clients without refreshing.

| Attribute           | Type   | Size | Required |
| ------------------- | ------ | ---- | -------- |
| `postId`            | string | 36   | yes      |
| `userId`            | string | 36   | yes      |
| `text`              | string | 2000 | yes      |
| `userDisplayName`   | string | 255  | no       |
| `userAvatarFileId`  | string | 36   | no       |

`userDisplayName` and `userAvatarFileId` are optional snapshots. The UI always
prefers the live `profiles` cache and falls back to these when a profile does
not exist yet. If the collection only has the three core attributes, comment
creation retries without the snapshots and still works.

Permissions: **read: Users**, **create: Users**, **delete: Users** (own
documents via document security). Never allow anonymous read.

Index: **`postId` (ascending) is required** for the batched per-feed lookup;
add `$createdAt` (descending) to match the newest-first ordering.

Realtime is enabled automatically on the collection. If `comments` does not
exist yet, likes and comments still work for posts that carry the legacy
embedded `comments` attribute on the `articles` collection: the client writes
back to that attribute and the existing article realtime stream keeps every
viewer in sync.

## Likes

Likes stay in the `likes` string array on `articles` (Option 2). Every like and
unlike is an `updateDocument` call, so the existing
`databases.[DB_ID].collections.articles.documents` stream pushes the new array
to every feed and modal instantly. No separate collection is required.

## Optional env overrides

```env
VITE_APPWRITE_PROFILES_COLLECTION_ID="profiles"
VITE_APPWRITE_FOLLOWS_COLLECTION_ID="follows"
VITE_APPWRITE_MESSAGES_COLLECTION_ID="messages"
VITE_APPWRITE_COMMENTS_COLLECTION_ID="comments"
```

## Realtime channels

The client opens these websocket channels and needs the collection read
permissions above:

- `databases.[DB_ID].collections.profiles.documents` — profile create/update/delete
  patches the global profile cache, so feed cards, the creator rail, chat,
  navbar and public profiles re-render immediately.
- `databases.[DB_ID].collections.follows.documents` — follow counts refresh on
  any follow/unfollow.
- `databases.[DB_ID].collections.articles.documents` — the home feed receives
  new moments, likes and legacy embedded comment updates live.
- `databases.[DB_ID].collections.comments.documents` — comment create/update/
  delete events patch the global comment store, so every open card and modal
  shows the new comment and counter immediately.
- `databases.[DB_ID].collections.messages.documents` — chat bubbles and
  conversation rows update live.

If a collection is missing, only that stream is skipped; the rest of the app
keeps working with normal fetches.

Until `messages` exists, `/chat` shows an explicit setup notice and never
displays fake conversations. Until `follows` exists, follow counts show `—` and
the Follow action reports the missing collection.
