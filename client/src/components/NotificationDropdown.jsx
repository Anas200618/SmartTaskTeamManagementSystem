import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const socket = io("https://smarttaskteammanagementsystem.onrender.com"); // Your Backend URL

const NotificationDropdown = ({ currentTheme }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);
  const userId = localStorage.getItem("userId");

  // Handle responsiveness on window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 576);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 1. NATIVE SYSTEM NOTIFICATION FUNCTION ---
  const triggerNativeNotification = (notif) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.message,
        icon: "/favicon.ico",
      });
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await API.get("/notifications");
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };

    if (userId) {
      fetchNotifications();
      socket.emit("join_room", userId);
    }

    socket.on("new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      triggerNativeNotification(notif);
    });

    return () => {
      socket.off("new_notification");
    };
  }, [userId]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const closeOnOutsideClick = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener("click", closeOnOutsideClick);
    }
    return () => window.removeEventListener("click", closeOnOutsideClick);
  }, [isOpen]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Failed to mark as read:", err);
    }
  };

  const testNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("Test Notification", {
        body: "If you hear a sound, your system settings are correct!",
      });
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") testNotification();
      });
    }
  };

  return (
    <div className="dropdown position-relative">
      <button
        className="btn btn-light rounded-circle shadow-sm position-relative"
        onClick={toggleDropdown}
        type="button"
        style={{ width: "40px", height: "40px", zIndex: 1100 }}
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop for mobile to make closing easier */}
      {isOpen && isMobile && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.1)', zIndex: 1999 
          }} 
        />
      )}

      <ul
        className={`dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-0 overflow-hidden ${isOpen ? 'show' : ''}`}
        style={{
          // RESPONSIVE WIDTH LOGIC
          width: isMobile ? "90vw" : "350px",
          maxWidth: isMobile ? "400px" : "350px",
          borderRadius: '12px',
          display: isOpen ? 'block' : 'none',
          position: isMobile ? 'fixed' : 'absolute',
          // CENTER ON MOBILE, RIGHT ALIGN ON DESKTOP
          right: isMobile ? '50%' : '0',
          left: isMobile ? '50%' : 'auto',
          transform: isMobile ? 'translateX(-50%)' : 'none',
          top: isMobile ? '70px' : 'auto',
          zIndex: 2000,
          maxHeight: "80vh" // Prevent going off bottom of screen
        }}
      >
        <li className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <span className="fw-bold text-dark">Notifications</span>
          <span className="badge bg-primary rounded-pill">{unreadCount} New</span>
        </li>
        
        <li className="p-2 border-bottom bg-white text-center">
          <button
            className="btn btn-sm btn-outline-primary w-100 fw-bold"
            onClick={testNotification}
            style={{ fontSize: '12px' }}
          >
            <i className="bi bi-megaphone-fill me-2"></i> Test System Sound
          </button>
        </li>

        <div style={{ maxHeight: isMobile ? "60vh" : "350px", overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <li className="p-4 text-center text-muted small">No notifications yet</li>
          ) : (
            notifications.map((n) => (
              <li
                key={n._id}
                className={`p-3 border-bottom dropdown-item ${!n.isRead ? "bg-light" : ""}`}
                style={{
                  whiteSpace: 'normal',
                  cursor: 'pointer',
                  borderLeft: !n.isRead ? `4px solid ${currentTheme?.accent || '#0d6efd'}` : '4px solid transparent',
                  backgroundColor: !n.isRead ? 'rgba(0,0,0,0.03)' : 'transparent'
                }}
                onClick={(e) => markAsRead(n._id, e)}
              >
                <div className="fw-bold small text-dark">{n.title}</div>
                <div className="small text-muted mb-1" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>{n.message}</div>
                <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </li>
            ))
          )}
        </div>
      </ul>
    </div>
  );
};

export default NotificationDropdown;
