import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ImagePlus,
  Loader2,
  Save,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import { toUserMessage } from "../lib/errors";

const MAX_TITLE = 120;
const MAX_CONTENT = 5000;

const EditPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("active");
  const [newFile, setNewFile] = useState(null);
  const [newPreview, setNewPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const newPreviewRef = useRef("");

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
        setTitle(result.title || "");
        setContent(
          typeof result.content === "string"
            ? result.content.replace(/<[^>]+>/g, "").trim()
            : "",
        );
        setStatus(result.status || "active");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (!saved) return undefined;
    const timeout = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timeout);
  }, [saved]);

  const handleFile = (selected) => {
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Use a JPG, PNG or WEBP image.");
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setError("That image is larger than 15 MB. Try a smaller file.");
      return;
    }

    if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
    const url = URL.createObjectURL(selected);
    newPreviewRef.current = url;
    setNewFile(selected);
    setNewPreview(url);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!post || saving) return;

    if (!title.trim()) {
      setError("A title is required.");
      return;
    }

    if (userData?.$id && post.userId !== userData.$id) {
      setError("You can only edit your own moments.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let featuredImage = post.featuredImage;
      let uploadedId = null;

      if (newFile) {
        uploadedId = await appwriteService.uploadMediaFile(newFile);
        featuredImage = uploadedId;
      }

      const updated = await appwriteService.updatePost(post.$id, {
        title: title.trim(),
        content: content.trim(),
        status,
        featuredImage,
      });

      if (!updated) throw new Error("The update didn't go through. Try again.");

      if (uploadedId && post.featuredImage && post.featuredImage !== uploadedId) {
        appwriteService.deleteFile(post.featuredImage).catch(() => {});
      }

      setPost(updated);
      setNewFile(null);
      if (newPreviewRef.current) URL.revokeObjectURL(newPreviewRef.current);
      newPreviewRef.current = "";
      setNewPreview("");
      setSaved(true);
    } catch (updateError) {
      setError(toUserMessage(updateError, "Couldn't save this moment. Try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-full bg-white/5" />
        <div className="h-64 rounded-3xl bg-white/5" />
        <div className="h-4 w-2/3 rounded-full bg-white/5" />
      </div>
    );
  }

  if (!post) return null;

  const currentImage = newPreview
    ? newPreview
    : post.featuredImage
      ? appwriteService.getFileView(post.featuredImage)
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-2xl py-8"
    >
      <Link
        to={`/post/${post.$id}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to moment
      </Link>

      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        Edit your moment
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Changes are saved straight to your Appwrite record.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-3xl border border-white/10 bg-night-soft/80 p-5 backdrop-blur-xl sm:p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Title
          </span>
          <input
            value={title}
            maxLength={MAX_TITLE}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30"
            placeholder="Give your moment a title"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">
            Caption
          </span>
          <textarea
            value={content}
            rows={5}
            maxLength={MAX_CONTENT}
            onChange={(event) => setContent(event.target.value)}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30"
            placeholder="What's the story behind this moment?"
          />
          <span className="mt-1 block text-right text-[10px] tabular-nums text-slate-500">
            {content.length}/{MAX_CONTENT}
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Photo
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={post.title || "Moment"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white">
                <ImagePlus className="h-3.5 w-3.5" />
                Replace photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    handleFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              Status
            </span>
            <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
              {["active", "inactive"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  aria-pressed={status === option}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                    status === option
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-16px_rgba(168,85,247,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>

          <Link
            to={`/post/${post.$id}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </motion.div>
  );
};

export default EditPost;
