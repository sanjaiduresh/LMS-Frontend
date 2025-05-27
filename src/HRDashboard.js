import React, { useEffect, useState, useCallback, useMemo } from "react";
import { User, Users, Calendar, Clock, Search, Filter, CheckCircle, XCircle, LogOut, UserCheck } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/HRDashboard.css";
import API_URL from "./api";
export default function HRDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Missing state variables
  const [activeTab, setActiveTab] = useState('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');

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

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Computed values using useMemo for better performance
  const userTotalBalance = useMemo(() => {
    if (!user?.leaveBalance) return 0;
    return (parseInt(user.leaveBalance.casual) || 0) +
           (parseInt(user.leaveBalance.sick) || 0) +
           (parseInt(user.leaveBalance.earned) || 0);
  }, [user?.leaveBalance]);

  const filteredUsers = useMemo(() => {
    return users.filter(employee => {
      const matchesSearch = searchQuery === '' || 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === '' || employee.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const totalEmployees = users.length;
  const pendingRequests = leaves.filter(leave => 
    leave.status === 'pending' || (leave.requiredApprovals && leave.requiredApprovals.length > 0)
  ).length;
  
  const approvedToday = leaves.filter(leave => {
    const today = new Date().toDateString();
    const leaveDate = new Date(leave.updatedAt || leave.createdAt).toDateString();
    return leave.status === 'approved' && leaveDate === today;
  }).length;

  // ApplyLeaveForm component (assuming it should be inline since ApplyLeave import might not match)
  const ApplyLeaveForm = ({ userId, onLeaveApplied }) => {
    const [formData, setFormData] = useState({
      type: 'casual',
      from: '',
      to: '',
      reason: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API_URL}/leave/apply`, {
          ...formData,
          userId
        });
        setFormData({ type: 'casual', from: '', to: '', reason: '' });
        onLeaveApplied();
        alert('Leave application submitted successfully!');
      } catch (error) {
        console.error('Failed to apply leave:', error);
        alert('Failed to submit leave application. Please try again.');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="hr-apply-form">
        <div className="hr-form-group">
          <label className="hr-form-label">Leave Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="hr-form-select"
            required
          >
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="earned">Earned Leave</option>
          </select>
        </div>
        
        <div className="hr-form-row">
          <div className="hr-form-group">
            <label className="hr-form-label">From Date</label>
            <input
              type="date"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="hr-form-input"
              required
            />
          </div>
          
          <div className="hr-form-group">
            <label className="hr-form-label">To Date</label>
            <input
              type="date"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="hr-form-input"
              required
            />
          </div>
        </div>
        
        <div className="hr-form-group">
          <label className="hr-form-label">Reason</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="hr-form-textarea"
            placeholder="Enter reason for leave..."
            rows="3"
          />
        </div>
        
        <button type="submit" className="hr-form-submit">
          Submit Leave Application
        </button>
      </form>
    );
  };

  if (loading || !user) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="hr-container">
      {/* Navigation Bar */}
      <nav className="hr-navbar">
        <div className="hr-navbar-brand">
          <UserCheck className="hr-brand-icon" size={24} />
          <span className="hr-brand-text">HR Portal</span>
        </div>
        <div className="hr-navbar-user">
          <div className="hr-user-info">
            <div className="hr-user-name">{user.name}</div>
            <div className="hr-user-role">{user.role.toUpperCase()}</div>
          </div>
          <button className="hr-logout-btn" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="hr-layout">
        {/* Sidebar */}
        <aside className="hr-sidebar">
          {/* Stats Card */}
          <div className="hr-stats-card">
            <div className="hr-stat-main">
              <span className="hr-stat-number">{userTotalBalance}</span>
              <span className="hr-stat-label">My Leave Balance</span>
            </div>
            <div className="hr-stat-breakdown">
              <div className="hr-stat-item">
                <span className="hr-stat-type">Casual</span>
                <span className="hr-stat-value">{user.leaveBalance?.casual || 0}</span>
              </div>
              <div className="hr-stat-item">
                <span className="hr-stat-type">Sick</span>
                <span className="hr-stat-value">{user.leaveBalance?.sick || 0}</span>
              </div>
              <div className="hr-stat-item">
                <span className="hr-stat-type">Earned</span>
                <span className="hr-stat-value">{user.leaveBalance?.earned || 0}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hr-nav-tabs">
            <button
              className={`hr-nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <Users size={20} />
              Employees
            </button>
            <button
              className={`hr-nav-tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <Clock size={20} />
              Leave Requests
            </button>
            <button
              className={`hr-nav-tab ${activeTab === 'apply' ? 'active' : ''}`}
              onClick={() => setActiveTab('apply')}
            >
              <Calendar size={20} />
              Apply Leave
            </button>
            <button
              className={`hr-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <User size={20} />
              My History
            </button>
          </div>

          {/* Team Summary */}
          <div className="hr-team-summary">
            <h4 className="hr-section-title">Quick Stats</h4>
            <div className="hr-summary-stats">
              <div className="hr-summary-item">
                <span className="hr-summary-label">Total Employees</span>
                <span className="hr-summary-value">{totalEmployees}</span>
              </div>
              <div className="hr-summary-item">
                <span className="hr-summary-label">Pending Requests</span>
                <span className="hr-summary-value">{pendingRequests}</span>
              </div>
              <div className="hr-summary-item">
                <span className="hr-summary-label">Approved Today</span>
                <span className="hr-summary-value">{approvedToday}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="hr-main">
          <div className="hr-content">
            {activeTab === 'employees' && (
              <>
                <div className="hr-content-header">
                  <h1 className="hr-content-title">Employee Management</h1>
                  <p className="hr-content-subtitle">
                    Search and filter employees, view their leave balances and manage their information.
                  </p>
                </div>

                {/* Filters */}
                <div className="hr-filters">
                  <div className="hr-search-group">
                    <Search className="hr-search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="hr-search-input"
                    />
                  </div>
                  <div className="hr-filter-group">
                    <Filter className="hr-filter-icon" size={18} />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="hr-filter-select"
                    >
                      <option value="">All Roles</option>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Employee Grid */}
                <div className="hr-team-grid">
                  {filteredUsers.length === 0 ? (
                    <div className="hr-empty-state">
                      <Users size={48} />
                      <h3>No employees found</h3>
                      <p>Try adjusting your search or filter criteria.</p>
                    </div>
                  ) : (
                    filteredUsers.map((employee) => {
                      const totalBalance = (parseInt(employee.leaveBalance?.casual) || 0) +
                                         (parseInt(employee.leaveBalance?.sick) || 0) +
                                         (parseInt(employee.leaveBalance?.earned) || 0);
                      return (
                        <div key={employee._id} className="hr-member-card">
                          <div className="hr-member-header">
                            <div className="hr-member-avatar">
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hr-member-info">
                              <div className="hr-member-name">{employee.name}</div>
                              <div className="hr-member-email">{employee.email}</div>
                              <span className={`hr-role-badge ${employee.role}`}>
                                {employee.role}
                              </span>
                            </div>
                          </div>
                          <div className="hr-member-balance">
                            <div className="hr-balance-total">
                              <span className="hr-balance-number">{totalBalance}</span>
                              <span className="hr-balance-label">Total Leave Days</span>
                            </div>
                            <div className="hr-balance-details">
                              <div className="hr-balance-item">
                                <span className="hr-balance-type">Casual</span>
                                <span className="hr-balance-count">{employee.leaveBalance?.casual || 0}</span>
                              </div>
                              <div className="hr-balance-item">
                                <span className="hr-balance-type">Sick</span>
                                <span className="hr-balance-count">{employee.leaveBalance?.sick || 0}</span>
                              </div>
                              <div className="hr-balance-item">
                                <span className="hr-balance-type">Earned</span>
                                <span className="hr-balance-count">{employee.leaveBalance?.earned || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activeTab === 'requests' && (
              <>
                <div className="hr-content-header">
                  <h1 className="hr-content-title">Leave Requests</h1>
                  <p className="hr-content-subtitle">
                    Review and manage employee leave requests. Approve or reject pending applications.
                  </p>
                </div>

                <div className="hr-requests-list">
                  {leaves.length === 0 ? (
                    <div className="hr-empty-state">
                      <Clock size={48} />
                      <h3>No leave requests</h3>
                      <p>All caught up! No pending leave requests at the moment.</p>
                    </div>
                  ) : (
                    leaves.map((leave) => {
                      const employee = users.find((u) => u._id === leave.userId);
                      const isPending = leave.status === 'pending' || (leave.requiredApprovals && leave.requiredApprovals.length > 0);
                      
                      return (
                        <div key={leave._id} className="hr-request-card">
                          <div className="hr-request-header">
                            <div className="hr-request-user">
                              <div className="hr-request-avatar">
                                {employee?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="hr-request-info">
                                <div className="hr-request-name">{employee?.name || 'Unknown User'}</div>
                                <div className="hr-request-type">{leave.type} leave</div>
                              </div>
                            </div>
                            <div className={`hr-request-status ${isPending ? 'pending' : leave.status}`}>
                              {isPending ? 'pending' : leave.status}
                            </div>
                          </div>
                          
                          <div className="hr-request-details">
                            <div className="hr-request-dates">
                              <div className="hr-date-item">
                                <span className="hr-date-label">From</span>
                                <span className="hr-date-value">
                                  {new Date(leave.from).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="hr-date-item">
                                <span className="hr-date-label">To</span>
                                <span className="hr-date-value">
                                  {new Date(leave.to).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="hr-date-item">
                                <span className="hr-date-label">Duration</span>
                                <span className="hr-date-value">
                                  {Math.ceil((new Date(leave.to) - new Date(leave.from)) / (1000 * 60 * 60 * 24)) + 1} days
                                </span>
                              </div>
                            </div>
                            
                            {leave.reason && (
                              <div className="hr-request-reason">
                                <span className="hr-reason-label">Reason:</span>
                                <span className="hr-reason-text">{leave.reason}</span>
                              </div>
                            )}
                          </div>

                          {isPending && (
                            <div className="hr-request-actions">
                              <button
                                className="hr-action-btn approve"
                                onClick={() => handleAction(leave._id, 'approved')}
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button
                                className="hr-action-btn reject"
                                onClick={() => handleAction(leave._id, 'rejected')}
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activeTab === 'apply' && (
              <>
                <div className="hr-content-header">
                  <h1 className="hr-content-title">Apply for Leave</h1>
                  <p className="hr-content-subtitle">
                    Submit your leave application. Your request will be processed according to company policy.
                  </p>
                </div>
                <ApplyLeaveForm userId={user._id} onLeaveApplied={fetchData} />
              </>
            )}

            {activeTab === 'history' && (
              <>
                <div className="hr-content-header">
                  <h1 className="hr-content-title">My Leave History</h1>
                  <p className="hr-content-subtitle">
                    View your personal leave application history and current balance.
                  </p>
                </div>

                <div className="hr-history-container">
                  <div className="hr-balance-card">
                    <div className="hr-balance-header">
                      <User className="hr-balance-icon" />
                      <h3>Current Leave Balance</h3>
                    </div>
                    <div className="hr-balance-grid">
                      <div className="hr-balance-item-large casual">
                        <span className="hr-balance-number">{user.leaveBalance?.casual || 0}</span>
                        <span className="hr-balance-label">Casual Leave</span>
                      </div>
                      <div className="hr-balance-item-large sick">
                        <span className="hr-balance-number">{user.leaveBalance?.sick || 0}</span>
                        <span className="hr-balance-label">Sick Leave</span>
                      </div>
                      <div className="hr-balance-item-large earned">
                        <span className="hr-balance-number">{user.leaveBalance?.earned || 0}</span>
                        <span className="hr-balance-label">Earned Leave</span>
                      </div>
                    </div>
                  </div>

                  <div className="hr-history-list">
                    {leaves.length === 0 ? (
                      <div className="hr-empty-state">
                        <Calendar size={48} />
                        <h3>No leave history</h3>
                        <p>You haven't applied for any leaves yet.</p>
                      </div>
                    ) : (
                      leaves.map((leave, idx) => (
                        <div key={idx} className="hr-history-item">
                          <div className="hr-history-header">
                            <div className="hr-history-type">
                              <Calendar size={16} />
                              {leave.type} leave
                            </div>
                            <div className={`hr-history-status ${leave.status}`}>
                              {leave.requiredApprovals && leave.requiredApprovals.length === 0 ? 'approved' : leave.status}
                            </div>
                          </div>
                          <div className="hr-history-dates">
                            {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                          </div>
                          {leave.reason && (
                            <div className="hr-history-reason">{leave.reason}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}