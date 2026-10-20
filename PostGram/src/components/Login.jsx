import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { Lock, Mail } from "lucide-react";
import authservice from "../Appwrite/Auth";
import { toUserMessage } from "../lib/errors";
import { login as authLogin } from "../store/authSlice";
import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmit,
  AuthTabs,
} from "./auth/AuthUI";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onTouched" });
  const [error, setError] = useState("");

  const login = async (data) => {
    setError("");

    try {
      const session = await authservice.Login(data);

      if (session) {
        const user = await authservice.getcurrentUser();

        if (user) {
          let prefs = {};

          try {
            prefs = (await authservice.getPrefs()) || {};
          } catch (prefsError) {
            // Sign in still works when preferences can't be read.
          }

          dispatch(
            authLogin({
              $id: user.$id,
              email: user.email,
              name: user.name,
              username: prefs.username || "",
              bio: prefs.bio || "",
              avatarFileId: prefs.avatarFileId || "",
            }),
          );
        }

        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        toUserMessage(
          err,
          "Unable to sign in. Please try again.",
          { 401: "The email or password is incorrect.", 429: "Too many sign-in attempts. Please wait a minute and try again." },
        ),
      );
    }
  };

  return (
    <AuthShell mode="login">
      <AuthTabs active="login" />

      <div className="mt-7">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Sign in to return to your creative canvas.
        </p>
      </div>

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <form
        onSubmit={handleSubmit(login)}
        noValidate
        className="mt-6 space-y-4"
      >
        <AuthField
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          autoComplete="email"
          error={errors.email}
          {...register("email", {
            required: "Please enter your email address.",
            validate: (value) =>
              /^([\w.\-_]+)?\w+@[\w-_]+(\.\w+){1,}$/i.test(value) ||
              "Please enter a valid email address.",
          })}
        />

        <AuthField
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={Lock}
          autoComplete="current-password"
          error={errors.password}
          {...register("password", {
            required: "Please enter your password.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long.",
            },
          })}
        />

        <AuthSubmit loading={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-violet-300 transition hover:text-violet-200"
        >
          Create one free
        </Link>
      </p>
    </AuthShell>
  );
};

export default Login;
