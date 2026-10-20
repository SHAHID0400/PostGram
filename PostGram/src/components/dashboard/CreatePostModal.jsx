import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import appwriteService from "../../Appwrite/config";
import { toUserMessage } from "../../lib/errors";
import { Avatar, avatarUrl } from "./ui";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CAPTION = 1000;

const CreatePostModal = ({ user, onClose, onCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, submitting]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (selected) => {
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("That image is larger than 10 MB. Try a smaller one.");
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || submitting || !user) return;

    setSubmitting(true);
    setError("");

    try {
      const post = await appwriteService.createMoment({
        file,
        caption,
        user,
      });
      onCreated(post);
      onClose();
    } catch (err) {
      setError(
        toUserMessage(
          err,
          "We couldn't publish your moment. Please check your connection and try again.",
        ),
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-moment-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md sm:items-center sm:py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d16] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-violet-500/20 to-cyan-400/20 text-violet-200 ring-1 ring-white/10">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="create-moment-title"
                className="font-display text-base font-semibold text-white"
              >
                Create a moment
              </h2>
              <p className="text-[11px] text-slate-500">
                Shared straight to your real PostGram feed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Close composer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} src={avatarUrl(user)} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "PostGram creator"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => pickFile(event.target.files?.[0])}
          />

          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <img
                src={preview}
                alt="Selected upload preview"
                className="max-h-72 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={submitting}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black disabled:opacity-40"
                aria-label="Remove selected image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition ${
                dragging
                  ? "border-violet-400/70 bg-violet-500/10"
                  : "border-white/15 bg-white/[0.03] hover:border-violet-400/40 hover:bg-white/5"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-violet-200">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-white">
                Choose an image or drop it here
              </span>
              <span className="text-[11px] text-slate-500">
                JPG, PNG, WEBP or GIF · up to 10 MB
              </span>
            </button>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="moment-caption"
                className="text-xs font-medium text-slate-300"
              >
                Caption
              </label>
              <span className="text-[11px] tabular-nums text-slate-500">
                {caption.length}/{MAX_CAPTION}
              </span>
            </div>
            <textarea
              id="moment-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={MAX_CAPTION}
              rows={3}
              placeholder="What's the story behind this moment? Add #hashtags."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_36px_-12px_rgba(168,85,247,0.9)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                "Publish moment"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
