import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Member",
  });

  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const primaryColor = "#2c5d8f";
  const secondaryColor = "#1a3a5a";

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // Name Validation: Matches the professional regex in backend
    if (!name) {
      newErrors.name = "Full name is required";
    } else if (name.length < 2 || name.length > 50) {
      newErrors.name = "Name must be 2-50 characters";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      newErrors.name = "Invalid characters in name";
    }

    // Email Validation: Supports .org, .in, .io, .systems, etc.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      newErrors.email = "Work email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Provide a valid email (e.g., .org, .in, .io)";
    }

    // Password Validation: 8 chars min + complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/;
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password = "Requires 8+ chars, A-Z, 0-9 & special char";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "email" ? value.trim() : value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await API.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      // Use the professional message sent from the backend
      alert(response.data.message);
      navigate("/login");
    } catch (err) {
      // Handles both manual alerts and backend validation errors
      const serverMessage = err.response?.data?.message || "Error registering user";
      alert(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center position-relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: "20px",
      }}
    >
      {/* Decorative Background Elements */}
      <div className="position-absolute bg-white opacity-10 rounded-circle animate-pulse" style={{ width: '500px', height: '500px', top: '-250px', right: '-100px', filter: 'blur(80px)' }}></div>
      <div className="position-absolute bg-info opacity-10 rounded-circle animate-pulse-delayed" style={{ width: '400px', height: '400px', bottom: '-200px', left: '-100px', filter: 'blur(80px)' }}></div>

      <div
        className="card shadow-2xl border-0 w-100 animate__animated animate__fadeIn"
        style={{
          maxWidth: "550px",
          borderRadius: "24px",
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "35px",
        }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold m-0" style={{ color: secondaryColor, letterSpacing: '-1px' }}>
            Create Account
          </h2>
          <p className="text-muted small">Join the Smart Task ecosystem today</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            {/* Name */}
            <div className="col-md-12 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-person text-muted"></i></span>
                <input
                  type="text"
                  name="name"
                  className={`form-control bg-light border-0 ${errors.name ? "is-invalid" : ""}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ borderRadius: '0 8px 8px 0' }}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
            </div>

            {/* Email */}
            <div className="col-md-12 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
                <input
                  type="email"
                  name="email"
                  className={`form-control bg-light border-0 ${errors.email ? "is-invalid" : ""}`}
                  placeholder="john@company.io"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ borderRadius: '0 8px 8px 0' }}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            {/* Password */}
            <div className="col-md-6 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                name="password"
                className={`form-control bg-light border-0 ${errors.password ? "is-invalid" : ""}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ borderRadius: '8px' }}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="col-md-6 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Confirm</label>
              <input
                type={showPasswords ? "text" : "password"}
                name="confirmPassword"
                className={`form-control bg-light border-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{ borderRadius: '8px' }}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-check form-switch mt-2 mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="showPasswords"
              checked={showPasswords}
              onChange={() => setShowPasswords(!showPasswords)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="showPasswords" className="form-check-label small text-muted">Show Passwords</label>
          </div>

          {/* Role */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Account Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select bg-light border-0"
              style={{ borderRadius: '8px', cursor: 'pointer' }}
            >
              <option value="Member">Team Member</option>
              <option value="Admin">Team Admin</option>
            </select>

            {formData.role === "Admin" && (
              <div className="mt-3 p-2 px-3 border-start border-danger border-4 rounded bg-danger-subtle shadow-sm">
                <i className="bi bi-info-circle-fill text-danger me-2"></i>
                <small className="text-danger fw-medium">Approval from SuperAdmin required after signup.</small>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 text-white shadow-sm transition-hover border-0"
            style={{
              backgroundColor: primaryColor,
              borderRadius: "12px",
              padding: "14px",
              fontWeight: "600",
            }}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : "Create Workspace Account"}
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <p className="small text-muted mb-0">
            Already a member?{" "}
            <span
              className="fw-bold text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>

      <style>{`
        .transition-hover { transition: all 0.3s ease; }
        .transition-hover:hover { transform: translateY(-2px); filter: brightness(1.15); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .animate-pulse { animation: pulse 8s infinite ease-in-out; }
        .animate-pulse-delayed { animation: pulse 10s infinite ease-in-out reverse; animation-delay: 2s; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
};

export default Register;