import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/HRDashboard.css";
import ApplyLeave from "./Components/ApplyLeave";
import API_URL from "./api";

export default function HRDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const fetchDatas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/user/${id}`);
      setUser(res.data.user);
      setLeaves(res.data.leaves);
    } catch (error) {
      console.error("Failed to fetch user data", error);
      navigate("/login");
    }
  }, [id, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const leaveRes = await axios.get(`${API_URL}/admin/leaves`);
      const userRes = await axios.get(`${API_URL}/admin/users`);
      setLeaves(leaveRes.data);
      setUsers(userRes.data);
      setFilteredUsers(userRes.data); // Initialize filteredUsers with all users
      setError(null);
    } catch (err) {
      setError("Failed to fetch admin data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatas();
    fetchData();
  }, [fetchDatas, fetchData]);

  // Handle search and filter
  useEffect(() => {
    let filtered = users;

    // Search by name or email
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole) {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterRole, users]);

  const handleAction = async (leaveId, action, role) => {
    console.log("Attempting action:", action, "with role:", role);
    if (
      !window.confirm(`Are you sure you want to ${action} this leave request?`)
    )
      return;
    try {
      await axios.post(`${API_URL}/admin/leave-action`, {
        leaveId,
        action,
        role,
      });
      fetchData();
    } catch (err) {
      console.error("Action failed", err);
      if (err.response) {
        alert(`Error: ${err.response.data.error}`);
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading || !user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="welcome-text">Welcome, {user.name} (HR Dashboard)</h2>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Search and Filter Section */}
      <section className="card">
        <h3>Employee Search & Filter</h3>
        <div className="search-filter-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="filter-group">
            <label>Filter by Role:</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Employee List */}
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Total Leave Balance</th>
                <th>Casual</th>
                <th>Sick</th>
                <th>Earned</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div>No employees found</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const totalBalance =
                    (parseInt(u.leaveBalance?.casual) || 0) +
                    (parseInt(u.leaveBalance?.sick) || 0) +
                    (parseInt(u.leaveBalance?.earned) || 0);
                  return (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{totalBalance}</td>
                      <td>{u.leaveBalance?.casual ?? "-"}</td>
                      <td>{u.leaveBalance?.sick ?? "-"}</td>
                      <td>{u.leaveBalance?.earned ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leave Requests Section */}
      <section className="card">
        <h3>Leave Requests</h3>
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => {
                const userObj = users.find((u) => u._id === leave.userId);
                return (
                  <tr key={leave._id}>
                    <td>{userObj?.name || "N/A"}</td>
                    <td>{leave.type}</td>
                    <td>{new Date(leave.from).toLocaleDateString()}</td>
                    <td>{new Date(leave.to).toLocaleDateString()}</td>
                    <td className={`status-${leave.status}`}>
                      {leave.requiredApprovals &&
                      leave.requiredApprovals.length === 0
                        ? "approved"
                        : "pending"}
                    </td>
                    <td>
                      {leave.status === "pending" || leave.status === "Pending" ? (
                        <div className="action-btns">
                          <button
                            className="approve"
                            title="Approve Leave"
                            onClick={() =>
                              handleAction(leave._id, "approved", user?.role)
                            }
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="reject"
                            title="Reject Leave"
                            onClick={() =>
                              handleAction(leave._id, "rejected", user?.role)
                            }
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        leave.status
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leave Balance Section */}
      <div className="leave-summary card">
        <h3>
          Leave Balance:{" "}
          {(parseInt(user.leaveBalance?.casual) || 0) +
            (parseInt(user.leaveBalance?.sick) || 0) +
            (parseInt(user.leaveBalance?.earned) || 0)}
        </h3>
        <p>Casual: {user.leaveBalance?.casual}</p>
        <p>Sick: {user.leaveBalance?.sick}</p>
        <p>Earned: {user.leaveBalance?.earned || 0}</p>
      </div>

      {/* Apply Leave Section */}
      <div className="apply-leave-section card">
        <ApplyLeave userId={user._id} onLeaveApplied={fetchData} />
      </div>

      {/* Leave History Section */}
      <div className="leave-history card">
        <h3>Leave History</h3>
        <table className="leave-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, idx) => (
              <tr key={idx}>
                <td>{leave.type}</td>
                <td>{new Date(leave.from).toLocaleDateString()}</td>
                <td>{new Date(leave.to).toLocaleDateString()}</td>
                <td>
                  {leave.requiredApprovals &&
                  leave.requiredApprovals.length === 0
                    ? "approved"
                    : leave.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}