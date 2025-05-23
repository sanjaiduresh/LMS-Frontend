import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../../api";
import "./TeamsManagement.css";

export default function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [allManagers, setAllManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reassignModal, setReassignModal] = useState({
    show: false,
    employee: null,
    newManagerId: ""
  });

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/teams`),
        axios.get(`${API_URL}/admin/users`)
      ]);

      setTeams(teamsRes.data.teams);
      setUnassignedEmployees(teamsRes.data.unassignedEmployees);
      
      // Filter managers for reassignment dropdown
      const managers = usersRes.data.filter(user => 
        user.role === "manager"
      );
      setAllManagers(managers);
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch teams data:", err);
      setError("Failed to load teams data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const handleReassignManager = async () => {
    if (!reassignModal.employee || !reassignModal.newManagerId) return;

    try {
      await axios.put(
        `${API_URL}/admin/user/${reassignModal.employee._id}/manager`,
        { managerId: reassignModal.newManagerId }
      );

      alert("Manager assignment updated successfully!");
      setReassignModal({ show: false, employee: null, newManagerId: "" });
      fetchTeamsData(); // Refresh data
    } catch (err) {
      console.error("Failed to reassign manager:", err);
      alert("Failed to update manager assignment.");
    }
  };

  const openReassignModal = (employee) => {
    setReassignModal({
      show: true,
      employee,
      newManagerId: ""
    });
  };

  if (loading) {
    return <div className="loading">Loading teams...</div>;
  }

  return (
    <div className="teams-container">
      <header className="teams-header">
        <h2>Team Management</h2>
        <button onClick={fetchTeamsData} className="refresh-btn">
          🔄 Refresh
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Teams Section */}
      <section className="teams-section">
        <h3>Teams ({teams.length})</h3>
        {teams.length === 0 ? (
          <div className="no-data">No teams found. Create managers and assign employees.</div>
        ) : (
          <div className="teams-grid">
            {teams.map((team) => (
              <div key={team.manager._id} className="team-card">
                <div className="team-header">
                  <div className="manager-info">
                    <h4>👤 {team.manager.name}</h4>
                    <span className="role-badge manager">{team.manager.role}</span>
                    <p className="email">{team.manager.email}</p>
                  </div>
                  <div className="team-stats">
                    <span className="member-count">
                      {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="team-members">
                  <h5>Team Members:</h5>
                  {team.members.length === 0 ? (
                    <p className="no-members">No team members assigned</p>
                  ) : (
                    <div className="members-list">
                      {team.members.map((member) => (
                        <div key={member._id} className="member-item">
                          <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-email">{member.email}</span>
                          </div>
                          <div className="member-actions">
                            <button
                              className="reassign-btn"
                              onClick={() => openReassignModal(member)}
                              title="Reassign to different manager"
                            >
                              ↔️
                            </button>
                          </div>
                          <div className="leave-balance">
                            <small>
                              C:{member.leaveBalance?.casual || 0} | 
                              S:{member.leaveBalance?.sick || 0} | 
                              E:{member.leaveBalance?.earned || 0}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unassigned Employees Section */}
      {unassignedEmployees.length > 0 && (
        <section className="unassigned-section">
          <h3>⚠️ Unassigned Employees ({unassignedEmployees.length})</h3>
          <div className="unassigned-list">
            {unassignedEmployees.map((employee) => (
              <div key={employee._id} className="unassigned-item">
                <div className="employee-info">
                  <span className="employee-name">{employee.name}</span>
                  <span className="employee-email">{employee.email}</span>
                </div>
                <button
                  className="assign-btn"
                  onClick={() => openReassignModal(employee)}
                >
                  Assign Manager
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reassign Manager Modal */}
      {reassignModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reassign Manager</h3>
              <button
                className="close-modal-btn"
                onClick={() => setReassignModal({ show: false, employee: null, newManagerId: "" })}
              >
                ✖
              </button>
            </div>

            <div className="modal-body">
              <p>
                <strong>Employee:</strong> {reassignModal.employee?.name}
              </p>
              
              <div className="form-group">
                <label htmlFor="newManager">Select New Manager:</label>
                <select
                  id="newManager"
                  value={reassignModal.newManagerId}
                  onChange={(e) => setReassignModal({
                    ...reassignModal,
                    newManagerId: e.target.value
                  })}
                  required
                >
                  <option value="">Choose a manager...</option>
                  {allManagers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setReassignModal({ show: false, employee: null, newManagerId: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignManager}
                disabled={!reassignModal.newManagerId}
                className="confirm-btn"
              >
                Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}