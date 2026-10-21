const getAvatarFileId = (profile) =>
  [profile?.avatarFileId, profile?.avatar, profile?.imageId]
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";

const getTimestamp = (profile) => {
  const updatedAt = Date.parse(profile?.$updatedAt || "");
  if (Number.isFinite(updatedAt)) return updatedAt;

  const createdAt = Date.parse(profile?.$createdAt || "");
  return Number.isFinite(createdAt) ? createdAt : 0;
};

export const compareProfiles = (first, second) => {
  const firstHasAvatar = Boolean(getAvatarFileId(first));
  const secondHasAvatar = Boolean(getAvatarFileId(second));

  if (firstHasAvatar !== secondHasAvatar) {
    return firstHasAvatar ? 1 : -1;
  }

  const timestampDifference = getTimestamp(first) - getTimestamp(second);
  if (timestampDifference !== 0) return timestampDifference;

  return String(first?.$id || "").localeCompare(String(second?.$id || ""));
};

export const selectPreferredProfile = (profiles = []) =>
  profiles.reduce((preferred, profile) => {
    if (!profile) return preferred;
    return !preferred || compareProfiles(profile, preferred) > 0
      ? profile
      : preferred;
  }, null);

export const dedupeProfiles = (profiles = []) => {
  const byUserId = new Map();

  profiles.forEach((profile) => {
    const userId = profile?.userId || profile?.$id;
    if (!userId) return;

    const existing = byUserId.get(userId);
    if (!existing || compareProfiles(profile, existing) > 0) {
      byUserId.set(userId, profile);
    }
  });

  return [...byUserId.values()];
};