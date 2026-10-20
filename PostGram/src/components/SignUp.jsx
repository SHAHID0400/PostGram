import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { Lock, Mail, User } from "lucide-react";
import authservice from "../Appwrite/Auth";
import appwriteService from "../Appwrite/config";
import { toUserMessage } from "../lib/errors";
import { login } from "../store/authSlice";
import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmit,
  AuthTabs,
} from "./auth/AuthUI";

const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onTouched" });
  const [error, setError] = useState("");

  const create = async (data) => {
    setError("");

    try {
      const userData = await authservice.CreateAccount(data);

      if (userData) {
        const currentUser = await authservice.getcurrentUser();

        if (currentUser) {
          let prefs = {};

          try {
            prefs = (await authservice.getPrefs()) || {};
          } catch (prefsError) {
            // A brand-new account has no preferences yet.
          }

          dispatch(
            login({
              $id: currentUser.$id,
              email: currentUser.email,
              name: currentUser.name,
              username: prefs.username || "",
              bio: prefs.bio || "",
              avatarFileId: prefs.avatarFileId || "",
            }),
          );

          // Create the public profile document so people can find this
          // account by name or @username right away.
          appwriteService
            .savePublicProfile({
              userId: currentUser.$id,
              name: currentUser.name || "",
              username: prefs.username || "",
              bio: prefs.bio || "",
              avatarFileId: prefs.avatarFileId || "",
            })
            .catch(() => {});
        }

        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        toUserMessage(
          err,
          "Unable to create your account. Please try again.",
          { 409: "An account with this email already exists. Try signing in instead." },
        ),
      );
    }
  };

  return (
    <AuthShell mode="signup">
      <AuthTabs active="signup" />

      <div className="mt-7">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          One minute to set up. A lifetime of moments.
        </p>
      </div>

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <form
        onSubmit={handleSubmit(create)}
        noValidate
        className="mt-6 space-y-4"
      >
        <AuthField
          label="Full name"
          placeholder="Enter your full name"
          icon={User}
          autoComplete="name"
          error={errors.name}
          {...register("name", {
            required: "Please enter your full name.",
          })}
        />

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
          placeholder="Create a password"
          icon={Lock}
          autoComplete="new-password"
          error={errors.password}
          {...register("password", {
            required: "Please create a password.",
          })}
        />

        <AuthSubmit loading={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </AuthSubmit>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-violet-300 transition hover:text-violet-200"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default SignUp;
