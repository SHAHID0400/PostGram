import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Compass,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import logo from "../assets/plogo.png";
import { useProfiles } from "../context/ProfilesContext";
import { useComments } from "../context/CommentsContext";
import useRealtimeFeed from "../hooks/useRealtimeFeed";
import ExplorePostModal from "../components/explore/ExplorePostModal";
import UserSearch from "../components/search/UserSearch";
import { MobileDock } from "../components/dashboard/Sidebar";
import {
  Avatar,
  avatarUrl,
  parseComments,
  stripHtml,
} from "../components/dashboard/ui";

const PAGE_SIZE = 24;

const Explore = () => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);
  const { profiles, ensureProfiles } = useProfiles();
  const {
    supported: commentsCollectionSupported,
    ensureComments,
    getComments,
  } = useComments();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    appwriteService
      .listFeedPosts({ limit: PAGE_SIZE, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setPosts((current) => {
          const known = new Set(
            result.documents.map((document) => document.$id),
          );
          const streamed = current.filter((post) => !known.has(post.$id));
          return [...streamed, ...result.documents];
        });
        setPage(0);
        setHasMore(result.documents.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't load explore right now. Check your connection.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await appwriteService.listFeedPosts({
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });

      setPosts((current) => {
        const known = new Set(current.map((post) => post.$id));
        return [
          ...current,
          ...result.documents.filter((post) => !known.has(post.$id)),
        ];
      });
      setPage(nextPage);
      setHasMore(result.documents.length === PAGE_SIZE);
    } catch (loadError) {
      setError("Couldn't load more moments. Try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Real hashtags pulled from real captions.
  const tags = useMemo(() => {
    const counts = new Map();

    posts.forEach((post) => {
      const text = `${stripHtml(post.content)} ${post.title || ""}`;
      const found = text.match(/#[a-zA-Z0-9_]+/g) || [];
      found.forEach((tag) => {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [posts]);

  const creators = useMemo(() => {
    const map = new Map();

    posts.forEach((post) => {
      if (!post.userId) return;
      const profile = profiles[post.userId];
      const entry = map.get(post.userId) || {
        userId: post.userId,
        name: profile?.name || post.name || "PostGram creator",
        username: profile?.username || "",
        avatarFileId: profile?.avatarFileId || "",
        avatarUrl: profile?.avatarUrl || "",
        count: 0,
      };
      entry.count += 1;
      if (!entry.name && post.name) entry.name = post.name;
      map.set(post.userId, entry);
    });

    return [...map.values()]
      .sort((first, second) => second.count - first.count)
      .slice(0, 12);
  }, [posts, profiles]);

  // Resolve every explore author through the shared realtime profiles cache.
  const authorKey = useMemo(
    () =>
      [...new Set(posts.map((post) => post.userId).filter(Boolean))].join("|"),
    [posts],
  );

  useEffect(() => {
    if (authorKey) ensureProfiles(authorKey.split("|"));
  }, [authorKey, ensureProfiles]);

  // Load every visible moment's comments in one batched request.
  const postKey = useMemo(
    () => posts.map((post) => post.$id).filter(Boolean).join("|"),
    [posts],
  );

  useEffect(() => {
    if (!postKey || commentsCollectionSupported === false) return;
    ensureComments(postKey.split("|"));
  }, [postKey, commentsCollectionSupported, ensureComments]);

  const commentCountFor = (post) => {
    const remote =
      commentsCollectionSupported === false
        ? 0
        : getComments(post.$id).length;
    return remote + parseComments(post.comments).length;
  };

  // Live moments: new posts, edits, likes and deletes stream in without reload.
  useRealtimeFeed(({ document, events }) => {
    const isCreate = events.some((event) => event.endsWith(".create"));
    const isUpdate = events.some((event) => event.endsWith(".update"));
    const isDelete = events.some((event) => event.endsWith(".delete"));
    const inactive = document.status && document.status !== "active";

    setPosts((current) => {
      if (isDelete) {
        return current.filter((post) => post.$id !== document.$id);
      }

      if (isCreate) {
        if (inactive) return current;

        return current.some((post) => post.$id === document.$id)
          ? current.map((post) =>
              post.$id === document.$id ? { ...post, ...document } : post,
            )
          : [document, ...current];
      }

      if (isUpdate) {
        if (inactive) {
          return current.filter((post) => post.$id !== document.$id);
        }

        return current.map((post) =>
          post.$id === document.$id ? { ...post, ...document } : post,
        );
      }

      return current;
    });

    setSelectedPost((current) => {
      if (current?.$id !== document.$id) return current;
      return isDelete ? null : { ...current, ...document };
    });
  });

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return posts.filter((post) => {
      if (creatorFilter && post.userId !== creatorFilter) return false;

      const text =
        `${stripHtml(post.content)} ${post.title || ""} ${post.name || ""} ${post.location || ""}`.toLowerCase();

      if (activeTag !== "all" && !text.includes(`#${activeTag}`)) return false;
      if (term && !text.includes(term)) return false;

      return true;
    });
  }, [posts, search, activeTag, creatorFilter]);

  const activeCreator = creators.find(
    (creator) => creator.userId === creatorFilter,
  );
  const filtersActive =
    Boolean(search.trim()) || activeTag !== "all" || Boolean(creatorFilter);

  const clearFilters = () => {
    setSearch("");
    setActiveTag("all");
    setCreatorFilter(null);
  };

  const handleUpdatePost = (next) => {
    setSelectedPost(next);
    setPosts((current) =>
      current.map((post) => (post.$id === next.$id ? next : post)),
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/2 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-night/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="PostGram" className="h-8 w-8 rounded-xl" />
            <span className="hidden font-display text-sm font-semibold text-white sm:block">
              PostGram
            </span>
          </Link>

          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-400 sm:inline-flex">
            <Compass className="h-3.5 w-3.5 text-cyan-300" />
            Explore
          </span>

          <UserSearch className="ml-auto hidden w-52 sm:block lg:w-64" />

          <Link
            to="/studio"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_-14px_rgba(168,85,247,0.9)] sm:ml-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create
          </Link>
        </div>

        <div className="border-t border-white/[0.05] px-4 py-2 sm:hidden">
          <UserSearch placeholder="Search creators or @username" />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 lg:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search captions, hashtags or creators"
            aria-label="Search explore"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTag("all")}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTag === "all"
                ? "border-violet-400/50 bg-violet-500/20 text-white"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            #All
          </button>

          {tags.map((tag) => {
            const id = tag.name.replace("#", "");
            const active = activeTag === id;
            return (
              <button
                key={tag.name}
                type="button"
                onClick={() => setActiveTag(active ? "all" : id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {tag.name}
                <span className="ml-1.5 tabular-nums text-slate-500">
                  {tag.count}
                </span>
              </button>
            );
          })}
        </div>

        {creators.length > 0 ? (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Trending creators
              </h2>
              {creatorFilter ? (
                <button
                  type="button"
                  onClick={() => setCreatorFilter(null)}
                  className="text-[11px] font-medium text-violet-300 transition hover:text-violet-200"
                >
                  Clear creator
                </button>
              ) : null}
            </div>

            <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto pb-2">
              {creators.map((creator) => {
                const isSelf = creator.userId === userData?.$id;
                const active = creatorFilter === creator.userId;
                return (
                  <button
                    key={creator.userId}
                    type="button"
                    onClick={() => navigate(`/profile/${creator.userId}`)}
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                    title={`View ${creator.name}'s profile`}
                  >
                    <span
                      className={`rounded-full p-[2px] transition ${
                        active
                          ? "bg-linear-to-br from-violet-400 via-fuchsia-400 to-cyan-400"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Avatar
                        name={creator.name}
                        src={
                          isSelf
                            ? avatarUrl(userData)
                            : creator.avatarUrl ||
                              (creator.avatarFileId
                                ? appwriteService.getFileView(
                                    creator.avatarFileId,
                                  )
                                : "")
                        }
                        size="lg"
                        className="ring-2 ring-night"
                      />
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-medium text-slate-400">
                      {isSelf ? "You" : creator.name}
                    </span>
                    {!isSelf && creator.username ? (
                      <span className="max-w-full truncate text-[9px] text-violet-300/80">
                        @{creator.username}
                      </span>
                    ) : null}
                    <span className="text-[9px] text-slate-600">
                      {creator.count} moment{creator.count === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-lg font-semibold tracking-tight text-white">
            {activeCreator ? `Moments by ${activeCreator.name}` : "All moments"}
          </h1>
          <span className="text-[11px] text-slate-500">
            {loading ? "Loading…" : `${visiblePosts.length} shown`}
          </span>

          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 px-3 py-1.5 font-medium transition hover:bg-rose-500/15"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-5">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-night-soft/70 p-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200">
              <Compass className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-white">
              No moments found
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              {filtersActive
                ? "Try a different search, hashtag or creator."
                : "Nothing has been published yet. Share the first moment."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {filtersActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
                >
                  Clear filters
                </button>
              ) : null}
              <Link
                to="/studio"
                className="rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-xs font-semibold text-white"
              >
                Open Studio
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-flow-dense grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-5">
              {visiblePosts.map((post, index) => {
                const featured = index % 7 === 0 && visiblePosts.length > 4;
                const isSelf = post.userId === userData?.$id;
                const authorProfile = profiles[post.userId];
                const likesSupported = "likes" in post;
                const commentsSupported =
                  commentsCollectionSupported !== false ||
                  "comments" in post;

                return (
                  <motion.button
                    key={post.$id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index, 10) * 0.025,
                    }}
                    className={`group relative overflow-hidden rounded-xl bg-night-soft text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 ${
                      featured
                        ? "col-span-2 row-span-2 aspect-square"
                        : "aspect-square"
                    }`}
                    aria-label={post.title || "Open moment"}
                  >
                    {post.featuredImage ? (
                      <img
                        src={appwriteService.getFileView(post.featuredImage)}
                        alt={post.title || "PostGram moment"}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 px-3 text-center text-xs font-semibold text-white">
                        {post.title || "Moment"}
                      </span>
                    )}

                    <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />

                    <span className="absolute inset-0 hidden flex-col items-center justify-center gap-2.5 opacity-0 transition group-hover:flex group-hover:opacity-100 group-focus-visible:flex group-focus-visible:opacity-100">
                      <Avatar
                        name={authorProfile?.name || post.name}
                        src={
                          isSelf
                            ? avatarUrl(userData)
                            : authorProfile?.avatarUrl ||
                              (authorProfile?.avatarFileId
                                ? appwriteService.getFileView(
                                    authorProfile.avatarFileId,
                                  )
                                : "")
                        }
                        size="md"
                        className="ring-2 ring-white/30"
                      />
                      <span className="flex items-center gap-3 text-xs font-semibold text-white">
                        {likesSupported ? (
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {Array.isArray(post.likes) ? post.likes.length : 0}
                          </span>
                        ) : null}
                        {commentsSupported ? (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {commentCountFor(post)}
                          </span>
                        ) : null}
                        {!likesSupported && !commentsSupported ? (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            {featured ? "Featured" : "Open"}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    {post.location ? (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-2.5 pb-2 pt-6 text-[10px] text-slate-200">
                        {post.location}
                      </span>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            {hasMore && !filtersActive ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more moments"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <AnimatePresence>
        {selectedPost ? (
          <ExplorePostModal
            post={selectedPost}
            user={userData}
            authorProfile={profiles[selectedPost.userId]}
            onClose={() => setSelectedPost(null)}
            onUpdate={handleUpdatePost}
          />
        ) : null}
      </AnimatePresence>

      <MobileDock user={userData} />
    </div>
  );
};

export default Explore;
