import React from "react";
import { Navigate } from "react-router-dom";

// children = component to render
// role = string or array of allowed roles

const PrivateRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check
  if (role) {
    if (Array.isArray(role)) {
      if (!role.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      if (user.role !== role) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default PrivateRoute;
