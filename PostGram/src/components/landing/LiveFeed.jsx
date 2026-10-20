import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bookmark,
  Flame,
  Heart,
  MessageCircle,
  Radio,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Reveal, SectionHeading } from "./ui";
import {
  feedPosts,
  storyRings,
  trendingTags,
} from "./content";

const formatCount = (value) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const FeedCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0d16]"
    >
      <div className="relative isolate overflow-hidden">
        <img
          src={post.image}
          alt={post.caption}
          className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-44"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-md">
          <img
            src={post.author.avatar}
            alt=""
            className="h-4 w-4 rounded-full object-cover"
          />
          <span className="text-[9px] font-medium text-white">
            {post.author.handle}
          </span>
        </div>

        <span className="absolute right-2.5 top-2.5 rounded-full bg-black/35 px-2 py-0.5 text-[8px] font-medium text-white/70 backdrop-blur-md">
          {post.time}
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.82 }}
              onClick={() => setLiked((value) => !value)}
              aria-pressed={liked}
              aria-label={liked ? "Unlike post" : "Like post"}
              className="rounded-md p-0.5 transition-colors"
            >
              <Heart
                className={`h-[17px] w-[17px] transition-colors ${
                  liked
                    ? "fill-rose-500 text-rose-500"
                    : "text-white/70 hover:text-white"
                }`}
              />
            </motion.button>
            <MessageCircle className="h-[17px] w-[17px] text-white/70" />
            <Send className="h-[17px] w-[17px] text-white/70" />
          </div>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save post"}
            className="p-0.5"
          >
            <Bookmark
              className={`h-[17px] w-[17px] transition-colors ${
                saved ? "fill-violet-400 text-violet-400" : "text-white/70"
              }`}
            />
          </button>
        </div>

        <div className="mt-2 flex min-h-[1rem] items-baseline gap-1 overflow-hidden">
          <span className="text-[11px] font-semibold text-white">
            {formatCount(post.likes + (liked ? 1 : 0))}
          </span>
          <span className="text-[10px] text-slate-500">likes</span>
          <span className="ml-auto text-[10px] text-slate-500">
            {post.comments} comments
          </span>
        </div>

        <p className="mt-1.5 line-clamp-1 text-[10.5px] leading-snug text-slate-400">
          {post.caption}
        </p>
      </div>
    </motion.article>
  );
};

const LiveFeed = () => {
  const [activeRing, setActiveRing] = useState("nova");

  return (
    <section
      id="community"
      className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_65%)] blur-2xl"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Live community"
            title={
              <>
                The feed never sleeps —{" "}
                <span className="text-gradient">and neither does your crowd.</span>
              </>
            }
            description="Stories glow the moment they're posted. Reactions, replies and saves sync in real time, so every conversation feels like it's happening right beside you."
          />

          <Reveal delay={0.2}>
            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: Sparkles,
                  title: "Story rings with gradient borders",
                  copy: "See who's live, who's new and who just replied — all at a glance.",
                },
                {
                  icon: Zap,
                  title: "Reactions synced instantly",
                  copy: "Likes, comments and saves update live without a single refresh.",
                },
                {
                  icon: Flame,
                  title: "Trending tags, curated per community",
                  copy: "Discover what your circle is actually talking about today.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-violet-200">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                      {item.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Realtime delivery */}
          <Reveal delay={0.3} className="mt-8">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Realtime delivery
                </span>
                <Radio className="h-3.5 w-3.5 text-slate-500" />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Posts, likes, follows and messages sync through Appwrite
                Realtime, so everyone sees changes as they happen.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.4} className="mt-7">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#05060a] transition-transform duration-300 hover:scale-[1.02]"
            >
              Open the live feed
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        {/* Feed preview window */}
        <Reveal delay={0.15}>
          <div
            id="feed"
            className="relative scroll-mt-28 rounded-[1.8rem] border border-white/10 bg-[#080b14]/80 p-3 shadow-[0_40px_120px_-40px_rgba(88,28,135,0.65)] backdrop-blur-2xl sm:p-4"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-[1.8rem] bg-gradient-to-b from-white/[0.08] to-transparent [mask-image:linear-gradient(to_bottom,black,transparent_40%)]"
            />

            {/* Window chrome */}
            <div className="relative flex items-center justify-between px-2 pb-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[9px] font-medium tracking-wide text-slate-500">
                postgram.app / feed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Preview
              </span>
            </div>

            {/* Story rings */}
            <div className="no-scrollbar relative flex gap-4 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              {storyRings.map((ring) => {
                const isActive = activeRing === ring.id;
                return (
                  <button
                    key={ring.id}
                    type="button"
                    onClick={() => setActiveRing(ring.id)}
                    className="flex shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none"
                    aria-pressed={isActive}
                    aria-label={`Open ${ring.name}'s story`}
                  >
                    <span
                      className={`rounded-full p-[2px] transition-all duration-300 ${
                        ring.isUser
                          ? "border border-dashed border-white/30"
                          : "ring-story"
                      } ${isActive ? "scale-105 shadow-[0_0_22px_-4px_rgba(217,70,239,0.75)]" : "opacity-80 hover:opacity-100"}`}
                    >
                      <span className="block rounded-full bg-[#080b14] p-[2px]">
                        <img
                          src={ring.avatar}
                          alt=""
                          className={`h-11 w-11 rounded-full object-cover transition ${
                            isActive ? "ring-2 ring-white/30" : ""
                          }`}
                          loading="lazy"
                        />
                      </span>
                    </span>
                    <span
                      className={`max-w-[3.4rem] truncate text-[10px] ${
                        isActive ? "font-semibold text-white" : "text-slate-500"
                      }`}
                    >
                      {ring.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Posts */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {feedPosts.slice(0, 2).map((post) => (
                <FeedCard key={post.id} post={post} />
              ))}
            </div>

            {/* Third post — compact row */}
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2.5">
              <img
                src={feedPosts[2].image}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-white">
                  {feedPosts[2].author.name}
                  <span className="ml-1.5 font-normal text-slate-500">
                    {feedPosts[2].handle}
                  </span>
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {feedPosts[2].caption}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-300">
                <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                {formatCount(feedPosts[2].likes)}
              </span>
            </div>

            {/* Trending marquee */}
            <div className="mask-fade-x mt-3 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] py-2">
              <div className="flex w-max animate-marquee gap-2 px-2">
                {[...trendingTags, ...trendingTags].map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="whitespace-nowrap rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default LiveFeed;
