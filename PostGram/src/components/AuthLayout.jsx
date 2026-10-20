import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * Route guard for authenticated and guest-only routes.
 * - authentication={true}: requires a signed-in user.
 * - authentication={false}: only for guests (login / signup).
 */
const AuthLayout = ({ children, authentication = true }) => {
  const authStatus = useSelector((state) => state.auth?.status);

  if (authentication && !authStatus) {
    return <Navigate to="/login" replace />;
  }

  if (!authentication && authStatus) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AuthLayout;
