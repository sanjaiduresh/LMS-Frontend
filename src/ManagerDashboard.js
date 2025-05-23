import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/ManagerDashboard.css";
import ApplyLeave from "./Components/ApplyLeave";
import API_URL from "./api";
import LeaveCalendar from "./pages/LeaveCalendar/LeaveCalendar";

export default function ManagerDashboard() {
  /* ------------------------------------------------------------------ */
  /* State & helpers                                                    */
  /* ------------------------------------------------------------------ */
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole");
  
  const [user, setUser] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ----- fetch data ------------------------------------------------ */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user data and team data
      const [userRes, teamRes] = await Promise.all([
        axios.get(`${API_URL}/user/${id}`),
        axios.get(`${API_URL}/manager/${id}/team`)
      ]);
      
      setUser(userRes.data.user);
      setTeamData(teamRes.data);
      setTeamMembers(teamRes.data.members || []);
      setTeamLeaves(teamRes.data.teamLeaves || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to fetch dashboard data. Please try again later.");
      if (err.response?.status === 403) {
        setError("Access denied. You are not authorized to view this page.");
      } else if (err.response?.status === 404) {
        setError("Manager not found or has no team assigned.");
      } else {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ------------------------------------------------------------------ */
  /* Derived data                                                       */
  /* ------------------------------------------------------------------ */
  const { pendingLeaves, historyLeaves } = useMemo(() => {
    const pending = teamLeaves.filter(leave => 
      leave.requiredApprovals?.includes(role?.toLowerCase()) && 
      leave.status?.toLowerCase() === 'pending'
    );
    const history = teamLeaves.filter(leave => 
      !leave.requiredApprovals?.includes(role?.toLowerCase()) ||
      leave.status?.toLowerCase() !== 'pending'
    );
    return { pendingLeaves: pending, historyLeaves: history };
  }, [teamLeaves, role]);

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */
  const handleAction = async (leaveId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) return;
    
    try {
      await axios.post(`${API_URL}/admin/leave-action`, {
        leaveId,
        action,
        role: role?.toLowerCase(),
      });
      fetchData();
    } catch (err) {
      console.error("Action failed", err);
      alert(err.response?.data?.error || "An unexpected error occurred.");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const getUserName = (userId) => {
    const member = teamMembers.find(m => m._id === userId);
    return member?.name || "N/A";
  };

  const calculateLeaveDays = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const renderRows = (arr, showActions = false) => {
    if (arr.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="md-empty-state">
            <div className="md-empty-state-icon">📋</div>
            <div>No {activeTab} requests found from your team</div>
          </td>
        </tr>
      );
    }

    return arr.map((leave) => (
      <tr key={leave._id}>
        <td>{leave.userName || getUserName(leave.userId)}</td>
        <td>{leave.type}</td>
        <td>{new Date(leave.from).toLocaleDateString()}</td>
        <td>{new Date(leave.to).toLocaleDateString()}</td>
        <td>{calculateLeaveDays(leave.from, leave.to)} day(s)</td>
        <td className={`md-status-${leave.status?.toLowerCase()}`}>
          {leave.requiredApprovals?.length === 0 ? "Approved" : leave.status}
        </td>
        <td className="md-actions-cell">
          {showActions ? (
            <div className="md-action-buttons">
              <button
                className="md-action-button md-approve-button"
                onClick={() => handleAction(leave._id, "approved")}
              >
                ✅ Approve
              </button>
              <button
                className="md-action-button md-reject-button"
                onClick={() => handleAction(leave._id, "rejected")}
              >
                ❌ Reject
              </button>
            </div>
          ) : (
            <span className="md-no-actions">—</span>
          )}
        </td>
      </tr>
    ));
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  if (loading) return <div className="md-loading">Loading Manager Dashboard…</div>;
  if (error) return <div className="md-error">{error}</div>;
  if (!user) return null;

  const totalBalance =
    (parseInt(user.leaveBalance?.casual) || 0) +
    (parseInt(user.leaveBalance?.sick) || 0) +
    (parseInt(user.leaveBalance?.earned) || 0);

  return (
    <div className="md-dashboard-container">
      {/* ---------- header ------------------------------------------- */}
      <div className="md-dashboard-header">
        <div className="md-header-left">
          <h2 className="md-welcome-text">Manager Dashboard</h2>
          <p className="md-subtitle">Welcome, {user.name}</p>
          <p className="md-team-info">
            Managing {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="md-header-right">
          <button className="md-logout-button" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* ---------- grid layout -------------------------------------- */}
      <div className="md-dashboard-grid">
        {/* ===== Sidebar ============================================ */}
        <aside className="md-dashboard-sidebar">
          {/* Balance card */}
          <div className="md-leave-summary">
            <h3>{totalBalance}</h3>
            <div>Your Leave Balance</div>

            <div className="md-balance-grid">
              {["Casual", "Sick", "Earned"].map((lbl) => (
                <div key={lbl} className="md-balance-item">
                  <div className="md-label">{lbl}</div>
                  <div className="md-value">
                    {user.leaveBalance?.[lbl.toLowerCase()] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Overview */}
          <div className="md-team-overview">
            <h4>Your Team</h4>
            {teamMembers.length > 0 ? (
              <div className="md-team-list">
                {teamMembers.map(member => (
                  <div key={member._id} className="md-team-member">
                    <div className="md-member-name">{member.name}</div>
                    <div className="md-member-email">{member.email}</div>
                    <div className="md-member-balance">
                      Total Balance: {
                        (member.leaveBalance?.casual || 0) +
                        (member.leaveBalance?.sick || 0) +
                        (member.leaveBalance?.earned || 0)
                      } days
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="md-no-team">No team members assigned</div>
            )}
          </div>

          {/* Apply Leave */}
          <div className="md-apply-leave-section">
            <ApplyLeave
              userId={user._id}
              onLeaveApplied={fetchData}
              existingLeaves={teamLeaves.filter(leave => leave.userId === user._id)}
            />
          </div>
        </aside>

        {/* ===== Main panel ========================================= */}
        <main className="md-dashboard-main">
          {/* Tabs */}
          <div className="md-status-tabs">
            <button
              className={`md-tab-button ${activeTab === "pending" ? "md-active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending Approvals&nbsp;({pendingLeaves.length})
            </button>
            <button
              className={`md-tab-button ${activeTab === "history" ? "md-active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Team Requests&nbsp;({historyLeaves.length})
            </button>
          </div>

          {/* Table card */}
          <section className="md-card">
            <header className="md-card-header">
              <h3>
                {activeTab === "pending" 
                  ? "Team Requests Awaiting Your Approval" 
                  : "All Team Leave Requests"}
              </h3>
            </header>

            <div className="md-card-content">
              <table className="md-leave-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === "pending"
                    ? renderRows(pendingLeaves, true)
                    : renderRows(historyLeaves, false)}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <LeaveCalendar leaves={teamLeaves} />
    </div>
  );
}