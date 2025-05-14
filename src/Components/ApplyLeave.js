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
  
    const fromDate = new Date(from);
    const toDate = new Date(to);
  
    if (fromDate > toDate) {
      setMessage("❌ 'From Date' cannot be after 'To Date'");
      return;
    }
  
    // Count only weekdays
    let weekdayCount = 0;
    let tempDate = new Date(fromDate);
    while (tempDate <= toDate) {
      const day = tempDate.getDay(); // 0 = Sun, 6 = Sat
      if (day !== 0 && day !== 6) {
        weekdayCount++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
  
    if (weekdayCount === 0) {
      setMessage("❌ Leave period falls entirely on weekends. Please choose weekdays.");
      return;
    }
  
    try {
      await axios.post("http://localhost:8000/apply-leave", {
        userId,
        type,
        from,
        to,
        status: "pending",
        reason,
        validDays: weekdayCount, // Send this to backend
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
              {message && <p>{message}</p>}

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
