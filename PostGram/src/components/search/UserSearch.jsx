import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AtSign, Loader2, Search, UserRound, X } from "lucide-react";
import appwriteService from "../../Appwrite/config";
import { Avatar, avatarUrl } from "../dashboard/ui";

const SEARCH_DEBOUNCE = 300;

const UserSearch = ({
  className = "",
  placeholder = "Search creators or @username",
}) => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  const containerRef = useRef(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = term.trim().replace(/^@/, "");

    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    setError("");

    const timeout = setTimeout(() => {
      appwriteService
        .searchUsers(query, { currentUser: userData })
        .then((people) => {
          if (!cancelled) {
            setResults(people);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setError("Couldn't search right now. Try again.");
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, SEARCH_DEBOUNCE);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [term, userData]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const openResult = (person) => {
    setOpen(false);
    setTerm("");
    setResults([]);
    navigate(
      person.userId === userData?.$id
        ? "/profile"
        : `/profile/${person.userId}`,
    );
  };

  const clear = () => {
    setTerm("");
    setResults([]);
    setError("");
    setOpen(false);
  };

  const showDropdown = open && term.trim().replace(/^@/, "").length >= 2;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => term.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          aria-label="Search people by name or username"
          autoComplete="off"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
        />
        {searching ? (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-500" />
        ) : term ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Clear people search"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-60 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1120] p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
          {error ? (
            <p className="px-3 py-2.5 text-[11px] text-rose-300">{error}</p>
          ) : results.length === 0 && !searching ? (
            <p className="px-3 py-2.5 text-[11px] text-slate-500">
              No creators match “{term.trim()}”.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((person) => {
                const isSelf = person.userId === userData?.$id;
                const name = person.name || "PostGram creator";
                const avatarSrc = person.avatarFileId
                  ? appwriteService.getFileView(person.avatarFileId)
                  : isSelf
                    ? avatarUrl(userData)
                    : "";

                return (
                  <li key={person.userId}>
                    <button
                      type="button"
                      onClick={() => openResult(person)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/5 focus:outline-none focus-visible:bg-white/10"
                    >
                      <Avatar name={name} src={avatarSrc} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-white">
                          {name}
                          {isSelf ? (
                            <span className="ml-1.5 text-[10px] font-normal text-violet-300">
                              you
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                          {person.username ? (
                            <>
                              <AtSign className="h-2.5 w-2.5" />
                              {person.username}
                            </>
                          ) : (
                            <>
                              <UserRound className="h-2.5 w-2.5" />
                              {person.userId.slice(0, 12)}…
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default UserSearch;
