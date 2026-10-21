import { useCallback, useEffect, useMemo, useState } from "react";
import appwriteService from "../Appwrite/config";
import { useComments } from "../context/CommentsContext";
import { useProfiles } from "../context/ProfilesContext";
import { toUserMessage } from "../lib/errors";
import { sanitizeText } from "../lib/security";
import { avatarUrl, parseComments } from "../components/dashboard/ui";
import { getAvatarUrl } from "../utils/avatarHelper";

const EMBEDDED_LIMIT = 4800;
const MAX_COMMENT_LENGTH = 2000;
const MAX_EMBEDDED_COMMENT = 500;

const embeddedId = (entry, index) =>
  `legacy-${entry?.createdAt || "unknown"}-${index}-${String(
    entry?.text || entry || "",
  ).slice(0, 24)}`;

/**
 * Turns the legacy embedded comment payload into the same shape the comments
 * collection returns, so both can be rendered by one list.
 */
const normalizeEmbeddedComment = (entry, index) => {
  if (typeof entry === "string") {
    return {
      $id: embeddedId(entry, index),
      userId: "",
      text: entry,
      userDisplayName: "",
      userAvatarFileId: "",
      $createdAt: "",
      legacy: true,
    };
  }

  return {
    $id: embeddedId(entry, index),
    userId: entry?.id || entry?.userId || "",
    text: entry?.text || "",
    userDisplayName: entry?.name || entry?.userDisplayName || "",
    userAvatarFileId: entry?.avatarFileId || "",
    $createdAt: entry?.createdAt || "",
    legacy: true,
  };
};

const timeValue = (comment) => {
  const parsed = new Date(comment?.$createdAt || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * One comments engine shared by feed cards and the explore/post modal.
 *
 * Comments live in the `comments` collection and stream in over Appwrite
 * Realtime. Posts written before that collection existed still carry an
 * embedded `comments` value; both are merged here. If the collection cannot
 * be reached, submitting falls back to the embedded post attribute.
 */
const usePostComments = ({ post, user, onEmbeddedComment }) => {
  const { supported, ensureComments, getComments, addOptimisticComment, replaceComment, removeComment } =
    useComments();
  const { profiles, ensureProfiles } = useProfiles();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const postId = post?.$id || "";
  const legacySupported = Boolean(post && "comments" in post);
  const remoteSupported = supported !== false;
  const commentsSupported = remoteSupported || legacySupported;

  useEffect(() => {
    if (postId && remoteSupported) ensureComments([postId]);
  }, [postId, remoteSupported, ensureComments]);

  const remoteComments = getComments(postId);

  const legacyComments = useMemo(
    () => parseComments(post?.comments).map(normalizeEmbeddedComment),
    [post?.comments],
  );

  const comments = useMemo(() => {
    const merged = [...remoteComments, ...legacyComments].filter(
      (comment) => comment && comment.text,
    );

    return merged.sort((a, b) => timeValue(b) - timeValue(a));
  }, [remoteComments, legacyComments]);

  const commenterKey = useMemo(
    () =>
      [
        ...new Set(comments.map((comment) => comment.userId).filter(Boolean)),
      ].join("|"),
    [comments],
  );

  useEffect(() => {
    if (!commenterKey) return;
    ensureProfiles(commenterKey.split("|"));
  }, [commenterKey, ensureProfiles]);

  const commenterProfile = useCallback(
    (comment) => {
      if (comment?.userId && profiles[comment.userId]) {
        return profiles[comment.userId];
      }
      return null;
    },
    [profiles],
  );

  const nameFor = useCallback(
    (comment) => {
      if (comment?.userId && user?.$id === comment.userId && user?.name) {
        return user.name;
      }
      const profile = commenterProfile(comment);
      return (
        profile?.name ||
        comment?.userDisplayName ||
        "PostGram creator"
      );
    },
    [commenterProfile, user],
  );

  const usernameFor = useCallback(
    (comment) => {
      if (comment?.userId && user?.$id === comment.userId && user?.username) {
        return String(user.username).replace(/^@+/, "");
      }
      const profile = commenterProfile(comment);
      return String(profile?.username || "").replace(/^@+/, "");
    },
    [commenterProfile, user],
  );

  const avatarFor = useCallback(
    (comment) => {
      if (comment?.userId && user?.$id === comment.userId) {
        return avatarUrl(user);
      }

      const profile = commenterProfile(comment);
      if (profile?.avatarUrl) return profile.avatarUrl;

      const fileId = profile?.avatarFileId || comment?.userAvatarFileId;
      return getAvatarUrl({ avatarFileId: fileId });
    },
    [commenterProfile, user],
  );

  const submit = useCallback(
    async (rawText) => {
      const text = sanitizeText(rawText, MAX_COMMENT_LENGTH);
      if (!user?.$id || !postId || submitting) return false;
      if (!text) {
        setError("Write something before posting.");
        return false;
      }

      setSubmitting(true);
      setError("");

      const temporaryId = `pending-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      if (remoteSupported) {
        addOptimisticComment(postId, {
          $id: temporaryId,
          userId: user.$id,
          text,
          userDisplayName: user.name || "",
          userAvatarFileId: user.avatarFileId || "",
          $createdAt: new Date().toISOString(),
        });
      }

      try {
        if (remoteSupported) {
          try {
            const result = await appwriteService.createComment({
              postId,
              user,
              text,
            });
            replaceComment(postId, temporaryId, result.comment);
            return true;
          } catch (createError) {
            // Only a missing collection falls back to the post attribute;
            // permission or validation failures deserve a real error message.
            if (!createError?.commentsUnavailable || !legacySupported) {
              throw createError;
            }
            removeComment(postId, temporaryId);
          }
        }

        if (!legacySupported || typeof onEmbeddedComment !== "function") {
          throw new Error("Comments aren't available right now.");
        }

        const entry = {
          id: user.$id,
          name: user.name || "Creator",
          text: sanitizeText(text, MAX_EMBEDDED_COMMENT),
          createdAt: new Date().toISOString(),
        };

        let nextValue;

        if (Array.isArray(post.comments)) {
          nextValue = [...post.comments, `${entry.name}: ${entry.text}`];
        } else {
          nextValue = JSON.stringify([...parseComments(post.comments), entry]);
          if (nextValue.length > EMBEDDED_LIMIT) {
            throw new Error("This moment has reached its comment limit.");
          }
        }

        await onEmbeddedComment(post, nextValue);
        return true;
      } catch (submitError) {
        if (remoteSupported) removeComment(postId, temporaryId);
        setError(toUserMessage(submitError, "Couldn't post your comment."));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      addOptimisticComment,
      legacySupported,
      onEmbeddedComment,
      post,
      postId,
      remoteSupported,
      removeComment,
      replaceComment,
      submitting,
      user,
    ],
  );

  return {
    comments,
    count: comments.length,
    supported: commentsSupported,
    submitting,
    error,
    clearError: () => setError(""),
    submit,
    nameFor,
    usernameFor,
    avatarFor,
  };
};

export default usePostComments;
