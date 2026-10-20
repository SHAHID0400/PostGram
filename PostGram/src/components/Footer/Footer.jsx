import { Link } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
import logo from "../../assets/plogo.png";

const Footer = () => (
  <footer className="border-t border-white/[0.06] bg-night/80">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="PostGram" className="h-8 w-8 rounded-xl" />
            <span className="font-display text-base font-semibold tracking-tight text-white">
              PostGram
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            The social canvas for creators. Share real moments, backed by
            Appwrite storage and a live database.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:gap-14">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Product
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-slate-400 transition hover:text-white"
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link
                  to="/explore"
                  className="text-slate-400 transition hover:text-white"
                >
                  Explore
                </Link>
              </li>
              <li>
                <Link
                  to="/studio"
                  className="text-slate-400 transition hover:text-white"
                >
                  Creator Studio
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Account
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/login"
                  className="text-slate-400 transition hover:text-white"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-slate-400 transition hover:text-white"
                >
                  Create account
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} PostGram. All rights reserved.</p>
        <p className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-400" />
          Built for creators
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
