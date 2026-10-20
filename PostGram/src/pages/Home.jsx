import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Landing from "./Landing";

const Home = () => {
  const authStatus = useSelector((state) => state.auth.status);

  // Guests get the marketing landing; signed-in creators go to their feed.
  return authStatus ? <Navigate to="/dashboard" replace /> : <Landing />;
};

export default Home;
