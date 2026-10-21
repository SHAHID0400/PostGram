import { ID, Query } from "appwrite";
import authService from "../Appwrite/Auth";
import appwriteService from "../Appwrite/config";
import conf from "../conf/confi";
import { sanitizeText } from "./security";
import { dedupeProfiles } from "../utils/profileResolver";

const PAGE_SIZE = 100;

const uniqueIds = (...values) =>
  [...new Set(values.flat().filter((value) => typeof value === "string" && value.trim()))];

const dedupeDocuments = (documents) => {
  const uniqueDocuments = new Map();
  documents.forEach((document) => {
    if (document?.$id && !uniqueDocuments.has(document.$id)) {
      uniqueDocuments.set(document.$id, document);
    }
  });
  return [...uniqueDocuments.values()];
};

const listAllDocuments = async (collectionId, queries = []) => {
  const documents = [];
  let cursor = "";

  do {
    const page = await appwriteService.Databases.listDocuments(
      conf.appwriteDatabaseId,
      collectionId,
      [
        ...queries,
        Query.limit(PAGE_SIZE),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
    );
    const pageDocuments = page.documents || [];
    documents.push(...pageDocuments);
    cursor =
      pageDocuments.length === PAGE_SIZE
        ? pageDocuments.at(-1).$id
        : "";
  } while (cursor);

  return dedupeDocuments(documents);
};

const listAllDocumentsByValues = async (collectionId, attribute, values) => {
  const results = [];
  const uniqueValues = [...new Set(values.filter(Boolean))];

  for (let index = 0; index < uniqueValues.length; index += PAGE_SIZE) {
    results.push(
      ...(await listAllDocuments(collectionId, [
        Query.equal(attribute, uniqueValues.slice(index, index + PAGE_SIZE)),
      ])),
    );
  }

  return dedupeDocuments(results);
};

const deleteDocuments = async (collectionId, documents) => {
  const failures = [];
  const batchSize = 20;

  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize);
    const results = await Promise.allSettled(
      batch.map((document) =>
        appwriteService.Databases.deleteDocument(
          conf.appwriteDatabaseId,
          collectionId,
          document.$id,
        ),
      ),
    );

    results.forEach((result, batchIndex) => {
      if (result.status === "rejected") {
        failures.push({
          id: batch[batchIndex].$id,
          error: result.reason?.message || "Unknown Appwrite error",
        });
      }
    });
  }

  return failures;
};

const getProfileAvatarId = (profile) =>
  [profile?.avatarFileId, profile?.avatar, profile?.imageId]
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";

const isMissingStorageFile = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    Number(error?.code) === 404 ||
    /file[^.]*not found|file[^.]*could not be found|file[^.]*does not exist|not be found/.test(
      message,
    )
  );
};

const deleteStorageFileIfPresent = async (fileId) => {
  if (!fileId) return { deleted: false, missing: false };
  if (!conf.appwriteBucketId) {
    throw new Error("VITE_APPWRITE_BUCKET_ID is not configured.");
  }

  try {
    await appwriteService.bucket.deleteFile(conf.appwriteBucketId, fileId);
    return { deleted: true, missing: false };
  } catch (error) {
    if (!isMissingStorageFile(error)) throw error;

    console.warn(
      "Storage file already missing or previously purged:",
      fileId,
    );
    return { deleted: false, missing: true };
  }
};

const assertAdminSession = async () => {
  const account = await authService.getcurrentUser();
  if (!account?.labels?.includes("admin")) {
    throw new Error("An active Appwrite admin session is required.");
  }
  return account;
};

const mapProfile = (profile) => ({
  ...profile,
  userId: profile.userId || profile.$id,
  realName: profile.realName || profile.name || profile.displayName || "",
  email: profile.email || "",
  name: profile.name || profile.displayName || "",
  displayName: profile.displayName || profile.name || "",
  username: profile.username || "",
  bio: profile.bio || "",
  avatarFileId: profile.avatarFileId || profile.avatar || profile.imageId || "",
  labels: Array.isArray(profile.labels) ? profile.labels : [],
  profileId: profile.$id,
  registeredAt: profile.$createdAt || "",
});

const listUsers = async (payload) => {
  const page = await appwriteService.Databases.listDocuments(
    conf.appwriteDatabaseId,
    appwriteService.profilesCollectionId,
    [
      Query.orderDesc("$createdAt"),
      Query.limit(PAGE_SIZE),
      ...(payload.cursor ? [Query.cursorAfter(payload.cursor)] : []),
    ],
  );
  const users = dedupeProfiles((page.documents || []).map(mapProfile));
  return {
    users,
    total: page.total || 0,
    nextCursor:
      page.documents?.length === PAGE_SIZE
        ? page.documents.at(-1).$id
        : "",
  };
};

const getSummary = async () => {
  const [posts, comments] = await Promise.all([
    appwriteService.Databases.listDocuments(
      conf.appwriteDatabaseId,
      conf.appwriteCollectionId,
      [Query.limit(1)],
    ),
    appwriteService.Databases.listDocuments(
      conf.appwriteDatabaseId,
      conf.appwriteCommentsCollectionId,
      [Query.limit(1)],
    ),
  ]);

  const uniqueUserIds = new Set();
  let cursor = "";
  let page;
  do {
    page = await appwriteService.Databases.listDocuments(
      conf.appwriteDatabaseId,
      appwriteService.profilesCollectionId,
      [Query.limit(PAGE_SIZE), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    );
    (page.documents || []).forEach((profile) => {
      const userId = profile.userId || profile.$id;
      if (userId) uniqueUserIds.add(userId);
    });
    cursor =
      page.documents?.length === PAGE_SIZE
        ? page.documents.at(-1).$id
        : "";
  } while (cursor);

  return {
    totalUsers: uniqueUserIds.size,
    totalPosts: posts.total || 0,
    totalComments: comments.total || 0,
  };
};

const loadUserActivity = async (payload) => {
  const userIds = uniqueIds(
    payload.userId,
    payload.profileId,
    payload.documentId,
  );
  if (!userIds.length) throw new Error("Select a user before loading activity.");

  const kind = ["posts", "comments"].includes(payload.kind)
    ? payload.kind
    : "all";
  const queries = [
    Query.equal("userId", userIds),
    Query.orderDesc("$createdAt"),
    Query.limit(PAGE_SIZE),
    ...(payload.cursor ? [Query.cursorAfter(payload.cursor)] : []),
  ];
  const [postPage, commentPage] = await Promise.all([
    kind === "comments"
      ? Promise.resolve({ documents: [], total: 0 })
      : appwriteService.Databases.listDocuments(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionId,
          queries,
        ),
    kind === "posts"
      ? Promise.resolve({ documents: [], total: 0 })
      : appwriteService.Databases.listDocuments(
          conf.appwriteDatabaseId,
          appwriteService.commentsCollectionId,
          queries,
        ),
  ]);

  const comments = await Promise.all(
    (commentPage.documents || []).map(async (comment) => {
      try {
        const post = await appwriteService.Databases.getDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionId,
          comment.postId,
        );
        return {
          ...comment,
          postTitle: post.title || "",
          postSlug: post.slug || "",
          postFeaturedImage: post.featuredImage || "",
        };
      } catch {
        return {
          ...comment,
          postTitle: "Post unavailable",
          postSlug: "",
          postFeaturedImage: "",
        };
      }
    }),
  );

  const posts = postPage.documents || [];
  return {
    posts: dedupeDocuments(posts),
    totalPosts: postPage.total || 0,
    nextPostsCursor:
      posts.length === PAGE_SIZE ? posts.at(-1).$id : "",
    comments: dedupeDocuments(comments),
    totalComments: commentPage.total || 0,
    nextCommentsCursor:
      commentPage.documents?.length === PAGE_SIZE
        ? commentPage.documents.at(-1).$id
        : "",
  };
};

const updateProfile = async (payload) => {
  const userId = String(payload.userId || "");
  if (!userId) throw new Error("Select a user before saving profile changes.");
  const current = await appwriteService.getPreferredProfileDocument(userId);
  const data = {
    userId,
    displayName: sanitizeText(payload.displayName, 128),
    username: String(payload.username || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-zA-Z0-9._]/g, "")
      .slice(0, 36),
    bio: sanitizeText(payload.bio, 160),
    avatarFileId: String(payload.avatarFileId || "").trim().slice(0, 128),
  };
  if (current && Object.hasOwn(current, "name")) {
    data.name = data.displayName;
  }
  const profile = current
    ? await appwriteService.Databases.updateDocument(
        conf.appwriteDatabaseId,
        appwriteService.profilesCollectionId,
        current.$id,
        data,
      )
    : await appwriteService.Databases.createDocument(
        conf.appwriteDatabaseId,
        appwriteService.profilesCollectionId,
        ID.unique(),
        data,
      );
  return { profile };
};

const updatePost = async (payload) => {
  if (!["active", "hidden", "flagged"].includes(payload.status)) {
    throw new Error("Post status must be active, hidden, or flagged.");
  }
  const post = await appwriteService.Databases.updateDocument(
    conf.appwriteDatabaseId,
    conf.appwriteCollectionId,
    payload.postId,
    {
      title: sanitizeText(payload.title, 120),
      content: sanitizeText(payload.content, 20000),
      status: payload.status,
    },
  );
  return { post, audienceSupported: false };
};

const deletePost = async (payload) => {
  const post = await appwriteService.Databases.getDocument(
    conf.appwriteDatabaseId,
    conf.appwriteCollectionId,
    payload.postId,
  );
  let mediaIsShared = false;
  let mediaReferenceCheckUnavailable = false;
  if (post.featuredImage) {
    try {
      const [otherPosts, profiles] = await Promise.all([
        appwriteService.Databases.listDocuments(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionId,
          [
            Query.equal("featuredImage", post.featuredImage),
            Query.limit(2),
          ],
        ),
        appwriteService.Databases.listDocuments(
          conf.appwriteDatabaseId,
          appwriteService.profilesCollectionId,
          [Query.equal("avatarFileId", post.featuredImage), Query.limit(1)],
        ),
      ]);
      mediaIsShared =
        (otherPosts.documents || []).some((item) => item.$id !== post.$id) ||
        Boolean(profiles.documents?.length);
    } catch {
      mediaReferenceCheckUnavailable = true;
    }
  }
  await appwriteService.Databases.deleteDocument(
    conf.appwriteDatabaseId,
    conf.appwriteCollectionId,
    payload.postId,
  );
  let mediaDeleted = !post.featuredImage;
  let mediaMissing = false;
  if (post.featuredImage && !mediaIsShared && !mediaReferenceCheckUnavailable) {
    const result = await deleteStorageFileIfPresent(post.featuredImage);
    mediaDeleted = result.deleted || result.missing;
    mediaMissing = result.missing;
  }
  return {
    deleted: true,
    mediaDeleted,
    mediaMissing,
    mediaRetained: mediaIsShared || mediaReferenceCheckUnavailable,
  };
};

const deleteUser = async (payload, adminAccount) => {
  const userId = String(payload.userId || "").trim();
  const profileId = String(payload.profileId || "").trim();
  if (!userId || !profileId) {
    throw new Error("Both the selected user ID and profile document ID are required.");
  }
  if (adminAccount?.$id === userId) {
    throw new Error("You cannot delete the account you are currently using.");
  }

  const userIds = uniqueIds(userId, profileId);
  const [posts, authoredComments, profiles] = await Promise.all([
    listAllDocuments(
      conf.appwriteCollectionId,
      [Query.equal("userId", userIds)],
    ),
    listAllDocuments(
      appwriteService.commentsCollectionId,
      [Query.equal("userId", userIds)],
    ),
    listAllDocuments(
      appwriteService.profilesCollectionId,
      [Query.equal("userId", userIds)],
    ),
  ]);
  const commentsOnOwnedPosts = await listAllDocumentsByValues(
    appwriteService.commentsCollectionId,
    "postId",
    posts.map((post) => post.$id),
  );
  const comments = dedupeDocuments([
    ...authoredComments,
    ...commentsOnOwnedPosts,
  ]);

  const profileDocumentIds = new Set(profiles.map((profile) => profile.$id));
  if (!profileDocumentIds.has(profileId)) {
    const selectedProfile = await appwriteService.Databases.getDocument(
      conf.appwriteDatabaseId,
      appwriteService.profilesCollectionId,
      profileId,
    );
    if (
      selectedProfile.userId &&
      !userIds.includes(String(selectedProfile.userId))
    ) {
      throw new Error("The selected profile document does not belong to this user.");
    }
    profiles.push(selectedProfile);
    profileDocumentIds.add(selectedProfile.$id);
  }

  const mediaIds = new Set(
    [
      ...posts.map((post) => post.featuredImage),
      ...profiles.map(getProfileAvatarId),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );

  const commentFailures = await deleteDocuments(
    appwriteService.commentsCollectionId,
    comments,
  );
  const postFailures = await deleteDocuments(
    conf.appwriteCollectionId,
    posts,
  );
  if (commentFailures.length || postFailures.length) {
    const failedCount = commentFailures.length + postFailures.length;
    throw new Error(
      `Deletion stopped after partially removing user data: ${failedCount} comment/post document(s) could not be deleted. The profile was retained; retry after correcting Appwrite permissions or document errors.`,
    );
  }

  const profileFailures = await deleteDocuments(
    appwriteService.profilesCollectionId,
    [...profileDocumentIds].map(($id) => ({ $id })),
  );
  if (profileFailures.length) {
    throw new Error(
      `Posts and comments were deleted, but ${profileFailures.length} profile document(s) could not be deleted. Retry after correcting Appwrite permissions or document errors.`,
    );
  }

  const warnings = [];
  let missingMediaFiles = 0;
  if (mediaIds.size) {
    let remainingProfileMedia;
    try {
      const remainingProfiles = await listAllDocuments(
        appwriteService.profilesCollectionId,
      );
      remainingProfileMedia = new Set(
        remainingProfiles.map(getProfileAvatarId).filter(Boolean),
      );
    } catch (error) {
      warnings.push(
        `Media cleanup was skipped because shared-file references could not be checked: ${error?.message || "Appwrite query failed"}`,
      );
    }

    if (remainingProfileMedia) {
      for (const fileId of mediaIds) {
        let isStillReferenced;
        try {
          const remainingPosts = await appwriteService.Databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            [Query.equal("featuredImage", fileId), Query.limit(1)],
          );
          isStillReferenced =
            Boolean(remainingPosts.documents?.length) ||
            remainingProfileMedia.has(fileId);
        } catch (error) {
          warnings.push(
            `Media file ${fileId} was retained because shared references could not be checked: ${error?.message || "Appwrite query failed"}`,
          );
          continue;
        }
        if (isStillReferenced) continue;

        const result = await deleteStorageFileIfPresent(fileId);
        if (result.missing) missingMediaFiles += 1;
      }
    }
  }

  return {
    success: true,
    purged: true,
    deleted: true,
    deletedPosts: posts.length,
    deletedComments: comments.length,
    deletedProfiles: profileDocumentIds.size,
    missingMediaFiles,
    warnings,
  };
};

const uploadAvatar = async (payload) => {
  const encoded = String(payload.base64 || "");
  const mime = String(payload.mime || "");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) {
    throw new Error("Avatar image must be smaller than 3 MB.");
  }
  const validImage =
    (mime === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes.at(-2) === 0xff &&
      bytes.at(-1) === 0xd9) ||
    (mime === "image/png" &&
      bytes.subarray(0, 8).join(",") ===
        "137,80,78,71,13,10,26,10") ||
    (mime === "image/webp" &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP");
  if (!validImage) {
    throw new Error("The uploaded file does not match its image type.");
  }
  const file = new File(
    [bytes],
    `${payload.userId || "avatar"}.${mime.split("/")[1]}`,
    { type: mime },
  );
  const uploaded = await appwriteService.bucket.createFile(
    conf.appwriteBucketId,
    ID.unique(),
    file,
    ['read("any")'],
  );
  return { userId: payload.userId, fileId: uploaded.$id };
};

const directRequest = async (action, payload) => {
  const adminAccount = await assertAdminSession();
  switch (action) {
    case "summary":
      return getSummary();
    case "list-users":
      return listUsers(payload);
    case "user-activity":
      return loadUserActivity(payload);
    case "update-profile":
      return updateProfile(payload);
    case "update-post":
      return updatePost(payload);
    case "delete-post":
      return deletePost(payload);
    case "delete-user":
      return deleteUser(payload, adminAccount);
    case "update-comment": {
      const text = sanitizeText(payload.text, 2000);
      if (!text) throw new Error("Comment text cannot be empty.");
      const comment = await appwriteService.Databases.updateDocument(
        conf.appwriteDatabaseId,
        appwriteService.commentsCollectionId,
        payload.commentId,
        { text },
      );
      return { comment };
    }
    case "delete-comment":
      await appwriteService.Databases.deleteDocument(
        conf.appwriteDatabaseId,
        appwriteService.commentsCollectionId,
        payload.commentId,
      );
      return { deleted: true };
    case "upload-avatar":
      return uploadAvatar(payload);
    default:
      throw new Error(`Unsupported admin action: ${action}`);
  }
};

export const adminRequest = (action, payload = {}) =>
  directRequest(action, payload);

export const encodeImage = async (file) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () =>
      reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
  return { base64, mime: file.type };
};