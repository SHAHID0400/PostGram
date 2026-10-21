import appwriteService from "../Appwrite/config";

export const getAvatarUrl = (profile) => {
  const fileId = [profile?.avatarFileId, profile?.avatar, profile?.imageId]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim();

  if (!fileId) return null;

  try {
    const fileUrl = appwriteService.getFileView(fileId);
    return typeof fileUrl === "string" && fileUrl.trim()
      ? fileUrl.trim()
      : null;
  } catch {
    return null;
  }
};