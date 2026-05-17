import React from "react";
import authservice from "../Appwrite/Auth";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { Button, Input, Logo } from "./index";
import { useDispatch } from "react-redux";
import { set, useForm } from "react-hook-form";
import { useState } from "react";
const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();
  const [error, seterror] = useState("");
  const create = async (data) => {
    seterror("");
    try {
      const userData = await authservice.CreateAccount(data);

      if (userData) {
        const currentUser = await authservice.getcurrentUser();

        if (currentUser) {
          const cleanUser = {
            id: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
          };

          dispatch(login({ userData: cleanUser }));
        }

        navigate("/");
      }
    } catch (error) {
      seterror(error.message);
    }
  };
  return (
    <div className="flex items-center justify-center">
      <div
        className={`max-auto w-full max-w-lg  bg-gray-100 rounded-xl p-10 border border-black/10`}
      >
        <div className="mb-2 flex justify-center">
          <span className="inline-block w-full mx-auto">
            <Logo width="100%" />
          </span>
        </div>
        <h2 className="text-center text-2xl text-black font-bold leading-tight">
          {" "}
          Sign Up to Create account
        </h2>
        <p className="mt-2 text-center text-base text-black/60">
          Already have an account?&nbsp;
          <Link
            to="/login"
            className="font-medium text-primary transition-all duration-200 hover:underline"
          >
            Sign In
          </Link>
        </p>
        {error && <p className="text-red-600 mt-8 text-center">{error}</p>}
        <form onSubmit={handleSubmit(create)}>
          <div className="space-y-5">
            <Input
              label="Full name "
              placeholder="Enter your full name"
              {...register("name", {
                required: true,
              })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              {...register("email", {
                required: true,
                validate: (value) =>
                  /^([\w\.\-_]+)?\w+@[\w-_]+(\.\w+){1,}$/i.test(value) ||
                  "Please enter a valid email address",
              })}
            />
            <Input
              label="Password"
              placeholder="Enter Password"
              type="password"
              {...register("password", {
                required: true,
              })}
            />
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
