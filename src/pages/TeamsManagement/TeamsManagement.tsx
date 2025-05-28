import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../api';
import './TeamsManagement.css';
import { User } from '../../types';

interface Team {
  _id: string;
  manager: User;
  members: User[];
  memberCount: number;
}

interface ReassignModal {
  show: boolean;
  employee: User | null;
  newManagerId: string;
}

export default function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<User[]>([]);
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'large' | 'small' | 'empty'>('all');
  const [reassignModal, setReassignModal] = useState<ReassignModal>({
    show: false,
    employee: null,
    newManagerId: ''
  });

  const fetchTeamsData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([
        axios.get<{ teams: Team[]; unassignedEmployees: User[] }>(`${API_URL}/teams`),
        axios.get<User[]>(`${API_URL}/users`)
      ]);

      setTeams(teamsRes.data.teams);
      setUnassignedEmployees(teamsRes.data.unassignedEmployees);

      // Filter managers for reassignment dropdown
      const managers = usersRes.data.filter((user) => user.role === 'manager');
      setAllManagers(managers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching teams data:', err);
      setError('Failed to load teams data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const handleReassignManager = async (): Promise<void> => {
    if (!reassignModal.employee || !reassignModal.newManagerId) return;

    try {
      await axios.put(
        `${API_URL}/user/${reassignModal.employee?._id}/manager`,
        { managerId: reassignModal.newManagerId }
      );

      alert('Manager assignment updated successfully!');
      setReassignModal({ show: false, employee: null, newManagerId: '' });
      fetchTeamsData();
    } catch (err: any) {
      console.error('Failed to reassign manager:', err);
      alert('Failed to update manager assignment.');
    }
  };

  const openReassignModal = (employee: User): void => {
    setReassignModal({
      show: true,
      employee,
      newManagerId: ''
    });
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = (
      team.manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.members.some(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'large') return matchesSearch && team.memberCount >= 5;
    if (filterStatus === 'small') return matchesSearch && team.memberCount < 5;
    if (filterStatus === 'empty') return matchesSearch && team.memberCount === 0;

    return matchesSearch;
  });

  const filteredUnassigned = unassignedEmployees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTotalMembers = () => {
    return teams.reduce((sum, team) => sum + team.memberCount, 0);
  };

  if (loading) {
    return <div className="md-loading">Loading teams...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="md-container">
      <div className="md-teams-container">
        {/* Header */}
        <div className="md-content-header">
          <div className="md-header-main">
            <h1 className="md-content-title">Team Management</h1>
            <p className="md-content-subtitle">
              Manage team assignments and organizational structure
            </p>
          </div>
          <button onClick={fetchTeamsData} className="md-refresh-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Overview */}
        <div className="md-stats-overview">
          <div className="md-stats-card">
            <div className="md-stat-main">
              <span className="md-stat-number">{teams.length}</span>
              <span className="md-stat-label">Active Teams</span>
            </div>
            <div className="md-stat-breakdown">
              <div className="md-stat-item">
                <span className="md-stat-type">Members</span>
                <span className="md-stat-value">{getTotalMembers()}</span>
              </div>
              <div className="md-stat-item">
                <span className="md-stat-type">Managers</span>
                <span className="md-stat-value">{allManagers.length}</span>
              </div>
              <div className="md-stat-item">
                <span className="md-stat-type">Unassigned</span>
                <span className="md-stat-value">{unassignedEmployees.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="md-filters">
          <div className="md-search-group">
            <svg className="md-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              className="md-search-input"
              placeholder="Search teams, managers, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md-filter-group">
            <svg className="md-filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"/>
            </svg>
            <select
              className="md-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'large' | 'small' | 'empty')}
            >
              <option value="all">All Teams</option>
              <option value="large">Large Teams (5+ members)</option>
              <option value="small">Small Teams (&lt;5 members)</option>
              <option value="empty">Empty Teams</option>
            </select>
          </div>
        </div>

        {/* Teams Grid */}
        <section className="md-teams-section">
          <div className="md-section-header">
            <h3 className="md-section-title">
              Teams ({filteredTeams.length})
            </h3>
          </div>
          
          {filteredTeams.length === 0 ? (
            <div className="md-empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <h3>No teams found</h3>
              <p>Create managers and assign employees to get started</p>
            </div>
          ) : (
            <div className="md-team-grid">
              {filteredTeams.map((team) => (
                <div key={team.manager._id} className="md-team-card">
                  <div className="md-team-header">
                    <div className="md-manager-section">
                      <div className="md-manager-avatar">
                        {getInitials(team.manager.name)}
                      </div>
                      <div className="md-manager-info">
                        <h4 className="md-manager-name">{team.manager.name}</h4>
                        <span className="md-manager-role">{team.manager.role}</span>
                        <p className="md-manager-email">{team.manager.email}</p>
                      </div>
                    </div>
                    <div className="md-team-stats">
                      <div className="md-member-count">
                        <span className="md-count-number">{team.memberCount}</span>
                        <span className="md-count-label">
                          {team.memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md-team-members">
                    <h5 className="md-members-title">Team Members</h5>
                    {team.members.length === 0 ? (
                      <div className="md-no-members">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                        <span>No members assigned</span>
                      </div>
                    ) : (
                      <div className="md-members-list">
                        {team.members.map((member) => (
                          <div key={member._id} className="md-member-item">
                            <div className="md-member-avatar-small">
                              {getInitials(member.name)}
                            </div>
                            <div className="md-member-details">
                              <span className="md-member-name">{member.name}</span>
                              <span className="md-member-email">{member.email}</span>
                            </div>
                            <div className="md-leave-summary">
                              <div className="md-leave-item">
                                <span className="md-leave-type">C</span>
                                <span className="md-leave-count">{member.leaveBalance?.casual || 0}</span>
                              </div>
                              <div className="md-leave-item">
                                <span className="md-leave-type">S</span>
                                <span className="md-leave-count">{member.leaveBalance?.sick || 0}</span>
                              </div>
                              <div className="md-leave-item">
                                <span className="md-leave-type">E</span>
                                <span className="md-leave-count">{member.leaveBalance?.earned || 0}</span>
                              </div>
                            </div>
                            <button
                              className="md-reassign-btn"
                              onClick={() => openReassignModal(member)}
                              title="Reassign to different manager"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                              </svg>
                            </button>
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
        {filteredUnassigned.length > 0 && (
          <section className="md-unassigned-section">
            <div className="md-section-header">
              <h3 className="md-section-title md-warning-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                Unassigned Employees ({filteredUnassigned.length})
              </h3>
            </div>
            <div className="md-unassigned-grid">
              {filteredUnassigned.map((employee) => (
                <div key={employee._id} className="md-unassigned-card">
                  <div className="md-unassigned-info">
                    <div className="md-employee-avatar">
                      {getInitials(employee.name)}
                    </div>
                    <div className="md-employee-details">
                      <span className="md-employee-name">{employee.name}</span>
                      <span className="md-employee-email">{employee.email}</span>
                    </div>
                  </div>
                  <button
                    className="md-assign-btn"
                    onClick={() => openReassignModal(employee)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Assign Manager
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reassign Manager Modal */}
        {reassignModal.show && (
          <div className="md-modal-overlay">
            <div className="md-modal-content">
              <div className="md-modal-header">
                <h3 className="md-modal-title">Reassign Manager</h3>
                <button
                  className="md-close-btn"
                  onClick={() => setReassignModal({ show: false, employee: null, newManagerId: '' })}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="md-modal-body">
                <div className="md-employee-preview">
                  <div className="md-preview-avatar">
                    {getInitials(reassignModal.employee?.name || '')}
                  </div>
                  <div className="md-preview-info">
                    <span className="md-preview-name">{reassignModal.employee?.name}</span>
                    <span className="md-preview-email">{reassignModal.employee?.email}</span>
                  </div>
                </div>
                
                <div className="md-form-group">
                  <label htmlFor="newManager" className="md-form-label">
                    Select New Manager
                  </label>
                  <select
                    id="newManager"
                    className="md-form-select"
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

              <div className="md-modal-footer">
                <button
                  type="button"
                  className="md-btn-secondary"
                  onClick={() => setReassignModal({ show: false, employee: null, newManagerId: '' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="md-btn-primary"
                  onClick={handleReassignManager}
                  disabled={!reassignModal.newManagerId}
                >
                  Update Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}