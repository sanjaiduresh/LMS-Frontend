import React, { useState } from "react";
import axios from "axios";
import "../styles/ApplyLeave.css";

const ApplyLeave = ({ userId , onLeaveApplied}) => {
  const [type, setType] = useState("casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/apply-leave", {
        userId,
        type,
        from,
        to,
        status:"pending",
        reason,
      });
      setMessage("✅ Leave Applied Successfully!");
      onLeaveApplied();
      setShowModal(false);
      setFrom("");
      setTo("");
      setReason("");
    } catch (err) {
      setMessage("❌ Failed to apply leave.");
    }
  };

  return (
    <div className="apply-leave">
      <button onClick={() => setShowModal(true)} className="open-button">
        Apply for Leave
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Apply for Leave</h2>
            <form onSubmit={handleApply}>
              <label>Leave Type:</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="earned">Earned</option>
              </select>

              <label>From Date:</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />

              <label>To Date:</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />

              <label>Reason:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for your leave"
                rows="3"
                required
              />

              <button type="submit">Submit</button>
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

export default ApplyLeave;
