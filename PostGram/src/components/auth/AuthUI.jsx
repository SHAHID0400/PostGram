import { forwardRef, useId, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import logo from "../../assets/plogo.png";
import { feedPosts, heroAvatars } from "../landing/content";

const EASE = [0.22, 1, 0.36, 1];

/* ── Ambient background ──────────────────────────────────── */
const AuthBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-[#05060a]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_18%_0%,rgba(124,58,237,0.24),transparent_65%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_92%_18%,rgba(236,72,153,0.12),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_62%_100%,rgba(34,211,238,0.09),transparent_70%)]" />
    <div className="absolute inset-0 grid-overlay opacity-40" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const BrandMark = ({ className = "" }) => (
  <Link
    to="/"
    className={`group inline-flex items-center gap-2.5 ${className}`}
    aria-label="PostGram home"
  >
    <span className="relative">
      <span className="absolute inset-0 rounded-full bg-violet-500/40 blur-md transition-opacity duration-500 group-hover:opacity-100" />
      <img
        src={logo}
        alt="PostGram logo"
        className="relative h-9 w-9 rounded-full object-contain ring-1 ring-white/15"
      />
    </span>
    <span className="font-display text-lg font-semibold tracking-tight text-white">
      PostGram
    </span>
  </Link>
);

/* ── Left-side product preview ───────────────────────────── */
const PreviewCard = ({ reduceMotion }) => {
  const featured = feedPosts[0];

  return (
    <div className="relative mt-10 max-w-md">
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.3),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.16),transparent_60%)] blur-2xl"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        className="glass relative rounded-[1.75rem] p-3 shadow-[0_35px_90px_-35px_rgba(88,28,135,0.8)]"
      >
        <div className="flex items-center justify-between px-1.5 pb-2.5">
          <div className="flex items-center gap-2">
            <img
              src={featured.author.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/15"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {featured.author.name}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {featured.location}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300/25 bg-fuchsia-500/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-fuchsia-100">
            <span className="h-1 w-1 animate-pulse rounded-full bg-fuchsia-300" />
            Live
          </span>
        </div>

        <img
          src={featured.image}
          alt="Featured PostGram moment"
          className="h-48 w-full rounded-2xl object-cover"
          loading="lazy"
        />

        <div className="flex items-center justify-between px-1.5 pt-3">
          <div className="flex items-center gap-3 text-slate-300">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <MessageCircle className="h-4 w-4" />
          </div>
          <p className="text-[11px] text-slate-400">
            <span className="font-semibold text-white">
              {featured.likes.toLocaleString("en-US")}
            </span>{" "}
            likes
          </p>
        </div>
      </motion.div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="glass absolute -right-3 top-20 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25">
          <Star className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold text-white">+248% reach</p>
          <p className="text-[8px] text-slate-400">this month</p>
        </div>
      </motion.div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
        className="absolute -left-4 bottom-14 flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-md"
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
  );
};

/* ── Split-screen auth shell ─────────────────────────────── */
export const AuthShell = ({ mode = "login", children }) => {
  const reduceMotion = useReducedMotion();
  const isSignup = mode === "signup";

  return (
    <div className="relative min-h-screen overflow-x-clip font-sans text-slate-200">
      <AuthBackdrop />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden flex-col justify-between px-8 py-10 lg:flex xl:px-14">
          <BrandMark />

          <div className="relative py-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
              {isSignup ? "Join 120k+ creators" : "Welcome back, creator"}
            </span>

            <h1 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white xl:text-[3.2rem]">
              {isSignup ? (
                <>
                  Your next moment deserves{" "}
                  <span className="text-gradient">an audience.</span>
                </>
              ) : (
                <>
                  Your creative canvas is{" "}
                  <span className="text-gradient">right where you left it.</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              {isSignup
                ? "Create your account and start sharing high-fidelity work with a community that actually replies."
                : "Pick up every conversation, story and idea — your community has been waiting for you."}
            </p>

            <PreviewCard reduceMotion={reduceMotion} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {heroAvatars.slice(0, 4).map((avatar, index) => (
                <img
                  key={avatar}
                  src={avatar}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-[#05060a] object-cover ring-1 ring-white/10"
                  style={{ zIndex: heroAvatars.length - index }}
                  loading="lazy"
                />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Trusted by{" "}
              <span className="font-semibold text-white">120k+ creators</span>{" "}
              worldwide
            </p>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
          <div className="w-full max-w-[27rem]">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <BrandMark />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0d16]/80 p-1.5 shadow-[0_40px_120px_-40px_rgba(88,28,135,0.8)] backdrop-blur-2xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
              <div className="rounded-[1.65rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.05] via-transparent to-transparent p-6 sm:p-8">
                {children}
                <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
                  Secure sessions powered by Appwrite
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ── Form primitives ─────────────────────────────────────── */
export const AuthTabs = ({ active }) => {
  const linkClass =
    "relative flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-xs font-semibold transition-colors duration-300";

  return (
    <div className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      <Link
        to="/login"
        className={`${linkClass} ${
          active === "login" ? "text-white" : "text-slate-400 hover:text-white"
        }`}
        aria-current={active === "login" ? "page" : undefined}
      >
        {active === "login" ? (
          <motion.span
            layoutId="auth-mode-pill"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 shadow-[0_10px_28px_-10px_rgba(168,85,247,0.9)]"
          />
        ) : null}
        <span className="relative">Sign in</span>
      </Link>

      <Link
        to="/signup"
        className={`${linkClass} ${
          active === "signup" ? "text-white" : "text-slate-400 hover:text-white"
        }`}
        aria-current={active === "signup" ? "page" : undefined}
      >
        {active === "signup" ? (
          <motion.span
            layoutId="auth-mode-pill"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 shadow-[0_10px_28px_-10px_rgba(168,85,247,0.9)]"
          />
        ) : null}
        <span className="relative">Create account</span>
      </Link>
    </div>
  );
};

export const AuthAlert = ({ children, variant = "error" }) => (
  <div
    role="alert"
    className={
      variant === "success"
        ? "mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3.5 py-3 text-xs leading-relaxed text-emerald-200"
        : "mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-3 text-xs leading-relaxed text-rose-200"
    }
  >
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{children}</span>
  </div>
);

export const AuthField = forwardRef(function AuthField(
  { label, icon: Icon, error, hint, type = "text", className = "", ...props },
  ref,
) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block pl-1 text-xs font-medium text-slate-300"
      >
        {label}
      </label>

      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        ) : null}

        <input
          id={id}
          ref={ref}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-2xl border bg-white/[0.035] py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-300 focus:bg-white/[0.05] focus:ring-2 ${
            Icon ? "pl-11" : "pl-4"
          } ${isPassword ? "pr-11" : "pr-4"} ${
            error
              ? "border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/15"
              : "border-white/10 hover:border-white/20 focus:border-violet-400/60 focus:ring-violet-500/20"
          } ${className}`}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs text-rose-300"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error.message}
        </p>
      ) : hint ? (
        <p className="mt-1.5 pl-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export const AuthSubmit = ({ loading = false, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="group relative mt-1 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_-14px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
  >
    <span className="absolute inset-0 card-sheen animate-shimmer opacity-60" />
    <span className="relative flex items-center gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </span>
  </button>
);
