import React, { useState, useEffect } from "react";
import axios from "axios";

const ApplyLeave = ({ userId }) => {
  const [type, setType] = useState("casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/apply-leave", {
        userId,
        type,
        from,
        to,
      });
      setMessage("✅ Leave Applied Successfully!");
    } catch (err) {
      setMessage("❌ Failed to apply leave.");
    }
  };

  return (
    <div className="apply-leave">
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

        <button type="submit">Apply Leave</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default ApplyLeave;
