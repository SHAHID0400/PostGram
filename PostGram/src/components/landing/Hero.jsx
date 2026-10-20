import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Heart,
  House,
  MessageCircle,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import logo from "../../assets/plogo.png";
import {
  feedPosts,
  heroAvatars,
  heroStats,
  storyRings,
  trendingTags,
} from "./content";

const EASE = [0.22, 1, 0.36, 1];
const SPRING = { stiffness: 140, damping: 18, mass: 0.6 };

/* ── Interactive 3D phone preview ─────────────────────────── */
const PhoneMockup = () => {
  const frameRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const rawRotateX = useMotionValue(6);
  const rawRotateY = useMotionValue(-10);
  const rotateX = useSpring(rawRotateX, SPRING);
  const rotateY = useSpring(rawRotateY, SPRING);

  const handlePointerMove = (event) => {
    if (reduceMotion || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rawRotateY.set(x * 18);
    rawRotateX.set(-y * 14);
  };

  const resetTilt = () => {
    rawRotateX.set(6);
    rawRotateY.set(-10);
  };

  const featured = feedPosts[0];

  return (
    <div
      ref={frameRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetTilt}
      className="relative mx-auto w-full max-w-[26rem] [perspective:1500px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 scale-110"
      >
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.34),transparent_62%)] blur-2xl animate-pulse-glow" />
        <div className="absolute right-4 top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.3),transparent_65%)] blur-2xl" />
        <div className="absolute bottom-12 left-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.24),transparent_65%)] blur-2xl" />
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative mx-auto w-full max-w-[18.5rem] [transform-style:preserve-3d] sm:max-w-[20rem]"
      >
        <div className="relative rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-white/[0.14] to-white/[0.03] p-[3px] shadow-[0_45px_120px_-30px_rgba(109,40,217,0.6)]">
          <div className="rounded-[2.45rem] bg-[#05060b] p-[6px] ring-1 ring-black/60">
            <div className="relative overflow-hidden rounded-[2.1rem] border border-white/[0.06] bg-[#070910]">
              <div className="absolute left-1/2 top-2.5 z-20 h-[1.15rem] w-24 -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/5" />

              {/* Status bar */}
              <div className="flex items-center justify-between px-6 pb-1 pt-3.5 text-[10px] font-semibold text-white/80">
                <span>9:41</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px]">
                    <span className="h-1.5 w-[2px] rounded-sm bg-white/70" />
                    <span className="h-2 w-[2px] rounded-sm bg-white/70" />
                    <span className="h-2.5 w-[2px] rounded-sm bg-white/70" />
                    <span className="h-3 w-[2px] rounded-sm bg-white/40" />
                  </span>
                  <span className="text-[9px] tracking-wide">5G</span>
                  <span className="relative h-[9px] w-[18px] rounded-[3px] border border-white/50">
                    <span className="absolute inset-[1.5px] right-[5px] rounded-[1.5px] bg-emerald-400/90" />
                    <span className="absolute -right-[2.5px] top-1/2 h-[4px] w-[2px] -translate-y-1/2 rounded-r-sm bg-white/50" />
                  </span>
                </span>
              </div>

              {/* App header */}
              <div className="flex items-center justify-between px-4 pb-3 pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src={logo}
                    alt=""
                    className="h-6 w-6 rounded-full object-contain ring-1 ring-white/15"
                  />
                  <span className="font-display text-[13px] font-semibold tracking-tight text-white">
                    PostGram
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-white/70">
                  <Search className="h-[15px] w-[15px]" />
                  <span className="relative">
                    <Heart className="h-[15px] w-[15px]" />
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-fuchsia-400 ring-2 ring-[#070910]" />
                  </span>
                </div>
              </div>

              {/* Story rings */}
              <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-3.5">
                {storyRings.slice(0, 5).map((ring) => (
                  <div
                    key={ring.id}
                    className="flex shrink-0 flex-col items-center gap-1"
                  >
                    <div
                      className={`rounded-full p-[2px] ${
                        ring.isUser
                          ? "border border-dashed border-white/25"
                          : "ring-story"
                      }`}
                    >
                      <div className="rounded-full bg-[#070910] p-[2px]">
                        <div className="relative">
                          <img
                            src={ring.avatar}
                            alt={ring.name}
                            className="h-9 w-9 rounded-full object-cover"
                            loading="lazy"
                          />
                          {ring.isUser ? (
                            <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-violet-500 ring-2 ring-[#070910]">
                              <Plus className="h-2.5 w-2.5 text-white" />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <span className="max-w-[2.9rem] truncate text-[8.5px] text-white/55">
                      {ring.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feed card */}
              <div className="mx-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <div className="relative isolate">
                  <img
                    src={featured.image}
                    alt="Featured PostGram post"
                    className="h-44 w-full object-cover sm:h-48"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/25" />

                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-md">
                    <img
                      src={featured.author.avatar}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span className="text-[8.5px] font-medium text-white">
                      {featured.author.handle}
                    </span>
                  </div>

                  <div className="absolute inset-x-2.5 bottom-2.5">
                    <p className="text-[9.5px] leading-snug text-white/90">
                      {featured.caption}
                    </p>
                    <p className="mt-0.5 text-[8px] text-white/55">
                      {featured.location}
                    </p>
                  </div>

                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-fuchsia-300/25 bg-fuchsia-500/20 px-2 py-1 backdrop-blur-md">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-fuchsia-300" />
                    <span className="text-[8px] font-semibold text-fuchsia-100">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <Heart className="h-[15px] w-[15px] fill-rose-500 text-rose-500" />
                    <MessageCircle className="h-[15px] w-[15px] text-white/75" />
                    <Send className="h-[15px] w-[15px] text-white/75" />
                  </div>
                  <Bookmark className="h-[15px] w-[15px] text-white/75" />
                </div>

                <div className="flex items-center justify-between px-2.5 pb-2.5">
                  <p className="text-[9px] text-white/70">
                    <span className="font-semibold text-white">
                      {featured.likes.toLocaleString("en-US")}
                    </span>{" "}
                    likes · {featured.comments} comments
                  </p>
                  <span className="text-[8px] text-white/40">
                    {featured.time}
                  </span>
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="mt-3 flex items-center justify-around border-t border-white/[0.06] px-4 pb-4 pt-2.5 text-white/45">
                <House className="h-[17px] w-[17px] text-white" />
                <Search className="h-[17px] w-[17px]" />
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_6px_16px_-4px_rgba(217,70,239,0.8)]">
                  <Plus className="h-4 w-4" />
                </span>
                <Heart className="h-[17px] w-[17px]" />
                <User className="h-[17px] w-[17px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating UI cards */}
        <div
          className="absolute -left-4 top-[22%] sm:-left-2 lg:-left-16"
          style={{ transform: "translateZ(70px)" }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass flex items-center gap-2 rounded-2xl px-3 py-2 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-rose-500/25 to-fuchsia-500/20 text-rose-300 ring-1 ring-rose-400/25">
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-white">
                +1,284 likes
              </p>
              <p className="text-[9px] text-slate-400">in the last hour</p>
            </div>
          </motion.div>
        </div>

        <div
          className="absolute -right-3 top-[14%] sm:-right-4 lg:-right-10"
          style={{ transform: "translateZ(90px)" }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 12, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            className="glass flex items-center gap-2 rounded-2xl px-2.5 py-2 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]"
          >
            <img
              src={storyRings[2].avatar}
              alt=""
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="max-w-[8.5rem]">
              <p className="truncate text-[9px] text-slate-400">
                <span className="font-semibold text-white">Leo Park</span>{" "}
                replied
              </p>
              <p className="truncate text-[10px] font-medium text-white">
                “That shot is unreal 🤯”
              </p>
            </div>
          </motion.div>
        </div>

        <div
          className="absolute -left-2 bottom-[16%] sm:-left-4 lg:-left-12"
          style={{ transform: "translateZ(60px)" }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
            className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-200">
              248 creators watching
            </span>
          </motion.div>
        </div>

        <div
          className="absolute -right-1 bottom-[25%] sm:-right-2 lg:-right-6"
          style={{ transform: "translateZ(80px)" }}
        >
          <motion.div
            animate={
              reduceMotion ? undefined : { y: [0, 9, 0], rotate: [0, 3, 0] }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.1,
            }}
            className="glass flex items-center gap-1 rounded-full px-2.5 py-1.5"
          >
            <span className="text-[11px]">❤️</span>
            <span className="text-[11px]">🔥</span>
            <span className="text-[11px]">✨</span>
            <span className="ml-1 text-[9px] font-medium text-slate-300">
              +2.4k reactions
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Hero section ─────────────────────────────────────────── */
const Hero = () => {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hero-glow opacity-90"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8">
        <div className="relative z-10 text-center lg:text-left">
          <motion.div {...fadeUp(0.05)}>
            <a
              href="#features"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] py-1.5 pl-1.5 pr-4 text-xs text-slate-300 backdrop-blur-xl transition hover:border-violet-400/30 hover:bg-white/[0.07]"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/90 to-fuchsia-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" />
                New
              </span>
              <span className="font-medium">
                PostGram 2.0 is live in public beta
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
            </a>
          </motion.div>

          <motion.h1
            {...fadeUp(0.12)}
            className="mt-7 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl xl:text-[4.35rem]"
          >
            Share Moments,
            <br />
            <span className="text-gradient">Amplify Creativity,</span>
            <br />
            Connect Instantly.
          </motion.h1>

          <motion.p
            {...fadeUp(0.22)}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0"
          >
            PostGram is the social canvas for creators who care about craft.
            Publish high-fidelity moments, grow a community that actually
            replies, and see exactly what moves them — in real time.
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              to="/signup"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_-14px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              <span className="absolute inset-0 card-sheen animate-shimmer opacity-70" />
              <span className="relative">Get Started Free</span>
              <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <a
              href="#feed"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/12 bg-white/[0.045] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
                <Play className="h-3 w-3 translate-x-[1px] fill-white text-white" />
              </span>
              Explore Trending
            </a>
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-9 flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {heroAvatars.map((avatar, index) => (
                  <img
                    key={avatar}
                    src={avatar}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-[#05060a] object-cover ring-1 ring-white/10"
                    style={{ zIndex: heroAvatars.length - index }}
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  120k+ creators
                </p>
                <p className="text-xs text-slate-500">joined this month</p>
              </div>
            </div>

            <div className="hidden h-9 w-px bg-white/10 sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">4.9</span> from
                creators
              </p>
            </div>
          </motion.div>

          <motion.dl
            {...fadeUp(0.5)}
            className="mt-10 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-6 text-center lg:text-left"
          >
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-xl font-semibold text-white sm:text-2xl">
                  {stat.value}
                </dd>
                <dd className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: EASE }}
          className="relative z-0"
        >
          <PhoneMockup />
        </motion.div>
      </div>

      {/* Trending ticker */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mx-auto mt-20 flex max-w-7xl items-center gap-4 px-5 sm:px-8"
      >
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          <span className="hidden sm:inline">Trending now</span>
        </div>
        <div className="mask-fade-x flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-2.5">
            {[...trendingTags, ...trendingTags].map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="whitespace-nowrap rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
