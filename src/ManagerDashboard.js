import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import ApplyLeave from "./Components/ApplyLeave";
import API_URL from "./api";
export default function ManagerDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const role = localStorage.getItem("userRole");

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
      setError(null);
    } catch (err) {
      setError("Failed to fetch admin data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Always call hooks unconditionally and only at top level
  useEffect(() => {
    fetchDatas();
    fetchData();
  }, [fetchDatas, fetchData]);

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
  // ✅ Define the missing logout function
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading || !user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      Manager Dashboard
      <div className="dashboard-header">
        <h2 className="welcome-text">Welcome, {user.name}</h2>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
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
                      {leave.requiredApprovals.includes(
                        user.role.toLowerCase()
                      ) ? (
                        <div className="action-btns">
                          <button
                            className="approve"
                            title="Approve Leave"
                            onClick={() => handleAction(leave._id, "approved", role)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="reject"
                            title="Reject Leave"
                            onClick={() => handleAction(leave._id, "rejected", role)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : leave.requiredApprovals.length > 0 ? (
                        "pending"
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
      <div className="leave-summary card">
        <h3>
          Leave Balance:{" "}
          {(parseInt(user.leaveBalance?.casual) || 0) +
            (parseInt(user.leaveBalance?.sick) || 0) +
            (parseInt(user.leaveBalance?.earned) || 0)}
        </h3>
        <p>Casual: {user.leaveBalance?.casual}</p>
        <p>Sick: {user.leaveBalance?.sick}</p>
        <p>Earned: {user.leaveBalance?.earned}</p>
      </div>
      <div className="apply-leave-section card">
        <ApplyLeave userId={user._id} onLeaveApplied={fetchData} />
      </div>
      <div className="leave-history card">
        <h3>Leave History</h3>
        <table className="leave-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, idx) => (
              <tr key={idx}>
                <td>{leave.userName || "N/A"}</td>
                <td>{leave.type}</td>
                <td>{new Date(leave.from).toLocaleDateString()}</td>
                <td>{new Date(leave.to).toLocaleDateString()}</td>
                <td>{leave.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
