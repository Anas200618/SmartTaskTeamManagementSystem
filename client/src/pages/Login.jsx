import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const primaryColor = "#2c5d8f";
  const secondaryColor = "#1a3a5a";

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};
    
    // Updated Regex to support .org, .in, .io, .systems etc.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid organizational email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      // Updated to match the new 8-character professional standard
      newErrors.password = "Minimum 8 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "email" ? value.trim() : value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ================= HANDLE LOGIN =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await API.post("/auth/login", formData);
      
      // Save data to localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);
      
      const userId = res.data.user._id || res.data.user.id;
      localStorage.setItem("userId", userId); 
      
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Login failed";

      // Professional handling for Admin Approval (403 Forbidden)
      if (status === 403 || message.toLowerCase().includes("approval")) {
        alert("Account Pending: Admin accounts require SuperAdmin approval before access is granted.");
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center position-relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background: secondaryColor,
        padding: "20px",
      }}
    >
      {/* --- DYNAMIC BACKGROUND --- */}
      <div className="bg-animation">
        <div id="blob-1" style={{ background: primaryColor }}></div>
        <div id="blob-2" style={{ background: '#4a90e2' }}></div>
        <div id="blob-3" style={{ background: '#63b3ed' }}></div>
      </div>

      <div
        className="card shadow-2xl border-0 animate__animated animate__fadeInUp"
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "24px",
          backdropFilter: "blur(15px)",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          padding: "40px",
          zIndex: 10
        }}
      >
        <div className="text-center mb-5">
          <div 
            className="d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" 
            style={{ width: '60px', height: '60px', borderRadius: '15px', background: primaryColor }}
          >
            <i className="bi bi-shield-check text-white fs-2"></i>
          </div>
          <h2 className="fw-bold m-0" style={{ color: secondaryColor, letterSpacing: '-0.5px' }}>
            Welcome Back
          </h2>
          <p className="text-muted small mt-2">Sign in to manage your workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '11px' }}>Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                name="email"
                placeholder="name@company.io"
                value={formData.email}
                onChange={handleChange}
                className={`form-control form-control-lg bg-light border-start-0 ps-0 ${errors.email ? "is-invalid" : ""}`}
                style={{ borderRadius: '0 12px 12px 0', fontSize: '15px' }}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between">
                <label className="form-label small fw-bold text-uppercase text-muted" style={{ fontSize: '11px' }}>Password</label>
                <span className="small text-primary fw-semibold" style={{ fontSize: '11px', cursor: 'pointer' }}>Forgot?</span>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '12px 0 0 12px' }}>
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={`form-control form-control-lg bg-light border-start-0 border-end-0 ps-0 ${errors.password ? "is-invalid" : ""}`}
                style={{ fontSize: '15px' }}
              />
              <span 
                className="input-group-text bg-light border-start-0" 
                style={{ borderRadius: '0 12px 12px 0', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
              </span>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          <div className="d-flex align-items-center mb-4">
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="rememberMe" />
                <label className="form-check-label small text-muted" htmlFor="rememberMe">Remember me</label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-lg w-100 text-white shadow transition-all border-0"
            style={{
              backgroundColor: primaryColor,
              borderRadius: "12px",
              padding: "14px",
              fontWeight: "600",
              fontSize: '16px'
            }}
          >
            {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
            ) : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted small">
            New to Smart Task?{" "}
            <span
              className="fw-bold"
              style={{ cursor: "pointer", color: primaryColor }}
              onClick={() => navigate("/register")}
            >
              Create an account
            </span>
          </p>
        </div>

        <div className="text-center mt-5">
          <p className="text-muted" style={{ fontSize: '10px', opacity: 0.6 }}>
            © 2026 SMART TASK MANAGEMENT SYSTEM.<br/>SECURED BY ENTERPRISE ENCRYPTION.
          </p>
        </div>
      </div>

      <style>{`
        .bg-animation {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: 1;
        }
        #blob-1, #blob-2, #blob-3 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: move 20s infinite alternate;
        }
        #blob-1 { top: -100px; left: -100px; }
        #blob-2 { bottom: -100px; right: -100px; animation-duration: 25s; }
        #blob-3 { top: 40%; left: 30%; width: 300px; height: 300px; animation-duration: 15s; }

        @keyframes move {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(100px, 100px) scale(1.2); }
        }

        .transition-all { transition: all 0.2s ease-in-out; }
        .transition-all:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      `}</style>
    </div>
  );
};

export default Login;