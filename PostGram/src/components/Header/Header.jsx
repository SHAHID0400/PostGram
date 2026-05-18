import React, { act, useState } from "react";
import { Container, Logo } from "../index";
import Logoutbtn from "./Logoutbtn";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const [open, setopen] = useState(false);
  const authStatus = useSelector((state) => state.auth?.status);
  const navigate = useNavigate();
  // console.log("authStatus:", authStatus);

  const navItems = [
    {
      name: "Home",
      slug: "/",
      active: true,
    },
    {
      name: "Login",
      slug: "/login",
      active: !authStatus,
    },

    {
      name: "Signup",
      slug: "/signup",
      active: !authStatus,
    },
    {
      name: "All Posts",
      slug: "/all-posts",
      active: authStatus,
    },
    {
      name: "Add Post",
      slug: "/add-post",
      active: authStatus,
    },
  ];

  // console.log(navItems);

  return (
    <header className=" relative text-white py-4">
      <Container>
        <nav className="flex items-center justify-between">
          {/* <div className='mr-4'>
            <Link to='/'><Logo width='70px' /></Link>
          </div> */}

          <Link to="/">
            <Logo />
          </Link>
          <div
            className="sm:hidden ml-auto text-2xl cursor-pointer"
            onClick={() => {
              setopen(!open);
            }}
          >
            ☰
          </div>

          <ul className="flex gap-4 text-white ml-auto hidden sm:flex">
            {navItems.map((item) =>
              item.active ? (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      navigate(item.slug);
                    }}
                    className="inline-block px-6 py-2 duration-200 hover:bg-blue-100 hover:text-black rounded-full"
                  >
                    {item.name}
                  </button>
                </li>
              ) : null,
            )}

            {authStatus && (
              <li>
                <Logoutbtn />
              </li>
            )}
          </ul>
          {open && (
            <div className="absolute top-16 right-4 bg-slate-800 p-4 rounded-lg flex flex-col gap-4 sm:hidden">
              {navItems.map((item) =>
                item.active ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.slug);
                      setopen(false);
                    }}
                    className="text-white text-left"
                  >
                    {item.name}
                  </button>
                ) : null,
              )}

              {authStatus && <Logoutbtn />}
            </div>
          )}
        </nav>
      </Container>
    </header>
  );
};

export default Header;
