import React, { useEffect, useState, useCallback, useMemo, JSX } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import "./styles/Dashboard.css";
import ApplyLeave from "./Components/ApplyLeave";
import API_URL from "./api";
import { User, Leave, Role } from "./types";
const ALL_APPROVERS: Role[] = ["hr", "manager"];

export default function EmployeeDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeLeave, setActiveLeave] = useState<Leave | null>(null);

  const openDetails = (leave: Leave): void => {
    setActiveLeave(leave);
    setShowModal(true);
  };

  const closeDetails = (): void => {
    setActiveLeave(null);
    setShowModal(false);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ user: User; leaves: Leave[] }>(
        `${API_URL}/user/${id}`
      );
      setUser(res.data.user);
      setLeaves(res.data.leaves);
      setError("");
    } catch (err: any) {
      console.error("Failed to fetch user data", err);
      setError("Unable to load dashboard. Please login again.");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { pendingLeaves, historyLeaves } = useMemo(() => {
    const pending: Leave[] = [];
    const history: Leave[] = [];
    leaves.forEach((leave) =>
      (leave.status ?? "").toLowerCase() === "pending"
        ? pending.push(leave)
        : history.push(leave)
    );
    return { pendingLeaves: pending, historyLeaves: history };
  }, [leaves]);

  const cancelLeave = async (leaveId: string): Promise<void> => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await axios.delete(`${API_URL}/leave/${leaveId}`);
      fetchData();
    } catch (err: any) {
      alert(
        err.response?.data?.error || "Unable to cancel; please contact HR."
      );
    }
  };

  const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const renderRows = (arr: Leave[], allowCancel: boolean): JSX.Element => {
    if (arr.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="ed-empty-state">
            <div className="ed-empty-state-icon">📋</div>
            <div>No {activeTab} requests found</div>
          </td>
        </tr>
      );
    }

    return (
      <>
        {arr.map((leave) => (
          <tr key={leave._id}>
            <td>{leave.type}</td>
            <td>{new Date(leave.from).toLocaleDateString()}</td>
            <td>{new Date(leave.to).toLocaleDateString()}</td>
            <td className={`ed-status-${leave.status?.toLowerCase()}`}>
              {leave.status}
            </td>
            <td className="ed-actions-cell">
              <button
                className="ed-leave-action-button ed-details-button"
                onClick={() => openDetails(leave)}
                aria-label={`View details for ${leave.type} leave`}
              >
                Details
              </button>
              {allowCancel && (
                <button
                  className="ed-leave-action-button ed-cancel-button"
                  onClick={() => cancelLeave(leave._id)}
                  aria-label={`Cancel ${leave.type} leave request`}
                >
                  Cancel
                </button>
              )}
            </td>
          </tr>
        ))}
      </>
    );
  };

  if (loading) return <div className="ed-loading">Loading Dashboard…</div>;
  if (error) return <div className="ed-error">{error}</div>;
  if (!user) return null;

  const total =
    (user.leaveBalance?.casual ?? 0) +
    (user.leaveBalance?.sick ?? 0) +
    (user.leaveBalance?.earned ?? 0);

  return (
    <div className="ed-dashboard-container">
      <div className="ed-dashboard-header">
        <h2 className="ed-welcome-text">Welcome, {user.name}</h2>
        <button
          className="ed-logout-button"
          onClick={logout}
          aria-label="Log out"
        >
          Logout
        </button>
      </div>

      <div className="ed-dashboard-grid">
        <aside className="ed-dashboard-sidebar">
          <div className="ed-leave-summary">
            <h3>{total}</h3>
            <div>Total Leave Balance</div>

            <div className="ed-balance-grid">
              {(["Casual", "Sick", "Earned"] as const).map((label) => (
                <div key={label} className="ed-balance-item">
                  <div className="ed-label">{label}</div>
                  <div className="ed-value">
                    {user.leaveBalance?.[
                      label.toLowerCase() as "casual" | "sick" | "earned"
                    ] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ed-apply-leave-section">
            <ApplyLeave
              userId={user._id}
              onLeaveApplied={fetchData}
              existingLeaves={leaves}
            />
          </div>
        </aside>

        <main className="ed-dashboard-main">
          <div className="ed-status-tabs">
            <button
              className={`ed-tab-button ${
                activeTab === "pending" ? "ed-active" : ""
              }`}
              onClick={() => setActiveTab("pending")}
              aria-selected={activeTab === "pending"}
              role="tab"
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              className={`ed-tab-button ${
                activeTab === "history" ? "ed-active" : ""
              }`}
              onClick={() => setActiveTab("history")}
              aria-selected={activeTab === "history"}
              role="tab"
            >
              History ({historyLeaves.length})
            </button>
          </div>

          <section className="ed-card">
            <header className="ed-card-header">
              <h3>
                {activeTab === "pending" ? "Pending Requests" : "Leave History"}
              </h3>
            </header>

            <div className="ed-card-content">
              <table className="ed-leave-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
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

      {showModal && activeLeave && (
        <div
          className="ed-modal-overlay"
          onClick={closeDetails}
          role="dialog"
          aria-modal="true"
        >
          <div className="ed-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Approval Details</h3>
            <p>
              <strong>Approved by:</strong>{" "}
              {activeLeave.requiredApprovals?.length
                ? activeLeave.requiredApprovals
                    .filter((role) => !["hr", "manager"].includes(role))
                    .join(", ")
                    .toUpperCase() || "None"
                : "None"}
            </p>
            <p>
              <strong>Waiting for:</strong>{" "}
              {activeLeave.requiredApprovals?.length
                ? ALL_APPROVERS.filter((role) =>
                    activeLeave.requiredApprovals?.includes(role)
                  )
                    .join(", ")
                    .toUpperCase() || "Complete"
                : "Complete"}
            </p>
            <p>
              <strong>Leave Type:</strong> {activeLeave.type}
            </p>
            <p>
              <strong>Duration:</strong>{" "}
              {new Date(activeLeave.from).toLocaleDateString()} –{" "}
              {new Date(activeLeave.to).toLocaleDateString()}
            </p>
            {activeLeave.reason && (
              <p>
                <strong>Reason:</strong> {activeLeave.reason}
              </p>
            )}
            <button
              className="ed-close-button"
              onClick={closeDetails}
              aria-label="Close approval details"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
