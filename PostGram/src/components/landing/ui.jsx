import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** Scroll-triggered reveal wrapper. Animates once when it enters the viewport. */
export const Reveal = ({
  children,
  className = "",
  delay = 0,
  y = 28,
  once = true,
  amount = 0.25,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/** Staggered container + item variants for lists of cards. */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

/** Reusable eyebrow + headline + description block used by each section. */
export const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}) => {
  const centered = align === "center";

  return (
    <div
      className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${className}`}
    >
      {eyebrow ? (
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
            {eyebrow}
          </span>
        </Reveal>
      ) : null}

      <Reveal delay={0.08}>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.85rem]">
          {title}
        </h2>
      </Reveal>

      {description ? (
        <Reveal delay={0.16}>
          <p
            className={`mt-4 text-base leading-relaxed text-slate-400 ${
              centered ? "mx-auto max-w-2xl" : "max-w-xl"
            }`}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
};

export default Reveal;
