import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Filter, Users, Calendar, CheckCircle, XCircle, Clock, LogOut, Plus } from "lucide-react";
import "./styles/ManagerDashboard.css";
import ApplyLeave from "./Components/ApplyLeave";
import {API_URL} from "./api";
import LeaveCalendar from "./pages/LeaveCalendar/LeaveCalendar";
import { User, Leave, Team, Role, ApplyLeaveProps } from "./types";

export default function ManagerDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole") as Role | null;

  const [user, setUser] = useState<User | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [filteredTeamMembers, setFilteredTeamMembers] = useState<User[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "history" | "apply" | "calendar">("pending");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterBalance, setFilterBalance] = useState<"low" | "medium" | "high" | "">("");

  /* ----- fetch data ------------------------------------------------ */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user data and team data
      const [userRes, teamRes] = await Promise.all([
        axios.get<{ user: User }>(`${API_URL}/user/${id}`),
        axios.get<Team>(`${API_URL}/manager/${id}/team`),
      ]);

      setUser(userRes.data.user);
      setTeamData(teamRes.data);
      setTeamMembers(teamRes.data.members || []);
      setFilteredTeamMembers(teamRes.data.members || []);
      setTeamLeaves(teamRes.data.teamLeaves || []);
      setError(null);
    } catch (err: any) {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ----- search and filter ----------------------------------------- */
  useEffect(() => {
    let filtered = teamMembers;

    if (searchQuery) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterBalance) {
      filtered = filtered.filter((member) => {
        const totalBalance =
          (parseInt(member.leaveBalance?.casual?.toString() ?? "0") || 0) +
          (parseInt(member.leaveBalance?.sick?.toString() ?? "0") || 0) +
          (parseInt(member.leaveBalance?.earned?.toString() ?? "0") || 0);
        if (filterBalance === "low") return totalBalance < 10;
        if (filterBalance === "medium") return totalBalance >= 10 && totalBalance <= 20;
        if (filterBalance === "high") return totalBalance > 20;
        return true;
      });
    }

    setFilteredTeamMembers(filtered);
  }, [searchQuery, filterBalance, teamMembers]);

  // Derived data
  const { pendingLeaves, historyLeaves } = useMemo(() => {
    const pending = teamLeaves.filter(
      (leave) =>
        leave.requiredApprovals?.includes(role?.toLowerCase() as Role) &&
        leave.status?.toLowerCase() === "pending"
    );
    const history = teamLeaves.filter(
      (leave) =>
        !leave.requiredApprovals?.includes(role?.toLowerCase() as Role) ||
        leave.status?.toLowerCase() !== "pending"
    );
    return { pendingLeaves: pending, historyLeaves: history };
  }, [teamLeaves, role]);

  // Actions
  const handleAction = async (leaveId: string, action: "approved" | "rejected") => {
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) return;
    console.log(`${action} leave ${leaveId}`);
  };

  const logout = () => {
    navigate("/login");
  };

  // Helpers
  const getUserName = (userId: string): string => {
    const member = teamMembers.find((m) => m._id === userId);
    return member?.name || "N/A";
  };

  const calculateLeaveDays = (from: string, to: string): number => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const totalBalance = user
    ? (parseInt(user.leaveBalance?.casual?.toString() ?? "0") || 0) +
      (parseInt(user.leaveBalance?.sick?.toString() ?? "0") || 0) +
      (parseInt(user.leaveBalance?.earned?.toString() ?? "0") || 0)
    : 0;

  if (loading) return <div className="md-loading">Loading Manager Dashboard…</div>;
  if (error) return <div className="md-error">{error}</div>;
  if (!user) return null;

  return (
    <div className="md-container">
      {/* Top Navigation Bar */}
      <nav className="md-navbar">
        <div className="md-navbar-brand">
          <Users className="md-brand-icon" />
          <span className="md-brand-text">Manager Portal</span>
        </div>

        <div className="md-navbar-user">
          <div className="md-user-info">
            <span className="md-user-name">{user.name}</span>
            <span className="md-user-role">Team Manager</span>
          </div>
          <button className="md-logout-btn" onClick={logout}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="md-layout">
        {/* Sidebar */}
        <aside className="md-sidebar">
          {/* Quick Stats */}
          <div className="md-stats-card">
            <div className="md-stat-main">
              <span className="md-stat-number">{totalBalance}</span>
              <span className="md-stat-label">Your Leave Balance</span>
            </div>
            <div className="md-stat-breakdown">
              <div className="md-stat-item">
                <span className="md-stat-type">Casual</span>
                <span className="md-stat-value">{user.leaveBalance?.casual || 0}</span>
              </div>
              <div className="md-stat-item">
                <span className="md-stat-type">Sick</span>
                <span className="md-stat-value">{user.leaveBalance?.sick || 0}</span>
              </div>
              <div className="md-stat-item">
                <span className="md-stat-type">Earned</span>
                <span className="md-stat-value">{user.leaveBalance?.earned || 0}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="md-nav-tabs">
            <button
              className={`md-nav-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Users size={16} />
              Team Overview
            </button>
            <button
              className={`md-nav-tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} />
              Pending ({pendingLeaves.length})
            </button>
            <button
              className={`md-nav-tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <Calendar size={16} />
              All Requests ({historyLeaves.length})
            </button>
            <button
              className={`md-nav-tab ${activeTab === "apply" ? "active" : ""}`}
              onClick={() => setActiveTab("apply")}
            >
              <Plus size={16} />
              Apply Leave
            </button>
            <button
              className={`md-nav-tab ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar size={16} />
              Leave Calendar
            </button>
            </div>

            {/* Team Summary */}
            <div className="md-team-summary">
              <h4 className="md-section-title">Team Summary</h4>
              <div className="md-summary-stats">
                <div className="md-summary-item">
                  <span className="md-summary-label">Total Members</span>
                    <span className="md-summary-value">{teamMembers.length}</span>
                  </div>
                  <div className="md-summary-item">
                    <span className="md-summary-label">Pending Approvals</span>
                    <span className="md-summary-value">{pendingLeaves.length}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="md-main">
              {/* Team Overview Tab */}
              {activeTab === "overview" && (
                <div className="md-content">
                  <div className="md-content-header">
                    <h2 className="md-content-title">Team Overview</h2>
                    <p className="md-content-subtitle">Manage your team members and their leave balances</p>
                  </div>

                  {/* Search and Filter */}
                  <div className="md-filters">
                    <div className="md-search-group">
                      <Search className="md-search-icon" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="md-search-input"
                      />
                    </div>

                    <div className="md-filter-group">
                      <Filter className="md-filter-icon" />
                      <select
                        value={filterBalance}
                        onChange={(e) => setFilterBalance(e.target.value as "low" | "medium" | "high" | "")}
                        className="md-filter-select"
                      >
                        <option value="">All Balances</option>
                        <option value="low">Low (&lt; 10 days)</option>
                        <option value="medium">Medium (10-20 days)</option>
                        <option value="high">High (&gt; 20 days)</option>
                      </select>
                    </div>
                  </div>

                  {/* Team Members Grid */}
                  <div className="md-team-grid">
                    {filteredTeamMembers.length === 0 ? (
                      <div className="md-empty-state">
                        <Users size={48} />
                        <h3>No team members found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                      </div>
                    ) : (
                      filteredTeamMembers.map((member) => {
                        const memberTotal =
                          (parseInt((member.leaveBalance?.casual ?? "0").toString()) || 0) +
                          (parseInt((member.leaveBalance?.sick ?? "0").toString()) || 0) +
                          (parseInt((member.leaveBalance?.earned ?? "0").toString()) || 0);

                        return (
                          <div key={member._id} className="md-member-card">
                            <div className="md-member-header">
                              <div className="md-member-avatar">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="md-member-info">
                                <h4 className="md-member-name">{member.name}</h4>
                                <p className="md-member-email">{member.email}</p>
                              </div>
                            </div>

                            <div className="md-member-balance">
                              <div className="md-balance-total">
                                <span className="md-balance-number">{memberTotal}</span>
                                <span className="md-balance-label">Total Days</span>
                              </div>

                              <div className="md-balance-details">
                                <div className="md-balance-item">
                                  <span className="md-balance-type">Casual</span>
                                  <span className="md-balance-count">{member.leaveBalance?.casual || 0}</span>
                                </div>
                                <div className="md-balance-item">
                                  <span className="md-balance-type">Sick</span>
                                  <span className="md-balance-count">{member.leaveBalance?.sick || 0}</span>
                                </div>
                                <div className="md-balance-item">
                                  <span className="md-balance-type">Earned</span>
                                  <span className="md-balance-count">{member.leaveBalance?.earned || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Pending Requests Tab */}
              {activeTab === "pending" && (
                <div className="md-content">
                  <div className="md-content-header">
                    <h2 className="md-content-title">Pending Approvals</h2>
                    <p className="md-content-subtitle">Review and approve leave requests from your team</p>
                  </div>

                  <div className="md-requests-list">
                    {pendingLeaves.length === 0 ? (
                      <div className="md-empty-state">
                        <CheckCircle size={48} />
                        <h3>All caught up!</h3>
                        <p>No pending leave requests at the moment</p>
                      </div>
                    ) : (
                      pendingLeaves.map((leave) => (
                        <div key={leave._id} className="md-request-card">
                          <div className="md-request-header">
                            <div className="md-request-user">
                              <div className="md-request-avatar">
                                {leave.userName?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="md-request-info">
                                <h4 className="md-request-name">{leave.userName || getUserName(leave.userId)}</h4>
                                <p className="md-request-type">{leave.type} Leave</p>
                              </div>
                            </div>
                            <span className="md-request-status pending">Pending</span>
                          </div>

                          <div className="md-request-details">
                            <div className="md-request-dates">
                              <div className="md-date-item">
                                <span className="md-date-label">From</span>
                                <span className="md-date-value">{new Date(leave.from).toLocaleDateString()}</span>
                              </div>
                              <div className="md-date-item">
                                <span className="md-date-label">To</span>
                                <span className="md-date-value">{new Date(leave.to).toLocaleDateString()}</span>
                              </div>
                              <div className="md-date-item">
                                <span className="md-date-label">Duration</span>
                                <span className="md-date-value">{calculateLeaveDays(leave.from, leave.to)} days</span>
                              </div>
                            </div>

                            {leave.reason && (
                              <div className="md-request-reason">
                                <span className="md-reason-label">Reason:</span>
                                <span className="md-reason-text">{leave.reason}</span>
                              </div>
                            )}
                          </div>

                          <div className="md-request-actions">
                            <button
                              className="md-action-btn approve"
                              onClick={() => handleAction(leave._id, "approved")}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              className="md-action-btn reject"
                              onClick={() => handleAction(leave._id, "rejected")}
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="md-content">
                  <div className="md-content-header">
                    <h2 className="md-content-title">All Leave Requests</h2>
                    <p className="md-content-subtitle">Complete history of team leave requests</p>
                  </div>

                  <div className="md-requests-list">
                    {historyLeaves.length === 0 ? (
                      <div className="md-empty-state">
                        <Calendar size={48} />
                        <h3>No requests found</h3>
                        <p>Your team hasn't submitted any leave requests yet</p>
                      </div>
                    ) : (
                      historyLeaves.map((leave) => (
                        <div key={leave._id} className="md-request-card">
                          <div className="md-request-header">
                            <div className="md-request-user">
                              <div className="md-request-avatar">
                                {leave.userName?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="md-request-info">
                                <h4 className="md-request-name">{leave.userName || getUserName(leave.userId)}</h4>
                                <p className="md-request-type">{leave.type} Leave</p>
                              </div>
                            </div>
                            <span className={`md-request-status ${leave.status?.toLowerCase()}`}>
                              {leave.status}
                            </span>
                          </div>

                          <div className="md-request-details">
                            <div className="md-request-dates">
                              <div className="md-date-item">
                                <span className="md-date-label">From</span>
                                <span className="md-date-value">{new Date(leave.from).toLocaleDateString()}</span>
                              </div>
                              <div className="md-date-item">
                                <span className="md-date-label">To</span>
                                <span className="md-date-value">{new Date(leave.to).toLocaleDateString()}</span>
                              </div>
                              <div className="md-date-item">
                                <span className="md-date-label">Duration</span>
                                <span className="md-date-value">{calculateLeaveDays(leave.from, leave.to)} days</span>
                              </div>
                            </div>

                            {leave.reason && (
                              <div className="md-request-reason">
                                <span className="md-reason-label">Reason:</span>
                                <span className="md-reason-text">{leave.reason}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Apply Leave Tab */}
              {activeTab === "apply" && (
                <div className="md-content">
                  <div className="md-content-header">
                    <h2 className="md-content-title">Apply for Leave</h2>
                    <p className="md-content-subtitle">Submit your own leave request</p>
                  </div>

                  <div className="md-apply-section">
                    <ApplyLeave
                      userId={user._id}
                      onLeaveApplied={fetchData}
                      existingLeaves={teamLeaves
                        .filter((leave) => leave.userId === user._id)
                        .map((leave) => ({
                          ...leave,
                          reason: leave.reason ?? "",
                          validDays: leave.validDays ?? 0,
                        }))}
                    />
                  </div>
                </div>
              )}

              {/* Leave Calendar Tab */}
              {activeTab === "calendar" && <LeaveCalendar leaves={teamLeaves} />}
            </main>
          </div>
        </div>
      );
    }