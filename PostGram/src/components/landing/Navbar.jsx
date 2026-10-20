import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, Sparkles, X } from "lucide-react";
import logo from "../../assets/plogo.png";
import { navLinks } from "./content";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const authStatus = useSelector((state) => state.auth?.status);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaHref = authStatus ? "/dashboard" : "/signup";
  const ctaLabel = authStatus ? "Open Feed" : "Launch App";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-3 py-2.5 transition-all duration-500 sm:px-4 ${
          scrolled
            ? "border-white/10 bg-[#070911]/80 shadow-[0_18px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            : "border-white/[0.07] bg-white/[0.035] backdrop-blur-xl"
        }`}
      >
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-full pr-2"
          aria-label="PostGram home"
        >
          <span className="relative">
            <span className="absolute inset-0 rounded-full bg-violet-500/40 blur-md transition-opacity duration-500 group-hover:opacity-100" />
            <img
              src={logo}
              alt="PostGram logo"
              className="relative h-9 w-9 rounded-full object-contain ring-1 ring-white/15"
            />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            PostGram
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {!authStatus ? (
            <Link
              to="/login"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            to={ctaHref}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4.5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(168,85,247,0.8)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <span className="absolute inset-0 card-sheen animate-shimmer opacity-60" />
            <span className="relative">{ctaLabel}</span>
            <ArrowUpRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto mt-3 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#080b14]/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                </a>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-4">
              {!authStatus ? (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  Sign in
                </Link>
              ) : null}
              <Link
                to={ctaHref}
                onClick={() => setOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" />
                {ctaLabel}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
