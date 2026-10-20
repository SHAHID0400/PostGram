import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import appwriteService from "../../Appwrite/config";
import usePostComments from "../../hooks/usePostComments";
import { sanitizeText } from "../../lib/security";
import { Avatar, avatarUrl, stripHtml, timeAgo } from "./ui";

const renderCaption = (caption) =>
  caption.split(/(#[a-zA-Z0-9_]+)/g).map((part, index) =>
    part.startsWith("#") ? (
      <span key={index} className="font-medium text-violet-300">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );

const PostCard = ({ post, user, authorProfile, onLike, onComment, onDelete }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const inputRef = useRef(null);

  // Comments hook integration
  const {
    comments = [],
    count = 0,
    submitting = false,
    error: commentError,
    clearError,
    submit,
    nameFor,
    usernameFor,
    avatarFor,
  } = usePostComments({
    post,
    user,
    onEmbeddedComment: onComment,
  });

  // Local optimistic state for likes
  const [localLikes, setLocalLikes] = useState(
    Array.isArray(post.likes) ? post.likes : []
  );

  const likes = Array.isArray(post.likes) ? post.likes : localLikes;
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
  const imageUrl = post.featuredImage
    ? appwriteService.getFileView(post.featuredImage)
    : "";
  const caption = stripHtml(post.content) || stripHtml(post.title);

  const toggleLike = () => {
    if (!user?.$id) return;

    const nextLikes = liked
      ? likes.filter((id) => id !== user.$id)
      : [...likes, user.$id];

    setLocalLikes(nextLikes);

    if (onLike) {
      onLike(post, nextLikes);
    }
  };

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      setBurst((value) => value + 1);
      if (user?.$id && !liked) {
        toggleLike();
      }
      return;
    }
    lastTap.current = now;
  };

  const focusComposer = () => {
    setCommentsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!draft.trim() || submitting) return;

    if (submit) {
      const posted = await submit(sanitizeText(draft, 2000));
      if (posted) setDraft("");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-white/[0.07] bg-night-soft/80 backdrop-blur-xl mb-6 shadow-xl"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3.5">
        <span className="rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[2px]">
          <Avatar
            name={authorName}
            src={authorAvatar}
            size="md"
            className="ring-2 ring-night-soft"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-baseline gap-1.5 truncate text-sm font-semibold text-white">
            <span className="truncate">
              {authorName || "PostGram creator"}
            </span>
            {authorUsername ? (
              <span className="truncate text-[11px] font-normal text-slate-400">
                @{authorUsername}
              </span>
            ) : null}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>{timeAgo(post.$createdAt)}</span>
            {post.location ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{post.location}</span>
                </span>
              </>
            ) : null}
            {post.audience === "followers" ? (
              <>
                <span className="text-slate-600">·</span>
                <span
                  className="inline-flex items-center gap-1 text-slate-400"
                  title="Followers only"
                >
                  <Lock className="h-3 w-3" />
                  Followers
                </span>
              </>
            ) : null}
          </p>
        </div>
        {isOwner && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(post)}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
            aria-label="Delete this moment"
            title="Delete moment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {/* Post Image Container */}
      <div
        onPointerUp={handleMediaTap}
        className="relative select-none bg-black/50 cursor-pointer"
      >
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={post.title || "PostGram moment"}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="max-h-[560px] w-full object-cover"
          />
        ) : (
          <div className="grid min-h-56 place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-white">
              {post.title || "Moment"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {burst > 0 ? (
            <motion.span
              key={burst}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{
                scale: [0.3, 1.35, 1],
                opacity: [0, 1, 1],
                rotate: [0, -8, 0],
              }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.55, 1],
              }}
              onAnimationComplete={() => setBurst(0)}
              className="pointer-events-none absolute inset-0 grid place-items-center"
              aria-hidden="true"
            >
              <Heart className="h-24 w-24 fill-rose-500 text-rose-500 drop-shadow-[0_12px_40px_rgba(244,63,94,0.85)]" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Action Bar (Like, Comment, Link) */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={toggleLike}
            whileTap={{ scale: 0.85 }}
            aria-pressed={liked}
            aria-label={liked ? "Unlike moment" : "Like moment"}
            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm transition ${
              liked
                ? "text-rose-400"
                : "text-slate-400 hover:bg-white/5 hover:text-rose-300"
            }`}
          >
            <motion.span
              animate={liked ? { scale: [1, 1.3, 1.1] } : { scale: 1 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="grid place-items-center"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  liked ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </motion.span>
            <span className="tabular-nums font-semibold">{likes.length}</span>
          </motion.button>

          <button
            type="button"
            onClick={() => setCommentsOpen((value) => !value)}
            aria-expanded={commentsOpen}
            className="inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="tabular-nums font-semibold">{count}</span>
          </button>

          <Link
            to={`/post/${post.$id}`}
            className="ml-auto rounded-full px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            View moment
          </Link>
        </div>

        {caption ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {renderCaption(caption)}
          </p>
        ) : null}

        {/* Comment Drawer Trigger */}
        <button
          type="button"
          onClick={focusComposer}
          className="mt-3 flex w-full items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-left text-xs text-slate-500 transition hover:border-violet-400/30 hover:text-slate-300"
        >
          <Avatar name={user?.name} src={avatarUrl(user)} size="sm" />
          <span className="truncate">
            {count > 0
              ? `View all ${count} comment${count === 1 ? "" : "s"}`
              : "Add a comment…"}
          </span>
        </button>

        {/* Comments Drawer */}
        <AnimatePresence initial={false}>
          {commentsOpen ? (
            <motion.div
              key="comment-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                {comments.length > 0 ? (
                  <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <motion.li
                        key={comment.$id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2.5"
                      >
                        <Avatar
                          name={nameFor ? nameFor(comment) : comment.userDisplayName}
                          src={avatarFor ? avatarFor(comment) : ""}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-baseline gap-1.5 text-xs">
                            <span className="font-semibold text-white">
                              {nameFor ? nameFor(comment) : (comment.userDisplayName || "Member")}
                            </span>
                            {usernameFor && usernameFor(comment) ? (
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
                  <p className="text-xs text-slate-500">
                    No comments yet. Start the conversation.
                  </p>
                )}

                <form
                  onSubmit={submitComment}
                  className="mt-3 flex items-center gap-2"
                >
                  <Avatar name={user?.name} src={avatarUrl(user)} size="sm" />
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (commentError && clearError) clearError();
                    }}
                    maxLength={2000}
                    placeholder="Add a comment…"
                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none"
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
                {commentError ? (
                  <p className="mt-2 text-xs text-rose-300">{commentError}</p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

export default PostCard;