import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  Hash,
  House,
  Images,
  Loader2,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  PlusSquare,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import logo from "../../assets/plogo.png";
import { Avatar, SidebarSkeleton, avatarUrl } from "./ui";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-white/[0.08] text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

export const DashboardSidebar = ({
  user,
  postCount,
  onCreate,
  onShowMine,
  mineActive,
  onLogout,
  loggingOut,
  onEditProfile,
}) => {
  const location = useLocation();
  const [createHover, setCreateHover] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.06] bg-night/90 px-4 py-6 backdrop-blur-2xl lg:flex xl:w-64">
      <Link
        to="/"
        className="flex items-center gap-2.5 rounded-full px-2 py-1"
        aria-label="PostGram home"
      >
        <img
          src={logo}
          alt="PostGram logo"
          className="h-9 w-9 rounded-full object-contain ring-1 ring-white/15"
        />
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          PostGram
        </span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Dashboard">
        <NavLink to="/dashboard" end className={navLinkClass}>
          <House className="h-[18px] w-[18px]" />
          Home
        </NavLink>

        <button
          type="button"
          onClick={onShowMine}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
            mineActive
              ? "bg-white/[0.08] text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <UserRound className="h-[18px] w-[18px]" />
          My moments
        </button>

        <button
          type="button"
          onClick={onCreate}
          onMouseEnter={() => setCreateHover(true)}
          onMouseLeave={() => setCreateHover(false)}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <PlusSquare className="h-[18px] w-[18px]" />
          Create moment
          <Sparkles
            className={`ml-auto h-3.5 w-3.5 text-violet-300 transition ${
              createHover ? "opacity-100" : "opacity-40"
            }`}
          />
        </button>

        <NavLink to="/explore" className={navLinkClass}>
          <Compass className="h-[18px] w-[18px]" />
          Explore
        </NavLink>

        <NavLink to="/chat" className={navLinkClass}>
          <MessageCircle className="h-[18px] w-[18px]" />
          Messages
        </NavLink>

        <NavLink to="/studio" className={navLinkClass}>
          <Images className="h-[18px] w-[18px]" />
          Studio uploader
        </NavLink>
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} src={avatarUrl(user)} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "PostGram creator"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {user?.username ? `@${user.username}` : user?.email}
              </p>
            </div>
            {onEditProfile ? (
              <button
                type="button"
                onClick={onEditProfile}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Edit profile"
                title="Edit profile"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] text-slate-500">
            <span>Published moments</span>
            <span className="font-semibold tabular-nums text-white">
              {typeof postCount === "number" ? postCount : "—"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <LogOut className="h-[18px] w-[18px]" />
          )}
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <p className="mt-3 px-2 text-[10px] text-slate-600">
        {location.pathname === "/dashboard"
          ? "Signed in with Appwrite"
          : "PostGram dashboard"}
      </p>
    </aside>
  );
};

export const DashboardRail = ({
  user,
  stats,
  creators,
  creatorStats,
  tags,
  activeAuthor,
  onSelectAuthor,
  onClearAuthor,
  loading,
}) => (
  <aside className="hidden xl:block">
    <div className="sticky top-24 space-y-5">
      <section className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-violet-300" />
          Your pulse
        </h2>
        <dl className="mt-4 space-y-3">
          {[
            {
              label: "Your moments",
              value: typeof stats?.myPosts === "number" ? stats.myPosts : "—",
              icon: Images,
            },
            {
              label: "Active in feed",
              value: stats?.feedTotal ?? "—",
              icon: Compass,
            },
            {
              label: "Creators",
              value: stats?.creators ?? "—",
              icon: Users,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-xs text-slate-400">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                {label}
              </dt>
              <dd className="text-sm font-semibold tabular-nums text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Creators in feed</h2>
          {activeAuthor ? (
            <button
              type="button"
              onClick={onClearAuthor}
              className="text-[11px] font-medium text-violet-300 transition hover:text-violet-200"
            >
              Clear filter
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Real people publishing to PostGram right now.
        </p>

        <div className="mt-4 space-y-3">
          {loading ? (
            <SidebarSkeleton />
          ) : creators.length > 0 ? (
            creators.map((creator) => {
              const count = creatorStats?.[creator.userId];
              const isActive = activeAuthor === creator.userId;
              return (
                <div key={creator.userId} className="flex items-center gap-3">
                  <Avatar name={creator.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {creator.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {typeof count === "number"
                        ? `${count} moment${count === 1 ? "" : "s"}`
                        : count === null
                          ? "Count unavailable"
                          : "Loading moments…"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      isActive
                        ? onClearAuthor()
                        : onSelectAuthor(creator.userId)
                    }
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      isActive
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-400/40 hover:text-white"
                    }`}
                  >
                    {isActive ? "Viewing" : "View"}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500">
              No other creators have published yet. Your feed updates live.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Hash className="h-4 w-4 text-cyan-300" />
          Trending tags
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Pulled from real captions in your feed.
        </p>
        {tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.name}>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                  {tag.name}
                  <span className="tabular-nums text-slate-500">
                    {tag.count}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Hashtags appear here as creators publish.
          </p>
        )}
      </section>

      <p className="px-1 text-[10px] leading-relaxed text-slate-600">
        Signed in as {user?.email || "your account"} · data streamed from
        Appwrite.
      </p>
    </div>
  </aside>
);

const DockTab = ({ active, onClick, icon: Icon, children, label }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.9 }}
    aria-pressed={active}
    className="relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5"
  >
    {active ? (
      <motion.span
        layoutId="mobile-dock-active"
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="absolute inset-x-1 inset-y-0 rounded-xl bg-white/[0.08]"
      />
    ) : null}
    <span
      className={`relative z-10 transition-colors ${
        active ? "text-violet-200" : "text-slate-500"
      }`}
    >
      {children || <Icon className="h-5 w-5" />}
    </span>
    <span
      className={`relative z-10 text-[10px] font-medium transition-colors ${
        active ? "text-white" : "text-slate-500"
      }`}
    >
      {label}
    </span>
  </motion.button>
);

export const MobileDock = ({ user }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const homeActive = pathname === "/dashboard";
  const exploreActive = pathname === "/explore" || pathname === "/all-posts";
  const chatActive = pathname === "/chat" || pathname.startsWith("/chat/");
  const profileActive =
    pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a12]/90 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-xl lg:hidden">
      <nav
        aria-label="Mobile app"
        className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-1 pt-2"
      >
        <DockTab
          active={homeActive}
          onClick={() => navigate("/dashboard")}
          icon={House}
          label="Home"
        />

        <DockTab
          active={exploreActive}
          onClick={() => navigate("/explore")}
          icon={Compass}
          label="Explore"
        />

        <div className="relative flex flex-col items-center">
          <motion.button
            type="button"
            onClick={() => navigate("/studio")}
            whileTap={{ scale: 0.92 }}
            className="relative -mt-7 grid h-14 w-14 place-items-center rounded-full"
            aria-label="Create a moment in Studio"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-pulse-glow rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 opacity-70 blur-md"
            />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white ring-4 ring-[#0a0a12] shadow-[0_10px_30px_-8px_rgba(168,85,247,0.9)]">
              <Plus className="h-6 w-6" />
            </span>
          </motion.button>
          <span className="mt-0.5 text-[10px] font-medium text-slate-400">
            Create
          </span>
        </div>

        <DockTab
          active={chatActive}
          onClick={() => navigate("/chat")}
          icon={MessageCircle}
          label="Chat"
        />

        <motion.button
          type="button"
          onClick={() => navigate("/profile")}
          whileTap={{ scale: 0.9 }}
          aria-pressed={profileActive}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5"
        >
          <span
            className={`rounded-full p-[2px] transition ${
              profileActive
                ? "bg-linear-to-br from-violet-400 via-fuchsia-400 to-cyan-400"
                : "bg-white/15"
            }`}
          >
            <Avatar
              name={user?.name}
              src={avatarUrl(user)}
              size="sm"
              className="ring-2 ring-[#0a0a12]"
            />
          </span>
          <span
            className={`text-[10px] font-medium ${
              profileActive ? "text-white" : "text-slate-500"
            }`}
          >
            You
          </span>
        </motion.button>
      </nav>
    </div>
  );
};
