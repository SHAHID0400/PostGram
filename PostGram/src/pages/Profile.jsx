import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Bookmark,
  Camera,
  Check,
  Heart,
  Images,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import authService from "../Appwrite/Auth";
import { toUserMessage } from "../lib/errors";
import { logout, updateUser } from "../store/authSlice";
import { cropSquareAvatar } from "../components/profile/avatarCrop";
import { MobileDock } from "../components/dashboard/Sidebar";
import { Avatar, avatarUrl, stripHtml } from "../components/dashboard/ui";

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;
const MAX_BIO = 160;

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);
  const inputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("moments");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userData?.name || "");
  const [username, setUsername] = useState(userData?.username || "");
  const [bio, setBio] = useState(userData?.bio || "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [followStats, setFollowStats] = useState({
    supported: false,
    followers: null,
    following: null,
  });

  // Keep the public `profiles` document in sync so search and /profile/:userId
  // always show real name, username, bio and avatar.
  useEffect(() => {
    if (!userData?.$id) return;

    appwriteService
      .savePublicProfile({
        userId: userData.$id,
        name: userData.name || "",
        username: userData.username || "",
        bio: userData.bio || "",
        avatarFileId: userData.avatarFileId || "",
      })
      .catch(() => {});
  }, [
    userData?.$id,
    userData?.name,
    userData?.username,
    userData?.bio,
    userData?.avatarFileId,
  ]);

  useEffect(() => {
    if (!userData?.$id) return undefined;

    let cancelled = false;
    appwriteService.getFollowStats(userData.$id).then((stats) => {
      if (!cancelled) setFollowStats(stats);
    });

    return () => {
      cancelled = true;
    };
  }, [userData?.$id, toast]);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setUsername(userData.username || "");
      setBio(userData.bio || "");
    }
  }, [userData]);

  useEffect(() => {
    let cancelled = false;
    if (!userData?.$id) return undefined;

    setLoading(true);
    setLoadError("");

    appwriteService
      .listFeedPosts({ limit: 100, offset: 0, userId: userData.$id })
      .then((result) => {
        if (!cancelled) setPosts(result.documents);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your moments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userData?.$id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const likesSupported = posts.some((post) => Array.isArray(post.likes));
  const likesReceived = likesSupported
    ? posts.reduce((total, post) => total + post.likes.length, 0)
    : null;

  const stats = [
    { label: "Moments", value: loading ? "—" : posts.length },
    {
      label: "Likes received",
      value:
        loading || likesReceived === null
          ? "—"
          : likesReceived.toLocaleString(),
      hint: likesReceived === null ? "Likes aren't enabled yet" : undefined,
    },
    { label: "Following", value: followStats.following === null ? "—" : followStats.following, hint: followStats.supported ? undefined : "Follow graph isn't available yet" },
  ];

  const handleAvatarFile = async (file) => {
    if (!file || uploadingAvatar) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG or WEBP image for your avatar.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("That image is larger than 8 MB. Choose a smaller one.");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    let uploadedId = "";

    try {
      const cropped = await cropSquareAvatar(file);
      uploadedId = await appwriteService.uploadAvatarFile(cropped);

      await authService.saveProfile({
        name: userData?.name || "",
        username: userData?.username || "",
        bio: userData?.bio || "",
        avatarFileId: uploadedId,
      });

      dispatch(updateUser({ avatarFileId: uploadedId }));

      if (userData?.avatarFileId && userData.avatarFileId !== uploadedId) {
        appwriteService.deleteFile(userData.avatarFileId).catch(() => {});
      }

      setToast("Profile photo updated.");
    } catch (uploadError) {
      if (uploadedId) appwriteService.deleteFile(uploadedId).catch(() => {});
      setError(
        uploadError?.message || "Couldn't update your avatar. Try again.",
      );
    } finally {
      setUploadingAvatar(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const validate = () => {
    const nextErrors = {};
    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, "");

    if (cleanName.length < 2) {
      nextErrors.name = "Display name must be at least 2 characters.";
    } else if (cleanName.length > 50) {
      nextErrors.name = "Display name must be 50 characters or fewer.";
    }

    if (!/^[a-z0-9._]{3,20}$/i.test(cleanUsername)) {
      nextErrors.username = "Use 3–20 letters, numbers, dots or underscores.";
    }

    if (bio.trim().length > MAX_BIO) {
      nextErrors.bio = "Bio must be 160 characters or fewer.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0
      ? { cleanName, cleanUsername }
      : null;
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (saving) return;

    const values = validate();
    if (!values) return;

    const cleanBio = bio.trim();
    setSaving(true);
    setError("");

    try {
      await authService.saveProfile({
        name: values.cleanName,
        username: values.cleanUsername,
        bio: cleanBio,
        avatarFileId: userData?.avatarFileId || "",
      });

      dispatch(
        updateUser({
          name: values.cleanName,
          username: values.cleanUsername,
          bio: cleanBio,
        }),
      );

      setEditing(false);
      setToast("Profile updated.");
    } catch (saveError) {
      setError(toUserMessage(saveError, "Couldn't save your profile. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-night/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 sm:px-6">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <h1 className="font-display text-sm font-semibold text-white">
            Profile
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing((value) => !value);
                setError("");
              }}
              className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                editing
                  ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
              }`}
              aria-label="Edit profile settings"
              aria-pressed={editing}
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300 disabled:opacity-50"
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
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/[0.07] bg-night-soft/70 p-5 text-center backdrop-blur-xl sm:p-7"
        >
          <div className="relative mx-auto w-fit">
            <span className="block rounded-full bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 p-[2px]">
              <Avatar
                name={userData?.name}
                src={avatarUrl(userData)}
                size="2xl"
                className="ring-4 ring-night-soft"
              />
            </span>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#121627] text-violet-200 shadow-lg transition hover:bg-[#1a2035] disabled:opacity-60"
              aria-label="Upload a new profile photo"
              title="Upload photo"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleAvatarFile(event.target.files?.[0])}
            />
          </div>

          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white">
            {userData?.name || "PostGram creator"}
          </h2>

          {userData?.username ? (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
              <AtSign className="h-3 w-3 text-violet-300" />
              {userData.username}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-dashed border-violet-400/40 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              <AtSign className="h-3 w-3" />
              Set your username
            </button>
          )}

          {userData?.bio ? (
            <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm leading-relaxed text-slate-400">
              {userData.bio}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-3 text-xs font-medium text-violet-300 transition hover:text-violet-200"
            >
              Add a bio
            </button>
          )}

          <p className="mt-2 text-[10px] text-slate-600">
            {userData?.email || "Signed in with Appwrite"}
          </p>

          {error ? (
            <p
              role="alert"
              className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-left text-xs text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <dl className="mt-6 grid grid-cols-3 divide-x divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-white/[0.02] py-3">
            {stats.map((stat) => (
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

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:text-white"
            >
              <Pencil className="h-4 w-4" />
              Edit profile info
            </button>
            <Link
              to="/studio"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(168,85,247,0.9)]"
            >
              <Plus className="h-4 w-4" />
              Create moment
            </Link>
          </div>
        </motion.section>

        {editing ? (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={saveProfile}
            className="mt-4 space-y-4 rounded-3xl border border-white/10 bg-night-soft/80 p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">
                Edit profile info
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="text-xs font-medium text-slate-400 transition hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
            </div>

            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Display name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  autoComplete="name"
                  placeholder="Your display name"
                  className={`${fieldClass} pl-10 ${
                    fieldErrors.name ? "border-rose-400/60" : ""
                  }`}
                />
              </div>
              {fieldErrors.name ? (
                <p className="mt-1 text-[11px] text-rose-300">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="profile-username"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Username
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="profile-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={20}
                  autoComplete="username"
                  placeholder="yourhandle"
                  className={`${fieldClass} pl-10 ${
                    fieldErrors.username ? "border-rose-400/60" : ""
                  }`}
                />
              </div>
              {fieldErrors.username ? (
                <p className="mt-1 text-[11px] text-rose-300">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="profile-bio"
                  className="text-xs font-medium text-slate-300"
                >
                  Bio
                </label>
                <span className="text-[11px] tabular-nums text-slate-500">
                  {bio.length}/{MAX_BIO}
                </span>
              </div>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={MAX_BIO}
                rows={3}
                placeholder="Tell the community what you create."
                className={`${fieldClass} resize-none ${
                  fieldErrors.bio ? "border-rose-400/60" : ""
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(168,85,247,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save profile"}
            </button>
          </motion.form>
        ) : null}

        <section className="mt-6">
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {[
              { id: "moments", label: "My moments", icon: Images },
              { id: "saved", label: "Saved", icon: Bookmark },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-pressed={active}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                    active ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="profile-tab"
                      className="absolute inset-0 rounded-xl bg-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <Icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>

          {loadError ? (
            <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {loadError}
            </p>
          ) : null}

          {tab === "moments" ? (
            loading ? (
              <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square animate-pulse rounded-xl bg-white/5"
                  />
                ))}
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
                  Your published moments will appear here in real time.
                </p>
                <Link
                  to="/studio"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first moment
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
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
                          alt={post.title || "Your moment"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-linear-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 px-2 text-center text-[11px] font-semibold text-white">
                          {post.title || "Moment"}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
                      {Array.isArray(post.likes) && post.likes.length > 0 ? (
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                          <Heart className="h-2.5 w-2.5 fill-current" />
                          {post.likes.length}
                        </span>
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 hidden truncate bg-linear-to-t from-black/80 to-transparent px-2 pb-6 pt-8 text-[10px] text-slate-200 group-hover:block">
                        {stripHtml(post.content) || post.title || "Moment"}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="mt-4 rounded-3xl border border-white/10 bg-night-soft/70 p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
                <Bookmark className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">
                Saved is coming soon
              </h3>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
                Saving moments needs its own Appwrite collection. Your saved
                posts will appear here once saving is enabled for your account.
              </p>
              <button
                type="button"
                onClick={() => setTab("moments")}
                className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
              >
                Back to my moments
              </button>
            </div>
          )}
        </section>
      </main>

      {toast ? (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0d1120] px-4 py-2.5 text-xs font-medium text-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] lg:bottom-6"
        >
          {toast}
        </motion.p>
      ) : null}

      <MobileDock user={userData} />
    </div>
  );
};

export default Profile;
