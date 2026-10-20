import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2, Sparkles } from "lucide-react";
import appwriteService from "../Appwrite/config";
import { useProfiles } from "../context/ProfilesContext";
import { MobileDock } from "../components/dashboard/Sidebar";
import { Avatar, avatarUrl, timeAgo } from "../components/dashboard/ui";

const Creator = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);
  const { profiles, ensureProfiles } = useProfiles();
  const isSelf = userId === userData?.$id;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      navigate("/explore", { replace: true });
      return undefined;
    }

    setLoading(true);
    setError("");

    appwriteService
      .listFeedPosts({ limit: 60, offset: 0, userId })
      .then((result) => {
        if (!cancelled) setPosts(result.documents);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this creator's moments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) ensureProfiles([userId]);
  }, [userId, ensureProfiles]);

  const creatorProfile = userId ? profiles[userId] : null;
  const name =
    (isSelf ? userData?.name : creatorProfile?.name) ||
    posts[0]?.name ||
    (isSelf ? userData?.name : "") ||
    "PostGram creator";
  const avatarSrc = isSelf
    ? avatarUrl(userData)
    : creatorProfile?.avatarUrl ||
      (creatorProfile?.avatarFileId
        ? appwriteService.getFileView(creatorProfile.avatarFileId)
        : "");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-night/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <Link
            to="/explore"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Back to explore"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-semibold text-white">
            Creator profile
          </h1>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 pb-32 pt-6 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-white/[0.07] bg-night-soft/70 p-6 text-center backdrop-blur-xl"
        >
          <span className="rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[2px]">
            <Avatar
              name={name}
              src={avatarSrc}
              size="xl"
              className="ring-2 ring-night-soft"
            />
          </span>

          <h2 className="mt-4 font-display text-xl font-semibold text-white">
            {name}
          </h2>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400">
            <Camera className="h-3 w-3 text-violet-300" />
            {loading
              ? "Loading moments…"
              : `${posts.length} published moment${posts.length === 1 ? "" : "s"}`}
          </p>
          {creatorProfile?.username ? (
            <p className="mt-1 text-[11px] font-medium text-violet-300">
              @{String(creatorProfile.username).replace(/^@+/, "")}
            </p>
          ) : null}
          {creatorProfile?.bio ? (
            <p className="mt-3 max-w-md whitespace-pre-line text-xs leading-relaxed text-slate-400">
              {creatorProfile.bio}
            </p>
          ) : null}

          {posts.length > 0 ? (
            <p className="mt-2 text-[10px] text-slate-600">
              Latest moment {timeAgo(posts[0].$createdAt)}
            </p>
          ) : null}
        </motion.section>

        {error ? (
          <p className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-night-soft/70 p-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-violet-300" />
            <p className="mt-3 text-sm text-slate-300">
              This creator hasn't published an active moment yet.
            </p>
            <Link
              to="/explore"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
            >
              Back to explore
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
            {posts.map((post, index) => (
              <motion.div
                key={post.$id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
              >
                <Link
                  to={`/post/${post.$id}`}
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-night-soft"
                >
                  {post.featuredImage ? (
                    <img
                      src={appwriteService.getFileView(post.featuredImage)}
                      alt={post.title || "PostGram moment"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 px-2 text-center text-[11px] font-semibold text-white">
                      {post.title || "Moment"}
                    </span>
                  )}
                  <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-slate-500" />
        ) : null}
      </main>

      <MobileDock user={userData} />
    </div>
  );
};

export default Creator;
