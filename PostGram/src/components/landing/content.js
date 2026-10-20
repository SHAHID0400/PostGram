/**
 * Copy and imagery for the public landing experience.
 * Photographs are served from Unsplash's CDN.
 */

const img = (id, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Community", href: "#community" },
  { label: "Stories", href: "#stories" },
  { label: "Feed", href: "#feed" },
];

export const heroAvatars = [
  img("photo-1494790108377-be9c29b29330", 96),
  img("photo-1507003211169-0a1dd7228f2d", 96),
  img("photo-1534528741775-53994a69daeb", 96),
  img("photo-1506794778202-cad84cf45f1d", 96),
  img("photo-1539571696357-5a69c17a67c6", 96),
];

export const heroStats = [
  { value: "Live", label: "realtime sync" },
  { value: "1:1", label: "private chat" },
  { value: "0", label: "ad trackers" },
];

export const features = [
  {
    id: "sharing",
    icon: "Camera",
    accent: "#a78bfa",
    tag: "Instant Media Sharing",
    title: "Publish in one tap, at full fidelity.",
    description:
      "Pick a photo, write a caption and publish in one flow. Originals go to Appwrite Storage and appear in the feed the moment the upload finishes.",
    stat: "Originals preserved",
    meta: "Camera roll to feed",
  },
  {
    id: "community",
    icon: "Radio",
    accent: "#22d3ee",
    tag: "Real-Time Community Feeds",
    title: "A feed that moves at your speed.",
    description:
      "Likes and comments land without a refresh, and new moments stream into the dashboard as they're published. Realtime subscriptions keep every conversation current.",
    stat: "Realtime updates",
    meta: "Live sync",
  },
  {
    id: "analytics",
    icon: "BarChart3",
    accent: "#f472b6",
    tag: "Creator Dashboard",
    title: "Every moment in one place.",
    description:
      "See your posts, followers and following on your profile, then edit, delete or publish new work from a single dashboard built for creators.",
    stat: "One dashboard",
    meta: "Live insights",
  },
  {
    id: "privacy",
    icon: "ShieldCheck",
    accent: "#34d399",
    tag: "End-to-End Privacy",
    title: "Your moments stay yours.",
    description:
      "Private-by-default controls, real 1-on-1 messaging and document-level permissions through Appwrite. You decide who sees what — and your data is never sold.",
    stat: "Access controlled",
    meta: "No ad tracking",
  },
];

export const storyFilters = [
  "All",
  "Creator Spotlights",
  "Photography Tips",
  "Social Trends",
];

export const stories = [
  {
    id: "story-1",
    category: "Creator Spotlights",
    title: "Nova Reyes turns city rain into a 4M-follower aesthetic",
    excerpt:
      "The street photographer on finding poetry in puddles, building a signature color grade, and why consistency beats virality.",
    readTime: "6 min read",
    date: "Oct 12, 2026",
    image: img("photo-1492724441997-5dc865305da7", 1200),
    author: {
      name: "Amara Cole",
      role: "Editor",
      avatar: img("photo-1494790108377-be9c29b29330", 96),
    },
    tags: ["Creators", "Photography", "Growth"],
    body: [
      "Nova Reyes never planned to become a city photographer. She was a graphic designer who started carrying a battered mirrorless camera on her commute home, mostly to make the walk less predictable. The rain changed everything.",
      "“Wet asphalt is a free gradient map,” she says. “Every streetlight turns into a brushstroke. Every puddle becomes a second sky.” That observation — simple, repeatable, unmistakably hers — turned into a visual language that now reaches more than four million people a month.",
      "Her advice to creators chasing a signature look is deceptively practical: pick one constraint. One lens, one time of day, one weather condition. Constraints create consistency, and consistency is what an audience remembers long after a single viral post has scrolled away.",
      "On PostGram, Nova uses story rings to tease edits before they land in the feed. The behind-the-scenes clips routinely outperform the final image — a reminder that process, not polish, is what builds a community.",
    ],
  },
  {
    id: "story-2",
    category: "Photography Tips",
    title: "The golden hour is a myth — here's when to actually shoot",
    excerpt:
      "A practical field guide to blue hour, window light and overcast diffusion, with settings that work straight out of the camera.",
    readTime: "8 min read",
    date: "Oct 8, 2026",
    image: img("photo-1500530855697-b586d89ba3ee", 1200),
    author: {
      name: "Leo Park",
      role: "Staff Photographer",
      avatar: img("photo-1507003211169-0a1dd7228f2d", 96),
    },
    tags: ["Guides", "Lighting", "Camera"],
    body: [
      "Golden hour is wonderful. It is also crowded, oversaturated and increasingly predictable. Some of the most cinematic frames happen in the twenty minutes after sunset, when the sky turns a deep cobalt blue and city lights start to glow.",
      "Start at ISO 400, open your aperture to f/2.8, and expose for the highlights. Blue hour rewards patience: the window is short, but the contrast between warm practical lights and cool ambient sky does most of the storytelling for you.",
      "Overcast days are another underrated gift. A cloud deck is a giant softbox that removes harsh shadows and lets color saturate evenly. Photographers who only chase sunsets miss half the year.",
      "Finally, learn to see window light indoors. A single north-facing window at a 45-degree angle gives you portrait lighting that most studios spend thousands trying to imitate.",
    ],
  },
  {
    id: "story-3",
    category: "Social Trends",
    title: "Why 'slow social' is the fastest-growing creator strategy",
    excerpt:
      "Posting less, replying more and building depth: the counterintuitive playbook behind the most loyal communities of 2026.",
    readTime: "5 min read",
    date: "Oct 3, 2026",
    image: img("photo-1513364776144-60967b0f800f", 1200),
    author: {
      name: "Sofia Ruiz",
      role: "Trend Analyst",
      avatar: img("photo-1534528741775-53994a69daeb", 96),
    },
    tags: ["Strategy", "Community", "2026"],
    body: [
      "The feed is infinite, but attention is not. Creators are responding by posting less often and investing more in every post — longer captions, real replies, follow-up stories that continue the conversation days later.",
      "Platform data from PostGram shows that accounts posting three to four times a week retain followers at nearly twice the rate of accounts posting daily. The difference is not frequency; it is depth.",
      "Slow social is not an excuse to disappear. It is a promise to be present when you show up. Communities reward creators who remember a name, answer a question and let a conversation breathe.",
      "The playbook is simple: one considered post, one honest story, one genuine conversation per day. The growth compounds quietly, and it is far more durable than a spike.",
    ],
  },
  {
    id: "story-4",
    category: "Creator Spotlights",
    title: "The analogue revival: inside the film club taking over feeds",
    excerpt:
      "Meet the collective shooting 35mm, scanning at home and turning grain into one of the most recognizable brands online.",
    readTime: "7 min read",
    date: "Sep 27, 2026",
    image: img("photo-1501785888041-af3ef285b470", 1200),
    author: {
      name: "Maya Chen",
      role: "Features Writer",
      avatar: img("photo-1517841905240-472988babdf9", 96),
    },
    tags: ["Film", "Community", "Craft"],
    body: [
      "In a feed increasingly dominated by synthetic sharpness, a loose collective of film photographers is building an audience around grain, light leaks and the possibility of failure.",
      "Their workflow is deliberately slower: a roll every week, a home scan every Sunday, a single carousel on Monday. Followers say the pace feels human — and the imperfection is the point.",
      "“Digital taught us we can fix anything,” one member says. “Film teaches you to notice before you press the shutter.” That mindset has spilled into their captions, which read less like product copy and more like field notes.",
      "The club now runs monthly darkroom sessions that sell out in minutes. Their growth came without a single algorithm hack — just a consistent point of view and a room full of people who share it.",
    ],
  },
  {
    id: "story-5",
    category: "Photography Tips",
    title: "Shoot your next story series in a single afternoon",
    excerpt:
      "A repeatable shot list for building a coherent five-image story — composition, color and sequencing included.",
    readTime: "6 min read",
    date: "Sep 20, 2026",
    image: img("photo-1470071459604-3b5ec3a7fe05", 1200),
    author: {
      name: "Ines Moreau",
      role: "Photo Editor",
      avatar: img("photo-1524504388940-b1c1722653e1", 96),
    },
    tags: ["Composition", "Storytelling", "Series"],
    body: [
      "A photo story is not five photos. It is one idea, seen five ways. Before you leave the house, write a single sentence that describes the feeling you want — not the subject, the feeling.",
      "Your shot list should cover scale, detail, portraiture, motion and an environmental frame. Shoot the wide establishing shot last, after the light has evolved and you understand the space.",
      "Sequence matters as much as capture. Open with context, move into detail, introduce a human element, then close on a wide that mirrors the opening. The viewer should feel a loop close.",
      "When you post the series, resist the urge to add every frame. The strongest image often reads stronger with two frames of breathing room around it.",
    ],
  },
  {
    id: "story-6",
    category: "Social Trends",
    title: "Carousels are back — and they're beating video on saves",
    excerpt:
      "New PostGram data shows swipe-through photo sets driving 3× more saves than short-form video. Here's how to use them.",
    readTime: "4 min read",
    date: "Sep 14, 2026",
    image: img("photo-1504384308090-c894fdcc538d", 1200),
    author: {
      name: "Aarav Shah",
      role: "Data Storyteller",
      avatar: img("photo-1500648767791-00dcc994a43e", 96),
    },
    tags: ["Carousels", "Analytics", "Saves"],
    body: [
      "Video gets the headlines, but carousels get saved. Across 40,000 creator accounts, swipe-through photo sets now generate three times more saves per impression than short-form video.",
      "The reason is simple: a carousel is a tiny editorial product. It has a cover, a pace and a payoff. Viewers swipe because there is a promise of another frame, and they save because the whole set feels worth returning to.",
      "The strongest carousels use a single cover hook, five to eight supporting frames and a final slide with a clear takeaway. Avoid reusing the same composition — each swipe should earn its place.",
      "Treat the caption as the ninth slide. It is where a saved post becomes a remembered one.",
    ],
  },
];

export const storyRings = [
  { id: "you", name: "You", avatar: img("photo-1535713875002-d1d0cf377fde", 96), isUser: true },
  { id: "nova", name: "Nova", avatar: img("photo-1494790108377-be9c29b29330", 96) },
  { id: "leo", name: "Leo", avatar: img("photo-1507003211169-0a1dd7228f2d", 96) },
  { id: "sofia", name: "Sofia", avatar: img("photo-1534528741775-53994a69daeb", 96) },
  { id: "ines", name: "Ines", avatar: img("photo-1524504388940-b1c1722653e1", 96) },
  { id: "aarav", name: "Aarav", avatar: img("photo-1500648767791-00dcc994a43e", 96) },
];

export const feedPosts = [
  {
    id: "feed-1",
    author: {
      name: "Maya Chen",
      handle: "@mayamakes",
      avatar: img("photo-1517841905240-472988babdf9", 96),
    },
    image: img("photo-1519681393784-d120267933ba", 900),
    location: "Kyoto, Japan",
    caption: "Golden hour hits different from the rooftop. 🌅",
    likes: 12842,
    comments: 214,
    time: "2m",
    tags: ["goldenhour", "kyoto"],
  },
  {
    id: "feed-2",
    author: {
      name: "Leo Park",
      handle: "@leopark",
      avatar: img("photo-1507003211169-0a1dd7228f2d", 96),
    },
    image: img("photo-1469474968028-56623f02e42e", 900),
    location: "Dolomites, Italy",
    caption: "Six hours of hiking for thirty seconds of light.",
    likes: 9421,
    comments: 167,
    time: "11m",
    tags: ["landscape", "dolomites"],
  },
  {
    id: "feed-3",
    author: {
      name: "Sofia Ruiz",
      handle: "@sofiaruiz",
      avatar: img("photo-1534528741775-53994a69daeb", 96),
    },
    image: img("photo-1495474472287-4d71bcdd2085", 900),
    location: "Lisbon, Portugal",
    caption: "Slow morning, strong coffee, zero notifications.",
    likes: 6187,
    comments: 92,
    time: "24m",
    tags: ["slowliving", "lisbon"],
  },
];

export const liveActivity = [
  {
    id: "act-1",
    name: "Maya Chen",
    action: "just posted a new reel",
    time: "now",
    avatar: img("photo-1517841905240-472988babdf9", 96),
  },
  {
    id: "act-2",
    name: "Leo Park",
    action: "liked your mountain shot",
    time: "12s",
    avatar: img("photo-1507003211169-0a1dd7228f2d", 96),
  },
  {
    id: "act-3",
    name: "Sofia Ruiz",
    action: "started following you",
    time: "34s",
    avatar: img("photo-1534528741775-53994a69daeb", 96),
  },
  {
    id: "act-4",
    name: "Aarav Shah",
    action: "commented: “This color grade is unreal”",
    time: "1m",
    avatar: img("photo-1500648767791-00dcc994a43e", 96),
  },
  {
    id: "act-5",
    name: "Ines Moreau",
    action: "shared your story",
    time: "2m",
    avatar: img("photo-1524504388940-b1c1722653e1", 96),
  },
];

export const trendingTags = [
  "#GoldenHour",
  "#StreetPortrait",
  "#FilmCommunity",
  "#SlowTravel",
  "#Reels",
  "#CreatorEconomy",
  "#BlueHour",
  "#AnalogForever",
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Live Feed", href: "#feed" },
      { label: "Creator Analytics", href: "#features" },
      { label: "Privacy", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Community", href: "#community" },
      { label: "Stories", href: "#stories" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Creator Guide", href: "#stories" },
      { label: "API Docs", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
];

export const socialLinks = [
  { label: "Instagram", icon: "Instagram", href: "https://instagram.com" },
  { label: "X / Twitter", icon: "Twitter", href: "https://x.com" },
  { label: "GitHub", icon: "Github", href: "https://github.com" },
  { label: "LinkedIn", icon: "Linkedin", href: "https://linkedin.com" },
];
