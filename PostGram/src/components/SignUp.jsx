import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AtSign, Lock, Mail, User } from "lucide-react";
import authservice from "../Appwrite/Auth";
import { toUserMessage } from "../lib/errors";
import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmit,
  AuthTabs,
} from "./auth/AuthUI";

const SignUp = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onTouched" });
  const [error, setError] = useState("");

  const create = async (data) => {
    setError("");

    try {
      const created = await authservice.CreateAccount(data);

      if (!created?.$id) {
        throw new Error("Account was not created.");
      }

      // There is no session yet, so the chosen handle is kept locally until
      // the first sign-in and then written to preferences + public profile.
      authservice.rememberPendingProfile({
        email: data.email,
        name: data.name,
        username: data.username,
      });

      // Registration deliberately stops here. A dedicated sign-in makes the
      // new account prove its credentials before any session exists.
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully! Please sign in with your credentials.",
        },
      });
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
          label="Username"
          placeholder="yourhandle"
          icon={AtSign}
          autoComplete="username"
          hint="This is the @handle people will see on your profile."
          error={errors.username}
          {...register("username", {
            required: "Please choose a username.",
            pattern: {
              value: /^[a-z0-9._]{3,20}$/i,
              message: "Use 3–20 letters, numbers, dots or underscores.",
            },
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
