import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

const Footer = () => {
  return (
    <section className="relative overflow-hidden py-10 text-white font-bold bg-slate-900 border-t border-white/10 border border-t border-white/10 ">
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className=" grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="w-full p-6 md:w-1/2 lg:w-5/12">
            <div className="flex h-full flex-col justify-between">
              <div className="mb-6 flex justify-center sm:justify-start">
                <Logo width="100px" />
              </div>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <div className="h-full">
              <h3 className="tracking-px mb-4  text-xs font-semibold uppercase text-gray-300 text-center sm:text-left">
                Company
              </h3>
              <ul className="spac-y-2 text-center sm:text-left">
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Features
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Pricing
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Affiliate Program
                  </Link>
                </li>
                <li>
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Press Kit
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-2/12">
            <div className="h-full">
              <h3 className="tracking-px mb-4  text-xs font-semibold uppercase text-gray-300 text-center sm:text-left">
                Support
              </h3>
              <ul className="space-y-2 text-center sm:text-left">
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Account
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Help
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Customer Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-full p-6 md:w-1/2 lg:w-3/12">
            <div className="h-full">
              <h3 className="tracking-px mb-4  text-xs font-semibold uppercase text-gray-300 text-center sm:text-left">
                Legals
              </h3>
              <ul className="space-y-2 text-center sm:text-left">
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    className=" text-sm font-medium text-gray-400 hover:text-white transition"
                    to="/"
                  >
                    Licensing
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 flex justify-center mt-10">
          &copy; Copyright 2026. All Rights Reserved by Shahid.
        </p>
      </div>
    </section>
  );
};

export default Footer;
