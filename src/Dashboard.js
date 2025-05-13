import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/Dashboard.css";
import ApplyLeave from "./Components/ApplyLeave";

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8000/user/${id}`);
      setUser(res.data.user);
      setLeaves(res.data.leaves);
    } catch (error) {
      console.error("Failed to fetch user data", error);
      navigate("/login");
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="welcome-text">Welcome, {user.name}</h2>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="leave-summary card">
        <h3>
          Leave Balance: {(parseInt(user.leaveBalance?.casual) || 0) +
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
                <td>{leave.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
