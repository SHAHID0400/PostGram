import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import appwriteService from "../../Appwrite/config";
import usePostComments from "../../hooks/usePostComments";
import { sanitizeText } from "../../lib/security";
import { Avatar, avatarUrl, stripHtml, timeAgo } from "../dashboard/ui";

const ExplorePostModal = ({ post, user, authorProfile, onClose, onUpdate }) => {
  const [draft, setDraft] = useState("");
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState("");

  // The modal only owns local post state, so it persists embedded comments
  // itself when the dedicated collection is unavailable.
  const handleEmbeddedComment = async (targetPost, nextValue) => {
    onUpdate({ ...targetPost, comments: nextValue });

    try {
      await appwriteService.updatePostComments(targetPost.$id, nextValue);
    } catch (persistError) {
      onUpdate(targetPost);
      throw persistError;
    }
  };

  const {
    comments,
    count,
    supported: commentsSupported,
    submitting,
    error: commentError,
    clearError,
    submit,
    nameFor,
    usernameFor,
    avatarFor,
  } = usePostComments({
    post,
    user,
    onEmbeddedComment: handleEmbeddedComment,
  });

  const likesSupported = "likes" in post;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const liked = Boolean(user?.$id && likes.includes(user.$id));

  const isOwner = Boolean(user?.$id && post.userId === user.$id);
  const authorName =
    (isOwner && user?.name ? user.name : authorProfile?.name) || post.name;
  const authorUsername = isOwner
    ? String(user?.username || "").replace(/^@+/, "")
    : String(authorProfile?.username || "").replace(/^@+/, "");
  const authorAvatar = isOwner
    ? avatarUrl(user)
    : authorProfile?.avatarUrl ||
      (authorProfile?.avatarFileId
        ? appwriteService.getFileView(authorProfile.avatarFileId)
        : "");
  const caption = stripHtml(post.content) || stripHtml(post.title);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const toggleLike = async () => {
    if (!likesSupported || !user?.$id || liking) return;

    const next = liked
      ? likes.filter((id) => id !== user.$id)
      : [...likes, user.$id];

    setLiking(true);
    setLikeError("");
    onUpdate({ ...post, likes: next });

    try {
      await appwriteService.updatePostLikes(post.$id, next);
    } catch (likeFailure) {
      onUpdate({ ...post, likes });
      setLikeError("Couldn't save your like. Try again.");
    } finally {
      setLiking(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!draft.trim() || submitting || !user?.$id) return;

    const posted = await submit(sanitizeText(draft, 2000));
    if (posted) setDraft("");
  };

  const error = commentError || likeError;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 px-0 py-0 backdrop-blur-md sm:items-center sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label={post.title || "Moment"}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex min-h-screen w-full flex-col overflow-hidden bg-night-soft sm:min-h-0 sm:max-h-[90vh] sm:max-w-4xl sm:flex-row sm:rounded-3xl sm:border sm:border-white/10"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 sm:right-4 sm:top-4"
          aria-label="Close moment"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex shrink-0 items-center justify-center bg-black/60 sm:w-[58%]">
          {post.featuredImage ? (
            <img
              src={appwriteService.getFileView(post.featuredImage)}
              alt={post.title || "PostGram moment"}
              className="max-h-[55vh] w-full object-contain sm:max-h-[90vh]"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 p-8 text-center font-display text-xl font-semibold text-white">
              {post.title || "Moment"}
            </div>
          )}
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col sm:w-[42%]">
          <header className="flex items-center gap-3 border-b border-white/[0.07] p-4 pr-14">
            <span className="rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[2px]">
              <Avatar
                name={authorName}
                src={authorAvatar}
                size="md"
                className="ring-2 ring-night-soft"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-1.5 truncate text-sm font-semibold text-white">
                <span className="truncate">
                  {authorName || "PostGram creator"}
                </span>
                {authorUsername ? (
                  <span className="truncate text-[10px] font-normal text-slate-500">
                    @{authorUsername}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-slate-500">
                {timeAgo(post.$createdAt)}
                {post.location ? ` · ${post.location}` : ""}
              </p>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {caption ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
                {caption.split(/(#[a-zA-Z0-9_]+)/g).map((part, index) =>
                  part.startsWith("#") ? (
                    <span key={index} className="font-medium text-violet-300">
                      {part}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  ),
                )}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No caption on this moment.</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              {post.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </span>
              ) : null}
              {post.audience === "followers" ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Followers only
                </span>
              ) : null}
            </div>

            {commentsSupported ? (
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Comments ({count})
                </p>

                {comments.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {comments.map((comment) => (
                      <motion.li
                        key={comment.$id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5"
                      >
                        <Avatar
                          name={nameFor(comment)}
                          src={avatarFor(comment)}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-baseline gap-1.5 text-xs">
                            <span className="font-semibold text-white">
                              {nameFor(comment)}
                            </span>
                            {usernameFor(comment) ? (
                              <span className="text-[10px] text-slate-500">
                                @{usernameFor(comment)}
                              </span>
                            ) : null}
                            <span className="text-[10px] text-slate-500">
                              {comment.pending
                                ? "sending…"
                                : timeAgo(comment.$createdAt)}
                            </span>
                          </p>
                          <p
                            className={`break-words text-sm ${
                              comment.pending
                                ? "text-slate-400"
                                : "text-slate-300"
                            }`}
                          >
                            {comment.text}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    No comments yet. Start the conversation.
                  </p>
                )}
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-xs text-rose-300">{error}</p>
            ) : null}
          </div>

          <div className="border-t border-white/[0.07] p-3">
            <div className="mb-2 flex items-center gap-3 text-xs text-slate-400">
              {likesSupported ? (
                <motion.button
                  type="button"
                  onClick={toggleLike}
                  disabled={!user?.$id || liking}
                  whileTap={{ scale: 0.9 }}
                  aria-pressed={liked}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition ${
                    liked
                      ? "text-rose-400"
                      : "hover:bg-white/5 hover:text-rose-300"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      liked ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span className="tabular-nums">{likes.length}</span>
                </motion.button>
              ) : null}

              {commentsSupported ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="tabular-nums">{count}</span>
                </span>
              ) : null}

              <Link
                to={`/post/${post.$id}`}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Open full page
              </Link>
            </div>

            {commentsSupported ? (
              <form onSubmit={submitComment} className="flex items-center gap-2">
                <Avatar name={user?.name} src={avatarUrl(user)} size="sm" />
                <input
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (commentError) clearError();
                  }}
                  maxLength={2000}
                  placeholder="Add a comment…"
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || submitting}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Post comment"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {submitting ? "Posting" : "Post"}
                </button>
              </form>
            ) : (
              <p className="text-[11px] text-slate-500">
                Comments aren't available for this moment yet.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExplorePostModal;
