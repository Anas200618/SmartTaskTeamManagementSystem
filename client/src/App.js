import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // Added
import "react-toastify/dist/ReactToastify.css"; // Added

import HomePage from "./pages/home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GlobalDashboard from "./pages/Dashboard";
import TaskManagement from "./pages/TaskManagement";
import TeamManagement from "./components/TeamManagement";
import UserManagement from "./pages/UserManagement"; 

import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      {/* ToastContainer allows popups to show up globally */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        {/* ================= Public Routes ================= */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= Global Dashboard ================= */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <GlobalDashboard />
            </PrivateRoute>
          }
        />

        {/* ================= Task Management ================= */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TaskManagement />
            </PrivateRoute>
          }
        />

        {/* ================= Team Management (Admin + SuperAdmin) ================= */}
        <Route
          path="/teams"
          element={
            <PrivateRoute role={["Admin", "SuperAdmin"]}>
              <TeamManagement />
            </PrivateRoute>
          }
        />

        {/* ================= User Management (SuperAdmin only) ================= */}
        <Route
          path="/users"
          element={
            <PrivateRoute role="SuperAdmin">
              <UserManagement />
            </PrivateRoute>
          }
        />

        {/* ================= Redirect Unknown Routes ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;