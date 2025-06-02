import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../src/styles/AdminDashboard.css";
import CreateEmployee from "./Components/CreateEmployee";
import TeamsManagement from "./pages/TeamsManagement/TeamsManagement";
import { API_URL } from "./api";
import { User, Leave, LeaveStatus } from "./types";
import BulkUpload from "./Components/BulkUpload";

interface CreateEmployeeProps {
  managers: User[];
  onCreated: () => void;
  onClose: () => void;
}

interface Stats {
  totalUsers: number;
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "teams" | "create-employees"
  >("dashboard");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const navigate = useNavigate();

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const leaveRes = await axios.get<Leave[]>(`${API_URL}/admin/leaves`);
      const userRes = await axios.get<User[]>(`${API_URL}/admin/users`);
      setLeaves(leaveRes.data);
      setUsers(userRes.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch admin data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    leaveId: string,
    action: "approved" | "rejected"
  ): Promise<void> => {
    if (
      !window.confirm(`Are you sure you want to ${action} this leave request?`)
    )
      return;
    try {
      await axios.post(`${API_URL}/admin/leave-action`, { leaveId, action });
      fetchData();
    } catch (err: any) {
      console.error("Action failed", err);
    }
  };

  const handleLogout = (): void => {
    localStorage.clear();
    navigate("/login");
  };

  const getInitials = (name: string | undefined): string => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const calculateStats = (): Stats => {
    const totalUsers = users.length;
    const totalLeaves = leaves.length;
    const pendingLeaves = leaves.filter(
      (leave) => leave.status === "pending"
    ).length;
    const approvedLeaves = leaves.filter(
      (leave) => leave.status === "approved"
    ).length;
    const rejectedLeaves = leaves.filter(
      (leave) => leave.status === "rejected"
    ).length;

    return {
      totalUsers,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
    };
  };

  const filteredLeaves = leaves.filter((leave) => {
    const matchesSearch =
      leave.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = calculateStats();

  if (loading && activeTab === "dashboard") {
    return (
      <div className="ad-container">
        <div className="ad-loading">Loading Admin Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-container">
        <div className="ad-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ad-container">
      {/* Top Navigation */}
      <nav className="ad-navbar">
        <div className="ad-navbar-brand">
          <span className="ad-brand-icon">⚡</span>
          <span className="ad-brand-text">Admin Dashboard</span>
        </div>
        <div className="ad-navbar-user">
          <div className="ad-user-info">
            <span className="ad-user-name">Administrator</span>
            <span className="ad-user-role">Admin</span>
          </div>
          <button className="ad-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
          </button>
        </div>
      </nav>

      <div className="ad-layout">
        {/* Sidebar */}
        <aside className="ad-sidebar">
          {/* Stats Card */}
          <div className="ad-stats-card">
            <div className="ad-stat-main">
              <span className="ad-stat-number">{stats.totalLeaves}</span>
              <span className="ad-stat-label">Total Requests</span>
            </div>
            <div className="ad-stat-breakdown">
              <div className="ad-stat-item">
                <span className="ad-stat-type">Pending</span>
                <span className="ad-stat-value">{stats.pendingLeaves}</span>
              </div>
              <div className="ad-stat-item">
                <span className="ad-stat-type">Approved</span>
                <span className="ad-stat-value">{stats.approvedLeaves}</span>
              </div>
              <div className="ad-stat-item">
                <span className="ad-stat-type">Rejected</span>
                <span className="ad-stat-value">{stats.rejectedLeaves}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="ad-nav-tabs">
            <button
              className={`ad-nav-tab ${
                activeTab === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <span>📊</span>
              Dashboard
            </button>
            <button
              className={`ad-nav-tab ${activeTab === "teams" ? "active" : ""}`}
              onClick={() => setActiveTab("teams")}
            >
              <span>👥</span>
              Teams
            </button>
            <button
              className={`ad-nav-tab ${
                activeTab === "create-employees" ? "active" : ""
              }`}
              onClick={() => setActiveTab("create-employees")}
            >
              <span>👥</span>
              Add Employees
            </button>
          </div>

          {/* System Summary */}
          <div className="ad-system-summary">
            <h4 className="ad-section-title">System Overview</h4>
            <div className="ad-summary-stats">
              <div className="ad-summary-item">
                <span className="ad-summary-label">Total Users</span>
                <span className="ad-summary-value">{stats.totalUsers}</span>
              </div>
              <div className="ad-summary-item">
                <span className="ad-summary-label">Managers</span>
                <span className="ad-summary-value">
                  {users.filter((u) => u.role === "manager").length}
                </span>
              </div>
              <div className="ad-summary-item">
                <span className="ad-summary-label">Employees</span>
                <span className="ad-summary-value">
                  {users.filter((u) => u.role === "employee").length}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ad-main">
          <div className="ad-content">
            {activeTab === "dashboard" && (
              <>
                <div className="ad-content-header">
                  <h1 className="ad-content-title">Admin Dashboard</h1>
                  <p className="ad-content-subtitle">
                    Manage leave requests, users, and system operations
                  </p>
                </div>

                {/* Filters */}
                <div className="ad-filters">
                  <div className="ad-search-group">
                    <span className="ad-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by name or leave type..."
                      className="ad-search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="ad-filter-group">
                    <span className="ad-filter-icon">📋</span>
                    <select
                      className="ad-filter-select"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as LeaveStatus | "all")
                      }
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Leave Requests */}
                <div className="ad-requests-section">
                  <h2 className="ad-section-title">Leave Requests</h2>
                  {filteredLeaves.length === 0 ? (
                    <div className="ad-empty-state">
                      <span className="ad-empty-state-icon">📝</span>
                      <h3>No Leave Requests</h3>
                      <p>No leave requests match your current filters.</p>
                    </div>
                  ) : (
                    <div className="ad-requests-list">
                      {filteredLeaves.map((leave) => (
                        <div key={leave._id} className="ad-request-card">
                          <div className="ad-request-header">
                            <div className="ad-request-user">
                              <div className="ad-request-avatar">
                                {getInitials(leave.userName)}
                              </div>
                              <div className="ad-request-info">
                                <div className="ad-request-name">
                                  {leave.userName || "N/A"}
                                </div>
                                <div className="ad-request-type">
                                  {leave.type} Leave
                                </div>
                              </div>
                            </div>
                            <div
                              className={`ad-request-status ${leave.status.toLowerCase()}`}
                            >
                              {leave.status}
                            </div>
                          </div>

                          <div className="ad-request-details">
                            <div className="ad-request-dates">
                              <div className="ad-date-item">
                                <span className="ad-date-label">From</span>
                                <span className="ad-date-value">
                                  {new Date(leave.from).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="ad-date-item">
                                <span className="ad-date-label">To</span>
                                <span className="ad-date-value">
                                  {new Date(leave.to).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="ad-date-item">
                                <span className="ad-date-label">Duration</span>
                                <span className="ad-date-value">
                                  {Math.ceil(
                                    (new Date(leave.to).getTime() -
                                      new Date(leave.from).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  ) + 1}{" "}
                                  days
                                </span>
                              </div>
                            </div>

                            {leave.reason && (
                              <div className="ad-request-reason">
                                <span className="ad-reason-label">Reason:</span>
                                <span className="ad-reason-text">
                                  {leave.reason}
                                </span>
                              </div>
                            )}
                          </div>

                          {leave.status === "pending" && (
                            <div className="ad-request-actions">
                              <button
                                className="ad-action-btn approve"
                                onClick={() =>
                                  handleAction(leave._id, "approved")
                                }
                              >
                                <span>✅</span>
                                Approve
                              </button>
                              <button
                                className="ad-action-btn reject"
                                onClick={() =>
                                  handleAction(leave._id, "rejected")
                                }
                              >
                                <span>❌</span>
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "teams" && (
              <>
                    <TeamsManagement/>

                {/* <div className="ad-users-section">
                  <h2 className="ad-section-title">Users & Leave Balances</h2>
                  <div className="ad-users-grid">
                    {users.map((user) => {
                      const manager = user.managerId
                        ? users.find((u) => u._id === user.managerId)
                        : null;
                      const totalBalance =
                        (user.leaveBalance?.casual || 0) +
                        (user.leaveBalance?.sick || 0) +
                        (user.leaveBalance?.earned || 0);

                      return (
                        <div key={user._id} className="ad-user-card">
                          <div className="ad-user-header">
                            <div className="ad-user-avatar">
                              {getInitials(user.name)}
                            </div>
                            <div className="ad-user-info">
                              <div className="ad-user-name">{user.name}</div>
                              <div className="ad-user-email">{user.email}</div>
                              <div className={`ad-user-role ${user.role}`}>
                                {user.role}
                              </div>
                            </div>
                          </div>

                          {user.role === "employee" && (
                            <div className="ad-user-manager">
                              <span className="ad-manager-label">Manager:</span>
                              <span className="ad-manager-name">
                                {manager ? manager.name : "⚠️ Unassigned"}
                              </span>
                            </div>
                          )}

                          <div className="ad-user-balance">
                            <div className="ad-balance-total">
                              <span className="ad-balance-number">
                                {totalBalance}
                              </span>
                              <span className="ad-balance-label">
                                Total Days
                              </span>
                            </div>
                            <div className="ad-balance-details">
                              <div className="ad-balance-item">
                                <span className="ad-balance-type">Casual</span>
                                <span className="ad-balance-count">
                                  {user.leaveBalance?.casual || 0}
                                </span>
                              </div>
                              <div className="ad-balance-item">
                                <span className="ad-balance-type">Sick</span>
                                <span className="ad-balance-count">
                                  {user.leaveBalance?.sick || 0}
                                </span>
                              </div>
                              <div className="ad-balance-item">
                                <span className="ad-balance-type">Earned</span>
                                <span className="ad-balance-count">
                                  {user.leaveBalance?.earned || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div> */}
              </>
            )}
            {activeTab === "create-employees" && (
              <>
                {/* Create Employee Section */}
                <div className="ad-create-section">
                  <button
                    className="ad-create-btn"
                    onClick={() => setShowModal(true)}
                  >
                    <span>➕</span>
                    Create New Employee
                  </button>
                </div>
                <BulkUpload />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ad-modal-overlay">
          <div className="ad-modal-content">
            <button
              className="ad-close-modal-btn"
              onClick={() => setShowModal(false)}
            >
              ✖
            </button>
            <CreateEmployee
              managers={users.filter((user) => user.role === "manager")}
              onCreated={fetchData}
              onClose={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
