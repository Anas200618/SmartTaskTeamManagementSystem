import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import ProfileSection from "./ProfileSection"; // Newly imported

const DashboardLayout = ({ children, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchText, setSearchText] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("app-theme") || "corporate");

  const themes = {
    corporate: { primary: "#1a3a5a", accent: "#0d6efd", bg: "#f8f9fa", text: "#212529", card: "#ffffff" },
    midnight: { primary: "#0f172a", accent: "#38bdf8", bg: "#1e293b", text: "#f1f5f9", card: "#1e293b" },
    solar: { primary: "#433422", accent: "#f59e0b", bg: "#fef3c7", text: "#451a03", card: "#fffbeb" }
  };

  const currentTheme = themes[theme];

  useEffect(() => {
    if (!role) navigate("/login");

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [role, navigate]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleTheme = () => {
    const keys = Object.keys(themes);
    const next = keys[(keys.indexOf(theme) + 1) % keys.length];
    setTheme(next);
    localStorage.setItem("app-theme", next);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) onSearch(value);
  };

  return (
    <div className={`d-flex min-vh-100 overflow-hidden theme-${theme}`} style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}>
      
      {isMobile && sidebarOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50" style={{ zIndex: 1040 }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className="d-flex flex-column shadow-lg transition-all" style={{ width: sidebarOpen ? "260px" : isMobile ? "0px" : "80px", backgroundColor: currentTheme.primary, zIndex: 1050, position: isMobile ? "fixed" : "relative", height: "100vh", left: 0, overflowX: "hidden" }}>
        <div className="d-flex align-items-center px-4 py-4 mb-3">
            <div className="bg-white rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{width: '40px', height: '40px'}}>
                <i className="bi bi-rocket-takeoff-fill fs-5" style={{color: currentTheme.accent}}></i>
            </div>
            {sidebarOpen && <span className="ms-3 text-white fw-bold fs-5 text-nowrap">SmartTask</span>}
        </div>

        <nav className="flex-grow-1 px-3">
          <SidebarLink to="/dashboard" icon="bi-grid-1x2" label="Overview" isOpen={sidebarOpen} />
          <SidebarLink to="/tasks" icon="bi-journal-check" label="My Tasks" isOpen={sidebarOpen} />
          {(role === "Admin" || role === "SuperAdmin") && (
            <SidebarLink to="/teams" icon="bi-briefcase" label="Teams" isOpen={sidebarOpen} />
          )}
          {role === "SuperAdmin" && (
            <SidebarLink to="/users" icon="bi-shield-lock" label="Admin Center" isOpen={sidebarOpen} />
          )}
        </nav>

        <div className="p-3">
            <button onClick={toggleTheme} className="btn btn-link text-white text-decoration-none d-flex align-items-center w-100 p-2 rounded-3 bg-white bg-opacity-10 border-0 shadow-none">
                <i className={`bi ${theme === 'midnight' ? 'bi-moon-stars-fill' : theme === 'solar' ? 'bi-sun-fill' : 'bi-brightness-high'} fs-5`}></i>
                {sidebarOpen && <span className="ms-3 small text-uppercase fw-bold text-nowrap">Theme: {theme}</span>}
            </button>
        </div>
      </aside>

      <div className="flex-grow-1 d-flex flex-column vh-100 overflow-hidden">
        <header className="navbar navbar-expand bg-white border-bottom px-3 px-md-4 shadow-sm" style={{ height: "70px" }}>
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <button className="btn btn-light rounded-circle shadow-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <i className={`bi ${sidebarOpen && !isMobile ? 'bi-text-indent-right' : 'bi-list'} fs-5`}></i>
              </button>
              <h5 className="mb-0 fw-bold d-none d-md-block text-dark text-truncate" style={{maxWidth: '200px'}}>
                {location.pathname.split("/")[1].toUpperCase() || "DASHBOARD"}
              </h5>
            </div>

            <div className="d-flex align-items-center gap-2 gap-md-4">
              <div className="position-relative d-none d-lg-block">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                <input type="text" value={searchText} onChange={handleSearchChange} placeholder="Search..." className="form-control bg-light border-0 rounded-pill ps-5 py-2" style={{ width: "220px" }} />
              </div>

              <NotificationDropdown currentTheme={currentTheme} />

              {/* CLEAN PROFILE COMPONENT HERE */}
              <ProfileSection currentTheme={currentTheme} />
              
            </div>
          </div>
        </header>

        <main className="flex-grow-1 overflow-auto p-3 p-md-4 custom-scrollbar">
          {children}
        </main>
      </div>

      <style>{`
        .transition-all { transition: all 0.3s ease; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        .theme-midnight .bg-white { background-color: #1e293b !important; color: #f1f5f9 !important; }
        .theme-midnight .text-dark { color: #f1f5f9 !important; }
        .theme-midnight .border-bottom { border-color: #334155 !important; }
        
        .theme-solar .bg-white { background-color: #fffbeb !important; color: #451a03 !important; }
        .theme-solar .text-dark { color: #451a03 !important; }
        .theme-solar .border-bottom { border-color: #fde68a !important; }

        .nav-link.active { 
          background-color: rgba(255,255,255,0.1) !important; 
          border-left: 4px solid ${currentTheme.accent} !important; 
          opacity: 1 !important; 
        }

        @keyframes modalSlide { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
};

const SidebarLink = ({ to, icon, label, isOpen }) => (
  <NavLink to={to} className={({ isActive }) => `nav-link d-flex align-items-center py-3 px-3 rounded-2 text-white text-decoration-none mb-1 ${isActive ? 'active' : 'opacity-75'}`}>
    <i className={`bi ${icon} fs-5 flex-shrink-0`}></i>
    {isOpen && <span className="ms-3 text-nowrap">{label}</span>}
  </NavLink>
);

export default DashboardLayout;