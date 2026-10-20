import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StudioDropzone = ({
  file,
  previewUrl,
  meta,
  error,
  disabled,
  onSelect,
  onClear,
}) => {
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!disabled) onSelect(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          onSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={file ? "Replace selected photo" : "Upload a photo"}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed px-5 py-8 text-center transition ${
          dragging
            ? "border-violet-400/80 bg-violet-500/10"
            : file
              ? "border-white/15 bg-white/[0.03] hover:border-violet-400/40"
              : "border-white/15 bg-white/[0.02] hover:border-violet-400/40 hover:bg-white/[0.04]"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.24),transparent_68%)] blur-2xl"
        />

        {file && previewUrl ? (
          <div className="relative flex w-full items-center gap-4 text-left">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <img
                src={previewUrl}
                alt="Selected upload"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {file.name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {formatBytes(file.size)}
                {meta ? ` · ${meta.width}×${meta.height}px` : ""}
              </p>
              <p className="mt-1 text-[11px] text-violet-300">
                Drop another image or use Replace
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openPicker();
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-violet-400/40 hover:text-white"
                aria-label="Replace photo"
                title="Replace photo"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300"
                aria-label="Remove photo"
                title="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <motion.span
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200 shadow-[0_10px_30px_-12px_rgba(139,92,246,0.7)]"
            >
              <UploadCloud className="h-6 w-6" />
            </motion.span>
            <p className="relative mt-4 text-sm font-semibold text-white">
              Drag & drop your photo
            </p>
            <p className="relative mt-1 text-[11px] text-slate-500">
              or click to browse · JPG, PNG, WEBP up to 15 MB
            </p>
            <span className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium text-slate-300 transition group-hover:border-violet-400/40 group-hover:text-white">
              <ImagePlus className="h-3.5 w-3.5" />
              Choose photo
            </span>
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[11px] text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default StudioDropzone;
