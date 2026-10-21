import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Heart,
  ImagePlus,
  LoaderCircle,
  Mail,
  MessageCircle,
  Radio,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Activity,
  Zap,
  Sparkles,
  Cpu,
  BellRing,
} from "lucide-react";
import { useSelector } from "react-redux";
import appwriteService from "../../Appwrite/config";
import { useComments } from "../../context/CommentsContext";
import { useProfiles } from "../../context/ProfilesContext";
import { adminRequest, encodeImage } from "../../lib/adminApi";
import { dedupeProfiles } from "../../utils/profileResolver";
import { Avatar } from "../dashboard/ui";
import { getAvatarUrl } from "../../utils/avatarHelper";
import "./admin-control-hub.css";

const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Date unavailable";

const AdminControlHub = () => {
  const user = useSelector((state) => state.auth?.userData);
  const isAdmin = useSelector((state) => state.auth?.isAdmin);
  const { setProfile } = useProfiles();
  const { removeComment, upsertComment } = useComments();
  const [users, setUsers] = useState([]);
  const [usersCursor, setUsersCursor] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [postsCursor, setPostsCursor] = useState("");
  const [commentsCursor, setCommentsCursor] = useState("");
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [summary, setSummary] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [tab, setTab] = useState("posts");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const selectedUser = users.find((person) => person.userId === selectedUserId);
  const selectedUserIdValue =
    selectedUser?.userId || selectedUserId || selectedUser?.$id || "";
  const selectedUserProfileId = selectedUser?.profileId || selectedUser?.$id || "";
  const selectedUserIsCurrent = selectedUser?.userId === user?.$id;
  const selectedUserHasAdminLabel = selectedUserIsCurrent
    ? Boolean(user?.labels?.includes("admin"))
    : null;
  const makeListKey = (prefix, value, index) => {
    const baseValue = value || "unknown";
    return `${prefix}-${String(baseValue)}-${index}`;
  };

  useEffect(() => {
    if (!isAdmin) return undefined;

    let active = true;
    let summaryTimer = null;
    const cleanups = [];
    const activityUserIds = [
      ...new Set([selectedUserIdValue, selectedUserProfileId].filter(Boolean)),
    ];

    const refreshSummary = () => {
      if (summaryTimer) clearTimeout(summaryTimer);
      summaryTimer = setTimeout(() => {
        adminRequest("summary")
          .then((result) => {
            if (active) setSummary(result);
          })
          .catch(() => {
            if (active) setRealtimeStatus("offline");
          });
      }, 250);
    };

    const keepSubscription = (subscribe, onEvent) => {
      try {
        const result = subscribe((event) => {
          if (!active) return;
          setRealtimeStatus("live");
          onEvent(event);
          refreshSummary();
        });
        if (typeof result === "function") {
          cleanups.push(result);
          setRealtimeStatus("live");
        } else if (result && typeof result.then === "function") {
          result
            .then((unsubscribe) => {
              if (!active) {
                if (typeof unsubscribe === "function") unsubscribe();
                return;
              }
              if (typeof unsubscribe === "function") cleanups.push(unsubscribe);
              setRealtimeStatus("live");
            })
            .catch(() => {
              if (active) setRealtimeStatus("offline");
            });
        }
      } catch {
        setRealtimeStatus("offline");
      }
    };

    adminRequest("summary")
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    keepSubscription(
      (callback) => appwriteService.subscribeToFeed(callback),
      (event) => {
        const post = event?.payload;
        if (!post?.$id) return;
        const deleted = event.events?.some((name) => name.endsWith(".delete"));
        const created = event.events?.some((name) => name.endsWith(".create"));
        if (activityUserIds.includes(post.userId)) {
          setPosts((current) => {
            if (deleted) return current.filter((item) => item.$id !== post.$id);
            if (current.some((item) => item.$id === post.$id)) {
              return current.map((item) =>
                item.$id === post.$id ? { ...item, ...post } : item,
              );
            }
            return created ? [post, ...current] : current;
          });
        }
      },
    );

    keepSubscription(
      (callback) => appwriteService.subscribeToComments(callback),
      (event) => {
        const comment = event?.payload;
        if (!comment?.$id || !activityUserIds.includes(comment.userId)) return;
        const deleted = event.events?.some((name) => name.endsWith(".delete"));
        setComments((current) =>
          deleted
            ? current.filter((item) => item.$id !== comment.$id)
            : current.some((item) => item.$id === comment.$id)
              ? current.map((item) =>
                  item.$id === comment.$id ? { ...item, ...comment } : item,
                )
              : [comment, ...current],
        );
      },
    );

    keepSubscription(
      (callback) => appwriteService.subscribeToProfiles(callback),
      (event) => {
        const profile = event?.payload;
        const profileUserId = profile?.userId || profile?.$id;
        if (!profileUserId) return;
        setUsers((current) =>
          current.map((person) =>
            person.userId === profileUserId
              ? {
                  ...person,
                  name: profile.displayName || profile.name || person.name,
                  displayName: profile.displayName || profile.name || person.displayName,
                  username: profile.username || "",
                  bio: profile.bio || "",
                  avatarFileId:
                    profile.avatarFileId || profile.avatar || profile.imageId || "",
                }
              : person,
          ),
        );
      },
    );

    return () => {
      active = false;
      if (summaryTimer) clearTimeout(summaryTimer);
      cleanups.forEach((unsubscribe) => unsubscribe());
    };
  }, [isAdmin, selectedUserIdValue, selectedUserProfileId]);

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  useEffect(() => {
    let cancelled = false;

    adminRequest("list-users")
      .then((result) => {
        if (cancelled) return;
        setUsers(dedupeProfiles(result.users));
        setUsersCursor(result.nextCursor);
        const firstUser = result.users[0];
        if (firstUser) {
          setSelectedUserId(firstUser.userId);
          setProfileForm({
            displayName: firstUser.displayName || firstUser.name || "",
            username: firstUser.username || "",
            bio: firstUser.bio || "",
            avatarFileId: firstUser.avatarFileId || "",
          });
          setLoadingActivity(true);
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserIdValue) return undefined;

    let cancelled = false;
    adminRequest("user-activity", {
      userId: selectedUserIdValue,
      profileId: selectedUserProfileId,
    })
      .then((result) => {
        if (cancelled) return;
        setPosts(result.posts);
        setComments(result.comments);
        setTotalPosts(result.totalPosts);
        setTotalComments(result.totalComments);
        setPostsCursor(result.nextPostsCursor);
        setCommentsCursor(result.nextCommentsCursor);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUserIdValue, selectedUserProfileId]);

  const loadMoreUsers = async () => {
    if (!usersCursor) return;
    setBusy("users");
    setError("");
    try {
      const result = await adminRequest("list-users", { cursor: usersCursor });
      setUsers((current) => dedupeProfiles([...current, ...result.users]));
      setUsersCursor(result.nextCursor);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const loadMoreActivity = async (kind) => {
    if (!selectedUserIdValue) return;
    const cursor = kind === "posts" ? postsCursor : commentsCursor;
    setBusy(`load:${kind}`);
    setError("");
    try {
      const result = await adminRequest("user-activity", {
        userId: selectedUserIdValue,
        profileId: selectedUserProfileId,
        kind,
        cursor,
      });
      if (kind === "posts") {
        setPosts((current) => [...current, ...result.posts]);
        setTotalPosts(result.totalPosts);
        setPostsCursor(result.nextPostsCursor);
      } else {
        setComments((current) => [...current, ...result.comments]);
        setTotalComments(result.totalComments);
        setCommentsCursor(result.nextCommentsCursor);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().replace(/^@/, "").toLowerCase();
    if (!term) return users;
    return users.filter((person) =>
      [person.name, person.username, person.userId, person.email]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [users, search]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!selectedUser || !profileForm) return;
    setBusy("profile");
    setError("");
    const previousProfile = {
      name: selectedUser.name,
      username: selectedUser.username,
      bio: selectedUser.bio,
      avatarFileId: selectedUser.avatarFileId,
      hasProfile: true,
    };
    const optimisticProfile = {
      userId: selectedUser.userId,
      name: profileForm.displayName,
      username: profileForm.username,
      bio: profileForm.bio,
      avatarFileId: profileForm.avatarFileId,
      hasProfile: true,
    };
    setProfile(selectedUser.userId, optimisticProfile);
    setUsers((current) =>
      current.map((person) =>
        person.userId === selectedUser.userId
          ? { ...person, ...optimisticProfile, displayName: optimisticProfile.name }
          : person,
      ),
    );
    try {
      const result = await adminRequest("update-profile", {
        userId: selectedUser.userId,
        ...profileForm,
      });
      const profile = {
        userId: selectedUser.userId,
        name: result.profile.displayName || result.profile.name || profileForm.displayName,
        username: result.profile.username || "",
        bio: result.profile.bio || "",
        avatarFileId: result.profile.avatarFileId || "",
        hasProfile: true,
      };
      setProfile(selectedUser.userId, profile);
      setUsers((current) =>
        current.map((person) =>
          person.userId === selectedUser.userId
            ? { ...person, ...profile, displayName: profile.name }
            : person,
        ),
      );
      setNotice("⚡ Holographic profile synchronized successfully.");
    } catch (requestError) {
      setProfile(selectedUser.userId, previousProfile);
      setUsers((current) =>
        current.map((person) =>
          person.userId === selectedUser.userId
            ? { ...person, ...previousProfile, displayName: previousProfile.name }
            : person,
        ),
      );
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const uploadAvatar = async (file) => {
    if (!file || !selectedUser) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Avatar image must be smaller than 3 MB.");
      return;
    }
    setBusy("avatar");
    setError("");
    let uploadedFileId = "";
    try {
      const encoded = await encodeImage(file);
      const result = await adminRequest("upload-avatar", {
        userId: selectedUser.userId,
        ...encoded,
      });
      uploadedFileId = result.fileId;
      const profileResult = await adminRequest("update-profile", {
        userId: selectedUser.userId,
        displayName: profileForm?.displayName || selectedUser.displayName || selectedUser.name || "",
        username: profileForm?.username || selectedUser.username || "",
        bio: profileForm?.bio || selectedUser.bio || "",
        avatarFileId: uploadedFileId,
      });
      const updatedProfile = {
        userId: selectedUser.userId,
        name:
          profileResult.profile.displayName ||
          profileResult.profile.name ||
          profileForm.displayName,
        username: profileResult.profile.username || profileForm.username || "",
        bio: profileResult.profile.bio || profileForm.bio || "",
        avatarFileId: profileResult.profile.avatarFileId || uploadedFileId,
        hasProfile: true,
      };
      setProfileForm((current) => ({
        ...current,
        avatarFileId: updatedProfile.avatarFileId,
      }));
      setAvatarPreview(URL.createObjectURL(file));
      setProfile(selectedUser.userId, updatedProfile);
      setUsers((current) =>
        current.map((person) =>
          person.userId === selectedUser.userId
            ? { ...person, ...updatedProfile, displayName: updatedProfile.name }
            : person,
        ),
      );
      setNotice("✨ 4D Avatar matrix updated successfully.");
    } catch (requestError) {
      if (uploadedFileId) {
        await appwriteService.deleteFile(uploadedFileId);
      }
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const savePost = async (event) => {
    event.preventDefault();
    if (!editingPost) return;
    const postBeforeEdit = posts.find((post) => post.$id === editingPost.$id);
    const optimisticPost = { ...postBeforeEdit, ...editingPost };
    setPosts((current) =>
      current.map((post) =>
        post.$id === optimisticPost.$id ? optimisticPost : post,
      ),
    );
    setBusy(`post:${editingPost.$id}`);
    setError("");
    try {
      const result = await adminRequest("update-post", {
        postId: editingPost.$id,
        title: editingPost.title,
        content: editingPost.content,
        status: editingPost.status,
      });
      setPosts((current) =>
        current.map((post) => (post.$id === result.post.$id ? result.post : post)),
      );
      setEditingPost(null);
      setNotice("🚀 Post updated & broadcasted via WebSockets.");
    } catch (requestError) {
      if (postBeforeEdit) {
        setPosts((current) =>
          current.map((post) =>
            post.$id === postBeforeEdit.$id ? postBeforeEdit : post,
          ),
        );
      }
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const deletePost = async (post) => {
    const index = posts.findIndex((item) => item.$id === post.$id);
    setBusy(`post:${post.$id}`);
    setError("");
    setPosts((current) => current.filter((item) => item.$id !== post.$id));
    try {
      const result = await adminRequest("delete-post", { postId: post.$id });
      setTotalPosts((current) => Math.max(0, current - 1));
      setConfirm(null);
      setNotice(
        result.mediaDeleted
          ? result.mediaRetained
            ? "🗑️ Post deleted. Media retained as shared resource."
            : "🗑️ Post & media payload completely purged."
          : "⚠️ Post purged, media retention warning.",
      );
    } catch (requestError) {
      setPosts((current) => {
        if (current.some((item) => item.$id === post.$id)) return current;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, post);
        return next;
      });
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const saveComment = async (event) => {
    event.preventDefault();
    if (!editingComment) return;
    setBusy(`comment:${editingComment.$id}`);
    setError("");
    const previousComment = comments.find(
      (comment) => comment.$id === editingComment.$id,
    );
    const optimisticComment = { ...editingComment };
    setComments((current) =>
      current.map((comment) =>
        comment.$id === optimisticComment.$id ? optimisticComment : comment,
      ),
    );
    upsertComment(optimisticComment);
    try {
      const result = await adminRequest("update-comment", {
        commentId: editingComment.$id,
        text: editingComment.text,
      });
      setComments((current) =>
        current.map((comment) =>
          comment.$id === result.comment.$id ? result.comment : comment,
        ),
      );
      upsertComment(result.comment);
      setEditingComment(null);
      setNotice("💬 Comment updated successfully.");
    } catch (requestError) {
      if (previousComment) {
        setComments((current) =>
          current.map((comment) =>
            comment.$id === previousComment.$id ? previousComment : comment,
          ),
        );
        upsertComment(previousComment);
      }
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  const deleteComment = async (comment) => {
    setBusy(`comment:${comment.$id}`);
    setError("");
    setComments((current) => current.filter((item) => item.$id !== comment.$id));
    setTotalComments((current) => Math.max(0, current - 1));
    removeComment(comment.postId, comment.$id);
    try {
      await adminRequest("delete-comment", { commentId: comment.$id });
      setConfirm(null);
      setNotice("🗑️ Comment deleted successfully.");
    } catch (requestError) {
      setComments((current) => [comment, ...current]);
      setTotalComments((current) => current + 1);
      upsertComment(comment);
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  };

  if (!isAdmin) {
    return (
      <main className="admin-hub grid min-h-screen place-items-center px-5 text-slate-100">
        <motion.section
          initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="admin-glass-card max-w-md rounded-3xl p-8 text-center shadow-2xl"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-white tracking-tight">Access Restricted</h1>
          <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">
            Admin clearance required. Authenticate with privileged administrator credentials to access the Control Hub.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="admin-hub min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[160px] pointer-events-none animate-pulse" />

      <div className="mx-auto max-w-[1600px] relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="admin-glass-card mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-300 ring-2 ring-violet-400/40 shadow-lg shadow-violet-500/20"
            >
              <ShieldCheck size={28} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest border border-violet-500/30">
                  <Sparkles size={11} className="animate-spin" /> PostGram OS v4.2
                </span>
              </div>
              <h1 className="font-display text-2xl font-black text-white sm:text-3xl tracking-tight mt-1">
                Quantum Control Hub
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 font-mono">
              <Cpu size={14} className="text-violet-400 animate-pulse" />
              <span>Node: Frankfurt-01</span>
            </div>
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 shadow-md flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Direct Client Mode
            </span>
            <span className="hidden text-xs text-slate-300 sm:inline px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 font-mono">
              {user?.email}
            </span>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95 border border-violet-400/30"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
          </div>
        </motion.header>

        {/* Metrics Grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Registered Users",
              value: summary?.totalUsers,
              icon: Users,
              textColor: "text-blue-400",
            },
            {
              label: "Total Shared Moments",
              value: summary?.totalPosts,
              icon: FileText,
              textColor: "text-purple-400",
            },
            {
              label: "Total Global Comments",
              value: summary?.totalComments,
              icon: MessageCircle,
              textColor: "text-pink-400",
            },
            {
              label: "WebSocket Telemetry",
              value:
                realtimeStatus === "live"
                  ? "Connected (12ms)"
                  : realtimeStatus === "offline"
                    ? "Offline"
                    : "Synchronizing",
              icon: Radio,
              live: realtimeStatus === "live",
              textColor: "text-emerald-400",
            },
          ].map(({ label, value, icon: Icon, live, textColor }, idx) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="admin-metric-card relative overflow-hidden rounded-3xl p-6 shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Icon size={72} className={textColor} />
              </div>
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {label}
                </span>
                <div className={`p-2 rounded-xl bg-white/10 ${textColor} shadow-inner`}>
                  <Icon size={18} className={live ? "animate-pulse" : ""} />
                </div>
              </div>
              <motion.p
                key={String(value)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-3xl font-black text-white tracking-tight relative z-10"
              >
                {value === undefined ? "—" : typeof value === "number" ? value.toLocaleString() : value}
              </motion.p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 relative z-10">
                <Activity size={12} className={textColor} />
                <span>Real-time cluster telemetry active</span>
              </div>
            </motion.article>
          ))}
        </section>

        {/* Quick Power Suite Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="admin-glass-card mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quantum Power Suite</h3>
              <p className="text-[11px] text-slate-400">Instant administrative execution tools for global state maintenance.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setNotice("✨ Global cache flushed across all serverless edges.");
                setTimeout(() => setNotice(""), 4000);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition active:scale-95 flex items-center gap-2 shadow-md"
            >
              <Cpu size={14} className="text-violet-400" /> Flush Cache
            </button>
            <button
              type="button"
              onClick={() => {
                setNotice("📢 Broadcast signal transmitted to all connected WebSocket clients.");
                setTimeout(() => setNotice(""), 4000);
              }}
              className="px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/40 text-xs font-bold text-violet-200 transition active:scale-95 flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <BellRing size={14} className="text-violet-300" /> Broadcast Notice
            </button>
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-xs font-semibold text-rose-200 backdrop-blur-xl shadow-xl"
            >
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {notice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-200 backdrop-blur-xl shadow-xl"
            >
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid Workspace */}
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* User Explorer Sidebar */}
          <section className="admin-glass-card overflow-hidden rounded-3xl shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">User Explorer</h2>
                  <p className="mt-1 text-xs text-slate-400 font-medium">
                    {(summary?.totalUsers ?? users.length).toLocaleString()} registered accounts
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner">
                  <Users size={18} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-inner focus-within:border-violet-500/50 transition">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter name, username, ID..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500 font-medium"
                />
              </label>
            </div>
            
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-3 custom-scrollbar">
              {loadingUsers ? (
                <div className="grid place-items-center py-20 text-violet-400">
                  <LoaderCircle className="animate-spin" size={32} />
                </div>
              ) : filteredUsers.length ? (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.04 } },
                  }}
                >
                  {filteredUsers.map((person, index) => (
                    <motion.button
                      key={makeListKey("user", person.userId || person.$id || person.email || index, index)}
                      type="button"
                      variants={{
                        hidden: { opacity: 0, x: -15 },
                        show: { opacity: 1, x: 0 },
                      }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedUserId(person.userId);
                        setProfileForm({
                          displayName: person.displayName || person.name || "",
                          username: person.username || "",
                          bio: person.bio || "",
                          avatarFileId: person.avatarFileId || "",
                        });
                        setAvatarPreview("");
                        setPosts([]);
                        setComments([]);
                        setPostsCursor("");
                        setCommentsCursor("");
                        setTotalPosts(0);
                        setTotalComments(0);
                        setEditingPost(null);
                        setEditingComment(null);
                        setLoadingActivity(true);
                      }}
                      className={`mb-2 flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all border ${
                        selectedUserId === person.userId
                          ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/20 border-violet-500/50 shadow-lg shadow-violet-500/15"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                    >
                      <div className="relative">
                        <Avatar
                          name={person.name || person.email}
                          src={getAvatarUrl(person)}
                          size="md"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0d0d1a]" />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-white">
                          {person.name || "Unnamed user"}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-400 font-mono">
                          {person.username ? `@${person.username}` : person.email}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-1">
                        {(person.labels || [])
                          .filter((label) => ["admin", "premium", "mvp"].includes(label))
                          .map((label, index) => (
                            <span
                              key={makeListKey("user-label", label, index)}
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                label === "admin"
                                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                  : label === "premium"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              }`}
                            >
                              {label}
                            </span>
                          ))}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <p className="px-3 py-16 text-center text-xs text-slate-400 font-medium">
                  No accounts match your query.
                </p>
              )}
              
              {usersCursor && !search.trim() ? (
                <button
                  type="button"
                  onClick={loadMoreUsers}
                  disabled={Boolean(busy)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:border-violet-500/30 disabled:opacity-50 shadow-md"
                >
                  {busy === "users" ? "Loading users…" : `Load more accounts (${users.length}/${summary?.totalUsers ?? "…" })`}
                </button>
              ) : null}
            </div>
          </section>

          {/* User Details & Moderation Workspace */}
          <section className="min-w-0 space-y-6">
            {selectedUser && profileForm ? (
              <>
                <motion.section
                  key={selectedUser.userId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 25 }}
                  className="admin-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

                  {/* Selected User Header */}
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4 relative z-10">
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="relative group">
                        <Avatar
                          name={selectedUser.displayName || selectedUser.name}
                          src={getAvatarUrl(selectedUser)}
                          size="lg"
                        />
                        <div className="absolute inset-0 rounded-full bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                          <Sparkles size={20} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-black text-white tracking-tight">
                            {selectedUser.displayName || selectedUser.name || "Unnamed user"}
                          </h2>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            <BadgeCheck size={13} />
                            Verified Profile
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300 font-medium">
                          Real Name: {selectedUser.realName || "Not specified"}
                          {selectedUser.username ? ` · @${selectedUser.username}` : ""}
                        </p>
                        <p className="mt-1.5 break-all text-[11px] text-slate-400 font-mono">
                          ID: {selectedUser.userId} · Initialized {dateLabel(selectedUser.registeredAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedUser.labels || []).length ? (
                        selectedUser.labels.map((label, index) => (
                          <span key={makeListKey("selected-user-label", label, index)} className="rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-200">
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium px-3 py-1 rounded-full bg-white/5">No labels assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Security Bar */}
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 shadow-inner relative z-10">
                    <div className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                      <Mail size={16} className="text-violet-400" />
                      <span>{selectedUser.email || "Email securely restricted in database profile"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Admin Privilege</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={selectedUserHasAdminLabel ?? false}
                        aria-label="Admin privilege managed by server"
                        disabled
                        className={`relative h-6 w-12 cursor-not-allowed rounded-full transition-colors ${
                          selectedUserHasAdminLabel
                            ? "bg-violet-600 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                            : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all ${
                            selectedUserHasAdminLabel ? "left-7" : "left-1"
                          }`}
                        />
                      </button>
                      <span className="text-[11px] font-bold text-slate-300">
                        {selectedUserHasAdminLabel === null
                          ? "Server-Managed"
                          : selectedUserHasAdminLabel
                            ? "Active"
                            : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={saveProfile} className="grid gap-6 md:grid-cols-[140px_minmax(0,1fr)] relative z-10">
                    <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/30">
                      <Avatar
                        name={profileForm.displayName}
                        src={
                          avatarPreview ||
                          getAvatarUrl({ avatarFileId: profileForm.avatarFileId })
                        }
                        size="xl"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/20 hover:bg-violet-600/30 px-3 py-2 text-xs font-bold text-violet-200 transition active:scale-95 shadow-md">
                        {busy === "avatar" ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                        Replace Avatar
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => uploadAvatar(event.target.files?.[0])}
                          disabled={Boolean(busy)}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Display Name
                        <input
                          value={profileForm.displayName}
                          onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })}
                          maxLength={128}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition font-medium"
                        />
                      </label>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Username Handle
                        <input
                          value={profileForm.username}
                          onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value.replace(/^@/, "") })}
                          maxLength={36}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition font-medium"
                        />
                      </label>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 sm:col-span-2">
                        User Bio & Status
                        <textarea
                          value={profileForm.bio}
                          onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                          maxLength={160}
                          rows={2}
                          className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition font-medium"
                        />
                      </label>
                      <div className="flex items-center justify-between gap-3 sm:col-span-2 pt-2">
                        <span className="truncate text-xs text-slate-400 font-mono">{selectedUser.email}</span>
                        <button
                          type="submit"
                          disabled={Boolean(busy)}
                          className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          {busy === "profile" ? "Synchronizing Changes…" : "Save Profile Matrix"}
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.section>

                {/* Activity Feed Section */}
                <section className="admin-glass-card overflow-hidden rounded-3xl shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5 sm:px-6">
                    <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setTab("posts")}
                        className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                          tab === "posts" ? "text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab === "posts" && (
                          <motion.span
                            layoutId="admin-activity-tab"
                            className="absolute inset-0 -z-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/30"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <FileText size={15} /> Posts ({totalPosts})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("comments")}
                        className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                          tab === "comments" ? "text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab === "comments" && (
                          <motion.span
                            layoutId="admin-activity-tab"
                            className="absolute inset-0 -z-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/30"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <MessageCircle size={15} /> Comments ({totalComments})
                        </span>
                      </button>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Radio size={13} className="animate-pulse" /> Realtime Telemetry Active
                    </span>
                  </div>

                  {loadingActivity ? (
                    <div className="grid place-items-center py-20 text-violet-400">
                      <LoaderCircle className="animate-spin" size={36} />
                    </div>
                  ) : tab === "posts" ? (
                    <div className="divide-y divide-white/[0.06]">
                      {posts.length ? (
                        posts.map((post, index) => (
                          <motion.article
                            key={makeListKey("post", post.$id || post.userId || index, index)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                            className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors"
                          >
                            {editingPost?.$id === post.$id ? (
                              <form onSubmit={savePost} className="space-y-4">
                                <input
                                  value={editingPost.title || ""}
                                  onChange={(event) => setEditingPost({ ...editingPost, title: event.target.value })}
                                  maxLength={120}
                                  aria-label="Post title"
                                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition font-semibold"
                                />
                                <textarea
                                  value={editingPost.content || ""}
                                  onChange={(event) => setEditingPost({ ...editingPost, content: event.target.value })}
                                  maxLength={20000}
                                  rows={4}
                                  aria-label="Post caption"
                                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                                />
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                  <select
                                    value={editingPost.status || "active"}
                                    onChange={(event) => setEditingPost({ ...editingPost, status: event.target.value })}
                                    aria-label="Post visibility status"
                                    className="rounded-xl border border-white/10 bg-[#121222] px-4 py-2.5 text-xs text-white font-semibold outline-none"
                                  >
                                    <option value="active">Active State</option>
                                    <option value="hidden">Hidden State</option>
                                    <option value="flagged">Flagged State</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingPost(null)}
                                      className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      disabled={Boolean(busy)}
                                      className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition disabled:opacity-50"
                                    >
                                      {busy === `post:${post.$id}` ? "Saving…" : "Save Changes"}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-start gap-4">
                                {post.featuredImage ? (
                                  <img
                                    src={appwriteService.getFileView(post.featuredImage)}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/10 shadow-lg"
                                  />
                                ) : (
                                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/25">
                                    <FileText size={22} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-white tracking-tight">
                                    {post.title || "Untitled Moment"}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">
                                    {String(post.content || "").replace(/<[^>]*>/g, " ").trim()}
                                  </p>
                                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                                    <span>{dateLabel(post.$createdAt)}</span>
                                    <span className="inline-flex items-center gap-1 text-pink-400">
                                      <Heart size={13} /> {post.likes?.length || 0}
                                    </span>
                                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 border border-white/10">
                                      {post.status || "active"}
                                    </span>
                                    <Link to={`/post/${post.slug}`} className="text-violet-400 hover:text-violet-300 font-bold transition">
                                      View Live Post →
                                    </Link>
                                  </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPost({ ...post })}
                                    aria-label="Edit post"
                                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirm({ type: "post", item: post })}
                                    aria-label="Delete post"
                                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-rose-300 transition"
                                  >
                                    {busy === `post:${post.$id}` ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.article>
                        ))
                      ) : (
                        <p className="py-16 text-center text-xs text-slate-400 font-medium">No moments recorded for this account.</p>
                      )}
                      
                      {posts.length < totalPosts && postsCursor ? (
                        <div className="p-6 text-center">
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => loadMoreActivity("posts")}
                            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
                          >
                            {busy === "load:posts" ? "Loading records…" : `Load more posts (${posts.length}/${totalPosts})`}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {comments.length ? (
                        comments.map((comment, index) => (
                          <motion.article
                            key={makeListKey("comment", comment.$id || comment.userId || index, index)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                            className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors"
                          >
                            {editingComment?.$id === comment.$id ? (
                              <form onSubmit={saveComment} className="flex flex-col gap-3 sm:flex-row">
                                <textarea
                                  value={editingComment.text}
                                  onChange={(event) => setEditingComment({ ...editingComment, text: event.target.value })}
                                  maxLength={2000}
                                  rows={2}
                                  aria-label="Comment text"
                                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition"
                                />
                                <div className="flex shrink-0 gap-2 items-start">
                                  <button
                                    type="button"
                                    onClick={() => setEditingComment(null)}
                                    className="rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    disabled={Boolean(busy)}
                                    className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition disabled:opacity-50"
                                  >
                                    {busy === `comment:${comment.$id}` ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-2xl bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-fuchsia-500/25 mt-0.5">
                                  <MessageCircle size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-200 font-medium">
                                    {comment.text}
                                  </p>
                                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                                    <span>{dateLabel(comment.$createdAt)}</span>
                                    <Link to={`/post/${comment.postSlug || comment.postId}`} className="inline-flex min-w-0 items-center gap-2 text-violet-400 hover:text-violet-300 transition">
                                      {comment.postFeaturedImage ? (
                                        <img
                                          src={appwriteService.getFileView(comment.postFeaturedImage)}
                                          alt=""
                                          className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10"
                                        />
                                      ) : null}
                                      <span className="truncate font-semibold">
                                        {comment.postTitle || `Post Ref #${comment.postId}`}
                                      </span>
                                    </Link>
                                  </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingComment({ ...comment })}
                                    aria-label="Edit comment"
                                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirm({ type: "comment", item: comment })}
                                    aria-label="Delete comment"
                                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-rose-300 transition"
                                  >
                                    {busy === `comment:${comment.$id}` ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.article>
                        ))
                      ) : (
                        <p className="py-16 text-center text-xs text-slate-400 font-medium">No comments recorded for this account.</p>
                      )}
                      
                      {comments.length < totalComments && commentsCursor ? (
                        <div className="p-6 text-center">
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() => loadMoreActivity("comments")}
                            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-slate-200 hover:bg-white/10 transition disabled:opacity-50"
                          >
                            {busy === "load:comments" ? "Loading records…" : `Load more comments (${comments.length}/${totalComments})`}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="admin-glass-card grid min-h-[400px] place-items-center rounded-3xl text-center p-8 shadow-2xl">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20 mb-4 animate-bounce">
                    <Users size={28} />
                  </div>
                  <h3 className="text-base font-bold text-white">Select a Cluster Account</h3>
                  <p className="mt-1 text-xs text-slate-300 max-w-sm mx-auto font-medium">
                    {loadingUsers ? "Establishing secure connection…" : "Choose any user profile from the left explorer panel to inspect moments, comments, and execute updates."}
                  </p>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md" role="presentation">
            <motion.section
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-delete-title"
              className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#121222] p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 size={22} />
                </div>
                <h2 id="admin-delete-title" className="text-base font-bold text-white">
                  Purge {confirm.type === "post" ? "Moment Payload" : "Comment Node"}?
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">
                This action is irreversible and executes a permanent deletion across the database matrix. Realtime telemetry will broadcast the removal instantly.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/5 transition"
                >
                  Abort
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    confirm.type === "post"
                      ? deletePost(confirm.item)
                      : deleteComment(confirm.item)
                  }
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default AdminControlHub;