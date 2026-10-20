import { Component } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

/**
 * Catches unexpected render failures so a single broken tree cannot blank the
 * whole application. Operational errors (auth, network) are handled locally.
 */
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Monitoring belongs to the hosting provider; nothing is logged to the
    // browser console in production.
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-night px-5 text-slate-200">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-night-soft p-7 text-center shadow-[0_40px_100px_-40px_rgba(0,0,0,1)]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            The page hit an unexpected error. Your data is safe — reload to
            continue where you left off.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Reload PostGram
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
