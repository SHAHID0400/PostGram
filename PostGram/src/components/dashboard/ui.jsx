import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatarHelper";

export const timeAgo = (value) => {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const stripHtml = (html = "") =>
  String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const parseComments = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getInitials = (name = "") => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "PG";
};

export const avatarUrl = (user) => getAvatarUrl(user);

const SIZES = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-2xl",
};

export const Avatar = ({ name, src, size = "md", className = "" }) => {
  const [failedSrc, setFailedSrc] = useState("");
  const imageSrc =
    typeof src === "string"
      ? src.trim()
      : typeof URL !== "undefined" && src instanceof URL
        ? src.toString()
        : "";
  const isSupportedSrc =
    /^(https?:\/\/|blob:|data:image\/)/i.test(imageSrc) ||
    imageSrc.startsWith("/");

  const showImage = isSupportedSrc && failedSrc !== imageSrc;

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 font-semibold text-white ring-1 ring-white/15 ${SIZES[size] ?? SIZES.md} ${className}`}
      aria-hidden={!name}
    >
      {showImage ? (
        <img
          src={imageSrc}
          alt={name || "Creator avatar"}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </span>
  );
};

export const FeedSkeleton = () => (
  <div className="space-y-5" aria-hidden="true">
    {[0, 1, 2].map((item) => (
      <div
        key={item}
        className="overflow-hidden rounded-3xl border border-white/[0.07] bg-night-soft/70"
      >
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>
        <div className="h-64 animate-pulse bg-white/4" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/6" />
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
    ))}
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-3" aria-hidden="true">
    {[0, 1, 2].map((item) => (
      <div key={item} className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.07]" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/[0.07]" />
          <div className="h-2 w-16 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({
  title = "No posts yet",
  description = "Be the first creator to share a moment!",
  onCreate,
  actionLabel = "Create Post",
}) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-night-soft/70 p-10 text-center backdrop-blur-xl">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),transparent_65%)] blur-2xl"
    />
    <div className="relative">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200">
        <Camera className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        {description}
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-12px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-[1.02]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </div>
);

export const ConfirmDialog = ({
  open,
  title = "Delete this moment?",
  description = "This removes the post and its photo permanently. This can't be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onCancel?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 grid place-items-center bg-black/70 px-4 backdrop-blur-md"
          onClick={() => !loading && onCancel?.()}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-night-soft p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,1)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-300">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2
              id="confirm-title"
              className="mt-4 font-display text-lg font-semibold text-white"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              {description}
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {loading ? "Deleting…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
