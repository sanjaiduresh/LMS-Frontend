import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
    try {
      const leaveRes = await axios.get("http://localhost:8000/admin/leaves");
      const userRes = await axios.get("http://localhost:8000/admin/users");
      setLeaves(leaveRes.data);   // if your backend returns just the array
      setUsers(userRes.data);     // same here
      console.log(leaveRes, userRes);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (leaveId, action) => {
    try {
      await axios.post(`http://localhost:8000/admin/leave-action`, {
        leaveId,
        action,
      });
      fetchData();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <section className="users-list card">
        <h3>Users & Leave Balances</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Casual</th>
              <th>Sick</th>
              <th>Earned</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.leaveBalance?.casual}</td>
                <td>{u.leaveBalance?.sick}</td>
                <td>{u.leaveBalance?.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pending-leaves card">
        <h3>Leave Requests</h3>
        <table>
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
                <td>{leave.user?.name || "N/A"}</td>
                <td>{leave.type}</td>
                <td>{new Date(leave.from).toLocaleDateString()}</td>
                <td>{new Date(leave.to).toLocaleDateString()}</td>
                <td>{leave.status}</td>
                <td>
                  {leave.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleAction(leave._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(leave._id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    leave.status
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
