import { Heart, Lock, MapPin, MessageCircle, Send, Sparkles } from "lucide-react";
import { Avatar, avatarUrl } from "../dashboard/ui";

const StudioPreview = ({
  user,
  previewUrl,
  aspect,
  filter,
  caption,
  location,
  audience,
}) => {
  const name = user?.name || "PostGram creator";
  const username = user?.username || user?.email?.split("@")[0] || "you";
  const hasCaption = caption.trim().length > 0;

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
          LIVE PREVIEW
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
          {aspect.label}
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-night-soft shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3 p-4">
          <Avatar
            name={name}
            src={avatarUrl(user)}
            size="md"
            className="ring-2 ring-violet-500/30"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate text-[11px] text-slate-500">
                @{username}
              </span>
              {location ? (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          {audience === "followers" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-300">
              <Lock className="h-3 w-3" />
              Followers
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              Public
            </span>
          )}
        </div>

        <div
          className={`relative w-full overflow-hidden bg-black/60 ${aspect.frame}`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Post preview"
              className="h-full w-full object-cover transition-[filter] duration-300"
              style={{ filter: filter.css }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-white/[0.02] px-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-white/15 text-slate-600">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="text-xs text-slate-500">
                Your photo will appear here
              </p>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <Heart className="h-4 w-4" /> 0
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs">
              <MessageCircle className="h-4 w-4" /> 0
            </span>
            <Send className="ml-auto h-4 w-4 text-slate-500" />
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
            {hasCaption ? (
              caption
            ) : (
              <span className="text-slate-500">
                Your caption will show up here — tell the story behind the shot.
              </span>
            )}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-600">
            Just now · from your studio
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudioPreview;
