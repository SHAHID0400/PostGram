import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import { toUserMessage } from "../lib/errors";
import authService from "../Appwrite/Auth";
import { logout } from "../store/authSlice";
import logo from "../assets/plogo.png";
import PostCard from "../components/dashboard/PostCard";
import CreatePostModal from "../components/dashboard/CreatePostModal";
import UserSearch from "../components/search/UserSearch";
import {
  DashboardRail,
  DashboardSidebar,
  MobileDock,
} from "../components/dashboard/Sidebar";
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  FeedSkeleton,
  avatarUrl,
  stripHtml,
} from "../components/dashboard/ui";

const PAGE_SIZE = 8;

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const userData = useSelector((state) => state.auth?.userData);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const [myPostCount, setMyPostCount] = useState(null);
  const [feedTotal, setFeedTotal] = useState(null);
  const [creatorStats, setCreatorStats] = useState({});
  const [liveState, setLiveState] = useState("connecting");

  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const consumedStudioPostRef = useRef("");
  const consumedMineRef = useRef(false);

  useEffect(() => {
    if (userData?.$id) return;
    setMyPostCount(null);
  }, [userData?.$id]);

  // Real author post count for the sidebar.
  useEffect(() => {
    if (!userData?.$id) return undefined;

    let cancelled = false;
    appwriteService.getUserPostCount(userData.$id).then((count) => {
      if (!cancelled && typeof count === "number") setMyPostCount(count);
    });

    return () => {
      cancelled = true;
    };
  }, [userData?.$id, refreshKey]);

  // Newest-first feed straight from Appwrite.
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setPosts([]);
    setPage(0);
    setHasMore(false);

    appwriteService
      .listFeedPosts({
        limit: PAGE_SIZE,
        offset: 0,
        userId: authorFilter,
      })
      .then((result) => {
        if (cancelled) return;
        setPosts((current) => {
          const known = new Set(
            result.documents.map((document) => document.$id),
          );
          const streamed = current.filter((post) => !known.has(post.$id));

          return [...streamed, ...result.documents].sort(
            (first, second) =>
              new Date(second.$createdAt).getTime() -
              new Date(first.$createdAt).getTime(),
          );
        });
        setFeedTotal(result.total);
        setHasMore(result.documents.length === PAGE_SIZE);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          toUserMessage(
            err,
            "We couldn't reach the PostGram feed. Check your connection and try again.",
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorFilter, refreshKey]);

  // Live document stream — posts, likes and comments update without a reload.
  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    setLiveState("connecting");

    const handleEvent = (response) => {
      const events = response?.events || [];
      const document = response?.payload;
      if (!document?.$id) return;
      if (authorFilter && document.userId && document.userId !== authorFilter) {
        return;
      }

      const isCreate = events.some((event) => event.endsWith(".create"));
      const isUpdate = events.some((event) => event.endsWith(".update"));
      const isDelete = events.some((event) => event.endsWith(".delete"));

      setPosts((current) => {
        const withoutDocument = current.filter(
          (post) => post.$id !== document.$id,
        );

        if (isDelete) return withoutDocument;

        if (isCreate) {
          if (document.status && document.status !== "active") {
            return withoutDocument;
          }
          if (current.some((post) => post.$id === document.$id)) {
            return current.map((post) =>
              post.$id === document.$id ? { ...post, ...document } : post,
            );
          }
          return [document, ...current];
        }

        if (isUpdate) {
          if (document.status && document.status !== "active") {
            return withoutDocument;
          }
          return current.map((post) =>
            post.$id === document.$id ? { ...post, ...document } : post,
          );
        }

        return current;
      });
    };

    try {
      const subscription = appwriteService.subscribeToFeed(handleEvent);

      if (typeof subscription === "function") {
        unsubscribe = subscription;
        setLiveState("live");
      } else if (subscription && typeof subscription.then === "function") {
        subscription
          .then((stop) => {
            if (!active) {
              if (typeof stop === "function") stop();
              return;
            }
            unsubscribe = stop;
            setLiveState("live");
          })
          .catch(() => {
            if (active) setLiveState("offline");
          });
      } else {
        setLiveState("live");
      }
    } catch (subscriptionError) {
      setLiveState("offline");
    }

    return () => {
      active = false;
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (cleanupError) {
        // The socket is already closed.
      }
    };
  }, [authorFilter]);

  // Suggested creators come from real authors in the live feed.
  const creators = useMemo(() => {
    const map = new Map();

    posts.forEach((post) => {
      if (!post.userId || post.userId === userData?.$id) return;

      const existing = map.get(post.userId);
      if (existing) {
        existing.feedCount += 1;
      } else {
        map.set(post.userId, {
          userId: post.userId,
          name: post.name || "PostGram creator",
          feedCount: 1,
        });
      }
    });

    return [...map.values()]
      .sort((first, second) => second.feedCount - first.feedCount)
      .slice(0, 3);
  }, [posts, userData?.$id]);

  const creatorKey = creators.map((creator) => creator.userId).join("|");

  // Fetch each creator's real published-moment count.
  useEffect(() => {
    if (!creatorKey) {
      setCreatorStats({});
      return undefined;
    }

    let cancelled = false;
    const ids = creatorKey.split("|");

    Promise.all(
      ids.map(async (id) => [
        id,
        await appwriteService.getUserPostCount(id),
      ]),
    )
      .then((entries) => {
        if (cancelled) return;
        setCreatorStats((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }));
      })
      .catch(() => {
        // Counts stay hidden for creators that fail to load.
      });

    return () => {
      cancelled = true;
    };
  }, [creatorKey]);

  // Hashtags counted from real captions in the feed.
  const tags = useMemo(() => {
    const counts = new Map();

    posts.forEach((post) => {
      const text = `${stripHtml(post.content)} ${stripHtml(post.title)}`;
      const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
      matches.forEach((raw) => {
        const tag = raw.toLowerCase();
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter((post) =>
      [post.name, post.title, stripHtml(post.content)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [posts, search]);

  const uniqueCreatorCount = useMemo(
    () => new Set(posts.map((post) => post.userId).filter(Boolean)).size,
    [posts],
  );

  // Keep relative timestamps fresh.
  const [, setClock] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClock((value) => value + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const mineActive = Boolean(userData?.$id && authorFilter === userData.$id);
  const activeAuthorName = mineActive
    ? userData?.name || "you"
    : posts.find((post) => post.userId === authorFilter)?.name || "this creator";

  const handleLike = async (post, likes) => {
    const previous = post.likes;

    setPosts((current) =>
      current.map((item) =>
        item.$id === post.$id ? { ...item, likes } : item,
      ),
    );

    try {
      await appwriteService.updatePostLikes(post.$id, likes);
    } catch (likeError) {
      setPosts((current) =>
        current.map((item) =>
          item.$id === post.$id ? { ...item, likes: previous } : item,
        ),
      );
      setToast("Your like couldn't be saved. Please try again.");
    }
  };

  const handleComment = async (post, comments) => {
    const previous = post.comments;

    setPosts((current) =>
      current.map((item) =>
        item.$id === post.$id ? { ...item, comments } : item,
      ),
    );

    try {
      await appwriteService.updatePostComments(post.$id, comments);
    } catch (commentError) {
      setPosts((current) =>
        current.map((item) =>
          item.$id === post.$id ? { ...item, comments: previous } : item,
        ),
      );
      throw new Error("Couldn't save your comment. Please try again.");
    }
  };

  const handleDelete = (post) => setPendingDelete(post);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;

    const post = pendingDelete;
    setDeleting(true);
    const snapshot = posts;
    setPosts((current) => current.filter((item) => item.$id !== post.$id));

    try {
      const deleted = await appwriteService.deletePost(post.$id);
      if (deleted === false) throw new Error("Delete failed");

      if (post.featuredImage) {
        appwriteService.deleteFile(post.featuredImage).catch(() => {});
      }

      setMyPostCount((count) =>
        typeof count === "number" ? Math.max(0, count - 1) : count,
      );
      setFeedTotal((total) =>
        typeof total === "number" ? Math.max(0, total - 1) : total,
      );
      setToast("Moment deleted.");
      setPendingDelete(null);
    } catch (deleteError) {
      setPosts(snapshot);
      setToast("Couldn't delete this moment. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreated = (post) => {
    if (!authorFilter || authorFilter === post.userId) {
      setPosts((current) =>
        current.some((item) => item.$id === post.$id)
          ? current
          : [post, ...current],
      );
    }

    setMyPostCount((count) =>
      typeof count === "number" ? count + 1 : count,
    );
    setFeedTotal((total) =>
      typeof total === "number" ? total + 1 : total,
    );
    setToast("Your moment is live.");
  };

  // The Studio hands the freshly created document over through router state,
  // so the feed updates instantly instead of waiting for the realtime event.
  useEffect(() => {
    const created = routerLocation.state?.createdPost;
    const note = routerLocation.state?.note;
    if (!created?.$id || consumedStudioPostRef.current === created.$id) return;

    consumedStudioPostRef.current = created.$id;
    handleCreated(created);
    if (note) setToast(note);

    navigate(`${routerLocation.pathname}${routerLocation.search}`, {
      replace: true,
      state: null,
    });
    // handleCreated is stable enough for this one-shot handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    routerLocation.state,
    routerLocation.pathname,
    routerLocation.search,
    navigate,
  ]);

  // The mobile dock's "Moments" tab asks the feed to show only your posts.
  useEffect(() => {
    const wantsMine = routerLocation.state?.mine === "toggle";

    if (!wantsMine) {
      consumedMineRef.current = false;
      return;
    }

    if (!userData?.$id || consumedMineRef.current) return;

    consumedMineRef.current = true;
    setSearch("");
    setAuthorFilter((current) =>
      current === userData.$id ? null : userData.$id,
    );

    navigate(`${routerLocation.pathname}${routerLocation.search}`, {
      replace: true,
      state: null,
    });
  }, [
    routerLocation.state,
    routerLocation.pathname,
    routerLocation.search,
    userData?.$id,
    navigate,
  ]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.Logout();
    } catch (logoutError) {
      // Clear the local session even if Appwrite is unreachable.
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await appwriteService.listFeedPosts({
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
        userId: authorFilter,
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
      setToast("Couldn't load more moments. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilter = () => {
    setAuthorFilter(null);
    setSearch("");
  };

  const toggleMine = () => {
    if (mineActive) {
      clearFilter();
    } else {
      setAuthorFilter(userData?.$id ?? null);
    }
  };

  const liveBadge =
    liveState === "live"
      ? {
          label: "Live",
          className:
            "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
          dot: "bg-emerald-400",
        }
      : liveState === "offline"
        ? {
            label: "Sync paused",
            className: "border-white/10 bg-white/5 text-slate-400",
            dot: "bg-slate-500",
          }
        : {
            label: "Connecting",
            className: "border-white/10 bg-white/5 text-slate-400",
            dot: "bg-amber-400 animate-pulse",
          };

  return (
    <div className="relative min-h-screen bg-night text-slate-200">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-70"
      >
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <DashboardSidebar
        user={userData}
        postCount={myPostCount}
        onCreate={() => setComposerOpen(true)}
        onShowMine={toggleMine}
        mineActive={mineActive}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        onEditProfile={() => navigate("/profile")}
      />

      <div className="relative lg:pl-60 xl:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-night/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="flex items-center gap-2 lg:hidden"
              aria-label="PostGram home"
            >
              <img
                src={logo}
                alt=""
                className="h-8 w-8 rounded-full object-contain ring-1 ring-white/15"
              />
              <span className="font-display text-base font-semibold text-white">
                <span className="hidden sm:inline">PostGram</span>
              </span>
            </Link>

            <div className="ml-auto hidden items-center gap-2 md:flex">
              <UserSearch className="w-52 lg:w-64" />
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${liveBadge.className}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${liveBadge.dot}`}
                />
                {liveBadge.label}
              </span>
            </div>

            <Link
              to="/profile"
              className="rounded-full p-[2px] transition bg-white/15 hover:bg-white/30"
              aria-label="Open your profile"
              title="Your profile"
            >
              <Avatar
                name={userData?.name}
                src={avatarUrl(userData)}
                size="sm"
                className="ring-2 ring-night"
              />
            </Link>

            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(168,85,247,0.9)] transition hover:scale-[1.02] md:ml-0"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:text-rose-200 disabled:opacity-50 lg:hidden"
              aria-label="Sign out"
              title="Sign out"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="border-t border-white/[0.05] px-4 py-2 md:hidden">
            <UserSearch placeholder="Search creators or @username" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mt-1 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <main className="mx-auto w-full max-w-2xl xl:mx-0">
              <section className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={userData?.name}
                    src={avatarUrl(userData)}
                    size="md"
                  />
                  <button
                    type="button"
                    onClick={() => setComposerOpen(true)}
                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-slate-300"
                  >
                    Share a moment with PostGram…
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(true)}
                    disabled={!userData?.$id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Post</span>
                  </button>
                </div>
              </section>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-xl font-semibold tracking-tight text-white">
                  {mineActive
                    ? "My moments"
                    : authorFilter
                      ? `Moments by ${activeAuthorName}`
                      : "Home feed"}
                </h1>

                <span className="text-xs text-slate-500">
                  {loading
                    ? "Loading…"
                    : `${visiblePosts.length} loaded${
                        hasMore ? "+" : ""
                      }`}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRefreshKey((key) => key + 1)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
                    aria-label="Refresh feed"
                    title="Refresh feed"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </button>
                  <div className="relative hidden md:block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search"
                      aria-label="Search feed"
                      className="w-40 rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:outline-none lg:w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={clearFilter}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    !authorFilter
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={toggleMine}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    mineActive
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  My moments
                </button>

                {authorFilter && !mineActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    {activeAuthorName}
                    <button
                      type="button"
                      onClick={clearFilter}
                      aria-label="Clear creator filter"
                      className="text-cyan-300 transition hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : null}

                {liveState === "offline" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <WifiOff className="h-3.5 w-3.5" />
                    Live sync paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Wifi className="h-3.5 w-3.5" />
                    Realtime feed
                  </span>
                )}
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  <span className="min-w-0 flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((key) => key + 1)}
                    className="rounded-full border border-rose-300/30 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              <div className="mt-5 space-y-5 pb-28 lg:pb-16">
                {loading ? (
                  <FeedSkeleton />
                ) : visiblePosts.length > 0 ? (
                  <>
                    {visiblePosts.map((post) => (
                      <PostCard
                        key={post.$id}
                        post={post}
                        user={userData}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={handleDelete}
                      />
                    ))}

                    {hasMore ? (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          {loadingMore ? "Loading…" : "Load more moments"}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : search.trim() ? (
                  <div className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-8 text-center">
                    <p className="text-sm text-slate-300">
                      No moments match “{search.trim()}”.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-3 text-xs font-medium text-violet-300 transition hover:text-violet-200"
                    >
                      Clear search
                    </button>
                  </div>
                ) : authorFilter ? (
                  <EmptyState
                    title={
                      mineActive
                        ? "You haven't posted yet"
                        : "No moments from this creator"
                    }
                    description={
                      mineActive
                        ? "Publish your first moment and it will appear here instantly."
                        : "This creator hasn't shared an active moment yet."
                    }
                    onCreate={mineActive ? () => setComposerOpen(true) : undefined}
                    actionLabel="Create moment"
                  />
                ) : (
                  <EmptyState
                    title="The feed is waiting for you"
                    description="No one has published yet. Share the first real moment on PostGram."
                    onCreate={() => setComposerOpen(true)}
                    actionLabel="Create moment"
                  />
                )}
              </div>
            </main>

            <DashboardRail
              user={userData}
              stats={{
                myPosts: myPostCount,
                feedTotal,
                creators: uniqueCreatorCount,
              }}
              creators={creators}
              creatorStats={creatorStats}
              tags={tags}
              activeAuthor={authorFilter}
              onSelectAuthor={(id) => {
                setSearch("");
                setAuthorFilter(id);
              }}
              onClearAuthor={clearFilter}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {composerOpen ? (
        <CreatePostModal
          user={userData}
          onClose={() => setComposerOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}

      <MobileDock user={userData} mineActive={mineActive} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        loading={deleting}
        title="Delete this moment?"
        description="This removes the post and its photo permanently. This can't be undone."
        confirmLabel="Delete moment"
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="feed-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed bottom-24 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#0d1120] px-4 py-2.5 text-xs font-medium text-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] lg:bottom-5"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
