import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const ProfileSection = ({ currentTheme }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "", email: "", phone: "", designation: "", role: "", avatar: "", avatarFile: null
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get("/auth/me");
      
      // ✅ Robust URL construction to handle server root vs API path
      const baseUrl = API.defaults.baseURL.split('/api')[0]; 
      const avatarUrl = res.data.avatar
        ? `${baseUrl}${res.data.avatar.startsWith("/") ? "" : "/"}${res.data.avatar}`
        : "";

      setProfile({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        designation: res.data.designation || "",
        role: res.data.role || "",
        avatar: avatarUrl,
        avatarFile: null,
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ✅ ADDED BACK: Handles text input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (profile.avatar && profile.avatar.startsWith("blob:")) {
        URL.revokeObjectURL(profile.avatar);
      }
      setProfile((prev) => ({
        ...prev,
        avatarFile: file,
        avatar: URL.createObjectURL(file),
      }));
    }
  };

  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("designation", profile.designation);
      if (profile.avatarFile) formData.append("avatar", profile.avatarFile);

      await API.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Profile updated successfully!");
      setProfileOpen(false);
      fetchProfile();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update profile.";
      alert(errorMsg);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) return <div className="spinner-border spinner-border-sm text-primary"></div>;

  return (
    <>
      {/* Header Trigger */}
      <div className="d-flex align-items-center gap-2 gap-md-3 border-start ps-2 ps-md-4">
        <div 
          className="d-flex align-items-center gap-2" 
          onClick={() => setProfileOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <div className="text-end d-none d-sm-block">
            <div className="fw-bold text-dark lh-1 text-nowrap" style={{ fontSize: '0.85rem' }}>{profile.name}</div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{profile.role}</small>
          </div>
          <div className="rounded-circle shadow-sm border border-2 border-white d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style={{
                width: "38px", 
                height: "38px",
                // ✅ Add quotes around the URL variable
                background: profile.avatar ? `url("${profile.avatar}") center/cover` : currentTheme.accent,
            }}>
            {!profile.avatar && getInitials(profile.name)}
          </div>
        </div>
        
        <button className="btn btn-link text-danger p-0" onClick={handleLogout}>
            <i className="bi bi-power fs-4"></i>
        </button>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-start align-items-md-center px-3 pt-5 pt-md-0" 
             style={{ background: "rgba(0,0,0,0.5)", backdropFilter: 'blur(4px)', zIndex: 1200, overflowY: 'auto' }} 
             onClick={() => setProfileOpen(false)}>
          <div className="bg-white rounded-4 shadow-lg overflow-hidden border-0 mb-5 mb-md-0" 
               style={{ width: "100%", maxWidth: "420px", animation: 'modalSlide 0.3s ease-out' }} 
               onClick={(e) => e.stopPropagation()}>
            <div className="p-4 text-center text-white" style={{ background: currentTheme.primary }}>
                <div className="position-relative d-inline-block">
                    <div className="rounded-circle border border-4 border-white shadow bg-white overflow-hidden mx-auto" style={{ width: "90px", height: "90px" }}>
                        {profile.avatar ? <img src={profile.avatar} className="w-100 h-100 object-fit-cover" alt="Avatar"/> : <div className="w-100 h-100 d-flex align-items-center justify-content-center fs-2 text-primary">{getInitials(profile.name)}</div>}
                    </div>
                    <label className="btn btn-light btn-sm rounded-circle position-absolute bottom-0 end-0 shadow-sm border">
                        <i className="bi bi-camera-fill"></i>
                        <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                    </label>
                </div>
                <h5 className="mt-3 mb-0 text-truncate px-2">{profile.name}</h5>
                <p className="small mb-0 opacity-75">{profile.designation || profile.role}</p>
            </div>
            
            <div className="p-4 bg-white text-dark">
                <div className="row g-3">
                  {["name", "email", "phone", "designation"].map((field) => (
                      <div className="col-12" key={field}>
                          <label className="form-label small fw-bold text-uppercase text-muted mb-1" style={{fontSize: '0.65rem'}}>{field}</label>
                          <input type="text" name={field} value={profile[field]} className="form-control bg-light border-0 py-2" onChange={handleProfileChange} />
                      </div>
                  ))}
                </div>
                <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                    <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={saveProfile}>Save Changes</button>
                    <button className="btn btn-light px-4 py-2" onClick={() => setProfileOpen(false)}>Cancel</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSection;