import React, { useEffect, useState } from "react";
import conf from "./conf/confi";
import { useDispatch } from "react-redux";
import authService from "./Appwrite/Auth";
import { login, logout } from "./store/authSlice";
import { Footer, Header } from "./components";
import { Outlet } from "react-router-dom";

export const App = () => {
  const [loading, setloading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await authService.getcurrentUser();

        if (userData) {
          dispatch(
            login({
              $id: userData.$id,
              email: userData.email,
              name: userData.name,
            }),
          );
        } else {
          dispatch(logout());
        }
      } catch (error) {
        // 👇 IMPORTANT
        // guest user pe error aayega — ignore kar
        dispatch(logout());
      } finally {
        setloading(false);
      }
    };

    checkUser();
  }, []);

  return !loading ? (
    <div className="min-h-screen bg-gradient-to-br flex flex-col from-slate-900 via-blue-950 to-slate-900 text-white">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 md:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  ) : null;
};

export default App;
