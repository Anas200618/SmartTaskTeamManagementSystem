import React, { useEffect, useState, useMemo } from "react";
import API from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const UserManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 6;

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isSuperAdmin = user.role === "SuperAdmin";

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await API.get("/users/admins");
      setAdmins(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) =>
      `${admin.name} ${admin.email} ${admin.designation || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [admins, search]);

  const indexOfLast = currentPage * adminsPerPage;
  const indexOfFirst = indexOfLast - adminsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);

  const handleUpdate = async (id, updatedData) => {
    try {
      await API.put(`/users/${id}`, updatedData);
      fetchAdmins();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this admin? This action cannot be undone.")) return;
    try {
      await API.delete(`/users/${id}`);
      fetchAdmins();
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleAccess = async (id) => {
    try {
      await API.patch(`/users/${id}/toggle-access`);
      fetchAdmins();
    } catch (err) {
      console.log(err);
    }
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout onSearch={(val) => setSearch(val)}>
        <div className="container mt-5">
          <div className="alert alert-custom d-flex align-items-center bg-danger text-white border-0 shadow rounded-4 p-4">
            <i className="bi bi-exclamation-octagon-fill fs-1 me-3"></i>
            <div>
              <h4 className="alert-heading fw-bold mb-1">Access Denied</h4>
              <p className="mb-0">This module is reserved for Super Administrators only. Please contact IT if you believe this is an error.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onSearch={(val) => setSearch(val)}>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Admin Management</h2>
            <p className="text-muted small">Manage administrative privileges and account details</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary rounded-pill px-3 shadow-sm" onClick={fetchAdmins}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {/* Toolbar */}
          <div className="card-header bg-white border-0 py-3 px-4">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="input-group bg-light rounded-pill px-3 py-1">
                  <span className="input-group-text bg-transparent border-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-transparent border-0 shadow-none"
                    placeholder="Search by name, email or role..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light text-muted small text-uppercase">
                  <tr>
                    <th className="px-4 py-3 border-0">Administrator</th>
                    <th className="py-3 border-0">Email Address</th>
                    <th className="py-3 border-0">Designation</th>
                    <th className="py-3 border-0 text-center">System Access</th>
                    <th className="px-4 py-3 border-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                        <span className="text-muted">Synchronizing data...</span>
                      </td>
                    </tr>
                  ) : currentAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <i className="bi bi-people fs-1 text-light d-block mb-2"></i>
                        <span className="text-muted">No administrators found matching your search.</span>
                      </td>
                    </tr>
                  ) : (
                    currentAdmins.map((admin) => (
                      <tr key={admin._id} className="border-bottom">
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle me-3 bg-primary-subtle text-primary fw-bold">
                              {admin.name.charAt(0)}
                            </div>
                            <input
                              type="text"
                              className="form-control-plaintext fw-semibold p-0 admin-input shadow-none"
                              defaultValue={admin.name}
                              onBlur={(e) => handleUpdate(admin._id, { name: e.target.value })}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="email"
                            className="form-control-plaintext text-muted p-0 admin-input shadow-none"
                            defaultValue={admin.email}
                            onBlur={(e) => handleUpdate(admin._id, { email: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control-plaintext text-muted p-0 admin-input shadow-none"
                            placeholder="Set designation..."
                            defaultValue={admin.designation || ""}
                            onBlur={(e) => handleUpdate(admin._id, { designation: e.target.value })}
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex flex-column align-items-center">
                            <div className="form-check form-switch mb-1">
                              <input
                                className="form-check-input cursor-pointer shadow-none"
                                type="checkbox"
                                role="switch"
                                checked={admin.adminAccess || false}
                                onChange={() => handleToggleAccess(admin._id)}
                              />
                            </div>
                            <span className={`badge rounded-pill ${admin.adminAccess ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`} style={{fontSize: '0.7rem'}}>
                              {admin.adminAccess ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 text-end">
                          <button
                            className="btn btn-outline-danger btn-sm rounded-3 px-3 transition-all shadow-none"
                            onClick={() => handleDelete(admin._id)}
                          >
                            <i className="bi bi-trash3 me-1"></i> Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="card-footer bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredAdmins.length)} of {filteredAdmins.length} admins
              </small>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                  <button className="page-link shadow-none border-0 px-3" onClick={() => setCurrentPage(currentPage - 1)}>
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link shadow-none border-0 px-3" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
                  <button className="page-link shadow-none border-0 px-3" onClick={() => setCurrentPage(currentPage + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-input {
          border: 1px solid transparent;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .admin-input:focus {
          border-color: #dee2e6;
          background-color: #f8f9fa;
          padding: 2px 8px !important;
        }
        .avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
        .page-item.active .page-link {
          background-color: #2c5d8f !important;
          border-radius: 8px !important;
        }
        .table-hover tbody tr:hover {
          background-color: #fbfcfe;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default UserManagement;