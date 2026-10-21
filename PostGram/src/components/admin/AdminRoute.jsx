import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../Appwrite/Auth";

const AdminRoute = ({ children }) => {
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    authService
      .getcurrentUser()
      .then((user) => {
        if (cancelled) return;
        setAccess(user?.labels?.includes("admin") ? "allowed" : "denied");
      })
      .catch(() => {
        if (!cancelled) setAccess("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (access === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7fb] px-6 text-slate-900">
        <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-semibold">Admin label required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            You&apos;re signed in, but this Appwrite account doesn&apos;t have the{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
              admin
            </code>{" "}
            label. Add that label to this user in Appwrite, then reload this page.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Back to PostGram
          </Link>
        </section>
      </main>
    );
  }
  if (access === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7fb] px-6 text-slate-900">
        <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-semibold">Admin access unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            We couldn&apos;t verify your account label. Check your connection and
            try loading this page again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
  if (access !== "allowed") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f7fb]">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        <span className="sr-only">Verifying admin access</span>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
