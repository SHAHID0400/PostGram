import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import logo from "../../assets/plogo.png";
import { footerColumns, socialLinks } from "./content";

/* Brand icons were removed from recent lucide releases, so we ship them inline. */
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.53 3H21l-7.19 8.21L22 21h-6.56l-5.14-6.72L4.4 21H1l7.7-8.8L2 3h6.72l4.64 6.13L17.53 3Zm-1.19 16h1.83L7.73 4.9H5.76L16.34 19Z" />
  </svg>
);

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.84-2.05 3.79-2.05C21.75 8.59 22 11.1 22 14.3V21h-4v-5.95c0-1.42-.03-3.25-1.98-3.25-1.98 0-2.28 1.55-2.28 3.15V21h-4V9Z" />
  </svg>
);

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  Twitter: XIcon,
  Github: GithubIcon,
  Linkedin: LinkedinIcon,
};

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = (event) => {
    event.preventDefault();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!isValid) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setEmail("");
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] px-5 pb-8 pt-20 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.14),transparent_65%)]"
      />

      <div className="mx-auto max-w-7xl">
        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-7 sm:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_65%)] blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_65%)] blur-2xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles className="h-3 w-3" />
                The Sunday Signal
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                Get the best of PostGram in your inbox.
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                One considered email a week — creator stories, product drops and
                the numbers behind what's working. No spam, ever.
              </p>
            </div>

            <div>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (status !== "idle") setStatus("idle");
                    }}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    aria-invalid={status === "error"}
                    className={`w-full rounded-full border bg-[#05060a]/60 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:ring-2 ${
                      status === "error"
                        ? "border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/20"
                        : "border-white/12 focus:border-violet-400/60 focus:ring-violet-500/20"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_40px_-12px_rgba(168,85,247,0.9)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
                >
                  Subscribe
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </form>

              <div className="mt-3 min-h-[1.25rem]">
                <AnimatePresence mode="wait" initial={false}>
                  {status === "success" ? (
                    <motion.p
                      key="success"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5" />
                      You're in. Check your inbox for a hello.
                    </motion.p>
                  ) : null}
                  {status === "error" ? (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-xs font-medium text-rose-300"
                    >
                      Please enter a valid email address.
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Link columns */}
        <div className="mt-16 grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={logo}
                alt="PostGram"
                className="h-10 w-10 rounded-full object-contain ring-1 ring-white/15"
              />
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                PostGram
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The social canvas for creators who care about craft. Built for
              moments that deserve more than a scroll.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon] ?? InstagramIcon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © 2026 PostGram. Crafted with{" "}
            <span className="text-slate-300">React</span>,{" "}
            <span className="text-slate-300">Tailwind CSS</span>,{" "}
            <span className="text-slate-300">Framer Motion</span> &amp;{" "}
            <span className="text-slate-300">Lucide</span>.
          </p>

          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </span>
            <a
              href="#"
              className="text-xs text-slate-500 transition hover:text-white"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-slate-500 transition hover:text-white"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
