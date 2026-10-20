import conf from "../conf/confi";
import { assertSafeImage, sanitizeIdList, sanitizeText } from "../lib/security";
import { Client, Account , ID ,Databases ,Storage ,Query, Permission, Role } from "appwrite";

const slugify = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "moment";

const PROFILE_COLLECTION_MISSING =
    /collection.*(not found|could not be found|does not exist)/i;

// Avoid repeating failing requests once Appwrite reports that the optional
// profiles collection has not been created yet.
let profilesCollectionAvailable = null;

const isProfilesMissing = (error) =>
    error?.code === 404 && PROFILE_COLLECTION_MISSING.test(error?.message || "");

const isProfileSchemaError = (error) =>
    error?.code === 400 &&
    /attribute|document structure|invalid format|invalid value|enum|unknown/i.test(
        error?.message || "",
    );

const cleanHandle = (value) =>
    String(value || "")
        .trim()
        .replace(/^@+/, "")
        .replace(/[^a-zA-Z0-9._]/g, "")
        .slice(0, 36);

const profileNameOf = (profile) => profile?.name || profile?.displayName || "";

const normalizeProfile = (profile, fallbackUserId = "") => ({
    userId: profile?.userId || fallbackUserId,
    name: profileNameOf(profile),
    username: cleanHandle(profile?.username),
    bio: profile?.bio || "",
    avatarFileId: profile?.avatarFileId || "",
    hasProfile: Boolean(profile),
});


export class Service {
    client=new Client();
    Databases;
    bucket;
    
    constructor(){
        this.client 
        .setEndpoint(conf.appwriteUrl)
        .setProject(conf.appwriteProjectId);
        this.Databases = new Databases(this.client);
        this.bucket = new Storage(this.client);

    }
    async createPost({title,slug,content,featuredImage,status,userId,name}){
        try {
           return await this.Databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
             ID.unique(),
            {
                title: sanitizeText(title, 120),
                content: sanitizeText(content, 20000),
                featuredImage,
                status,
                userId,
                slug,
                name: sanitizeText(name, 128),
            }
           ); 
        } catch (error) {
            throw error;
        }

}

   async updatePost( slug,{title,content,featuredImage,status}){
    try {
        return await this.Databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,{
                title: sanitizeText(title, 120),
                content: sanitizeText(content, 20000),
                featuredImage,
                status,
            }
        );
    } catch (error) {
        throw error;
    }

}

async deletePost(slug){
    try {
        await this.Databases.deleteDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,
        );
        return true;
    } catch (error) {
        return false;
    }
}

async getPost(slug){
    try {
        return await this.Databases.getDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            slug,
        )
    } catch (error) {
        return false;
    }

}

async getPosts(queries=[Query.equal("status","active")]){
    try {
        return await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            queries,
        );
    } catch (error) {
        return false;
    }
}

// ── Dashboard feed ─────────────────────────────────────────
async listFeedPosts({ limit = 12, offset = 0, userId = null } = {}) {
    try {
        const queries = [
            Query.equal("status", "active"),
            Query.orderDesc("$createdAt"),
            Query.limit(limit),
            Query.offset(offset),
        ];

        if (userId) queries.push(Query.equal("userId", userId));

        return await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            queries,
        );
    } catch (error) {
        throw error;
    }
}

async getUserPostCount(userId) {
    try {
        const result = await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            [
                Query.equal("userId", userId),
                Query.equal("status", "active"),
                Query.limit(1),
            ],
        );
        return result.total;
    } catch (error) {
        return null;
    }
}

async createMoment({ file, caption, user }) {
    let uploadedFile = null;

    try {
        uploadedFile = await this.bucket.createFile(
            conf.appwriteBucketId,
            ID.unique(),
            file,
        );

        const text = sanitizeText(caption, 2200);
        const title = text ? text.slice(0, 70) : "Untitled moment";
        const slug = `${slugify(title)}-${Date.now().toString(36)}`;

        return await this.Databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            ID.unique(),
            {
                title,
                slug,
                content: text,
                featuredImage: uploadedFile.$id,
                status: "active",
                userId: user.$id,
                name: sanitizeText(user.name, 128) || "PostGram creator",
            },
        );
    } catch (error) {
        if (uploadedFile?.$id) {
            this.bucket
                .deleteFile(conf.appwriteBucketId, uploadedFile.$id)
                .catch(() => {});
        }
        throw error;
    }
}

subscribeToFeed(callback) {
    return this.client.subscribe(
        `databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteCollectionId}.documents`,
        callback,
    );
}

// ── Public profiles / user discovery ───────────────────────
// Appwrite's Users API is server-only, so public identity lives in the
// `profiles` collection and is looked up by its `userId` attribute. Documents
// created by this service use `ID.unique()`; profiles that older versions
// stored at the user id are still read through a direct lookup. Existing
// accounts that haven't visited their profile yet remain discoverable through
// the author data stored on their real posts.
async savePublicProfile({
    userId,
    name = "",
    displayName = "",
    username = "",
    bio = "",
    avatarFileId = "",
} = {}) {
    if (!userId) return false;
    if (profilesCollectionAvailable === false) return false;

    const databaseId = conf.appwriteDatabaseId;
    const collectionId = conf.appwriteProfilesCollectionId;
    const resolvedName = sanitizeText(name || displayName, 128);
    const safeHandle = cleanHandle(sanitizeText(username, 36));
    const cleanBio = sanitizeText(bio, 160);
    const safeAvatar = String(avatarFileId || "");
    const core = {
        userId,
        name: resolvedName,
        displayName: resolvedName,
        username: safeHandle,
        bio: cleanBio,
        avatarFileId: safeAvatar,
    };
    // Workspaces differ in whether the profile name lives in `name`,
    // `displayName`, or both. Try the richest payload first, then the schemas
    // that only declare one of them.
    const variants = [
        core,
        {
            userId,
            name: resolvedName,
            username: safeHandle,
            bio: cleanBio,
            avatarFileId: safeAvatar,
        },
        {
            userId,
            displayName: resolvedName,
            username: safeHandle,
            bio: cleanBio,
            avatarFileId: safeAvatar,
        },
        {
            userId,
            username: safeHandle,
            bio: cleanBio,
            avatarFileId: safeAvatar,
        },
    ];
    const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
    ];

    const findExisting = async () => {
        try {
            const result = await this.Databases.listDocuments(
                databaseId,
                collectionId,
                [Query.equal("userId", userId), Query.limit(1)],
            );
            profilesCollectionAvailable = true;
            if (result.documents?.length) return result.documents[0];
        } catch (queryError) {
            if (isProfilesMissing(queryError)) {
                profilesCollectionAvailable = false;
                return null;
            }
            // An unindexed `userId` attribute rejects the query; keep going.
        }

        try {
            const doc = await this.Databases.getDocument(
                databaseId,
                collectionId,
                userId,
            );
            profilesCollectionAvailable = true;
            return doc;
        } catch (lookupError) {
            if (isProfilesMissing(lookupError)) {
                profilesCollectionAvailable = false;
                return null;
            }
            // Documents created with ID.unique() have a different document id.
        }

        try {
            const result = await this.Databases.listDocuments(
                databaseId,
                collectionId,
                [Query.limit(100)],
            );
            profilesCollectionAvailable = true;
            return result.documents?.find((doc) => doc.userId === userId) || null;
        } catch (scanError) {
            if (isProfilesMissing(scanError)) {
                profilesCollectionAvailable = false;
            }
            return null;
        }
    };

    const existing = await findExisting();
    if (profilesCollectionAvailable === false) return false;

    if (existing?.$id) {
        const knownFields = Object.fromEntries(
            Object.entries(core).filter(([key]) =>
                Object.prototype.hasOwnProperty.call(existing, key),
            ),
        );
        const updates = Object.keys(knownFields).length
            ? [knownFields, ...variants]
            : variants;

        for (const payload of updates) {
            try {
                await this.Databases.updateDocument(
                    databaseId,
                    collectionId,
                    existing.$id,
                    payload,
                );
                profilesCollectionAvailable = true;
                return true;
            } catch (updateError) {
                if (isProfilesMissing(updateError)) {
                    profilesCollectionAvailable = false;
                    return false;
                }
                if (!isProfileSchemaError(updateError)) return false;
            }
        }

        return false;
    }

    const createOnce = async (payload, documentId) => {
        try {
            return await this.Databases.createDocument(
                databaseId,
                collectionId,
                documentId,
                payload,
                permissions,
            );
        } catch (permissionError) {
            if (isProfilesMissing(permissionError)) throw permissionError;
            // Collections without document security reject custom permissions;
            // retry with the collection defaults.
            return this.Databases.createDocument(
                databaseId,
                collectionId,
                documentId,
                payload,
            );
        }
    };

    for (const payload of variants) {
        try {
            await createOnce(payload, ID.unique());
            profilesCollectionAvailable = true;
            return true;
        } catch (createError) {
            if (isProfilesMissing(createError)) {
                profilesCollectionAvailable = false;
                return false;
            }
            if (!isProfileSchemaError(createError)) return false;
        }
    }

    // Last resort: keep the legacy document id = user id shape so the direct
    // lookup in getPublicProfile keeps resolving this account.
    try {
        await createOnce(
            {
                userId,
                username: safeHandle,
                bio: cleanBio,
                avatarFileId: safeAvatar,
            },
            userId,
        );
        profilesCollectionAvailable = true;
        return true;
    } catch (legacyError) {
        if (isProfilesMissing(legacyError)) profilesCollectionAvailable = false;
        return false;
    }
}

async getPublicProfile(userId) {
    if (!userId) return null;

    let profile = null;

    if (profilesCollectionAvailable !== false) {
        try {
            const result = await this.Databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteProfilesCollectionId,
                [Query.equal("userId", userId), Query.limit(1)],
            );
            profilesCollectionAvailable = true;
            profile = result.documents?.[0] || null;
        } catch (queryError) {
            // A 404 for the collection is cached so we stop retrying it; other
            // query errors fall through to the direct document lookup.
            if (isProfilesMissing(queryError)) {
                profilesCollectionAvailable = false;
            }
        }

        if (!profile && profilesCollectionAvailable !== false) {
            try {
                profile = await this.Databases.getDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteProfilesCollectionId,
                    userId,
                );
                profilesCollectionAvailable = true;
            } catch (lookupError) {
                if (isProfilesMissing(lookupError)) {
                    profilesCollectionAvailable = false;
                }
            }
        }
    }

    if (profile) {
        const normalized = normalizeProfile(profile, userId);
        if (normalized.name) return normalized;

        // A profile saved before a display name was set still has a real
        // author name on its posts; prefer that over a generic fallback.
        try {
            const posts = await this.listFeedPosts({ limit: 1, offset: 0, userId });
            return { ...normalized, name: posts.documents[0]?.name || "" };
        } catch (postError) {
            return normalized;
        }
    }

    try {
        const posts = await this.listFeedPosts({ limit: 1, offset: 0, userId });
        const post = posts.documents[0];

        return {
            userId,
            name: post?.name || "",
            username: "",
            bio: "",
            avatarFileId: "",
            hasProfile: false,
        };
    } catch (postError) {
        return normalizeProfile(null, userId);
    }
}

// Self-healing backfill for accounts that existed before the profiles
// collection did. It never overwrites a profile a user has already saved.
async ensurePublicProfile(
    userId,
    { name = "", username = "", bio = "", avatarFileId = "" } = {},
) {
    if (!userId) return false;

    const existing = await this.getPublicProfile(userId);
    if (existing?.hasProfile) return true;

    return this.savePublicProfile({
        userId,
        name,
        username,
        bio,
        avatarFileId,
    });
}

async searchUsers(term, { limit = 8, currentUser = null } = {}) {
    const query = String(term || "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    if (query.length < 2) return [];

    const people = new Map();

    try {
        const profiles = await this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteProfilesCollectionId,
            [Query.limit(100)],
        );

        profiles.documents.forEach((profile) => {
            const userId = profile.userId || profile.$id;
            if (!userId) return;

            people.set(userId, {
                userId,
                name: profileNameOf(profile),
                username: cleanHandle(profile.username),
                avatarFileId: profile.avatarFileId || "",
                hasProfile: true,
            });
        });
    } catch (profileError) {
        // The profiles collection may not exist yet; real post authors below
        // still make search usable.
    }

    try {
        const posts = await this.listFeedPosts({ limit: 100, offset: 0 });
        posts.documents.forEach((post) => {
            if (!post.userId || people.has(post.userId)) return;

            people.set(post.userId, {
                userId: post.userId,
                name: post.name || "",
                username: "",
                avatarFileId: "",
                hasProfile: false,
            });
        });
    } catch (postError) {
        // Search still works with profiles only.
    }

    if (currentUser?.$id) {
        people.set(currentUser.$id, {
            userId: currentUser.$id,
            name: currentUser.name || "",
            username: currentUser.username || "",
            avatarFileId: currentUser.avatarFileId || "",
            hasProfile: true,
        });
    }

    return [...people.values()]
        .filter((person) =>
            `${person.name} ${person.username} ${person.userId}`
                .toLowerCase()
                .includes(query),
        )
        .sort((first, second) => {
            const firstScore = String(first.username || "").toLowerCase().startsWith(query) ? 0 : 1;
            const secondScore = String(second.username || "").toLowerCase().startsWith(query) ? 0 : 1;
            return firstScore - secondScore;
        })
        .slice(0, limit);
}

// ── Follow graph ───────────────────────────────────────────
async getFollowDocument(followerId, followingId) {
    const result = await this.Databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteFollowsCollectionId,
        [
            Query.equal("followerId", followerId),
            Query.equal("followingId", followingId),
            Query.limit(1),
        ],
    );

    return result.documents[0] || null;
}

async isFollowing(followerId, followingId) {
    if (!followerId || !followingId || followerId === followingId) return false;

    try {
        return Boolean(await this.getFollowDocument(followerId, followingId));
    } catch (error) {
        // Return null so the UI can explain that the follow collection is missing.
        return null;
    }
}

async followUser(followerId, followingId) {
    if (!followerId || !followingId || followerId === followingId) return null;

    const existing = await this.getFollowDocument(followerId, followingId);
    if (existing) return existing;

    return this.Databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteFollowsCollectionId,
        ID.unique(),
        { followerId, followingId },
    );
}

async unfollowUser(followerId, followingId) {
    const existing = await this.getFollowDocument(followerId, followingId);
    if (!existing) return true;

    await this.Databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteFollowsCollectionId,
        existing.$id,
    );

    return true;
}

async getFollowStats(userId) {
    if (!userId) return { supported: false, followers: null, following: null };

    try {
        const [followers, following] = await Promise.all([
            this.Databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteFollowsCollectionId,
                [Query.equal("followingId", userId), Query.limit(1)],
            ),
            this.Databases.listDocuments(
                conf.appwriteDatabaseId,
                conf.appwriteFollowsCollectionId,
                [Query.equal("followerId", userId), Query.limit(1)],
            ),
        ]);

        return {
            supported: true,
            followers: followers.total,
            following: following.total,
        };
    } catch (error) {
        return { supported: false, followers: null, following: null };
    }
}

// ── 1-on-1 chat ────────────────────────────────────────────
conversationIdFor(firstUserId, secondUserId) {
    return [firstUserId, secondUserId].filter(Boolean).sort().join("__");
}

async listMessages({ userId, otherId, limit = 200 } = {}) {
    if (!userId || !otherId) return { documents: [], total: 0 };

    return this.Databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteMessagesCollectionId,
        [
            Query.equal(
                "conversationId",
                this.conversationIdFor(userId, otherId),
            ),
            Query.orderAsc("$createdAt"),
            Query.limit(limit),
        ],
    );
}

async sendMessage({ sender, recipientId, body }) {
    const text = sanitizeText(body, 2000);

    if (!sender?.$id || !recipientId || !text) {
        throw new Error("A recipient and message body are required.");
    }

    const base = {
        conversationId: this.conversationIdFor(sender.$id, recipientId),
        senderId: sender.$id,
        receiverId: recipientId,
        body: text,
    };

    // Optional sender snapshot lets chat resolve a name, handle and avatar
    // before the recipient has opened their public profile.
    const snapshot = {
        senderName: sanitizeText(sender.name, 128),
        senderUsername: sanitizeText(sender.username, 20).replace(
            /[^a-zA-Z0-9._]/g,
            "",
        ),
        senderAvatarFileId: sender.avatarFileId || "",
    };

    const create = (data) =>
        this.Databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteMessagesCollectionId,
            ID.unique(),
            data,
        );

    try {
        return await create({ ...base, ...snapshot });
    } catch (error) {
        const schemaMismatch =
            error?.code === 400 &&
            /attribute|document structure|invalid/i.test(error?.message || "");

        if (!schemaMismatch) throw error;

        // The messages collection may only contain the core four attributes.
        return create(base);
    }
}

async listConversations(userId) {
    if (!userId) return [];

    const [sent, received] = await Promise.all([
        this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteMessagesCollectionId,
            [
                Query.equal("senderId", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(100),
            ],
        ),
        this.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteMessagesCollectionId,
            [
                Query.equal("receiverId", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(100),
            ],
        ),
    ]);

    const allMessages = [...sent.documents, ...received.documents];
    const latestByPerson = new Map();
    const snapshotsBySender = new Map();

    allMessages.forEach((message) => {
        if (
            message.senderId &&
            (message.senderName ||
                message.senderUsername ||
                message.senderAvatarFileId)
        ) {
            snapshotsBySender.set(message.senderId, {
                name: message.senderName || "",
                username: message.senderUsername || "",
                avatarFileId: message.senderAvatarFileId || "",
            });
        }
    });

    allMessages
        .sort(
            (first, second) =>
                new Date(second.$createdAt).getTime() -
                new Date(first.$createdAt).getTime(),
        )
        .forEach((message) => {
            const otherId =
                message.senderId === userId
                    ? message.receiverId
                    : message.senderId;

            if (!otherId || latestByPerson.has(otherId)) return;
            latestByPerson.set(otherId, message);
        });

    const entries = [...latestByPerson.entries()];
    const profiles = await Promise.all(
        entries.map(([otherId]) => this.getPublicProfile(otherId)),
    );

    return entries.map(([otherId, message], index) => {
        const profile = profiles[index] || {};
        const snapshot = snapshotsBySender.get(otherId) || {};

        return {
            userId: otherId,
            profile: {
                ...profile,
                userId: profile.userId || otherId,
                name: profile.name || snapshot.name || "",
                username: profile.username || snapshot.username || "",
                avatarFileId:
                    profile.avatarFileId || snapshot.avatarFileId || "",
            },
            message,
        };
    });
}

subscribeToMessages(callback) {
    return this.client.subscribe(
        `databases.${conf.appwriteDatabaseId}.collections.${conf.appwriteMessagesCollectionId}.documents`,
        callback,
    );
}

// ── Creator Studio ─────────────────────────────────────────
async uploadMediaFile(file) {
    assertSafeImage(file);

    try {
        const uploaded = await this.bucket.createFile(
            conf.appwriteBucketId,
            ID.unique(),
            file,
        );
        return uploaded.$id;
    } catch (error) {
        throw error;
    }
}

async createStudioPost({
    caption = "",
    location = "",
    audience = "public",
    user,
    featuredImage,
}) {
    const text = sanitizeText(caption, 2200);
    const title = text ? text.slice(0, 70) : "Untitled moment";
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;

    const base = {
        title,
        slug,
        content: text,
        featuredImage,
        status: "active",
        userId: user.$id,
        name: sanitizeText(user.name, 128) || "PostGram creator",
    };

    const optional = {};
    const safeLocation = sanitizeText(location, 60);
    if (safeLocation) optional.location = safeLocation;
    if (audience) optional.audience = audience;

    const create = (data) =>
        this.Databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            ID.unique(),
            data,
        );

    // Optional metadata is only written when the collection schema allows it.
    // Appwrite reports a missing attribute, invalid enum or shape mismatch as
    // a 400, so retry with a smaller payload instead of failing the upload.
    const schemaMismatch = (error) =>
        error?.code === 400 &&
        /attribute|document structure|invalid format|invalid value|enum/i.test(
            error?.message || "",
        );

    try {
        const post = await create({ ...base, ...optional });
        return { post, metadataSaved: true };
    } catch (error) {
        if (!schemaMismatch(error) || Object.keys(optional).length === 0) {
            throw error;
        }

        // The posts collection may not have `location` / `audience` yet.
        // Retry with audience only, then with the core schema.
        try {
            const post = await create({
                ...base,
                ...(audience ? { audience } : {}),
            });
            return { post, metadataSaved: false };
        } catch (secondError) {
            if (!schemaMismatch(secondError)) {
                throw secondError;
            }

            const post = await create(base);
            return { post, metadataSaved: false };
        }
    }
}

// These only work when the `likes` (string[]) and `comments` (string)
// attributes exist on the posts collection. The UI checks the document
// shape before rendering the controls, so no fake engagement is shown.
async updatePostLikes(postId, likes) {
    return this.Databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        postId,
        { likes: sanitizeIdList(likes) },
    );
}

async updatePostComments(postId, comments) {
    return this.Databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        postId,
        { comments },
    );
}

// Profile avatars are stored in the same Appwrite bucket as post images.
async uploadAvatarFile(file) {
    assertSafeImage(file, { maxBytes: 8 * 1024 * 1024 });

    try {
        const uploaded = await this.bucket.createFile(
            conf.appwriteBucketId,
            ID.unique(),
            file,
        );
        return uploaded.$id;
    } catch (error) {
        throw error;
    }
}

//file upload
async uploadFile(file){

    try {
        return await this.bucket.createFile(
            conf.appwriteBucketId,
            ID.unique(),
            file,
        );
    } catch (error) {
        return false;
    }
}

async deleteFile(fileId){
    try {
        await this.bucket.deleteFile(
            conf.appwriteBucketId,
            fileId
        );
        return true;
    } catch (error) {
        return false;
    }
}

 getFileView(fileId){
    return this.bucket.getFileView(
        conf.appwriteBucketId,
        fileId
    )

}

}
const service = new Service();

 
export default service;