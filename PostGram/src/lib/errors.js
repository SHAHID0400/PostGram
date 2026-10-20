const STATUS_MESSAGES = {
  400: "That request could not be completed. Check the details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for.",
  409: "That action conflicts with existing data.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Our service is having trouble right now. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

const TECHNICAL_DETAIL =
  /appwrite|collection|attribute|database|document|index|permission|stack|fetch|network|socket|undefined|null/i;

/**
 * Converts an unknown error into copy that is safe to show to a person.
 * Raw SDK messages and stack details never reach the interface.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @param {Record<number, string>} [overrides]
 * @returns {string}
 */
export const toUserMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
  overrides = {},
) => {
  const source = /** @type {{ code?: number, message?: string }} */ (error);
  const code = typeof source?.code === "number" ? source.code : null;

  if (!code && source?.message && /failed to fetch|networkerror/i.test(source.message)) {
    return "We can't reach the server. Check your connection and try again.";
  }

  if (code && overrides[code]) return overrides[code];
  if (code && STATUS_MESSAGES[code]) return STATUS_MESSAGES[code];

  const message = typeof source?.message === "string" ? source.message : "";

  if (message && !code && !TECHNICAL_DETAIL.test(message)) {
    return message;
  }

  return fallback;
};
