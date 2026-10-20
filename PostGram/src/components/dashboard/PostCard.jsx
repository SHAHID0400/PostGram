import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Lock, MapPin, MessageCircle, Send, Trash2 } from "lucide-react";
import appwriteService from "../../Appwrite/config";
import { toUserMessage } from "../../lib/errors";
import { sanitizeText } from "../../lib/security";
import { Avatar, avatarUrl, parseComments, stripHtml, timeAgo } from "./ui";

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

const PostCard = ({ post, user, onLike, onComment, onDelete }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const likesSupported = Array.isArray(post.likes) || "likes" in post;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const liked = Boolean(user?.$id && likes.includes(user.$id));

  const commentsSupported = "comments" in post;
  const comments = commentsSupported ? parseComments(post.comments) : [];

  const isOwner = Boolean(user?.$id && post.userId === user.$id);
  const authorName = isOwner && user?.name ? user.name : post.name;
  const authorAvatar = isOwner ? avatarUrl(user) : "";
  const imageUrl = post.featuredImage
    ? appwriteService.getFileView(post.featuredImage)
    : "";
  const caption = stripHtml(post.content) || stripHtml(post.title);

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      setBurst((value) => value + 1);
      if (likesSupported && user?.$id && !liked) {
        onLike(post, [...likes, user.$id]);
      }
      return;
    }
    lastTap.current = now;
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || submitting || !user) return;

    setSubmitting(true);
    setCommentError("");

    try {
      const entry = {
        id: user.$id,
        name: user.name || "Creator",
        text: sanitizeText(text, 500),
        createdAt: new Date().toISOString(),
      };

      if (Array.isArray(post.comments)) {
        await onComment(post, [...post.comments, `${entry.name}: ${entry.text}`]);
      } else {
        const next = JSON.stringify([...parseComments(post.comments), entry]);
        if (next.length > 4800) {
          throw new Error("This moment has reached its comment limit.");
        }
        await onComment(post, next);
      }

      setDraft("");
    } catch (error) {
      setCommentError(toUserMessage(error, "Couldn't post your comment."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl border border-white/[0.07] bg-night-soft/80 backdrop-blur-xl"
    >
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
          <p className="truncate text-sm font-semibold text-white">
            {authorName || "PostGram creator"}
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

      <div
        onPointerUp={handleMediaTap}
        className="relative select-none bg-black/50"
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

        {burst > 0 ? (
          <motion.span
            key={burst}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-hidden="true"
          >
            <Heart className="h-20 w-20 fill-white text-white drop-shadow-[0_12px_36px_rgba(236,72,153,0.95)]" />
          </motion.span>
        ) : null}
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center gap-1">
          {likesSupported ? (
            <button
              type="button"
              onClick={() =>
                user?.$id &&
                onLike(
                  post,
                  liked
                    ? likes.filter((id) => id !== user.$id)
                    : [...likes, user.$id],
                )
              }
              aria-pressed={liked}
              aria-label={liked ? "Unlike moment" : "Like moment"}
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm transition ${
                liked
                  ? "text-rose-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <motion.span
                animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-rose-400" : ""}`} />
              </motion.span>
              <span className="tabular-nums">{likes.length}</span>
            </button>
          ) : null}

          {commentsSupported ? (
            <button
              type="button"
              onClick={() => setCommentsOpen((value) => !value)}
              aria-expanded={commentsOpen}
              className="inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="tabular-nums">{comments.length}</span>
            </button>
          ) : null}

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

        {commentsSupported && commentsOpen ? (
          <div className="mt-4 border-t border-white/[0.07] pt-4">
            {comments.length > 0 ? (
              <ul className="max-h-56 space-y-3 overflow-y-auto pr-1">
                {comments.map((comment, index) => {
                  const entry =
                    typeof comment === "string"
                      ? { name: "", text: comment }
                      : comment;
                  return (
                    <li key={`${post.$id}-comment-${index}`} className="flex gap-2.5">
                      <Avatar
                        name={entry?.name || "Creator"}
                        src={
                          entry?.id && entry.id === user?.$id
                            ? avatarUrl(user)
                            : ""
                        }
                        size="sm"
                      />
                      <div className="min-w-0">
                        {entry?.name ? (
                          <p className="text-xs font-semibold text-white">
                            {entry.name}
                          </p>
                        ) : null}
                        <p className="break-words text-sm text-slate-300">
                          {entry?.text || ""}
                        </p>
                        {entry?.createdAt ? (
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {timeAgo(entry.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                No comments yet. Start the conversation.
              </p>
            )}

            <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
              <Avatar name={user?.name} src={avatarUrl(user)} size="sm" />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                placeholder="Add a comment…"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || submitting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {commentError ? (
              <p className="mt-2 text-xs text-rose-300">{commentError}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
};

export default PostCard;
