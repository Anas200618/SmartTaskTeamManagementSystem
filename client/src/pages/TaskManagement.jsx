import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Low");
  const [dueDate, setDueDate] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [reassignTask, setReassignTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("board"); // 'list' or 'board'
  const tasksPerPage = 10;

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;
  const role = user.role;

  const isSuperAdmin = role === "SuperAdmin";
  const isAdmin = role === "Admin";
  const isMember = role === "Member";
  const canManage = isSuperAdmin || isAdmin;

  const fetchTeams = useCallback(async () => {
    if (!canManage) return;
    try {
      const res = await API.get("/teams");
      setTeams(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  }, [canManage]);

  const fetchTasks = useCallback(async () => {
    try {
      let query = "/tasks/filter?";
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterPriority) query += `priority=${filterPriority}&`;
      if (canManage && filterTeam) query += `teamId=${filterTeam}&`;
      if (canManage && sortBy) query += `sortBy=${sortBy}&`;

      const res = await API.get(query);
      let allTasks = res.data || [];

      if (isMember) {
        allTasks = allTasks.filter((t) => {
          const assignedId = typeof t.assignedTo === "object" ? t.assignedTo._id : t.assignedTo;
          return assignedId?.toString() === userId?.toString();
        });
      }
      setTasks(allTasks);
    } catch (err) {
      console.log(err);
    }
  }, [filterStatus, filterPriority, filterTeam, sortBy, isMember, userId, canManage]);

  const handleTeamChange = async (selectedTeamId, isReassign = false) => {
    if (isReassign) {
      setReassignTask({ ...reassignTask, teamId: selectedTeamId, assignedTo: "" });
    } else {
      setTeamId(selectedTeamId);
      setAssignedTo("");
    }
    if (!selectedTeamId) return setTeamMembers([]);
    try {
      const res = await API.get(`/teams/${selectedTeamId}`);
      setTeamMembers(res.data.members || []);
    } catch {
      setTeamMembers([]);
    }
  };

  const handleSubmitTask = async (taskData, isReassign = false) => {
    if (!taskData.title || !taskData.teamId || !taskData.assignedTo) {
      return alert("Fill required fields");
    }
    try {
      await API.post("/tasks", {
        ...taskData,
        reassignedFrom: isReassign ? taskData.originalId : undefined,
      });
      if (isReassign) setReassignTask(null);
      else {
        setTitle(""); setDescription(""); setTeamId("");
        setAssignedTo(""); setPriority("Low"); setDueDate("");
      }
      fetchTasks();
    } catch (err) {
      console.log(err);
    }
  };

  const handleMarkInProgress = async (taskId) => {
    await API.patch(`/tasks/${taskId}/in-progress`);
    fetchTasks();
  };

  const handleRequestApproval = async (taskId) => {
    await API.patch(`/tasks/${taskId}/request-approval`);
    fetchTasks();
  };

  const handleComplete = async (taskId) => {
    await API.patch(`/tasks/${taskId}/approve`);
    fetchTasks();
  };

  const handleReject = (task) => {
    setReassignTask({
      originalId: task._id,
      title: task.title,
      description: task.description,
      teamId: task.teamId?._id || "",
      assignedTo: task.assignedTo?._id || "",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
    });
    handleTeamChange(task.teamId?._id, true);
  };

  useEffect(() => { fetchTeams(); }, [fetchTeams]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    const tTitle = task.title?.toLowerCase() || "";
    const tTeam = task.teamId?.teamName?.toLowerCase() || "";
    const assigned = task.assignedTo && typeof task.assignedTo === "object" ? task.assignedTo.name?.toLowerCase() || "" : "";
    const search = searchTerm.toLowerCase();
    return tTitle.includes(search) || tTeam.includes(search) || assigned.includes(search);
  });

  const getPriorityStyle = (p) => {
    switch (p) {
      case "High": return { bg: "bg-danger-subtle", text: "text-danger" };
      case "Medium": return { bg: "bg-warning-subtle", text: "text-warning-emphasis" };
      default: return { bg: "bg-info-subtle", text: "text-info-emphasis" };
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Todo: "bg-secondary-subtle text-secondary",
      "In Progress": "bg-primary-subtle text-primary",
      "Pending Approval": "bg-warning-subtle text-warning-emphasis",
      Completed: "bg-success-subtle text-success",
      Rejected: "bg-danger-subtle text-danger"
    };
    return colors[status] || "bg-light text-dark";
  };

  // Pagination Logic
  const indexOfLast = currentPage * tasksPerPage;
  const indexOfFirst = indexOfLast - tasksPerPage;
  const listTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Kanban Columns
  const columns = ["Todo", "In Progress", "Pending Approval", "Completed"];

  const TaskCard = ({ task }) => {
    const pStyle = getPriorityStyle(task.priority);
    const assignedId = task.assignedTo?._id || task.assignedTo || null;

    return (
      <div className="card border-0 shadow-sm mb-3 rounded-3 task-kanban-card">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span className={`badge ${pStyle.bg} ${pStyle.text} rounded-pill`} style={{ fontSize: '0.7rem' }}>
              {task.priority}
            </span>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
            </small>
          </div>
          <h6 className="fw-bold text-dark mb-1">{task.title}</h6>
          <p className="text-muted small mb-3 text-truncate-2">{task.description}</p>
          
          <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
            <div className="d-flex align-items-center">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                {task.assignedTo?.name?.charAt(0) || "U"}
              </div>
              <span className="small text-muted text-truncate" style={{maxWidth: '80px'}}>{task.assignedTo?.name || "Unassigned"}</span>
            </div>
          </div>

          <div className="mt-3">
            {canManage ? (
              task.status === "Pending Approval" && (
                <div className="d-grid gap-1">
                  <button className="btn btn-success btn-sm w-100" onClick={() => handleComplete(task._id)}>Approve</button>
                  <button className="btn btn-outline-danger btn-sm w-100" onClick={() => handleReject(task)}>Reject</button>
                </div>
              )
            ) : isMember && assignedId === userId ? (
              task.status === "Todo" ? (
                <button className="btn btn-primary btn-sm w-100" onClick={() => handleMarkInProgress(task._id)}>Start</button>
              ) : task.status === "In Progress" ? (
                <button className="btn btn-warning btn-sm w-100" onClick={() => handleRequestApproval(task._id)}>Submit</button>
              ) : null
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout onSearch={(val) => setSearchTerm(val)}>
      <div className="container-fluid py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-dark m-0">Task Management</h2>
            <p className="text-muted small mb-0">Manage and track your team's productivity</p>
          </div>
          <div className="d-flex gap-2 bg-white p-1 rounded-3 shadow-sm">
            <button className={`btn btn-sm px-3 ${viewMode === 'list' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`} onClick={() => setViewMode('list')}>
              <i className="bi bi-list-task me-2"></i>List
            </button>
            <button className={`btn btn-sm px-3 ${viewMode === 'board' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`} onClick={() => setViewMode('board')}>
              <i className="bi bi-kanban me-2"></i>Board
            </button>
          </div>
        </div>

        {/* Create/Reassign Form Section - Same as before */}
        {canManage && (reassignTask || true) && (
          <div className={`card border-0 shadow-sm rounded-4 mb-4 ${reassignTask ? "border-start border-danger border-4" : ""}`}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                {reassignTask ? `Reassign Task: ${reassignTask.title}` : "Create New Task"}
                {reassignTask && <button className="btn btn-sm btn-link text-muted float-end text-decoration-none" onClick={() => setReassignTask(null)}>Cancel</button>}
              </h5>
              <div className="row g-3">
                <div className="col-md-4 col-sm-6">
                  <label className="form-label small fw-semibold">Task Title</label>
                  <input className="form-control" placeholder="What needs to be done?" value={reassignTask ? reassignTask.title : title} onChange={(e) => reassignTask ? setReassignTask({...reassignTask, title: e.target.value}) : setTitle(e.target.value)} />
                </div>
                <div className="col-md-5 col-sm-6">
                  <label className="form-label small fw-semibold">Description</label>
                  <input className="form-control" placeholder="Add more details..." value={reassignTask ? reassignTask.description : description} onChange={(e) => reassignTask ? setReassignTask({...reassignTask, description: e.target.value}) : setDescription(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Due Date</label>
                  <input type="date" className="form-control" value={reassignTask ? reassignTask.dueDate : dueDate} onChange={(e) => reassignTask ? setReassignTask({...reassignTask, dueDate: e.target.value}) : setDueDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Team</label>
                  <select className="form-select" value={reassignTask ? reassignTask.teamId : teamId} onChange={(e) => handleTeamChange(e.target.value, !!reassignTask)}>
                    <option value="">Select Team</option>
                    {teams.map((t) => <option key={t._id} value={t._id}>{t.teamName}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Assign To</label>
                  <select className="form-select" value={reassignTask ? reassignTask.assignedTo : assignedTo} onChange={(e) => reassignTask ? setReassignTask({...reassignTask, assignedTo: e.target.value}) : setAssignedTo(e.target.value)}>
                    <option value="">Select Member</option>
                    {teamMembers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Priority</label>
                  <select className="form-select" value={reassignTask ? reassignTask.priority : priority} onChange={(e) => reassignTask ? setReassignTask({...reassignTask, priority: e.target.value}) : setPriority(e.target.value)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button className={`btn ${reassignTask ? "btn-danger" : "btn-primary"} w-100 fw-bold`} onClick={() => reassignTask ? handleSubmitTask(reassignTask, true) : handleSubmitTask({ title, description, teamId, assignedTo, priority, dueDate })}>
                    {reassignTask ? "Confirm Reassignment" : "Create Task"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section - Same as before */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 bg-light">
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-6 col-md-2">
                <select className="form-select form-select-sm border-0 shadow-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="col-6 col-md-2">
                <select className="form-select form-select-sm border-0 shadow-sm" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              {canManage && (
                <>
                  <div className="col-6 col-md-2">
                    <select className="form-select form-select-sm border-0 shadow-sm" value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
                      <option value="">All Teams</option>
                      {teams.map((t) => <option key={t._id} value={t._id}>{t.teamName}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-2">
                    <select className="form-select form-select-sm border-0 shadow-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="">Sort By</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>
                </>
              )}
              <div className="col-12 col-md-4 ms-auto">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white border-0 shadow-sm"><i className="bi bi-search"></i></span>
                  <input className="form-control border-0 shadow-sm ps-0" placeholder="Search tasks..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CONDITIONAL RENDERING: LIST VS BOARD ================= */}
        {viewMode === "list" ? (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 py-3 text-uppercase small fw-bold text-muted">Task Details</th>
                    <th className="py-3 text-uppercase small fw-bold text-muted">Team</th>
                    <th className="py-3 text-uppercase small fw-bold text-muted">Assigned</th>
                    <th className="py-3 text-uppercase small fw-bold text-muted">Priority</th>
                    <th className="py-3 text-uppercase small fw-bold text-muted">Deadline</th>
                    <th className="py-3 text-uppercase small fw-bold text-muted">Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listTasks.length > 0 ? (
                    listTasks.map((task) => {
                      const assignedId = task.assignedTo?._id || task.assignedTo || null;
                      const pStyle = getPriorityStyle(task.priority);
                      return (
                        <tr key={task._id}>
                          <td className="ps-4">
                            <div className="fw-bold text-dark">{task.title}</div>
                            <div className="small text-muted text-truncate" style={{maxWidth: "200px"}}>{task.description}</div>
                          </td>
                          <td><span className="text-dark">{task.teamId?.teamName}</span></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: "24px", height: "24px", fontSize: "10px"}}>
                                {task.assignedTo?.name?.charAt(0) || "U"}
                              </div>
                              <span className="small">{task.assignedTo?.name || "Unassigned"}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${pStyle.bg} ${pStyle.text} rounded-pill px-3`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="small">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "-"}</td>
                          <td>
                            {canManage ? (
                              task.status === "Pending Approval" ? (
                                <div className="d-flex gap-1">
                                  <button className="btn btn-success btn-sm rounded-pill px-3 shadow-sm" onClick={() => handleComplete(task._id)}>Approve</button>
                                  <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleReject(task)}>Reject</button>
                                </div>
                              ) : (
                                <span className={`badge ${getStatusBadge(task.status)} rounded-pill px-3`}>{task.status}</span>
                              )
                            ) : isMember && assignedId === userId ? (
                              task.status === "Todo" ? (
                                <button className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm" onClick={() => handleMarkInProgress(task._id)}>Start Working</button>
                              ) : task.status === "In Progress" ? (
                                <button className="btn btn-warning btn-sm rounded-pill px-3 shadow-sm" onClick={() => handleRequestApproval(task._id)}>Submit for Approval</button>
                              ) : (
                                <span className={`badge ${getStatusBadge(task.status)} rounded-pill px-3`}>{task.status}</span>
                              )
                            ) : (
                              <span className={`badge ${getStatusBadge(task.status)} rounded-pill px-3`}>{task.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No tasks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination remains for list view */}
            {totalPages > 1 && (
              <div className="card-footer bg-white py-3 border-0">
                <div className="d-flex justify-content-between align-items-center px-3">
                  <span className="small text-muted">Page <strong>{currentPage}</strong> of {totalPages}</span>
                  <div className="btn-group shadow-sm">
                    <button className="btn btn-sm btn-outline-secondary px-3" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <i className="bi bi-chevron-left me-1"></i> Prev
                    </button>
                    <button className="btn btn-sm btn-outline-secondary px-3" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      Next <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Kanban Board View */
          <div className="kanban-wrapper overflow-auto pb-4">
            <div className="d-flex gap-4" style={{ minWidth: "1000px" }}>
              {columns.map((col) => (
                <div key={col} className="kanban-column flex-grow-1" style={{ minWidth: "250px", maxWidth: "300px" }}>
                  <div className="d-flex align-items-center justify-content-between mb-3 px-2">
                    <h6 className="fw-bold mb-0 text-uppercase small text-muted letter-spacing-1">{col}</h6>
                    <span className="badge bg-light text-dark rounded-pill shadow-sm">
                      {filteredTasks.filter(t => t.status === col).length}
                    </span>
                  </div>
                  <div className="kanban-items bg-light p-2 rounded-4" style={{ minHeight: "500px" }}>
                    {filteredTasks.filter(t => t.status === col).map(task => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                    {filteredTasks.filter(t => t.status === col).length === 0 && (
                      <div className="text-center py-5 text-muted small opacity-50">Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .letter-spacing-1 { letter-spacing: 1px; }
        .task-kanban-card { transition: transform 0.2s; cursor: default; }
        .task-kanban-card:hover { transform: translateY(-3px); }
        .kanban-wrapper::-webkit-scrollbar { height: 8px; }
        .kanban-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </DashboardLayout>
  );
};

export default TaskManagement;