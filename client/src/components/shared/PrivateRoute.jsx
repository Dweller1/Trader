import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const isAuth = localStorage.getItem("vatAuth") === "true";
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
