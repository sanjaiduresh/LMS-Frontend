import React, { useState } from "react";
import axios from "axios";
import API_URL from "../api";
import "../styles/ApplyLeave.css";

const ApplyLeave = ({ userId, onLeaveApplied, existingLeaves }) => {
  const [type, setType] = useState("casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format as yyyy-mm-dd
  };

  const getLeaveDateSet = () => {
    const dateSet = new Set();

    existingLeaves.forEach((leave) => {
      const from = new Date(leave.from);
      const to = new Date(leave.to);
      let current = new Date(from);
      while (current <= to) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          dateSet.add(current.toISOString().split("T")[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return dateSet;
  };

  const handleApply = async (e) => {
    e.preventDefault();

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const today = new Date(getTodayDate());

    if (fromDate < today || toDate < today) {
      setMessage("❌ You cannot select past dates for leave.");
      return;
    }

    if (fromDate > toDate) {
      setMessage("❌ 'From Date' cannot be after 'To Date'.");
      return;
    }

    // Count only weekdays
    let weekdayCount = 0;
    let tempDate = new Date(fromDate);
    const requestedDates = [];
    while (tempDate <= toDate) {
      const day = tempDate.getDay();
      if (day !== 0 && day !== 6) {
        weekdayCount++;
        requestedDates.push(tempDate.toISOString().split("T")[0]);
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    if (weekdayCount === 0) {
      setMessage(
        "❌ Leave period falls entirely on weekends. Please choose weekdays."
      );
      return;
    }

    // Check for conflict with existing leaves
    const existingLeaveDates = getLeaveDateSet();
    const hasConflict = requestedDates.some((date) =>
      existingLeaveDates.has(date)
    );

    if (hasConflict) {
      setMessage(
        "❌ You have already applied for leave on one or more of these dates."
      );
      return;
    }

    try {
      await axios.post(`${API_URL}/apply-leave`, {
        userId,
        type,
        from,
        to,
        status: "pending",
        reason,
        validDays: weekdayCount,
      });

      setMessage(`✅ Leave Applied for ${weekdayCount} working day(s)!`);
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
                min={getTodayDate()}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />

              <label>To Date:</label>
              <input
                type="date"
                min={getTodayDate()}
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
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                  setFrom("");
                  setTo("");
                  setReason("");
                }}
              >
                Cancel
              </button>

              {message && <p>{message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
