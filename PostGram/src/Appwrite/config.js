import conf from "../conf/confi";
import { assertSafeImage, sanitizeIdList, sanitizeText } from "../lib/security";
import { dedupeProfiles, selectPreferredProfile } from "../utils/profileResolver";
import { Client, Account, ID, Databases, Storage, Query, Permission, Role } from "appwrite";

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

let profilesCollectionAvailable = null;
let commentsCollectionAvailable = null;

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
const profileAvatarOf = (profile) =>
    [profile?.avatarFileId, profile?.avatar, profile?.imageId]
        .map((value) => String(value || "").trim())
        .find(Boolean) || "";

const normalizeProfile = (profile, fallbackUserId = "") => ({
    $id: profile?.$id || "",
    $createdAt: profile?.$createdAt || "",
    $updatedAt: profile?.$updatedAt || "",
    userId: profile?.userId || fallbackUserId,
    name: profileNameOf(profile),
    username: cleanHandle(profile?.username),
    bio: profile?.bio || "",
    avatarFileId: profileAvatarOf(profile),
    hasProfile: Boolean(profile),
});

export class Service {
    client = new Client();
    Databases;
    bucket;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.Databases = new Databases(this.client);
        this.bucket = new Storage(this.client);
    }

    get commentsCollectionId() {
        return conf.appwriteCommentsCollectionId || "comments";
    }

    get profilesCollectionId() {
        return conf.appwriteProfilesCollectionId || "profiles";
    }

    get followsCollectionId() {
        return conf.appwriteFollowsCollectionId || "follows";
    }

    get messagesCollectionId() {
        return conf.appwriteMessagesCollectionId || "messages";
    }

    async createPost({ title, slug, content, featuredImage, status, userId, name }) {
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
                    likes: [],
                }
            );
        } catch (error) {
            throw error;
        }
    }

    async updatePost(slug, { title, content, featuredImage, status }) {
        try {
            return await this.Databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
                {
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

    async deletePost(slug) {
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

    async getPost(slug) {
        try {
            return await this.Databases.getDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                slug,
            );
        } catch (error) {
            return false;
        }
    }

    async getPosts(queries = [Query.equal("status", "active")]) {
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
                    likes: [],
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

    subscribeToProfiles(callback) {
        return this.client.subscribe(
            `databases.${conf.appwriteDatabaseId}.collections.${this.profilesCollectionId}.documents`,
            callback,
        );
    }

    subscribeToFollows(callback) {
        return this.client.subscribe(
            `databases.${conf.appwriteDatabaseId}.collections.${this.followsCollectionId}.documents`,
            callback,
        );
    }

    subscribeToComments(callback) {
        return this.client.subscribe(
            `databases.${conf.appwriteDatabaseId}.collections.${this.commentsCollectionId}.documents`,
            callback,
        );
    }

    // ── Resilient Likes Update ─────────────────────────────────
    async updatePostLikes(postId, likes) {
        try {
            const cleanLikes = Array.isArray(likes) ? likes.map(String) : [];
            return await this.Databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                postId,
                { likes: cleanLikes }
            );
        } catch (err) {
            console.warn("Likes update sync warning:", err);
            return null;
        }
    }

    async updatePostComments(postId, comments) {
        return this.Databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            postId,
            { comments },
        );
    }

    // ── Post comments ───────────────────────────────────────────
    async listCommentsForPosts(postIds = []) {
        const ids = [...new Set((Array.isArray(postIds) ? postIds : []).filter(Boolean))];
        const comments = {};

        if (ids.length === 0) {
            return { supported: true, comments };
        }

        for (let index = 0; index < ids.length; index += 100) {
            const batch = ids.slice(index, index + 100);

            try {
                const response = await this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.commentsCollectionId,
                    [
                        Query.equal("postId", batch),
                        Query.orderDesc("$createdAt"),
                        Query.limit(500),
                    ],
                );

                response.documents.forEach((document) => {
                    const postId = document.postId;
                    if (!postId) return;
                    if (!comments[postId]) comments[postId] = [];
                    comments[postId].push(document);
                });
            } catch (error) {
                return { supported: true, comments };
            }
        }

        return { supported: true, comments };
    }

    async createComment({ postId, user, text } = {}) {
        if (!postId || !user?.$id) {
            throw new Error("A signed-in account is required to comment.");
        }

        const cleanText = sanitizeText(text, 2000);
        if (!cleanText) throw new Error("Write something before posting.");

        const payload = {
            postId,
            userId: user.$id,
            text: cleanText,
            authorName: sanitizeText(user.name || "", 255),
            avatarFileId: user.avatarFileId || "",
        };

        const core = {
            postId,
            userId: user.$id,
            text: cleanText,
        };

        try {
            return await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                this.commentsCollectionId,
                ID.unique(),
                payload
            );
        } catch (error) {
            try {
                return await this.Databases.createDocument(
                    conf.appwriteDatabaseId,
                    this.commentsCollectionId,
                    ID.unique(),
                    core
                );
            } catch (coreError) {
                console.error("createComment error:", coreError);
                throw coreError;
            }
        }
    }

    // ── Batch profile lookup ──────────────────────────────────
    async listProfileDocumentsByIds(userIds = []) {
        const ids = [...new Set((Array.isArray(userIds) ? userIds : []).filter(Boolean))];
        const documents = [];

        if (ids.length === 0) return documents;

        for (let index = 0; index < ids.length; index += 100) {
            const batch = ids.slice(index, index + 100);
            let cursor = "";

            do {
                const queries = [
                    Query.equal("userId", batch),
                    Query.limit(100),
                    ...(cursor ? [Query.cursorAfter(cursor)] : []),
                ];
                const response = await this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.profilesCollectionId,
                    queries,
                );
                const page = response.documents || [];
                documents.push(...page);
                cursor =
                    page.length === 100 ? page[page.length - 1].$id : "";
            } while (cursor);
        }

        return documents;
    }

    async listProfilesByIds(userIds = []) {
        const result = { profiles: {}, missingCollection: false };
        const documents = await this.listProfileDocumentsByIds(userIds);

        dedupeProfiles(documents).forEach((document) => {
            const userId = document.userId || document.$id;
            if (userId) {
                result.profiles[userId] = normalizeProfile(document, userId);
            }
        });

        return result;
    }

    async getPreferredProfileDocument(userId) {
        if (!userId) return null;
        const documents = await this.listProfileDocumentsByIds([userId]);
        return selectPreferredProfile(documents);
    }

    // ── Public profiles ────────────────────────────────────────
    async savePublicProfile({
        userId,
        name = "",
        displayName = "",
        username = "",
        bio = "",
        avatarFileId = "",
    } = {}) {
        if (!userId) return false;

        const databaseId = conf.appwriteDatabaseId;
        const collectionId = this.profilesCollectionId;
        const resolvedName = sanitizeText(name || displayName, 128);
        const safeHandle = cleanHandle(sanitizeText(username, 36));
        const cleanBio = sanitizeText(bio, 160);
        const safeAvatar = String(avatarFileId || "");

        const payload = {
            userId,
            username: safeHandle,
            displayName: resolvedName,
            bio: cleanBio,
            avatarFileId: safeAvatar,
        };

        try {
            const existing = await this.getPreferredProfileDocument(userId);

            if (existing) {
                await this.Databases.updateDocument(
                    databaseId,
                    collectionId,
                    existing.$id,
                    payload,
                );
            } else {
                await this.Databases.createDocument(
                    databaseId,
                    collectionId,
                    ID.unique(),
                    payload,
                );
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async getPublicProfile(userId) {
        if (!userId) return null;

        try {
            const profile = await this.getPreferredProfileDocument(userId);
            if (profile) return normalizeProfile(profile, userId);
        } catch (err) {}

        try {
            const posts = await this.listFeedPosts({ limit: 1, offset: 0, userId });
            const post = posts.documents?.[0];
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

    async ensurePublicProfile(
        userId,
        { name = "", username = "", bio = "", avatarFileId = "" } = {},
    ) {
        if (!userId) return false;
        const existing = await this.getPublicProfile(userId);
        if (existing?.hasProfile && existing?.name) return true;

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
                this.profilesCollectionId,
                [Query.limit(100)],
            );

            dedupeProfiles(profiles.documents || []).forEach((profile) => {
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
        } catch (e) {}

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
        try {
            const result = await this.Databases.listDocuments(
                conf.appwriteDatabaseId,
                this.followsCollectionId,
                [
                    Query.equal("followerId", followerId),
                    Query.equal("followingId", followingId),
                    Query.limit(1),
                ],
            );
            return result.documents[0] || null;
        } catch (e) {
            return null;
        }
    }

    async isFollowing(followerId, followingId) {
        if (!followerId || !followingId || followerId === followingId) return false;
        try {
            return Boolean(await this.getFollowDocument(followerId, followingId));
        } catch (error) {
            return null;
        }
    }

    async followUser(followerId, followingId) {
        if (!followerId || !followingId || followerId === followingId) return null;
        const existing = await this.getFollowDocument(followerId, followingId);
        if (existing) return existing;

        try {
            return await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                this.followsCollectionId,
                ID.unique(),
                { followerId, followingId },
            );
        } catch (e) {
            return null;
        }
    }

    async unfollowUser(followerId, followingId) {
        const existing = await this.getFollowDocument(followerId, followingId);
        if (!existing) return true;

        try {
            await this.Databases.deleteDocument(
                conf.appwriteDatabaseId,
                this.followsCollectionId,
                existing.$id,
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    async getFollowStats(userId) {
        if (!userId) return { supported: false, followers: null, following: null };

        try {
            const [followers, following] = await Promise.all([
                this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.followsCollectionId,
                    [Query.equal("followingId", userId), Query.limit(1)],
                ),
                this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.followsCollectionId,
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
            this.messagesCollectionId,
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

        try {
            return await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                this.messagesCollectionId,
                ID.unique(),
                base,
            );
        } catch (error) {
            throw error;
        }
    }

    async listConversations(userId) {
        if (!userId) return [];

        try {
            const [sent, received] = await Promise.all([
                this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.messagesCollectionId,
                    [
                        Query.equal("senderId", userId),
                        Query.orderDesc("$createdAt"),
                        Query.limit(100),
                    ],
                ),
                this.Databases.listDocuments(
                    conf.appwriteDatabaseId,
                    this.messagesCollectionId,
                    [
                        Query.equal("receiverId", userId),
                        Query.orderDesc("$createdAt"),
                        Query.limit(100),
                    ],
                ),
            ]);

            const allMessages = [...sent.documents, ...received.documents];
            const latestByPerson = new Map();

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
                return {
                    userId: otherId,
                    profile: {
                        ...profile,
                        userId: profile.userId || otherId,
                        name: profile.name || "Member",
                        username: profile.username || "",
                        avatarFileId: profile.avatarFileId || "",
                    },
                    message,
                };
            });
        } catch (e) {
            return [];
        }
    }

    subscribeToMessages(callback) {
        return this.client.subscribe(
            `databases.${conf.appwriteDatabaseId}.collections.${this.messagesCollectionId}.documents`,
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
            likes: [],
        };

        const optional = {};
        const safeLocation = sanitizeText(location, 60);
        if (safeLocation) optional.location = safeLocation;
        if (audience) optional.audience = audience;

        try {
            const post = await this.Databases.createDocument(
                conf.appwriteDatabaseId,
                conf.appwriteCollectionId,
                ID.unique(),
                { ...base, ...optional }
            );
            return {
                post: JSON.parse(JSON.stringify(post)),
                metadataSaved: true,
            };
        } catch (error) {
            try {
                const post = await this.Databases.createDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteCollectionId,
                    ID.unique(),
                    base
                );
                return {
                    post: JSON.parse(JSON.stringify(post)),
                    metadataSaved: false,
                };
            } catch (fallbackError) {
                console.error("createStudioPost error:", fallbackError);
                throw fallbackError;
            }
        }
    }

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

    async uploadFile(file) {
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

    async deleteFile(fileId) {
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

    getFileView(fileId) {
        if (!fileId) return "";
        if (!conf.appwriteBucketId) {
            throw new Error("VITE_APPWRITE_BUCKET_ID is not configured.");
        }
        return this.bucket.getFileView(
            conf.appwriteBucketId,
            fileId,
        );
    }

    getAvatarPreview(fileId) {
        return this.getFilePreview(fileId);
    }

    getFilePreview(fileId) {
        if (!fileId) return "";
        if (!conf.appwriteBucketId) {
            throw new Error("VITE_APPWRITE_BUCKET_ID is not configured.");
        }
        return this.bucket.getFilePreview(
            conf.appwriteBucketId,
            fileId,
            256,
            256,
        );
    }
}

const service = new Service();
export default service;