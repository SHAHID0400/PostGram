export const ASPECTS = [
  { id: "1:1", label: "1:1", ratio: 1, frame: "aspect-square" },
  { id: "4:5", label: "4:5", ratio: 4 / 5, frame: "aspect-[4/5]" },
  { id: "16:9", label: "16:9", ratio: 16 / 9, frame: "aspect-[16/9]" },
];

export const FILTERS = [
  { id: "normal", label: "Normal", css: "none" },
  {
    id: "cinematic",
    label: "Cinematic",
    css: "contrast(1.08) saturate(1.05) brightness(0.95) hue-rotate(-8deg)",
  },
  {
    id: "warm",
    label: "Warm",
    css: "sepia(0.18) saturate(1.2) brightness(1.03)",
  },
  {
    id: "moody",
    label: "Moody",
    css: "brightness(0.85) contrast(1.15) saturate(0.8)",
  },
  { id: "mono", label: "B&W", css: "grayscale(1) contrast(1.06)" },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    css: "saturate(1.55) hue-rotate(-24deg) contrast(1.12) brightness(1.02)",
  },
];

export const HASHTAG_SUGGESTIONS = [
  "#postgram",
  "#creators",
  "#moments",
  "#photography",
  "#design",
  "#lifestyle",
];

// These reflect the real pipeline the Studio runs through.
export const PUBLISH_STAGES = [
  "Processing media",
  "Uploading media",
  "Publishing",
  "Live in feed",
];

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
export const MAX_CAPTION = 1000;
export const MAX_LOCATION = 60;
