import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, X } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";
import { stories, storyFilters } from "./content";

const Stories = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeStory, setActiveStory] = useState(null);

  const filteredStories = useMemo(() => {
    if (activeFilter === "All") return stories;
    return stories.filter((story) => story.category === activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    if (!activeStory) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveStory(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeStory]);

  return (
    <section
      id="stories"
      className="relative scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Community stories & journal"
            title={
              <>
                Field notes from people{" "}
                <span className="text-gradient-warm">making things.</span>
              </>
            }
            description="Creator interviews, practical photography guides and the trends shaping social — written by the people living them."
          />
          <Reveal delay={0.15} className="shrink-0">
            <a
              href="#stories"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
            >
              Browse all stories
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Reveal>
        </div>

        {/* Filter tags */}
        <Reveal delay={0.2} className="mt-10">
          <div
            role="tablist"
            aria-label="Filter stories by category"
            className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
          >
            {storyFilters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="story-filter-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.9)]"
                    />
                  ) : null}
                  <span className="relative">{filter}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Story cards */}
        <motion.div layout className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredStories.map((story) => (
              <motion.article
                layout
                key={story.id}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setActiveStory(story)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveStory(story);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Read story: ${story.title}`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d16]/70 backdrop-blur-xl transition-colors duration-500 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-52 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d16] via-black/10 to-black/10" />

                  <span className="absolute left-3.5 top-3.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                    {story.category}
                  </span>
                  <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-medium text-white/85 backdrop-blur-md">
                    <Clock className="h-3 w-3" />
                    {story.readTime}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={story.author.avatar}
                      alt={story.author.name}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-white/15"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">
                        {story.author.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {story.date}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug tracking-tight text-white transition-colors group-hover:text-violet-100">
                    {story.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                    {story.excerpt}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-xs font-semibold text-slate-300 transition-colors group-hover:text-white">
                      Read full story
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-300 group-hover:border-violet-400/40 group-hover:bg-violet-500/15 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Reader modal */}
      <AnimatePresence>
        {activeStory ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={activeStory.title}
          >
            <div
              className="absolute inset-0 bg-[#03040a]/80 backdrop-blur-md"
              onClick={() => setActiveStory(null)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: 48, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 32, opacity: 0, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#080b14] shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] sm:rounded-3xl"
            >
              <div className="relative">
                <img
                  src={activeStory.image}
                  alt={activeStory.title}
                  className="h-56 w-full object-cover sm:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/20 to-black/30" />

                <button
                  type="button"
                  onClick={() => setActiveStory(null)}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
                  aria-label="Close story"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute inset-x-5 bottom-5">
                  <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100 backdrop-blur-md">
                    {activeStory.category}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                    {activeStory.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeStory.author.avatar}
                      alt={activeStory.author.name}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {activeStory.author.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeStory.author.role} · {activeStory.date}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    {activeStory.readTime}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {activeStory.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="text-[15px] leading-7 text-slate-300/90"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.07] pt-6">
                  {activeStory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default Stories;
