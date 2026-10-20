import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AtSign,
  Check,
  Heart,
  Images,
  Loader2,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import { toUserMessage } from "../lib/errors";
import ExplorePostModal from "../components/explore/ExplorePostModal";
import { MobileDock } from "../components/dashboard/Sidebar";
import { Avatar, timeAgo } from "../components/dashboard/ui";

const UserProfile = () => {
  const { userId } = useParams();
  const userData = useSelector((state) => state.auth?.userData);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [following, setFollowing] = useState(false);
  const [followSupported, setFollowSupported] = useState(true);
  const [followStats, setFollowStats] = useState({
    followers: null,
    following: null,
  });
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");

  const [selectedPost, setSelectedPost] = useState(null);

  const isSelf = Boolean(userData?.$id && userData.$id === userId);

  useEffect(() => {
    if (!userId || !userData?.$id || isSelf) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");
    setFollowError("");

    Promise.all([
      appwriteService.getPublicProfile(userId),
      appwriteService.listFeedPosts({ limit: 60, offset: 0, userId }),
      appwriteService.isFollowing(userData.$id, userId),
      appwriteService.getFollowStats(userId),
    ])
      .then(([nextProfile, postResult, isFollowing, stats]) => {
        if (cancelled) return;

        setProfile(nextProfile);
        setPosts(postResult.documents);
        setFollowing(Boolean(isFollowing));
        setFollowSupported(isFollowing !== null && stats.supported);
        setFollowStats({
          followers: stats.followers,
          following: stats.following,
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(toUserMessage(loadError, "Couldn't load this profile."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, userData?.$id, isSelf]);

  if (!userId) return <Navigate to="/explore" replace />;
  if (isSelf) return <Navigate to="/profile" replace />;

  const toggleFollow = async () => {
    if (followBusy || !userData?.$id) return;

    if (!followSupported) {
      setFollowError(
        "Follow needs the `follows` collection in Appwrite. Until it's created, nothing is saved.",
      );
      return;
    }

    const previous = following;
    const next = !previous;

    setFollowBusy(true);
    setFollowError("");
    setFollowing(next);
    setFollowStats((current) => ({
      ...current,
      followers:
        typeof current.followers === "number"
          ? Math.max(0, current.followers + (next ? 1 : -1))
          : current.followers,
    }));

    try {
      if (next) {
        await appwriteService.followUser(userData.$id, userId);
      } else {
        await appwriteService.unfollowUser(userData.$id, userId);
      }
    } catch (toggleError) {
      setFollowing(previous);
      setFollowStats((current) => ({
        ...current,
        followers:
          typeof current.followers === "number"
            ? Math.max(0, current.followers + (next ? -1 : 1))
            : current.followers,
      }));
      setFollowError(
        toggleError?.message || "Couldn't update your follow. Try again.",
      );
    } finally {
      setFollowBusy(false);
    }
  };

  const handleUpdatePost = (next) => {
    setSelectedPost(next);
    setPosts((current) =>
      current.map((post) => (post.$id === next.$id ? next : post)),
    );
  };

  const displayName = profile?.name || "PostGram creator";
  const avatarFileId = profile?.avatarFileId || "";
  const notFound = !loading && !error && !profile?.hasProfile && posts.length === 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-night/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 sm:px-6">
          <Link
            to="/explore"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Back to explore"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-semibold text-white">
              {loading ? "Profile" : displayName}
            </h1>
            {profile?.username ? (
              <p className="truncate text-[10px] text-slate-500">
                @{profile.username}
              </p>
            ) : null}
          </div>

          <Link
            to={`/chat/${userId}`}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_-14px_rgba(168,85,247,0.9)]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Message
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-32 pt-5 sm:px-6">
        {error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 px-3 py-1.5 font-medium transition hover:bg-rose-500/15"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-7">
            <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="mx-auto mt-4 h-4 w-40 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="mx-auto mt-2 h-3 w-24 animate-pulse rounded-full bg-white/5" />
            <div className="mx-auto mt-5 h-10 w-full max-w-sm animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-5 text-center backdrop-blur-xl sm:p-7"
            >
              <div className="relative mx-auto w-fit">
                <span className="block rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[2px]">
                  <Avatar
                    name={displayName}
                    src={
                      avatarFileId
                        ? appwriteService.getFileView(avatarFileId)
                        : ""
                    }
                    size="2xl"
                    className="ring-4 ring-night-soft"
                  />
                </span>
              </div>

              <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white">
                {displayName}
              </h2>

              {profile?.username ? (
                <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
                  <AtSign className="h-3 w-3 text-violet-300" />
                  {profile.username}
                </p>
              ) : (
                <p
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium text-slate-400"
                  title="This creator hasn't saved a public username yet"
                >
                  ID · {userId.slice(0, 12)}…
                </p>
              )}

              {profile?.bio ? (
                <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm leading-relaxed text-slate-400">
                  {profile.bio}
                </p>
              ) : (
                <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-500">
                  {profile?.hasProfile
                    ? "No bio added yet."
                    : "This creator hasn't saved a public profile yet. Their moments are still real and shown below."}
                </p>
              )}

              <dl className="mt-6 grid grid-cols-3 divide-x divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-white/[0.02] py-3">
                {[
                  {
                    label: "Moments",
                    value: loading ? "—" : posts.length,
                  },
                  {
                    label: "Followers",
                    value:
                      followStats.followers === null
                        ? "—"
                        : followStats.followers,
                    hint: followSupported
                      ? undefined
                      : "The follows collection isn't set up yet",
                  },
                  {
                    label: "Following",
                    value:
                      followStats.following === null
                        ? "—"
                        : followStats.following,
                    hint: followSupported
                      ? undefined
                      : "The follows collection isn't set up yet",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="px-2 text-center">
                    <dd className="font-display text-lg font-semibold tabular-nums text-white">
                      {stat.value}
                    </dd>
                    <dt
                      className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500"
                      title={stat.hint}
                    >
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>

              {followError ? (
                <p
                  role="alert"
                  className="mx-auto mt-4 max-w-md rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200"
                >
                  {followError}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={followBusy || (!followSupported && following)}
                  aria-pressed={following}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    following
                      ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                      : "bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-[0_16px_40px_-18px_rgba(168,85,247,0.9)] hover:brightness-110"
                  }`}
                >
                  {followBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : following ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {following ? "Following" : "Follow"}
                </button>

                <Link
                  to={`/chat/${userId}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Link>
              </div>

              {!followSupported ? (
                <p className="mt-3 text-[10px] text-slate-600">
                  Follow counts will appear once social features are enabled
                  for this workspace.
                </p>
              ) : null}
            </motion.section>

            <section className="mt-6">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-white">
                  Moments
                </h2>
                <span className="text-[11px] text-slate-500">
                  {posts.length}
                </span>
              </div>

              {notFound ? (
                <div className="mt-4 rounded-3xl border border-white/10 bg-night-soft/70 p-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
                    <UserPlus className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">
                    Nothing public from this account yet
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
                    This user hasn't published a moment or saved a public
                    profile.
                  </p>
                  <Link
                    to="/explore"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
                  >
                    Back to explore
                  </Link>
                </div>
              ) : posts.length === 0 ? (
                <div className="mt-4 rounded-3xl border border-white/10 bg-night-soft/70 p-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200">
                    <Images className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">
                    No moments yet
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
                    When {displayName} publishes, their active moments appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                  {posts.map((post, index) => (
                    <motion.button
                      key={post.$id}
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(index, 10) * 0.03 }}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-night-soft text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
                      aria-label={post.title || "Open moment"}
                    >
                      {post.featuredImage ? (
                        <img
                          src={appwriteService.getFileView(post.featuredImage)}
                          alt={post.title || "Moment"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 px-2 text-center text-[11px] font-semibold text-white">
                          {post.title || "Moment"}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                      {Array.isArray(post.likes) && post.likes.length > 0 ? (
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                          <Heart className="h-2.5 w-2.5 fill-current" />
                          {post.likes.length}
                        </span>
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 hidden truncate bg-linear-to-t from-black/80 to-transparent px-2 pb-6 pt-8 text-[10px] text-slate-200 group-hover:block">
                        {timeAgo(post.$createdAt)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <AnimatePresence>
        {selectedPost ? (
          <ExplorePostModal
            post={selectedPost}
            user={userData}
            onClose={() => setSelectedPost(null)}
            onUpdate={handleUpdatePost}
          />
        ) : null}
      </AnimatePresence>

      <MobileDock user={userData} />
    </div>
  );
};

export default UserProfile;
