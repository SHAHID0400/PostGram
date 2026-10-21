import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import authService from "./Appwrite/Auth";
import appwriteService from "./Appwrite/config";
import { login, logout } from "./store/authSlice";
import { Footer, Header } from "./components";
import { Outlet, useLocation } from "react-router-dom";

export const App = () => {
  const [loading, setloading] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();
  const authStatus = useSelector((state) => state.auth?.status);

  // The landing, auth and dashboard experiences ship their own full-page layouts.
  const isLandingExperience = location.pathname === "/" && !authStatus;
  const isAuthExperience = ["/login", "/signup"].includes(location.pathname);
  const standaloneRoutes = [
    "/dashboard",
    "/admin",
    "/studio",
    "/add-post",
    "/explore",
    "/profile",
    "/chat",
  ];
  const isDashboardExperience =
    standaloneRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/creator/") ||
    location.pathname.startsWith("/profile/") ||
    location.pathname.startsWith("/chat/");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await authService.getcurrentUser();

        if (userData) {
          let prefs = {};

          try {
            prefs = (await authService.getPrefs()) || {};
          } catch (prefsError) {
            // Accounts without stored preferences still sign in normally.
          }

          dispatch(
            login({
              $id: userData.$id,
              email: userData.email,
              name: userData.name,
              labels: userData.labels || [],
              username: prefs.username || "",
              bio: prefs.bio || "",
              avatarFileId: prefs.avatarFileId || "",
            }),
          );

          // Backfill the public profile document only when it is missing, so
          // accounts that predate profiles stay searchable without overwriting
          // data a user has already saved.
          appwriteService
            .ensurePublicProfile(userData.$id, {
              name: userData.name || "",
              username: prefs.username || "",
              bio: prefs.bio || "",
              avatarFileId: prefs.avatarFileId || "",
            })
            .catch(() => {});
        } else {
          authService.clearClientCache();
          dispatch(logout());
        }
      } catch (error) {
        // A missing or expired session must never leave cached identity behind.
        authService.clearClientCache();
        dispatch(logout());
      } finally {
        setloading(false);
      }
    };

    checkUser();
  }, []);
  

  return !loading ? (
    isLandingExperience || isAuthExperience || isDashboardExperience ? (
      <Outlet />
    ) : (
      <div className="flex min-h-screen flex-col bg-night text-white">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 grid-overlay opacity-30" />
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.16),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_70%)] blur-3xl" />
        </div>

        <Header />

        <main className="relative grow">
          <Outlet />
        </main>

        <Footer />
      </div>
    )
  ) : null;
};

export default App;
