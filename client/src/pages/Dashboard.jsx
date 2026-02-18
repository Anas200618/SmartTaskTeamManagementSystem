import React, { useEffect, useState, useCallback } from "react"; 
import DashboardLayout from "../components/DashboardLayout";
import API from "../services/api";
import TeamManagement from "../components/TeamManagement"; 
import TaskTimer from "../components/TaskTimer";
import DashboardCharts from "../components/DashboardCharts";

const GlobalDashboard = () => {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isSuperAdmin = role === "SuperAdmin";
  const showAdminView = isAdmin || isSuperAdmin;

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;

  const [stats, setStats] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeams] = useState(false); 
  const [searchText, setSearchText] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = isSuperAdmin ? "/dashboard/superadmin" : isAdmin ? "/dashboard/admin" : "/dashboard/member";
      const res = await API.get(url);
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isSuperAdmin]);

  const fetchTasks = useCallback(async () => {
    if (!showAdminView) {
      try {
        const res = await API.get("/tasks/filter");
        const myTasks = (res.data || []).filter((t) => {
          const assignedId = typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
          return assignedId?.toString() === userId?.toString();
        });
        setTasks(myTasks);
      } catch (err) {
        console.error("Task Fetch Error:", err);
      }
    }
  }, [showAdminView, userId]);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, [fetchStats, fetchTasks]);

  const totalTasks = showAdminView ? stats.totalTasks : stats.assignedTasks;
  const completionPercentage = stats.completionRate || (totalTasks > 0 ? Math.round(((stats.completedTasks || 0) / totalTasks) * 100) : 0);

  const filteredTasks = tasks.filter((task) => {
    const teamName = typeof task.teamId === "object" ? task.teamId.teamName : task.teamId || "";
    const search = searchText.toLowerCase();
    return (
      task.title?.toLowerCase().includes(search) ||
      teamName?.toLowerCase().includes(search) ||
      task.priority?.toLowerCase().includes(search) ||
      task.status?.toLowerCase().includes(search)
    );
  });

  const getBadgeClass = (val, type) => {
    const maps = {
      priority: { High: "danger", Medium: "warning text-dark" },
      status: { Completed: "success", "Completion Requested": "warning text-dark", "In Progress": "info text-dark" }
    };
    return maps[type][val] || "secondary";
  };

  return (
    <DashboardLayout onSearch={setSearchText}>
      <div className="container-fluid py-3 px-md-4">
        <style>{`
          .stat-card { border-radius: 0.75rem; color: white; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.3s ease; }
          .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
          .custom-rounded { border-radius: 0.75rem; }
          .table-custom-header th { font-weight: 600; font-size: 0.8rem; letter-spacing: 0.3px; }
          .productivity-card { background: #fff; border-radius: 0.75rem; padding: 1rem; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        `}</style>

        {/* HEADER */}
        <div className="card custom-rounded border-0 shadow-sm mb-3">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3">
            <div>
              <h4 className="fw-bold text-primary mb-0">
                {isSuperAdmin ? "SuperAdmin" : isAdmin ? "Admin" : "Member"} Dashboard
              </h4>
              <small className="text-muted">
                {showAdminView ? "Overview of teams and tasks." : "Your assigned tasks and productivity."}
              </small>
            </div>
            <button className="btn btn-primary btn-sm px-3 py-2 fw-semibold custom-rounded shadow-sm mt-2 mt-md-0" onClick={fetchStats}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "40vh" }}>
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
          </div>
        ) : (
          <>
            {showAdminView && showTeams && (
              <div className="card custom-rounded border-0 shadow-sm mb-3 p-2"><TeamManagement /></div>
            )}

            {!showAdminView && (
              <div className="row g-2 mb-3">
                {['today', 'weekly', 'monthly'].map((period, idx) => (
                  <div className="col-md-4" key={idx}>
                    <div className="productivity-card">
                      <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>{period} Log</small>
                      <h3 className={`fw-bold mb-0 text-${idx === 0 ? 'primary' : idx === 1 ? 'success' : 'info'}`}>
                        {stats.workingHours?.[period] || "0h 0m"}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMPACT STAT CARDS */}
            <div className="row g-2 mb-3">
              {showAdminView ? (
                <>
                  <StatCard title="Total Teams" value={stats.totalTeams} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                  <StatCard title="Members" value={stats.totalMembers || stats.teamMembers} gradient="linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)" />
                  <StatCard title="Total Tasks" value={stats.totalTasks} gradient="linear-gradient(135deg, #43cea2 0%, #185a9d 100%)" />
                  <StatCard title="In Progress" value={stats.inProgressTasks} gradient="linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" />
                  <StatCard title="Completed" value={stats.completedTasks} gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" />
                  <StatCard title="Pending" value={stats.pendingTasks} gradient="linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)" />
                </>
              ) : (
                <>
                  <StatCard title="Assigned" value={stats.assignedTasks} gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                  <StatCard title="In Progress" value={stats.inProgressTasks} gradient="linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" />
                  <StatCard title="Completed" value={stats.completedTasks} gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" />
                  <StatCard title="Pending" value={stats.pendingTasks} gradient="linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)" />
                </>
              )}
            </div>

            <DashboardCharts stats={stats} showAdminView={showAdminView} />

            {showAdminView && stats.teamPerformance && (
              <div className="card border-0 shadow-sm custom-rounded mb-3 overflow-hidden">
                <div className="card-header bg-white pt-3 px-3 border-0"><h6 className="fw-semibold mb-0">Member Productivity</h6></div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                      <thead className="table-light table-custom-header text-muted">
                        <tr><th className="ps-3">Name</th><th>Today</th><th>Weekly</th><th>Monthly</th><th>Tasks</th></tr>
                      </thead>
                      <tbody>
                        {stats.teamPerformance.map((m, i) => (
                          <tr key={i}>
                            <td className="ps-3 fw-medium">{m.name}</td><td>{m.today}</td><td>{m.weekly}</td><td>{m.monthly}</td>
                            <td><span className={`badge ${m.activeTasks > 5 ? 'bg-danger' : 'bg-primary'}`}>{m.activeTasks}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm custom-rounded mb-3 p-2">
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-semibold">Goal Completion</small>
                  <span className="badge bg-light text-primary border border-primary">{completionPercentage}%</span>
                </div>
                <div className="progress custom-rounded" style={{ height: "12px" }}>
                  <div className="progress-bar bg-success progress-bar-striped progress-bar-animated" style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>
            </div>

            {!showAdminView && (
              <div className="card border-0 shadow-sm custom-rounded overflow-hidden">
                <div className="card-header bg-white pt-3 px-3 border-0"><h6 className="fw-semibold mb-0">Active Tasks</h6></div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                      <thead className="table-light table-custom-header text-muted">
                        <tr><th className="ps-3">Title</th><th>Priority</th><th>Status</th><th>Timer</th></tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr key={task._id}>
                            <td className="ps-3">
                              <div className="fw-medium text-truncate" style={{ maxWidth: '150px' }}>{task.title}</div>
                            </td>
                            <td><span className={`badge rounded-pill bg-${getBadgeClass(task.priority, 'priority')}`}>{task.priority}</span></td>
                            <td><span className={`badge rounded-pill bg-${getBadgeClass(task.status, 'status')}`}>{task.status}</span></td>
                            <td><TaskTimer taskId={task._id} taskStatus={task.status} onTimerUpdate={fetchTasks}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ title, value, gradient }) => (
  <div className="col-6 col-sm-4 col-lg-2">
    <div className="card stat-card h-100" style={{ background: gradient }}>
      <div className="card-body p-2 d-flex flex-column justify-content-center text-center">
        <small className="text-white-50 fw-bold mb-1" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{title}</small>
        <h4 className="fw-bold mb-0 text-white">{value ?? 0}</h4>
      </div>
    </div>
  </div>
);

export default GlobalDashboard;