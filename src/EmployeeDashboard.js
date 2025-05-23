import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/Dashboard.css"; // uses the ed-* rules you received
import ApplyLeave from "./Components/ApplyLeave";
import API_URL from "./api";

export default function Dashboard() {
  /* ------------------------------------------------------------------ */
  /* State & helpers                                                    */
  /* ------------------------------------------------------------------ */
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ----- details modal --------------------------------------------- */
  const [showModal, setShowModal] = useState(false);
  const [activeLeave, setActiveLeave] = useState(null);

  const openDetails = (lv) => {
    setActiveLeave(lv);
    setShowModal(true);
  };
  const closeDetails = () => {
    setActiveLeave(null);
    setShowModal(false);
  };

  /* ----- fetch user & leave data ----------------------------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/user/${id}`);
      setUser(res.data.user);
      setLeaves(res.data.leaves);
      setError("");
    } catch (err) {
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

  /* ------------------------------------------------------------------ */
  /* Derived arrays                                                     */
  /* ------------------------------------------------------------------ */
  const { pendingLeaves, historyLeaves } = useMemo(() => {
    const pending = [];
    const history = [];
    leaves.forEach((l) =>
      (l.status ?? "").toLowerCase() === "pending"
        ? pending.push(l)
        : history.push(l)
    );
    return { pendingLeaves: pending, historyLeaves: history };
  }, [leaves]);

  /* ------------------------------------------------------------------ */
  /* Actions                                                            */
  /* ------------------------------------------------------------------ */
  const cancelLeave = async (leaveId) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await axios.delete(`${API_URL}/leave/${leaveId}`);
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.error || "Unable to cancel; please contact HR."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const renderRows = (arr, allowCancel) => {
    if (arr.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="ed-empty-state">
            <div className="ed-empty-state-icon">📋</div>
            <div>No {activeTab} requests found</div>
          </td>
        </tr>
      );
    }

    return arr.map((l) => (
      <tr key={l._id}>
        <td>{l.type}</td>
        <td>{new Date(l.from).toLocaleDateString()}</td>
        <td>{new Date(l.to).toLocaleDateString()}</td>
        <td className={`ed-status-${l.status?.toLowerCase()}`}>{l.status}</td>
        <td className="ed-actions-cell">
          <button
            className="ed-leave-action-button ed-details-button"
            onClick={() => openDetails(l)}
          >
            Details
          </button>
          {allowCancel && (
            <button
              className="ed-leave-action-button ed-cancel-button"
              onClick={() => cancelLeave(l._id)}
            >
              Cancel
            </button>
          )}
        </td>
      </tr>
    ));
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  if (loading) return <div className="ed-loading">Loading Dashboard…</div>;
  if (error) return <div className="ed-error">{error}</div>;
  if (!user) return null;

  const total =
    (parseInt(user.leaveBalance?.casual) || 0) +
    (parseInt(user.leaveBalance?.sick) || 0) +
    (parseInt(user.leaveBalance?.earned) || 0);

  return (
    <div className="ed-dashboard-container">
      {/* ---------- header ------------------------------------------- */}
      <div className="ed-dashboard-header">
        <h2 className="ed-welcome-text">Welcome, {user.name}</h2>
        <button className="ed-logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {/* ---------- grid layout -------------------------------------- */}
      <div className="ed-dashboard-grid">
        {/* ===== Sidebar ============================================ */}
        <aside className="ed-dashboard-sidebar">
          {/* Balance card */}
          <div className="ed-leave-summary">
            <h3>{total}</h3>
            <div>Total Leave Balance</div>

            <div className="ed-balance-grid">
              {["Casual", "Sick", "Earned"].map((lbl) => (
                <div key={lbl} className="ed-balance-item">
                  <div className="ed-label">{lbl}</div>
                  <div className="ed-value">
                    {user.leaveBalance?.[lbl.toLowerCase()] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply */}
          <div className="ed-apply-leave-section">
            <ApplyLeave
              userId={user._id}
              onLeaveApplied={fetchData}
              existingLeaves={leaves}
            />
          </div>
        </aside>

        {/* ===== Main panel ========================================= */}
        <main className="ed-dashboard-main">
          {/* Tabs */}
          <div className="ed-status-tabs">
            <button
              className={`ed-tab-button ${
                activeTab === "pending" ? "ed-active" : ""
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending&nbsp;({pendingLeaves.length})
            </button>
            <button
              className={`ed-tab-button ${
                activeTab === "history" ? "ed-active" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              History&nbsp;({historyLeaves.length})
            </button>
          </div>

          {/* Table card */}
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

      {/* ---------- Details modal ----------------------------------- */}
      {showModal && activeLeave && (
        <div className="ed-modal-overlay" onClick={closeDetails}>
          <div className="ed-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Approval Details</h3>
            {(() => {
              const ALL = ["hr", "manager"];
              const pending = activeLeave.requiredApprovals ?? [];
              const approved = ALL.filter((r) => !pending.includes(r));
              return (
                <Fragment>
                  <p>
                    <strong>Approved&nbsp;by:</strong>{" "}
                    {approved.length
                      ? approved.join(", ").toUpperCase()
                      : "None"}
                  </p>
                  <p>
                    <strong>Waiting&nbsp;for:</strong>{" "}
                    {pending.length
                      ? pending.join(", ").toUpperCase()
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
                </Fragment>
              );
            })()}
            <button className="ed-close-button" onClick={closeDetails}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
