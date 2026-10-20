import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Stories from "../components/landing/Stories";
import LiveFeed from "../components/landing/LiveFeed";
import Footer from "../components/landing/Footer";

const BackgroundFX = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-[#05060a]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.28),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_20%,rgba(236,72,153,0.1),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_5%_70%,rgba(34,211,238,0.08),transparent_70%)]" />
    <div className="absolute inset-0 grid-overlay opacity-60" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const FinalCTA = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative px-5 pb-24 sm:px-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/25 via-fuchsia-500/10 to-cyan-400/10 px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.4),transparent_65%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_65%)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Free forever to start
          </span>

          <h2 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Your next moment deserves{" "}
            <span className="text-gradient">an audience.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300/80">
            Join 120,000 creators building a slower, deeper, more beautiful social
            presence on PostGram.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#05060a] shadow-[0_18px_40px_-16px_rgba(255,255,255,0.5)] transition-transform duration-300 hover:scale-[1.02] sm:w-auto"
            >
              Create your free account
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[0.1] sm:w-auto"
            >
              Sign in
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-x-clip font-sans text-slate-200">
      <BackgroundFX />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stories />
        <LiveFeed />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
