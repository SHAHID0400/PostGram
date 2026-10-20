import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";
import authService from "../../Appwrite/Auth";
import { logout } from "../../store/authSlice";
import logo from "../../assets/plogo.png";
import { Avatar, avatarUrl } from "../dashboard/ui";

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth?.status);
  const userData = useSelector((state) => state.auth?.userData);
  const [open, setOpen] = useState(false);

  const items = authStatus
    ? [
        { to: "/explore", label: "Explore", icon: Compass },
        { to: "/chat", label: "Messages", icon: MessageCircle },
        { to: "/studio", label: "Studio", icon: Images },
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
    : [];

  const handleLogout = async () => {
    try {
      await authService.Logout();
    } catch (error) {
      // Drop the local session even if the network call fails.
    } finally {
      dispatch(logout());
      setOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-night/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="PostGram" className="h-8 w-8 rounded-xl" />
          <span className="font-display text-base font-semibold tracking-tight text-white">
            PostGram
          </span>
        </Link>

        <nav
          className="ml-6 hidden items-center gap-1 sm:flex"
          aria-label="Primary"
        >
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {authStatus ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3.5 transition hover:border-white/20 sm:inline-flex"
                title="Open your profile"
              >
                <Avatar
                  name={userData?.name}
                  src={avatarUrl(userData)}
                  size="sm"
                />
                <span className="max-w-28 truncate text-xs font-medium text-slate-300">
                  {userData?.name || "You"}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_-14px_rgba(168,85,247,0.9)]"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06] bg-night sm:hidden"
            aria-label="Mobile"
          >
            <div className="space-y-1 px-4 py-3">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}

              {authStatus ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-sm text-slate-300"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Header;
