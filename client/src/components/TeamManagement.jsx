import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const TeamManagement = () => {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";
  const isSuperAdmin = role === "SuperAdmin";
  const canEdit = isAdmin || isSuperAdmin;

  // ======== STATE preserved exactly as provided =========
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [editTeam, setEditTeam] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [moveToTeamId, setMoveToTeamId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit] = useState(5);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [filterTeamId, setFilterTeamId] = useState("");

  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMemberSearch, setTeamMemberSearch] = useState("");

  // ======== FETCH LOGIC (Preserved) =========
  const fetchTeams = useCallback(async () => {
    try {
      const res = await API.get(`/teams?page=${page}&limit=${limit}&search=${search}`);
      setTeams(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) { console.error(err); }
  }, [page, limit, search]);

  const fetchAllTeams = useCallback(async () => {
    try {
      const res = await API.get(`/teams?limit=1000`);
      setAllTeams(res.data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    if (!editTeam?._id) return;
    try {
      const res = await API.get(`/teams/${editTeam._id}`);
      setTeamMembers(res.data.members || []);
    } catch (err) { console.error(err); }
  }, [editTeam]);

  useEffect(() => {
    fetchTeams();
    fetchAllTeams();
    fetchUsers();
  }, [fetchTeams, fetchAllTeams, fetchUsers]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // ======== HANDLERS (Preserved) =========
  const getUserExistingTeam = (userId) => allTeams.find((team) => team.members?.some((member) => member._id === userId));

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const t = teamName.trim();
    if (!t || teams.some((x) => x.teamName.toLowerCase() === t.toLowerCase())) return alert("Team exists!");
    try {
      await API.post("/teams", { teamName: t });
      setTeamName("");
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error creating team"); }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await API.delete(`/teams/${id}`);
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error deleting team"); }
  };

  const openEditTeam = (t) => {
    setEditTeam(t);
    setEditTeamName(t.teamName);
    setSelectedUserId("");
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/teams/${editTeam._id}`, { teamName: editTeamName });
      fetchTeams();
      fetchAllTeams();
      setEditTeam(null);
    } catch { alert("Error updating team"); }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    const existingTeam = getUserExistingTeam(selectedUserId);
    if (existingTeam) return alert(`Member already exists in team "${existingTeam.teamName}"`);
    try {
      await API.put(`/teams/${editTeam._id}/add-member`, { userId: selectedUserId });
      setSelectedUserId("");
      fetchTeamMembers();
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error adding member"); }
  };

  const handleRemoveMember = async (id) => {
    try {
      await API.put(`/teams/${editTeam._id}/remove-member`, { userId: id });
      fetchTeamMembers();
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error removing member"); }
  };

  const handleMoveMember = async (id) => {
    if (!moveToTeamId) return;
    try {
      await API.put(`/teams/${editTeam._id}/remove-member`, { userId: id });
      await API.put(`/teams/${moveToTeamId}/add-member`, { userId: id });
      setMoveToTeamId("");
      fetchTeamMembers();
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error moving member"); }
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setDesignation(u.designation || "");
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await API.put(`/teams/user/${editUser._id}`, { name, email, designation });
      setEditUser(null);
      fetchUsers();
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error updating member"); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await API.delete(`/teams/user/${id}`);
      fetchUsers();
      fetchTeams();
      fetchAllTeams();
    } catch { alert("Error deleting member"); }
  };

  // ======== FILTERING LOGIC (Preserved) =========
  const membersWithTeam = users
    .filter((u) => u.role === "Member")
    .map((u) => {
      const t = allTeams.find((t) => t.members?.some((m) => m._id === u._id));
      return { ...u, teamName: t?.teamName || "-" };
    })
    .filter((u) => !filterTeamId || u.teamName === allTeams.find((t) => t._id === filterTeamId)?.teamName)
    .filter((u) => u.name.toLowerCase().includes(memberSearch.toLowerCase()));

  const paginatedMembers = membersWithTeam.slice((memberPage - 1) * memberLimit, memberPage * memberLimit);

  useEffect(() => {
    setMemberTotalPages(Math.ceil(membersWithTeam.length / memberLimit) || 1);
  }, [membersWithTeam, memberLimit]);

  const availableUsers = users.filter((u) => u.role === "Member" && !allTeams.some((t) => t.members?.some((m) => m._id === u._id)));

  return (
    <DashboardLayout onSearch={(val) => setSearch(val)}>
      <div className="container-fluid py-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Team & Member Management</h2>
            <p className="text-muted small">Organize your workspace and manage team assignments</p>
          </div>
        </div>

        <div className="row g-4">
          {/* CREATE TEAM */}
          {canEdit && (
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
                      <i className="bi bi-plus-circle-fill fs-4"></i>
                    </div>
                    <h5 className="fw-bold mb-0">Create New Team</h5>
                  </div>
                  <form onSubmit={handleCreateTeam}>
                    <div className="input-group mb-3">
                      <input
                        className="form-control border-end-0 rounded-start-pill ps-3"
                        placeholder="Team Name (e.g. Design)"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                      <button className="btn btn-primary px-4 rounded-end-pill shadow-sm" type="submit">
                        Create
                      </button>
                    </div>
                    <p className="text-muted small mb-0">Members can be added after team creation.</p>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TEAMS LIST */}
          <div className={canEdit ? "col-12 col-xl-8" : "col-12"}>
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Team Registry</h5>
                  <div className="position-relative" style={{ width: "250px" }}>
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input
                      className="form-control form-control-sm rounded-pill ps-5 bg-light border-0"
                      placeholder="Search teams..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-muted small text-uppercase">
                        <th className="border-0">Team Name</th>
                        <th className="border-0">Member Count</th>
                        {canEdit && <th className="border-0 text-end">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t) => (
                        <tr key={t._id}>
                          <td className="fw-semibold">{t.teamName}</td>
                          <td>
                            <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                              {t.members?.length || 0} Members
                            </span>
                          </td>
                          {canEdit && (
                            <td className="text-end">
                              <button className="btn btn-light btn-sm rounded-pill me-2 px-3 border" onClick={() => openEditTeam(t)}>
                                <i className="bi bi-gear-fill me-1"></i> Manage
                              </button>
                              <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleDeleteTeam(t._id)}>
                                <i className="bi bi-trash3"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
              </div>
            </div>
          </div>

          {/* MEMBERS TABLE */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 p-4 pb-0">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <h5 className="fw-bold mb-0">Directory of Members</h5>
                  <div className="d-flex gap-2">
                    <div className="position-relative">
                      <i className="bi bi-funnel position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                      <select
                        className="form-select form-select-sm rounded-pill ps-5 bg-light border-0"
                        style={{ minWidth: "180px" }}
                        value={filterTeamId}
                        onChange={(e) => { setFilterTeamId(e.target.value); setMemberPage(1); }}
                      >
                        <option value="">Filter by Team</option>
                        {allTeams.map((t) => <option key={t._id} value={t._id}>{t.teamName}</option>)}
                      </select>
                    </div>
                    <input
                      className="form-control form-control-sm rounded-pill bg-light border-0 px-3"
                      placeholder="Search by name..."
                      value={memberSearch}
                      onChange={(e) => { setMemberSearch(e.target.value); setMemberPage(1); }}
                    />
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr className="text-muted small text-uppercase">
                        <th className="border-0">Member Info</th>
                        <th className="border-0">Designation</th>
                        <th className="border-0">Current Team</th>
                        {canEdit && <th className="border-0 text-end">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "35px", height: "35px", fontSize: "12px" }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold">{u.name}</div>
                                <div className="text-muted small">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{u.designation || <span className="text-muted small italic">Not set</span>}</td>
                          <td>
                            <span className={`badge ${u.teamName === '-' ? 'bg-light text-dark' : 'bg-success bg-opacity-10 text-success'} px-3 py-2 rounded-pill`}>
                              {u.teamName}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="text-end">
                              <button className="btn btn-sm btn-light border rounded-pill me-2" onClick={() => openEditUser(u)}>
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDeleteUser(u._id)}>
                                <i className="bi bi-trash3"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={memberPage} totalPages={memberTotalPages} setPage={setMemberPage} />
              </div>
            </div>
          </div>
        </div>

        {/* MODALS (Enhanced UI) */}
        {editTeam && (
          <TeamModal
            editTeam={editTeam}
            setEditTeam={setEditTeam}
            editTeamName={editTeamName}
            setEditTeamName={setEditTeamName}
            handleUpdateTeam={handleUpdateTeam}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            availableUsers={availableUsers}
            handleAddMember={handleAddMember}
            teamMembers={teamMembers}
            teamMemberSearch={teamMemberSearch}
            setTeamMemberSearch={setTeamMemberSearch}
            moveToTeamId={moveToTeamId}
            setMoveToTeamId={setMoveToTeamId}
            allTeams={allTeams}
            handleMoveMember={handleMoveMember}
            handleRemoveMember={handleRemoveMember}
          />
        )}

        {editUser && (
          <UserModal
            editUser={editUser}
            setEditUser={setEditUser}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            designation={designation}
            setDesignation={setDesignation}
            handleUpdateUser={handleUpdateUser}
          />
        )}
      </div>

      <style>{`
        .modal-backdrop-custom {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(8px);
            z-index: 1060;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content-custom {
            background: white;
            border-radius: 1.5rem;
            width: 95%;
            max-width: 750px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            padding: 2rem;
        }
        .pagination-btn {
            border-radius: 50px;
            padding: 0.25rem 1rem;
            font-size: 0.85rem;
            transition: all 0.2s;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default TeamManagement;

/* ================= ENHANCED UI COMPONENTS ================= */

const Pagination = ({ page, totalPages, setPage }) => (
  <div className="d-flex justify-content-between align-items-center mt-4">
    <div className="text-muted small">
      Showing page <span className="fw-bold text-dark">{page}</span> of <span className="fw-bold text-dark">{totalPages}</span>
    </div>
    <div className="d-flex gap-2">
      <button className="btn btn-outline-secondary pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
        <i className="bi bi-chevron-left me-1"></i> Previous
      </button>
      <button className="btn btn-outline-secondary pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
        Next <i className="bi bi-chevron-right ms-1"></i>
      </button>
    </div>
  </div>
);

const TeamModal = ({
  editTeam,
  setEditTeam,
  editTeamName,
  setEditTeamName,
  handleUpdateTeam,
  selectedUserId,
  setSelectedUserId,
  availableUsers,
  handleAddMember,
  teamMembers,
  teamMemberSearch,
  setTeamMemberSearch,
  moveToTeamId,
  setMoveToTeamId,
  allTeams,
  handleMoveMember,
  handleRemoveMember,
}) => (
  <div className="modal-backdrop-custom">
    <div className="modal-content-custom">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Manage Team: {editTeam.teamName}</h4>
        <button className="btn-close" onClick={() => setEditTeam(null)}></button>
      </div>

      <div className="row g-4">
        <div className="col-md-5 border-end">
          <label className="form-label small fw-bold text-muted">Rename Team</label>
          <form onSubmit={handleUpdateTeam} className="mb-4">
            <input className="form-control mb-2 rounded-3" value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} />
            <button className="btn btn-dark w-100 rounded-3">Update Name</button>
          </form>

          <label className="form-label small fw-bold text-muted">Quick Add Member</label>
          <div className="d-flex gap-2 mb-3">
            <select className="form-select rounded-3" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select available...</option>
              {availableUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleAddMember}><i className="bi bi-person-plus"></i></button>
          </div>
        </div>

        <div className="col-md-7">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label small fw-bold text-muted mb-0">Current Members</label>
            <input
              className="form-control form-control-sm border-0 bg-light rounded-pill"
              style={{ width: "150px" }}
              placeholder="Filter list..."
              value={teamMemberSearch}
              onChange={(e) => setTeamMemberSearch(e.target.value)}
            />
          </div>
          <div className="member-list-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
            <ul className="list-group list-group-flush">
              {teamMembers
                .filter((m) => m.name.toLowerCase().includes(teamMemberSearch.toLowerCase()))
                .map((m) => (
                  <li key={m._id} className="list-group-item d-flex flex-column gap-2 px-0 py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">{m.name}</span>
                      <button className="btn btn-link text-danger btn-sm p-0 text-decoration-none" onClick={() => handleRemoveMember(m._id)}>
                        Remove
                      </button>
                    </div>
                    <div className="input-group input-group-sm">
                      <select className="form-select bg-light" value={moveToTeamId} onChange={(e) => setMoveToTeamId(e.target.value)}>
                        <option value="">Transfer to...</option>
                        {allTeams.filter(t => t._id !== editTeam._id).map((t) => (
                          <option key={t._id} value={t._id}>{t.teamName}</option>
                        ))}
                      </select>
                      <button className="btn btn-outline-info" onClick={() => handleMoveMember(m._id)}>Transfer</button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="text-end mt-4">
        <button className="btn btn-light px-4 rounded-pill border" onClick={() => setEditTeam(null)}>Finished</button>
      </div>
    </div>
  </div>
);

const UserModal = ({
  setEditUser,
  name,
  setName,
  email,
  setEmail,
  designation,
  setDesignation,
  handleUpdateUser,
}) => (
  <div className="modal-backdrop-custom">
    <div className="modal-content-custom" style={{ maxWidth: "450px" }}>
      <div className="text-center mb-4">
        <div className="bg-warning bg-opacity-10 p-3 d-inline-block rounded-circle mb-3">
          <i className="bi bi-person-lines-fill text-warning fs-3"></i>
        </div>
        <h4 className="fw-bold mb-0">Edit Member Details</h4>
        <p className="text-muted small">Update profile information for this member</p>
      </div>
      <form onSubmit={handleUpdateUser}>
        <div className="mb-3">
          <label className="form-label small fw-bold">Full Name</label>
          <input className="form-control rounded-3" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold">Email Address</label>
          <input className="form-control rounded-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="form-label small fw-bold">Designation</label>
          <input className="form-control rounded-3" value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary w-100 py-2 rounded-3 shadow-sm" type="submit">Save Changes</button>
          <button className="btn btn-light w-100 py-2 rounded-3 border" type="button" onClick={() => setEditUser(null)}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
);