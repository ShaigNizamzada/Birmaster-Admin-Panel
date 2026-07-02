import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";

const ProtectedRoute = () => {
  const [cookies, , removeCookie] = useCookies(["token"]);
  const token = cookies?.token;
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/Auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response?.data?.user?.id === 1) {
          setIsValid(true);
        } else {
          removeCookie("token", { path: "/" });
          setIsValid(false);
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        removeCookie("token", { path: "/" });
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkToken();
  }, [token, removeCookie, location.pathname]);

  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
