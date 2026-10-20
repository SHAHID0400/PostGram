import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { feedPosts, storyRings } from "./content";

const formatCount = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);

const LiveFeed = () => (
  <section
    id="community"
    className="relative scroll-mt-24 overflow-hidden px-6 py-16 lg:py-24"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl"
    />

    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
      {/* Copy */}
      <div className="lg:col-span-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live community
        </span>

        <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          The feed never sleeps —{" "}
          <span className="text-gradient">and neither does your circle.</span>
        </h2>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
          Posts, likes and replies sync through Appwrite Realtime the moment
          they happen. No refresh, no lag — just the conversation moving as
          fast as your community does.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl border border-white/[0.08] p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-violet-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">
              Story Rings with Live Sync
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Gradient rings show who is live and what is new, updated in real
              time.
            </p>
          </div>

          <div className="glass rounded-2xl border border-white/[0.08] p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500/25 to-orange-400/15 text-rose-200">
              <Zap className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">
              Instant Real-time Reactions
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Hearts, saves and replies update live — without a single page
              refresh.
            </p>
          </div>
        </div>

        <Link
          to="/explore"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_-14px_rgba(168,85,247,0.85)] transition-transform duration-300 hover:scale-[1.02]"
        >
          Explore Live Feed
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Mockup */}
      <div className="group relative lg:col-span-7" id="feed">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-purple-600/15 blur-3xl"
        />

        <div
          className="relative scroll-mt-28 transform-gpu transition-transform duration-700 ease-out lg:group-hover:[transform:perspective(1000px)_rotateY(-3deg)_rotateX(2deg)]"
          style={{ perspective: "1000px" }}
        >
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#080b14]/85 p-3 shadow-[0_40px_120px_-40px_rgba(88,28,135,0.65)] backdrop-blur-2xl sm:p-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent"
            />

            {/* Browser chrome */}
            <div className="relative flex items-center gap-3 pb-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium tracking-wide text-slate-500">
                  postgram.app/feed
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            {/* Stories */}
            <div className="no-scrollbar flex gap-4 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              {storyRings.map((ring) => (
                <div
                  key={ring.id}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={`rounded-full p-[2px] ${
                      ring.isUser
                        ? "border border-dashed border-white/30"
                        : "ring-story"
                    }`}
                  >
                    <span className="block rounded-full bg-[#080b14] p-[2px]">
                      <img
                        src={ring.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        loading="lazy"
                      />
                    </span>
                  </span>
                  <span className="max-w-[3.4rem] truncate text-[10px] text-slate-500">
                    {ring.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Feed preview */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {feedPosts.slice(0, 2).map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0d16]"
                >
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.caption}
                      className="h-36 w-full object-cover sm:h-44"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-md">
                      <img
                        src={post.author.avatar}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                      />
                      {post.author.handle}
                    </span>
                    <Play className="absolute right-2.5 top-2.5 h-4 w-4 text-white/70" />
                  </div>

                  <div className="p-2.5">
                    <div className="flex items-center gap-2 text-white/75">
                      <Heart className="h-4 w-4" />
                      <MessageCircle className="h-4 w-4" />
                      <Send className="h-4 w-4" />
                      <Bookmark className="ml-auto h-4 w-4" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2 text-[10px]">
                      <span className="font-semibold text-white">
                        {formatCount(post.likes)} likes
                      </span>
                      <span className="text-slate-500">
                        {formatCount(post.comments)} comments
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[10.5px] text-slate-400">
                      {post.caption}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Floating reaction pill */}
          <div className="absolute -bottom-4 left-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c101c]/95 px-3.5 py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500">
              <Heart className="h-3 w-3 fill-white text-white" />
            </span>
            <span className="text-[11px] font-semibold text-white">
              +1.2k reactions
            </span>
            <span className="text-[10px] text-slate-500">just now</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LiveFeed;
