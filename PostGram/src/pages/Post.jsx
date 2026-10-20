import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import { useProfiles } from "../context/ProfilesContext";
import { useComments } from "../context/CommentsContext";
import useRealtimeFeed from "../hooks/useRealtimeFeed";
import {
  Avatar,
  ConfirmDialog,
  avatarUrl,
  parseComments,
  stripHtml,
  timeAgo,
} from "../components/dashboard/ui";

const Post = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);
  const { profiles, ensureProfiles } = useProfiles();
  const {
    supported: commentsCollectionSupported,
    ensureComments,
    getComments,
  } = useComments();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  const isOwner = Boolean(post && userData && post.userId === userData.$id);
  const likesSupported = Boolean(post && "likes" in post);
  const commentsSupported = Boolean(
    post && (commentsCollectionSupported !== false || "comments" in post),
  );
  const commentCount = post
    ? (commentsCollectionSupported === false ? 0 : getComments(post.$id).length) +
      parseComments(post.comments).length
    : 0;
  const caption = stripHtml(post?.content) || stripHtml(post?.title);

  useEffect(() => {
    if (post?.$id && commentsCollectionSupported !== false) {
      ensureComments([post.$id]);
    }
  }, [post?.$id, commentsCollectionSupported, ensureComments]);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      navigate("/explore", { replace: true });
      return undefined;
    }

    setLoading(true);
    appwriteService
      .getPost(slug)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          navigate("/explore", { replace: true });
          return;
        }
        setPost(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (post?.userId) ensureProfiles([post.userId]);
  }, [post?.userId, ensureProfiles]);

  // Likes, comment counts, edits and deletion reach this view live.
  useRealtimeFeed(({ document, events }) => {
    if (!post || document.$id !== post.$id) return;

    if (events.some((event) => event.endsWith(".delete"))) {
      navigate("/explore", { replace: true });
      return;
    }

    setPost((current) =>
      current?.$id === document.$id ? { ...current, ...document } : current,
    );
  });

  const authorProfile = post?.userId ? profiles[post.userId] : null;
  const authorName =
    (isOwner && userData?.name ? userData.name : authorProfile?.name) ||
    post?.name ||
    "PostGram creator";
  const authorAvatar = isOwner
    ? avatarUrl(userData)
    : authorProfile?.avatarUrl ||
      (authorProfile?.avatarFileId
        ? appwriteService.getFileView(authorProfile.avatarFileId)
        : "");

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleDelete = async () => {
    if (!post || deleting) return;

    setDeleting(true);
    try {
      const deleted = await appwriteService.deletePost(post.$id);
      if (deleted === false) throw new Error("Delete failed");

      if (post.featuredImage) {
        appwriteService.deleteFile(post.featuredImage).catch(() => {});
      }

      navigate("/dashboard", { replace: true });
    } catch (deleteError) {
      setToast("Couldn't delete this moment. Please try again.");
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-pulse space-y-4 py-8">
        <div className="h-8 w-40 rounded-full bg-white/5" />
        <div className="h-80 rounded-3xl bg-white/5" />
        <div className="h-4 w-2/3 rounded-full bg-white/5" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-2xl py-8"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to feed
        </Link>

        {isOwner ? (
          <div className="flex items-center gap-2">
            <Link
              to={`/edit-post/${post.$id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <article className="mt-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-night-soft/80 backdrop-blur-xl">
        <header className="flex items-center gap-3 p-4">
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
              {authorName}
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
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Lock className="h-3 w-3" />
                    Followers
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </header>

        {post.featuredImage ? (
          <div className="bg-black/50">
            <img
              src={appwriteService.getFileView(post.featuredImage)}
              alt={post.title || "PostGram moment"}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        ) : null}

        <div className="p-5">
          <div
            className={`flex items-center gap-4 ${
              likesSupported || commentsSupported ? "" : "hidden"
            }`}
          >
            {likesSupported ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Heart className="h-4 w-4" />
                {Array.isArray(post.likes) ? post.likes.length : 0}
              </span>
            ) : null}
            {commentsSupported ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <MessageCircle className="h-4 w-4" />
                {commentCount}
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {post.title || "Untitled moment"}
          </h1>

          {caption ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {caption}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              This moment doesn't have a caption.
            </p>
          )}
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        loading={deleting}
        title="Delete this moment?"
        description="This removes the post and its photo permanently. This can't be undone."
        confirmLabel="Delete moment"
        onCancel={() => !deleting && setConfirmOpen(false)}
        onConfirm={handleDelete}
      />

      {toast ? (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0d1120] px-4 py-2.5 text-xs font-medium text-slate-200 shadow-xl"
        >
          {toast}
        </p>
      ) : null}
    </motion.div>
  );
};

export default Post;
