import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "animate.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const primaryColor = "#2c5d8f";
  const secondaryColor = "#1a3a5a";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="overflow-hidden bg-white">
      {/* ================= NAVBAR ================= */}
      <nav className={`navbar navbar-expand-lg fixed-top transition-all ${isScrolled ? "bg-white shadow-sm py-2" : "bg-transparent py-3"}`}>
        <div className="container">
          {/* FIXED: Changed <a> to <div> to avoid anchor-is-valid error */}
          <div 
            className="navbar-brand fw-bold fs-3 mb-0" 
            role="button" 
            onClick={() => window.scrollTo(0,0)}
            style={{ color: isScrolled ? secondaryColor : "white", cursor: 'pointer' }}
          >
            Smart<span style={{ color: "#4a90e2" }}>Task</span>
          </div>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm px-4 rounded-pill fw-bold ${isScrolled ? "btn-outline-primary" : "btn-outline-light"}`} onClick={() => navigate("/login")}>Login</button>
            <button className="btn btn-primary btn-sm px-4 rounded-pill fw-bold shadow-sm" onClick={() => navigate("/register")}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="text-white d-flex align-items-center position-relative pt-5"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, minHeight: "100vh" }}>
        
        <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden opacity-25">
          <div className="blob position-absolute bg-info rounded-circle" style={{ width: '400px', height: '400px', top: '-10%', left: '-5%', filter: 'blur(80px)' }}></div>
          <div className="blob position-absolute bg-primary rounded-circle" style={{ width: '300px', height: '300px', bottom: '10%', right: '5%', filter: 'blur(80px)' }}></div>
        </div>

        <div className="container position-relative z-index-1 mt-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start animate__animated animate__fadeInUp">
              <span className="badge rounded-pill mb-3 px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                🚀 Built for Modern Teams
              </span>
              <h1 className="display-2 fw-bold mb-3 lh-sm">
                Control Your <br /> <span className="text-info">Productivity.</span>
              </h1>
              <p className="lead mb-5 opacity-75 fs-4">
                The all-in-one platform to manage projects, track time, and collaborate seamlessly without switching tabs.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                <button className="btn btn-light btn-lg px-5 py-3 shadow-lg fw-bold rounded-pill transition-all hover-scale" onClick={() => navigate("/register")}>
                  Start Building for Free <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>

            <div className="col-lg-6 mt-5 mt-lg-0 animate__animated animate__zoomIn">
              <div className="glass-card p-2 rounded-5 shadow-2xl border border-white border-opacity-25">
                 <div className="bg-white rounded-4 p-4 shadow text-dark">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold mb-0">Project Momentum</h6>
                        <span className="badge bg-success-subtle text-success">+12.5%</span>
                    </div>
                    <div className="progress mb-3" style={{height: "10px"}}>
                        <div className="progress-bar" style={{width: "70%", background: primaryColor}}></div>
                    </div>
                    <div className="d-flex gap-2 text-center">
                        <div className="flex-fill p-2 bg-light rounded"><small className="d-block text-muted small-text">Tasks</small><strong>48</strong></div>
                        <div className="flex-fill p-2 bg-light rounded"><small className="d-block text-muted small-text">Done</small><strong>32</strong></div>
                        <div className="flex-fill p-2 bg-light rounded text-white" style={{background: primaryColor}}><small className="d-block opacity-75 small-text">Efficiency</small><strong>94%</strong></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEY FEATURES ================= */}
      <section className="py-5 mt-5">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-md-6">
              <h2 className="display-5 fw-bold mb-4">Master your workflow with <span className="text-primary">Advanced Tools</span></h2>
              <div className="d-flex mb-4">
                <div className="me-3 fs-3 text-primary"><i className="bi bi-kanban"></i></div>
                <div>
                  <h5 className="fw-bold">Visual Kanban Boards</h5>
                  <p className="text-muted">Drag and drop tasks between stages to visualize project progress instantly.</p>
                </div>
              </div>
              <div className="d-flex mb-4">
                <div className="me-3 fs-3 text-primary"><i className="bi bi-alarm"></i></div>
                <div>
                  <h5 className="fw-bold">Smart Reminders</h5>
                  <p className="text-muted">Automated system notifications ensure you never miss a critical deadline.</p>
                </div>
              </div>
              <div className="d-flex">
                <div className="me-3 fs-3 text-primary"><i className="bi bi-people"></i></div>
                <div>
                  <h5 className="fw-bold">Role-Based Access</h5>
                  <p className="text-muted">Secure your workspace by assigning Admin, Member, or Client roles.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
               <div className="position-relative">
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80" className="img-fluid rounded-5 shadow-lg" alt="Teamwork" />
                  <div className="position-absolute bottom-0 start-0 translate-middle-y bg-white p-3 rounded-4 shadow-lg ms-n4 d-none d-lg-block" style={{ width: '200px' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-success rounded-circle" style={{ width: '10px', height: '10px' }}></div>
                        <span className="fw-bold small">14 Members Online</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6">Simple Setup in 4 Steps</h2>
          </div>
          <div className="row g-4 text-center">
            {[
              { icon: "bi-person-plus", title: "Sign Up", text: "Create your workspace in seconds." },
              { icon: "bi-node-plus", title: "Setup Projects", text: "Organize tasks into specific projects." },
              { icon: "bi-person-gear", title: "Invite Team", text: "Add members and assign their roles." },
              { icon: "bi-graph-up-arrow", title: "Scale Up", text: "Monitor analytics and grow productivity." }
            ].map((step, i) => (
              <div className="col-md-3" key={i}>
                <div className="p-4 bg-white rounded-5 shadow-sm h-100 transition-up border-0">
                  <div className="text-primary mb-3 fs-1"><i className={`bi ${step.icon}`}></i></div>
                  <h5 className="fw-bold">{step.title}</h5>
                  <p className="text-muted small mb-0">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-5">
        <div className="container py-5 text-center">
          <h2 className="fw-bold mb-5">What our users say</h2>
          <div className="row g-4">
            {[
                { name: "John Carter", role: "Project Manager", msg: "This tool changed the way our team syncs. The UI is incredibly clean." },
                { name: "Sarah Lynch", role: "UI Designer", msg: "Finally, a task manager that doesn't feel like a spreadsheet." },
                { name: "Mike Ross", role: "Developer", msg: "The real-time notifications are a game changer for our sprint cycles." }
            ].map((t, i) => (
                <div className="col-md-4" key={i}>
                    <div className="p-4 border rounded-5 bg-white shadow-sm h-100">
                        <p className="text-muted fst-italic">"{t.msg}"</p>
                        <h6 className="fw-bold mb-0 mt-3">{t.name}</h6>
                        <small className="text-primary fw-bold">{t.role}</small>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-5">
        <div className="container">
            <div className="rounded-5 p-5 text-center text-white shadow-lg" style={{ background: `linear-gradient(45deg, ${primaryColor}, #4a90e2)` }}>
                <h2 className="display-5 fw-bold mb-4">Ready to boost your team?</h2>
                <button className="btn btn-light btn-lg px-5 py-3 rounded-pill fw-bold hover-scale" onClick={() => navigate("/register")}>Create Free Account</button>
            </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-dark text-white py-5">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <h4 className="fw-bold mb-1">SmartTask.</h4>
              <p className="opacity-50 small mb-0">© 2026 SmartTask Management. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
                <div className="d-flex gap-3 justify-content-center justify-content-md-end fs-4">
                    {/* FIXED: Changed <a> to <button> for accessibility and icon functionality */}
                    <button className="btn btn-link text-white p-0"><i className="bi bi-twitter"></i></button>
                    <button className="btn btn-link text-white p-0"><i className="bi bi-linkedin"></i></button>
                    <button className="btn btn-link text-white p-0"><i className="bi bi-github"></i></button>
                </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .transition-all { transition: all 0.4s ease; }
        .glass-card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); }
        .transition-up { transition: transform 0.3s ease; }
        .transition-up:hover { transform: translateY(-12px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
        .hover-scale { transition: 0.3s ease; }
        .hover-scale:hover { transform: scale(1.05); }
        .small-text { font-size: 0.75rem; }
        .blob { animation: float 10s infinite alternate; }
        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;