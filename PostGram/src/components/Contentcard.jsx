import React from "react";
import Logo from "./Logo";

const Contentcard = () => {
  return (
    <div className="flex items-center justify-center w-full min-h-[70vh]">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 w-[350px] text-center">
        <div className="flex justify-center items-center mb-4 h-20">
          <Logo />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome to Postgram 
        </h1>

        <p className="text-gray-300 text-sm mb-6">
          Share your thoughts, explore posts, and connect.
        </p>
        <div>
          <p className="text-sm text-gray-400 mt-4">
            Use the top menu to login or signup
          </p>
        </div>

        {/* <div className="flex gap-3 justify-center">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg text-white">
            Login
          </button>
          <button className="border px-4 py-2 rounded-lg text-white">
            Signup
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Contentcard;
