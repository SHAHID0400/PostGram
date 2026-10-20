import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store.js";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import AuthLayout from "./components/AuthLayout.jsx";
import ErrorBoundary from "./components/system/ErrorBoundary.jsx";
import { ProfilesProvider } from "./context/ProfilesContext.jsx";
import { CommentsProvider } from "./context/CommentsContext.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const Signup = lazy(() => import("./pages/SignUp.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Explore = lazy(() => import("./pages/Explore.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const Creator = lazy(() => import("./pages/Creator.jsx"));
const Studio = lazy(() => import("./pages/Studio"));
const EditPost = lazy(() => import("./pages/EditPost"));
const Post = lazy(() => import("./pages/Post"));

const RouteLoading = () => (
  <div className="grid min-h-screen place-items-center bg-night">
    <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-violet-400" />
    <span className="sr-only">Loading PostGram</span>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <AuthLayout authentication={false}>
            <Signup />
          </AuthLayout>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <AuthLayout authentication>
            <Dashboard />
          </AuthLayout>
        ),
      },
      {
        path: "/explore",
        element: (
          <AuthLayout authentication>
            <Explore />
          </AuthLayout>
        ),
      },
      {
        path: "/profile",
        element: (
          <AuthLayout authentication>
            <Profile />
          </AuthLayout>
        ),
      },
      {
        path: "/profile/:userId",
        element: (
          <AuthLayout authentication>
            <UserProfile />
          </AuthLayout>
        ),
      },
      {
        path: "/chat",
        element: (
          <AuthLayout authentication>
            <Chat />
          </AuthLayout>
        ),
      },
      {
        path: "/chat/:recipientId",
        element: (
          <AuthLayout authentication>
            <Chat />
          </AuthLayout>
        ),
      },
      {
        path: "/creator/:userId",
        element: (
          <AuthLayout authentication>
            <Creator />
          </AuthLayout>
        ),
      },
      {
        path: "/all-posts",
        element: <Navigate to="/explore" replace />,
      },
      {
        path: "/studio",
        element: (
          <AuthLayout authentication>
            <Studio />
          </AuthLayout>
        ),
      },
      {
        path: "/add-post",
        element: (
          <AuthLayout authentication>
            <Studio />
          </AuthLayout>
        ),
      },
      {
        path: "/edit-post/:slug",
        element: (
          <AuthLayout authentication>
            <EditPost />
          </AuthLayout>
        ),
      },
      {
        path: "/post/:slug",
        element: <Post />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ProfilesProvider>
          <CommentsProvider>
            <Suspense fallback={<RouteLoading />}>
              <RouterProvider router={router} />
            </Suspense>
          </CommentsProvider>
        </ProfilesProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
