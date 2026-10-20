import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import appwriteService from "../Appwrite/config";
import { updateUser } from "../store/authSlice";

const ProfilesContext = createContext(null);

const EMPTY_PROFILES = {};

// A single normalised shape shared by every component that renders a creator.
const normalizeProfileDoc = (document) => {
  const userId = document?.userId || document?.$id || "";
  const avatarFileId = document?.avatarFileId || "";

  return {
    userId,
    name: document?.name || document?.displayName || "",
    username: String(document?.username || "").replace(/^@+/, ""),
    bio: document?.bio || "",
    avatarFileId,
    avatarUrl: avatarFileId
      ? appwriteService.getFileView(avatarFileId)
      : "",
    hasProfile: true,
  };
};

const decorateProfile = (profile = {}, userId = "") => {
  const avatarFileId = profile.avatarFileId || "";

  return {
    userId: profile.userId || userId,
    name: profile.name || "",
    username: String(profile.username || "").replace(/^@+/, ""),
    bio: profile.bio || "",
    avatarFileId,
    avatarUrl: avatarFileId
      ? appwriteService.getFileView(avatarFileId)
      : "",
    hasProfile: Boolean(profile.hasProfile),
  };
};

const PROFILE_STATE_KEYS = ["name", "username", "bio", "avatarFileId"];

/**
 * Global profile cache + realtime profile subscription.
 *
 * Every screen resolves creators through this map, so a profile update made by
 * any client is patched in place and re-rendered across the feed, creator rail,
 * chat, navbar and public profile without a reload.
 */
export const ProfilesProvider = ({ children }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.userData);
  const currentUserId = currentUser?.$id || "";

  const [profiles, setProfiles] = useState(EMPTY_PROFILES);
  const [followsVersion, setFollowsVersion] = useState(0);

  const profilesRef = useRef(EMPTY_PROFILES);
  const pendingRef = useRef(new Set());

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const mergeProfiles = useCallback((entries = {}) => {
    if (!entries || Object.keys(entries).length === 0) return;

    setProfiles((current) => {
      const next = { ...current };

      Object.entries(entries).forEach(([userId, value]) => {
        const id = userId || value?.userId;
        if (!id) return;

        next[id] = {
          ...(current[id] || {}),
          ...decorateProfile(value, id),
        };
      });

      return next;
    });
  }, []);

  /**
   * Batch-load profiles for a set of user ids. Ids that already live in the
   * cache are never requested again, and concurrent calls are deduplicated.
   */
  const ensureProfiles = useCallback(
    async (userIds = []) => {
      const unique = [
        ...new Set(
          (Array.isArray(userIds) ? userIds : [userIds])
            .filter(Boolean)
            .map(String),
        ),
      ];

      const missing = unique.filter(
        (userId) =>
          !profilesRef.current[userId] && !pendingRef.current.has(userId),
      );

      if (missing.length === 0) return;

      missing.forEach((userId) => pendingRef.current.add(userId));

      try {
        let found = {};
        let collectionMissing = false;

        try {
          const result = await appwriteService.listProfilesByIds(missing);
          found = result?.profiles || {};
          collectionMissing = Boolean(result?.missingCollection);
        } catch (queryError) {
          // The collection may be absent; per-id resolution below decides.
          found = {};
        }

        const unresolved = missing.filter((userId) => !found[userId]);
        const fallbackEntries = collectionMissing
          ? unresolved.map((userId) => [
              userId,
              { userId, hasProfile: false },
            ])
          : await Promise.all(
              unresolved.map(async (userId) => {
                try {
                  const profile =
                    await appwriteService.getPublicProfile(userId);
                  return [userId, profile || { userId, hasProfile: false }];
                } catch (profileError) {
                  return [userId, { userId, hasProfile: false }];
                }
              }),
            );

        mergeProfiles({
          ...found,
          ...Object.fromEntries(fallbackEntries),
        });
      } finally {
        missing.forEach((userId) => pendingRef.current.delete(userId));
      }
    },
    [mergeProfiles],
  );

  /**
   * Optimistic local write used right after a successful profile mutation, so
   * the current user's avatar/handle update before the socket round-trip.
   */
  const setProfile = useCallback(
    (userId, patch = {}) => {
      if (!userId) return;

      setProfiles((current) => {
        const merged = { ...(current[userId] || {}), ...patch };

        return {
          ...current,
          [userId]: {
            ...merged,
            ...decorateProfile(merged, userId),
            hasProfile: true,
          },
        };
      });

      if (currentUserId && userId === currentUserId) {
        const statePatch = {};
        PROFILE_STATE_KEYS.forEach((key) => {
          if (patch[key] !== undefined) statePatch[key] = patch[key];
        });

        if (Object.keys(statePatch).length > 0) {
          dispatch(updateUser(statePatch));
        }
      }
    },
    [currentUserId, dispatch],
  );

  const getProfile = useCallback(
    (userId) => profiles[userId] || null,
    [profiles],
  );

  const refreshProfile = useCallback(
    async (userId) => {
      if (!userId) return null;

      try {
        const profile = await appwriteService.getPublicProfile(userId);
        mergeProfiles({ [userId]: profile });
        return profile;
      } catch (error) {
        return null;
      }
    },
    [mergeProfiles],
  );

  // Hydrate the signed-in user's public profile on boot and after sign-in.
  useEffect(() => {
    if (currentUserId) ensureProfiles([currentUserId]);
  }, [currentUserId, ensureProfiles]);

  // Universal realtime stream: profiles and follows.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let active = true;
    const cleanups = [];

    const keepSubscription = (subscribe) => {
      try {
        const subscription = subscribe();

        if (typeof subscription === "function") {
          cleanups.push(subscription);
          return;
        }

        if (subscription && typeof subscription.then === "function") {
          subscription
            .then((stop) => {
              if (!active) {
                if (typeof stop === "function") stop();
                return;
              }
              if (typeof stop === "function") cleanups.push(stop);
            })
            .catch(() => {
              // Realtime is optional; the app stays functional without it.
            });
        }
      } catch (subscriptionError) {
        // Realtime is optional; the app stays functional without it.
      }
    };

    const handleProfileEvent = (response) => {
      const events = response?.events || [];
      const document = response?.payload;
      const userId = document?.userId || document?.$id;

      if (!userId) return;

      const isDelete = events.some((event) => event.endsWith(".delete"));

      if (isDelete) {
        setProfiles((current) =>
          current[userId]
            ? {
                ...current,
                [userId]: {
                  ...current[userId],
                  hasProfile: false,
                },
              }
            : current,
        );
        return;
      }

      const normalized = normalizeProfileDoc(document);

      setProfiles((current) => ({
        ...current,
        [userId]: {
          ...(current[userId] || {}),
          ...normalized,
        },
      }));

      if (currentUserId && userId === currentUserId) {
        dispatch(
          updateUser({
            name: normalized.name,
            username: normalized.username,
            bio: normalized.bio,
            avatarFileId: normalized.avatarFileId,
          }),
        );
      }
    };

    const handleFollowEvent = () => {
      setFollowsVersion((version) => version + 1);
    };

    keepSubscription(() =>
      appwriteService.subscribeToProfiles(handleProfileEvent),
    );
    keepSubscription(() =>
      appwriteService.subscribeToFollows(handleFollowEvent),
    );

    return () => {
      active = false;
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (cleanupError) {
          // The socket is already closed.
        }
      });
    };
  }, [currentUserId, dispatch]);

  const value = useMemo(
    () => ({
      profiles,
      followsVersion,
      ensureProfiles,
      getProfile,
      setProfile,
      refreshProfile,
    }),
    [
      profiles,
      followsVersion,
      ensureProfiles,
      getProfile,
      setProfile,
      refreshProfile,
    ],
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
};

export const useProfiles = () => {
  const context = useContext(ProfilesContext);

  if (!context) {
    throw new Error("useProfiles must be used inside a ProfilesProvider.");
  }

  return context;
};

export default ProfilesContext;
