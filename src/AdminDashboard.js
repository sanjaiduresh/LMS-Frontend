import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CreateEmployee from "./Components/CreateEmployee";
import "./styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const leaveRes = await axios.get("http://localhost:8000/admin/leaves");
      const userRes = await axios.get("http://localhost:8000/admin/users");
      console.log(leaveRes);
      setLeaves(leaveRes.data);
      setUsers(userRes.data);
      setError(null);  // Reset error on successful fetch
    } catch (err) {
      setError("Failed to fetch admin data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (leaveId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) {
      return;
    }

    try {
      await axios.post("http://localhost:8000/admin/leave-action", {
        leaveId,
        action,
      });
      fetchData(); // Refresh data after action
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="error-message">{error}</div>}

{/* ✅ Trigger Modal Button */}
 <div className="card">
        <button className="open-modal-btn" onClick={() => setShowModal(true)}>
          ➕ Create New Employee
        </button>
      </div>

      {/* ✅ Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              ✖
            </button>
            <CreateEmployee onCreated={fetchData} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
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
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.userName || "N/A"}</td>
                  <td>{leave.type}</td>
                  <td>{new Date(leave.from).toLocaleDateString()}</td>
                  <td>{new Date(leave.to).toLocaleDateString()}</td>
                  <td className={`status-${leave.status}`}>{leave.status}</td>
                  <td>
                    {leave.status === "Pending" ? (
                      <div className="action-btns">
                        <button
                          className="approve"
                          title="Approve Leave"
                          onClick={() => handleAction(leave._id, "approved")}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="reject"
                          title="Reject Leave"
                          onClick={() => handleAction(leave._id, "rejected")}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    ) : (
                      leave.status
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Users & Leave Balances</h3>
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Casual</th>
                <th>Sick</th>
                <th>Earned</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.leaveBalance?.casual ?? "-"}</td>
                  <td>{u.leaveBalance?.sick ?? "-"}</td>
                  <td>{u.leaveBalance?.earned ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
