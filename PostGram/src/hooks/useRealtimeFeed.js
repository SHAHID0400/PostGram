import { useEffect, useRef } from "react";
import appwriteService from "../Appwrite/config";

/**
 * Subscribes to the articles collection once and forwards every create,
 * update and delete through a ref, so components never resubscribe merely
 * because their render closure changed.
 *
 * `onEvent({ document, events })` receives the raw Appwrite realtime payload.
 */
export const useRealtimeFeed = (onEvent) => {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let active = true;
    let unsubscribe = null;

    const handleEvent = (response) => {
      if (!active) return;

      const events = response?.events || [];
      const document = response?.payload;

      if (!document?.$id) return;

      try {
        handlerRef.current?.({ document, events });
      } catch (handlerError) {
        // A rendering handler must never tear down the socket.
      }
    };

    try {
      const subscription = appwriteService.subscribeToFeed(handleEvent);

      if (typeof subscription === "function") {
        unsubscribe = subscription;
      } else if (subscription && typeof subscription.then === "function") {
        subscription
          .then((stop) => {
            if (!active) {
              if (typeof stop === "function") stop();
              return;
            }
            unsubscribe = stop;
          })
          .catch(() => {
            // Realtime is optional; pages keep their fetched data.
          });
      }
    } catch (subscriptionError) {
      // Realtime is optional; pages keep their fetched data.
    }

    return () => {
      active = false;
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (cleanupError) {
        // The socket is already closed.
      }
    };
  }, []);
};

export default useRealtimeFeed;
