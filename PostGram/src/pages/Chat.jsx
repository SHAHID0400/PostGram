import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import appwriteService from "../Appwrite/config";
import conf from "../conf/confi";
import { toUserMessage } from "../lib/errors";
import { MobileDock } from "../components/dashboard/Sidebar";
import { Avatar, timeAgo } from "../components/dashboard/ui";

const collectionMissing = (error) =>
  error?.code === 404 ||
  /collection.*(not found|could not be found|does not exist)/i.test(
    error?.message || "",
  );

const formatClock = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SetupNotice = ({ collection }) => (
  <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-left">
    <p className="flex items-center gap-2 text-xs font-semibold text-amber-200">
      <AlertCircle className="h-4 w-4" />
      Chat needs one Appwrite collection
    </p>
    <p className="mt-2 text-[11px] leading-relaxed text-amber-100/80">
      Create a collection named{" "}
      <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">
        {collection}
      </code>{" "}
      with string attributes{" "}
      <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">
        conversationId
      </code>
      ,{" "}
      <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">
        senderId
      </code>
      ,{" "}
      <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">
        receiverId
      </code>{" "}
      and{" "}
      <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">
        body
      </code>
      . Give authenticated users read + create access so both people see
      messages instantly. Messages stay empty until that collection exists.
    </p>
  </div>
);

const Chat = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);

  const [activeProfile, setActiveProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [liveState, setLiveState] = useState("connecting");

  const bottomRef = useRef(null);
  const activeRecipientRef = useRef(recipientId || null);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    activeRecipientRef.current = recipientId || null;
  }, [recipientId]);

  const loadConversations = useCallback(
    async ({ quiet = false } = {}) => {
      if (!userData?.$id) return;

      if (!quiet) setListLoading(true);

      try {
        const list = await appwriteService.listConversations(userData.$id);
        setConversations(list);
        setListError("");
        setSetupRequired(false);
      } catch (error) {
        if (collectionMissing(error)) {
          setSetupRequired(true);
          setListError("");
        } else if (!quiet) {
          setListError(
            toUserMessage(error, "Couldn't load your conversations."),
          );
        }
      } finally {
        if (!quiet) setListLoading(false);
      }
    },
    [userData?.$id],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load the recipient profile and the real message history.
  useEffect(() => {
    if (!recipientId || !userData?.$id) {
      setActiveProfile(null);
      setMessages([]);
      setMessagesLoading(false);
      setMessageError("");
      return undefined;
    }

    if (recipientId === userData.$id) {
      navigate("/chat", { replace: true });
      return undefined;
    }

    let cancelled = false;
    setMessages([]);
    setMessagesLoading(true);
    setMessageError("");
    setDraft("");
    setActiveProfile(null);
    setProfileLoading(true);

    appwriteService
      .getPublicProfile(recipientId)
      .then((profile) => {
        if (!cancelled) setActiveProfile(profile);
      })
      .catch(() => {
        if (!cancelled) {
          setActiveProfile({
            userId: recipientId,
            name: "",
            username: "",
            bio: "",
            avatarFileId: "",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    appwriteService
      .listMessages({ userId: userData.$id, otherId: recipientId })
      .then((result) => {
        if (cancelled) return;
        setMessages(result.documents);
        setSetupRequired(false);
      })
      .catch((error) => {
        if (cancelled) return;
        if (collectionMissing(error)) {
          setSetupRequired(true);
        } else {
          setMessageError(toUserMessage(error, "Couldn't load this conversation."));
        }
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipientId, userData?.$id, navigate]);

  // Realtime: both sides receive new documents without a reload.
  useEffect(() => {
    if (!userData?.$id) return undefined;

    let active = true;
    let unsubscribe = null;
    setLiveState("connecting");

    const handleEvent = (response) => {
      const events = response?.events || [];
      const document = response?.payload;

      if (!document?.$id) return;
      if (!events.some((event) => event.endsWith(".create"))) return;
      if (
        document.senderId !== userData.$id &&
        document.receiverId !== userData.$id
      ) {
        return;
      }

      const currentRecipient = activeRecipientRef.current;

      if (
        currentRecipient &&
        document.conversationId ===
          appwriteService.conversationIdFor(
            userData.$id,
            currentRecipient,
          )
      ) {
        setMessages((current) =>
          current.some((message) => message.$id === document.$id)
            ? current
            : [...current, document],
        );
      }

      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (active) loadConversations({ quiet: true });
      }, 350);
    };

    try {
      const subscription = appwriteService.subscribeToMessages(handleEvent);

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
      clearTimeout(refreshTimerRef.current);
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (cleanupError) {
        // The socket is already closed.
      }
    };
  }, [userData?.$id, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, messagesLoading, recipientId]);

  const activeConversation = conversations.find(
    (conversation) => conversation.userId === recipientId,
  );

  const headerProfile = activeProfile || activeConversation?.profile;
  const headerName = headerProfile?.name || "PostGram creator";

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body || sending || !recipientId || !userData?.$id) return;

    setSending(true);
    setMessageError("");

    try {
      const document = await appwriteService.sendMessage({
        sender: userData,
        recipientId,
        body,
      });

      setMessages((current) =>
        current.some((message) => message.$id === document.$id)
          ? current
          : [...current, document],
      );
      setDraft("");
      setSetupRequired(false);
      loadConversations({ quiet: true });
    } catch (error) {
      if (collectionMissing(error)) {
        setSetupRequired(true);
      } else {
        setMessageError(toUserMessage(error, "Your message didn't send. Try again."));
      }
    } finally {
      setSending(false);
    }
  };

  const liveBadge =
    liveState === "live"
      ? {
          label: "Live",
          className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
          dot: "bg-emerald-400",
        }
      : liveState === "offline"
        ? {
            label: "Paused",
            className: "border-white/10 bg-white/5 text-slate-400",
            dot: "bg-slate-500",
          }
        : {
            label: "Connecting",
            className: "border-white/10 bg-white/5 text-slate-400",
            dot: "bg-amber-400 animate-pulse",
          };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-night text-slate-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 grid-overlay opacity-30" />
        <div className="absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_70%)] blur-3xl" />
      </div>

      <header className="relative z-30 shrink-0 border-b border-white/[0.06] bg-night/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2.5 px-4 sm:px-6 lg:px-8">
          <Link
            to={recipientId ? "/chat" : "/dashboard"}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
            aria-label={recipientId ? "Back to conversations" : "Back to feed"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white">
            <MessageCircle className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0">
            <h1 className="font-display text-sm font-semibold text-white">
              Messages
            </h1>
            <p className="truncate text-[10px] text-slate-500">
              {recipientId
                ? `Chat with ${headerName}`
                : "Your real 1-on-1 conversations"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:inline-flex ${liveBadge.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${liveBadge.dot}`} />
              {liveBadge.label}
            </span>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
              Find people
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 px-0 pb-24 sm:px-6 sm:pb-6 lg:px-8">
        <div className="flex min-h-0 w-full overflow-hidden border-white/[0.06] bg-night-soft/30 sm:rounded-3xl sm:border">
          <aside
            className={`${
              recipientId ? "hidden lg:flex" : "flex"
            } min-h-0 w-full shrink-0 flex-col border-white/[0.06] lg:w-80 lg:border-r xl:w-88`}
          >
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Conversations
              </h2>
              {conversations.length > 0 ? (
                <span className="text-[10px] tabular-nums text-slate-600">
                  {conversations.length}
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
              {listLoading ? (
                <div className="space-y-2 px-2 py-2" aria-hidden="true">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-2">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.07]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-28 animate-pulse rounded-full bg-white/[0.07]" />
                        <div className="h-2 w-40 animate-pulse rounded-full bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : setupRequired ? (
                <div className="p-2">
                  <SetupNotice collection={conf.appwriteMessagesCollectionId} />
                </div>
              ) : listError ? (
                <div className="p-3">
                  <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                    {listError}
                  </p>
                  <button
                    type="button"
                    onClick={() => loadConversations()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 transition hover:text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-white">
                    No conversations yet
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-56 text-[11px] leading-relaxed text-slate-500">
                    Find a creator and tap Message on their profile. Your real
                    chats will appear here.
                  </p>
                  <Link
                    to="/explore"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2 text-[11px] font-semibold text-white"
                  >
                    <Sparkles className="h-3 w-3" />
                    Explore creators
                  </Link>
                </div>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((conversation) => {
                    const person = conversation.profile;
                    const name = person?.name || "PostGram creator";
                    const active = conversation.userId === recipientId;
                    const isMine = conversation.message.senderId === userData?.$id;

                    return (
                      <li key={conversation.userId}>
                        <Link
                          to={`/chat/${conversation.userId}`}
                          className={`flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition ${
                            active
                              ? "bg-white/[0.08]"
                              : "hover:bg-white/[0.04]"
                          }`}
                        >
                          <Avatar
                            name={name}
                            src={
                              person?.avatarFileId
                                ? appwriteService.getFileView(
                                    person.avatarFileId,
                                  )
                                : ""
                            }
                            size="md"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-white">
                                {name}
                              </span>
                              <span className="shrink-0 text-[9px] text-slate-600">
                                {timeAgo(conversation.message.$createdAt)}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                              {isMine ? "You: " : ""}
                              {conversation.message.body}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section
            className={`${
              recipientId ? "flex" : "hidden lg:flex"
            } min-h-0 min-w-0 flex-1 flex-col`}
          >
            {!recipientId ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/5 text-violet-200">
                  <MessageCircle className="h-7 w-7" />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold text-white">
                  Select a conversation
                </h2>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-400">
                  Pick someone on the left, or find a creator and message them.
                </p>
                <Link
                  to="/explore"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                  Find people
                </Link>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                  <Link
                    to={`/profile/${recipientId}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition hover:opacity-90"
                  >
                    {profileLoading && !headerProfile ? (
                      <span className="h-10 w-10 animate-pulse rounded-full bg-white/[0.07]" />
                    ) : (
                      <Avatar
                        name={headerName}
                        src={
                          headerProfile?.avatarFileId
                            ? appwriteService.getFileView(
                                headerProfile.avatarFileId,
                              )
                            : ""
                        }
                        size="md"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {headerName}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        {headerProfile?.username ? (
                          <>
                            <AtSign className="h-2.5 w-2.5" />
                            {headerProfile.username}
                          </>
                        ) : (
                          "View public profile"
                        )}
                      </span>
                    </span>
                  </Link>

                  <span
                    className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:inline-flex ${liveBadge.className}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${liveBadge.dot}`}
                    />
                    {liveBadge.label}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {setupRequired ? (
                    <div className="mx-auto max-w-md py-6">
                      <SetupNotice
                        collection={conf.appwriteMessagesCollectionId}
                      />
                    </div>
                  ) : messagesLoading ? (
                    <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
                      {[0, 1, 2].map((item) => (
                        <div
                          key={item}
                          className={`h-10 animate-pulse rounded-2xl bg-white/5 ${
                            item === 1 ? "ml-12" : "mr-12"
                          }`}
                        />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-violet-200">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-sm font-medium text-white">
                        Say hi to {headerName}
                      </p>
                      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
                        This is the start of your real conversation. Messages
                        sync live to both accounts.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {messages.map((message) => {
                        const isMine = message.senderId === userData?.$id;

                        return (
                          <li
                            key={message.$id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[82%] rounded-2xl px-3.5 py-2 sm:max-w-[70%] ${
                                isMine
                                  ? "rounded-br-md bg-linear-to-br from-violet-500 to-fuchsia-500 text-white"
                                  : "rounded-bl-md border border-white/[0.07] bg-white/[0.06] text-slate-100"
                              }`}
                            >
                              <p className="whitespace-pre-line break-words text-sm leading-relaxed">
                                {message.body}
                              </p>
                              <p
                                className={`mt-1 text-right text-[9px] tabular-nums ${
                                  isMine
                                    ? "text-white/70"
                                    : "text-slate-500"
                                }`}
                              >
                                {formatClock(message.$createdAt)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div ref={bottomRef} />
                </div>

                <div className="shrink-0 border-t border-white/[0.06] p-3">
                  {messageError ? (
                    <p className="mb-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                      {messageError}
                    </p>
                  ) : null}

                  <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={2000}
                      disabled={setupRequired || sending}
                      placeholder={
                        setupRequired
                          ? "Create the messages collection to chat"
                          : `Message ${headerName}…`
                      }
                      aria-label={`Message ${headerName}`}
                      className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.94 }}
                      disabled={!draft.trim() || sending || setupRequired}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {sending ? "Sending…" : "Send"}
                      </span>
                    </motion.button>
                  </form>

                  <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-600">
                    {liveState === "offline" ? (
                      <>
                        <WifiOff className="h-2.5 w-2.5" />
                        Realtime paused — messages still save.
                      </>
                    ) : (
                      <>
                        <Wifi className="h-2.5 w-2.5" />
                        Synced with Appwrite Realtime
                      </>
                    )}
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <MobileDock user={userData} />
    </div>
  );
};

export default Chat;
