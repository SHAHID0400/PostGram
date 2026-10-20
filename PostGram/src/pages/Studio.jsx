import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Globe2,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import { toUserMessage } from "../lib/errors";
import logo from "../assets/plogo.png";
import StudioDropzone from "../components/studio/StudioDropzone";
import StudioPreview from "../components/studio/StudioPreview";
import {
  ASPECTS,
  FILTERS,
  HASHTAG_SUGGESTIONS,
  MAX_CAPTION,
  MAX_IMAGE_SIZE,
  MAX_LOCATION,
  PUBLISH_STAGES,
} from "../components/studio/constants";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("We couldn't read that image. Try a different file."));
    image.src = src;
  });

// Crops to the chosen aspect, bakes the selected look and returns a JPEG blob.
const processImage = async (src, aspect, filter) => {
  const image = await loadImage(src);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("That image looks empty. Try another one.");
  }

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceWidth / sourceHeight > aspect.ratio) {
    cropWidth = sourceHeight * aspect.ratio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / aspect.ratio;
    cropY = (sourceHeight - cropHeight) / 2;
  }

  const maxSide = 1600;
  let outputWidth = cropWidth;
  let outputHeight = cropHeight;
  if (outputWidth > maxSide) {
    outputHeight *= maxSide / outputWidth;
    outputWidth = maxSide;
  }
  if (outputHeight > maxSide) {
    outputWidth *= maxSide / outputHeight;
    outputHeight = maxSide;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser couldn't process this image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (filter.css !== "none") context.filter = filter.css;
  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("We couldn't export the edited image.")),
      "image/jpeg",
      0.92,
    );
  });

  return blob;
};

const SectionLabel = ({ step, title, hint }) => (
  <div className="mb-3 flex items-start gap-2.5">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-violet-200">
      {step}
    </span>
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  </div>
);

const Studio = () => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageMeta, setImageMeta] = useState(null);
  const [fileError, setFileError] = useState("");

  const [aspectId, setAspectId] = useState("4:5");
  const [filterId, setFilterId] = useState("normal");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState("public");

  const [tab, setTab] = useState("edit");
  const [stage, setStage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const previewUrlRef = useRef("");

  const aspect = useMemo(
    () => ASPECTS.find((item) => item.id === aspectId) ?? ASPECTS[1],
    [aspectId],
  );
  const filter = useMemo(
    () => FILTERS.find((item) => item.id === filterId) ?? FILTERS[0],
    [filterId],
  );

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleSelect = (selected) => {
    if (!selected) return;
    setPublishError("");

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError("Use a JPG, PNG or WEBP image.");
      return;
    }

    if (selected.size > MAX_IMAGE_SIZE) {
      setFileError("That image is larger than 15 MB. Try a smaller file.");
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(selected);
    previewUrlRef.current = url;

    setFileError("");
    setFile(selected);
    setPreviewUrl(url);
    setImageMeta(null);

    loadImage(url)
      .then((image) =>
        setImageMeta({
          width: image.naturalWidth,
          height: image.naturalHeight,
        }),
      )
      .catch(() => setImageMeta(null));
  };

  const handleClear = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setFile(null);
    setPreviewUrl("");
    setImageMeta(null);
    setFileError("");
    setPublishError("");
  };

  const appendHashtag = (tag) => {
    setCaption((current) => {
      const trimmed = current.trimEnd();
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return current;
      const next = trimmed ? `${trimmed} ${tag}` : tag;
      return next.slice(0, MAX_CAPTION);
    });
  };

  const handlePublish = async () => {
    if (!file || publishing) return;

    if (!userData?.$id) {
      setPublishError("Your session expired. Please sign in and try again.");
      return;
    }

    setPublishing(true);
    setPublishError("");
    setStage(0);

    let uploadedId = null;

    try {
      const blob = await processImage(previewUrl, aspect, filter);

      setStage(1);
      const processed = new File([blob], `studio-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      uploadedId = await appwriteService.uploadMediaFile(processed);

      setStage(2);
      const { post, metadataSaved } = await appwriteService.createStudioPost({
        caption,
        location,
        audience,
        user: userData,
        featuredImage: uploadedId,
      });

      setStage(3);
      await wait(650);

      // Router state must stay JSON-serialisable. Appwrite returns a document
      // model, so pass a plain snapshot with primitives only.
      const published = {
        $id: post.$id,
        $createdAt: post.$createdAt,
        title: post.title,
        content: post.content,
        featuredImage: post.featuredImage,
        status: post.status,
        userId: post.userId,
        name: post.name,
      };

      navigate("/dashboard", {
        replace: true,
        state: {
          createdPost: published,
          note: metadataSaved
            ? ""
            : "Your photo is live. Location and audience weren't saved because those fields don't exist in the posts collection yet.",
        },
      });
    } catch (error) {
      if (uploadedId) appwriteService.deleteFile(uploadedId).catch(() => {});
      setPublishError(
        toUserMessage(error, "Something went wrong while publishing. Try again."),
      );
      setStage(null);
      setPublishing(false);
    }
  };

  const canPublish = Boolean(file) && !publishing;
  const overLimit = caption.length >= MAX_CAPTION;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-40" />
        <div className="absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_68%)] blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-night/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="PostGram" className="h-8 w-8 rounded-xl" />
            <span className="hidden sm:block">
              <span className="block font-display text-sm font-semibold leading-tight text-white">
                PostGram
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Creator Studio
              </span>
            </span>
          </Link>

          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Draft
          </span>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className="hidden items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_35px_-14px_rgba(168,85,247,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            <Send className="h-4 w-4" />
            Publish
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mb-5 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:hidden">
          {[
            { id: "edit", label: "Edit", icon: ImageIcon },
            { id: "preview", label: "Preview", icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active ? "text-white" : "text-slate-400"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="studio-tab"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
          <div className={`${tab === "edit" ? "block" : "hidden"} lg:block`}>
            <div className="space-y-4">
              <section className="rounded-3xl border border-white/10 bg-night-soft/80 p-4 backdrop-blur-xl sm:p-5">
                <SectionLabel
                  step="1"
                  title="Select media"
                  hint="One photo per moment. It's uploaded to your Appwrite bucket."
                />
                <StudioDropzone
                  file={file}
                  previewUrl={previewUrl}
                  meta={imageMeta}
                  error={fileError}
                  disabled={publishing}
                  onSelect={handleSelect}
                  onClear={handleClear}
                />
              </section>

              <section className="rounded-3xl border border-white/10 bg-night-soft/80 p-4 backdrop-blur-xl sm:p-5">
                <SectionLabel
                  step="2"
                  title="Frame & mood"
                  hint="The crop and look are baked into the uploaded image."
                />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Aspect
                  </span>
                  {ASPECTS.map((item) => {
                    const active = aspectId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAspectId(item.id)}
                        disabled={publishing}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-violet-400/50 bg-violet-500/20 text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                        aria-pressed={active}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Filter
                  </span>
                  {FILTERS.map((item) => {
                    const active = filterId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilterId(item.id)}
                        disabled={publishing}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                        aria-pressed={active}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-night-soft/80 p-4 backdrop-blur-xl sm:p-5">
                <SectionLabel
                  step="3"
                  title="Caption & metadata"
                  hint="Stored on the post document in Appwrite."
                />

                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={(event) =>
                      setCaption(event.target.value.slice(0, MAX_CAPTION))
                    }
                    rows={4}
                    disabled={publishing}
                    placeholder="Tell the story behind this moment…"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pb-8 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
                  />
                  <span
                    className={`pointer-events-none absolute bottom-2.5 right-3.5 text-[10px] tabular-nums ${
                      overLimit ? "text-rose-300" : "text-slate-500"
                    }`}
                  >
                    {caption.length}/{MAX_CAPTION}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {HASHTAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => appendHashtag(tag)}
                      disabled={publishing}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-violet-400/40 hover:text-violet-200"
                    >
                      <Hash className="h-3 w-3" />
                      {tag.replace("#", "")}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-violet-300" />
                      Location
                    </span>
                    <input
                      type="text"
                      value={location}
                      maxLength={MAX_LOCATION}
                      disabled={publishing}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Add a place"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Globe2 className="h-3.5 w-3.5 text-violet-300" />
                      Audience
                    </span>
                    <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                      {[
                        { id: "public", label: "Public", icon: Globe2 },
                        { id: "followers", label: "Followers", icon: Lock },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = audience === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAudience(item.id)}
                            disabled={publishing}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
                              active
                                ? "bg-white/10 text-white"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                            aria-pressed={active}
                          >
                            <Icon className="h-3 w-3" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  Audience is a label only right now — PostGram has no follower
                  graph yet, so visibility is still controlled by your Appwrite
                  collection permissions.
                </p>
              </section>

              <AnimatePresence>
                {publishError ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{publishError}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="hidden flex-col gap-2 sm:flex lg:flex-row lg:items-center lg:justify-between">
                <p className="text-[11px] text-slate-500">
                  {file
                    ? `${aspect.label} · ${filter.label} · will be published to your live feed`
                    : "Add a photo to enable publishing"}
                </p>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_-16px_rgba(168,85,247,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {publishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {publishing ? "Publishing…" : "Publish moment"}
                </button>
              </div>
            </div>
          </div>

          <div className={`${tab === "preview" ? "block" : "hidden"} lg:block`}>
            <div className="lg:sticky lg:top-24">
              <StudioPreview
                user={userData}
                previewUrl={previewUrl}
                aspect={aspect}
                filter={filter}
                caption={caption}
                location={location}
                audience={audience}
              />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/90 px-4 py-3 backdrop-blur-2xl sm:hidden">
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_-16px_rgba(168,85,247,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {publishing ? "Publishing…" : "Publish moment"}
        </button>
      </div>

      <AnimatePresence>
        {stage !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Publishing your moment"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-night-soft p-6 shadow-[0_40px_100px_-40px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-semibold text-white">
                    Publishing your moment
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Keep this tab open for a second.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {PUBLISH_STAGES.map((label, index) => {
                  const done = stage > index;
                  const active = stage === index;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] transition ${
                          done
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : active
                              ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                              : "border-white/10 bg-white/5 text-slate-600"
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          done || active ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                  animate={{
                    width: `${((stage + 1) / PUBLISH_STAGES.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Studio;
