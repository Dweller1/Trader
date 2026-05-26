import { createContext, useContext, useState, createElement } from "react";
import { setToken } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("vatUser") || "null"),
  );

  function login(accessToken, userData) {
    setToken(accessToken);
    localStorage.setItem("vatUser", JSON.stringify(userData));
    localStorage.setItem("vatAuth", "true");
    setUser(userData);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("vatUser");
    localStorage.removeItem("vatAuth");
    setUser(null);
  }

  return createElement(
    AuthContext.Provider,
    { value: { user, login, logout } },
    children,
  );
}

export const useAuth = () => useContext(AuthContext);
