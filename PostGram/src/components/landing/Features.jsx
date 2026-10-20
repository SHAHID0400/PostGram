import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowUpRight,
  Camera,
  ChartColumn,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Reveal, SectionHeading, staggerContainer, staggerItem } from "./ui";
import { features } from "./content";

const ICONS = {
  Camera,
  Radio,
  BarChart3: ChartColumn,
  ShieldCheck,
};

const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  return `${parseInt(value.slice(0, 2), 16)}, ${parseInt(
    value.slice(2, 4),
    16,
  )}, ${parseInt(value.slice(4, 6), 16)}`;
};

/* ── Glassmorphic card with 3D tilt + cursor spotlight ──── */
const TiltCard = ({ children, glow = "139, 92, 246", intensity = 9 }) => {
  const cardRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, {
    stiffness: 180,
    damping: 22,
    mass: 0.5,
  });
  const rotateY = useSpring(rawRotateY, {
    stiffness: 180,
    damping: 22,
    mass: 0.5,
  });

  const handleMove = (event) => {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    rawRotateY.set((x - 0.5) * intensity * 2);
    rawRotateX.set(-(y - 0.5) * intensity * 2);

    cardRef.current.style.setProperty("--spot-x", `${x * 100}%`);
    cardRef.current.style.setProperty("--spot-y", `${y * 100}%`);
  };

  const handleLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <div className="[perspective:1200px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY }}
        className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d16]/80 p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors duration-500 hover:border-white/20 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(440px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(${glow}, 0.17), transparent 62%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
};

/* ── Feature matrix section ──────────────────────────────── */
const Features = () => {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(124,58,237,0.14),transparent_70%)] blur-2xl"
      />

      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The feature matrix"
          title={
            <>
              Everything you need to create,{" "}
              <span className="text-gradient">without the noise.</span>
            </>
          }
          description="Four deeply considered pillars power PostGram. No bloat, no dark patterns — just the tools that help your work travel further."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {features.map((feature, index) => {
            const Icon = ICONS[feature.icon] ?? Camera;
            const glow = hexToRgb(feature.accent);

            return (
              <motion.div key={feature.id} variants={staggerItem}>
                <TiltCard glow={glow}>
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-2xl ring-1 transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundColor: `${feature.accent}1f`,
                        color: feature.accent,
                        boxShadow: `inset 0 1px 0 0 ${feature.accent}33, 0 10px 30px -12px ${feature.accent}66`,
                        borderColor: `${feature.accent}33`,
                        ["--tw-ring-color"]: `${feature.accent}2e`,
                      }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-display text-[11px] tracking-[0.22em] text-slate-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p
                    className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: feature.accent }}
                  >
                    {feature.tag}
                  </p>
                  <h3 className="mt-2.5 font-display text-xl font-semibold leading-snug tracking-tight text-white sm:text-[1.35rem]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: feature.accent,
                          boxShadow: `0 0 12px ${feature.accent}`,
                        }}
                      />
                      <span className="text-xs font-medium text-slate-300">
                        {feature.stat}
                      </span>
                      <span className="hidden text-[10px] uppercase tracking-wider text-slate-600 sm:inline">
                        · {feature.meta}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors duration-300 group-hover:text-white">
                      Learn more
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                    style={{
                      background: `radial-gradient(circle, ${feature.accent}55, transparent 65%)`,
                    }}
                  />
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        <Reveal delay={0.1} className="mt-8">
          <p className="text-center text-xs text-slate-600">
            Hover a card — every surface in PostGram responds in three
            dimensions.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default Features;
