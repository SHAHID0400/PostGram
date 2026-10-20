import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import appwriteService from "../Appwrite/config";

const CommentsContext = createContext(null);

const EMPTY_COMMENTS = {};

const sortNewestFirst = (list = []) =>
  [...list].sort((a, b) =>
    String(b?.$createdAt || "").localeCompare(String(a?.$createdAt || "")),
  );

const normalizeCommentDoc = (document = {}) => ({
  $id: document.$id || "",
  postId: document.postId || "",
  userId: document.userId || "",
  text: document.text || "",
  userDisplayName: document.userDisplayName || document.displayName || "",
  userAvatarFileId:
    document.userAvatarFileId || document.avatarFileId || "",
  $createdAt: document.$createdAt || new Date().toISOString(),
  pending: false,
});

/**
 * Global comment store backed by the `comments` collection and its realtime
 * stream. Every post card and modal reads from this map, so a comment created
 * by any viewer appears in the feed without a refresh.
 */
export const CommentsProvider = ({ children }) => {
  const [commentsByPost, setCommentsByPost] = useState(EMPTY_COMMENTS);
  const [supported, setSupported] = useState(null);

  const loadedRef = useRef(new Set());
  const pendingRef = useRef(new Set());
  const queueRef = useRef(new Set());
  const timerRef = useRef(null);

  const writePostComments = useCallback((postId, updater) => {
    if (!postId) return;

    setCommentsByPost((current) => {
      const existing = current[postId] || [];
      const next = updater(existing);

      if (next === existing) return current;

      return { ...current, [postId]: next };
    });
  }, []);

  /**
   * A feed mounts many cards in one commit. Their effects all call
   * ensureComments in the same tick, so ids are queued and fetched together
   * instead of firing one query per card.
   */
  const flushQueue = useCallback(() => {
    timerRef.current = null;

    const ids = [...queueRef.current].filter(
      (postId) =>
        !loadedRef.current.has(postId) && !pendingRef.current.has(postId),
    );
    queueRef.current.clear();

    if (ids.length === 0) return;

    ids.forEach((postId) => pendingRef.current.add(postId));

    (async () => {
      try {
        const result = await appwriteService.listCommentsForPosts(ids);
        const fetched = result?.comments || {};

        ids.forEach((postId) => loadedRef.current.add(postId));
        setSupported((current) => result?.supported ?? current);

        setCommentsByPost((current) => {
          const next = { ...current };

          ids.forEach((postId) => {
            const remote = (fetched[postId] || []).map(normalizeCommentDoc);
            const local = current[postId] || [];

            // Keep optimistic rows that have not reached the socket yet, plus
            // any realtime comment that landed while this fetch was in flight.
            const localOnly = local.filter(
              (comment) => !remote.some((doc) => doc.$id === comment.$id),
            );

            next[postId] = sortNewestFirst([...localOnly, ...remote]);
          });

          return next;
        });
      } catch (error) {
        // The ids stay unloaded so the next render pass can retry.
      } finally {
        ids.forEach((postId) => pendingRef.current.delete(postId));
      }
    })();
  }, []);

  const ensureComments = useCallback(
    (postIds = []) => {
      const unique = [
        ...new Set(
          (Array.isArray(postIds) ? postIds : [postIds])
            .filter(Boolean)
            .map(String),
        ),
      ];

      let queued = false;

      unique.forEach((postId) => {
        if (
          loadedRef.current.has(postId) ||
          pendingRef.current.has(postId) ||
          queueRef.current.has(postId)
        ) {
          return;
        }
        queueRef.current.add(postId);
        queued = true;
      });

      if (!queued) return;

      if (!timerRef.current) {
        timerRef.current = setTimeout(flushQueue, 16);
      }
    },
    [flushQueue],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const addOptimisticComment = useCallback(
    (postId, comment) => {
      if (!postId) return;

      loadedRef.current.add(postId);
      writePostComments(postId, (existing) => [
        { ...comment, postId, pending: true },
        ...existing,
      ]);
    },
    [writePostComments],
  );

  const replaceComment = useCallback(
    (postId, temporaryId, comment) => {
      writePostComments(postId, (existing) => {
        if (!comment?.$id) {
          return existing.filter((row) => row.$id !== temporaryId);
        }

        const normalized = normalizeCommentDoc({ ...comment, postId });
        const withoutTemp = existing.filter((row) => row.$id !== temporaryId);
        const withoutDuplicate = withoutTemp.filter(
          (row) => row.$id !== normalized.$id,
        );

        return sortNewestFirst([normalized, ...withoutDuplicate]);
      });
    },
    [writePostComments],
  );

  const removeComment = useCallback(
    (postId, commentId) => {
      writePostComments(postId, (existing) =>
        existing.some((row) => row.$id === commentId)
          ? existing.filter((row) => row.$id !== commentId)
          : existing,
      );
    },
    [writePostComments],
  );

  // Realtime: comments created, edited or deleted anywhere reach every client.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let active = true;
    let cleanup = null;

    const handleEvent = (response) => {
      const document = response?.payload;
      const postId = document?.postId;

      if (!postId || !document?.$id) return;

      const events = response?.events || [];
      const isDelete = events.some((event) => event.endsWith(".delete"));

      if (isDelete) {
        removeComment(postId, document.$id);
        return;
      }

      const normalized = normalizeCommentDoc(document);

      writePostComments(postId, (existing) => {
        const withoutDuplicate = existing.filter(
          (row) => row.$id !== normalized.$id,
        );
        return sortNewestFirst([normalized, ...withoutDuplicate]);
      });
    };

    try {
      const subscription = appwriteService.subscribeToComments(handleEvent);

      if (typeof subscription === "function") {
        cleanup = subscription;
      } else if (subscription && typeof subscription.then === "function") {
        subscription
          .then((stop) => {
            if (!active) {
              if (typeof stop === "function") stop();
              return;
            }
            if (typeof stop === "function") cleanup = stop;
          })
          .catch(() => {
            // Realtime is optional; comments still load over HTTP.
          });
      }
    } catch (subscriptionError) {
      // Realtime is optional; comments still load over HTTP.
    }

    return () => {
      active = false;
      try {
        cleanup?.();
      } catch (cleanupError) {
        // The socket is already closed.
      }
    };
  }, [removeComment, writePostComments]);

  const getComments = useCallback(
    (postId) => (postId ? commentsByPost[postId] || [] : []),
    [commentsByPost],
  );

  const value = useMemo(
    () => ({
      commentsByPost,
      supported,
      ensureComments,
      getComments,
      addOptimisticComment,
      replaceComment,
      removeComment,
    }),
    [
      commentsByPost,
      supported,
      ensureComments,
      getComments,
      addOptimisticComment,
      replaceComment,
      removeComment,
    ],
  );

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);

  if (!context) {
    throw new Error("useComments must be used inside a CommentsProvider.");
  }

  return context;
};

export default CommentsContext;
