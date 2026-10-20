const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<[^>]*>/g;

/**
 * Normalises untrusted text before it is persisted or rendered.
 * React escapes output, but stripping markup at the boundary keeps stored
 * captions, comments and messages free of script payloads.
 *
 * @param {unknown} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export const sanitizeText = (value, maxLength = 2000) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(CONTROL_CHARACTERS, "")
    .replace(HTML_TAGS, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
};

/**
 * Keeps usernames to a predictable handle-safe character set.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const sanitizeUsername = (value) =>
  sanitizeText(value, 20)
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9._]/g, "");

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Validates image uploads before they reach Appwrite Storage.
 * Server-side validation remains mandatory; this is the first line of defence.
 *
 * @param {File | null | undefined} file
 * @param {{ maxBytes?: number }} [options]
 * @returns {File}
 */
export const assertSafeImage = (
  file,
  { maxBytes = DEFAULT_MAX_IMAGE_BYTES } = {},
) => {
  if (!file || typeof file !== "object") {
    throw new Error("Choose an image to upload.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, WEBP or GIF image.");
  }

  if (file.size <= 0) {
    throw new Error("That image looks empty. Choose another file.");
  }

  if (file.size > maxBytes) {
    throw new Error("That image is too large. Choose one under 10 MB.");
  }

  return file;
};

/**
 * Deduplicates and normalises a list of user ids (likes, participants).
 *
 * @param {unknown} values
 * @param {number} [limit]
 * @returns {string[]}
 */
export const sanitizeIdList = (values, limit = 5000) => {
  if (!Array.isArray(values)) return [];

  return [...new Set(values)]
    .filter((value) => typeof value === "string")
    .map((value) => sanitizeText(value, 36))
    .filter(Boolean)
    .slice(0, limit);
};
