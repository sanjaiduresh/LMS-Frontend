import React, { useState } from 'react';
import axios from 'axios';

import API_URL from '../api';
import '../styles/ApplyLeave.css';
import { LeaveBalance, Leave } from '../types';

interface ApplyLeaveProps {
  userId: string;
  onLeaveApplied: () => void;
  existingLeaves: Leave[];
}

export default function ApplyLeave({ userId, onLeaveApplied, existingLeaves }: ApplyLeaveProps) {
  const [type, setType] = useState<keyof LeaveBalance>('casual');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as yyyy-mm-dd
  };

  const getLeaveDateSet = (): Set<string> => {
    const dateSet = new Set<string>();

    existingLeaves.forEach((leave) => {
      const fromDate = new Date(leave.from);
      const toDate = new Date(leave.to);
      let current = new Date(fromDate);
      while (current <= toDate) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          dateSet.add(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return dateSet;
  };

  const handleApply = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const today = new Date(getTodayDate());

    if (fromDate < today || toDate < today) {
      setMessage('❌ You cannot select past dates for leave.');
      return;
    }

    if (fromDate > toDate) {
      setMessage("❌ 'From Date' cannot be after 'To Date'.");
      return;
    }

    // Count only weekdays
    let weekdayCount = 0;
    let tempDate = new Date(fromDate);
    const requestedDates: string[] = [];
    while (tempDate <= toDate) {
      const day = tempDate.getDay();
      if (day !== 0 && day !== 6) {
        weekdayCount++;
        requestedDates.push(tempDate.toISOString().split('T')[0]);
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    if (weekdayCount === 0) {
      setMessage('❌ Leave period falls entirely on weekends. Please choose weekdays.');
      return;
    }

    // Check for conflict with existing leaves
    const existingLeaveDates = getLeaveDateSet();
    const hasConflict = requestedDates.some((date) => existingLeaveDates.has(date));

    if (hasConflict) {
      setMessage('❌ You have already applied for leave on one or more of these dates.');
      return;
    }

    try {
      await axios.post(`${API_URL}/apply-leave`, {
        userId,
        type,
        from,
        to,
        status: 'pending' as const,
        reason,
        validDays: weekdayCount,
      });

      setMessage(`✅ Leave Applied for ${weekdayCount} working day(s)!`);
      onLeaveApplied();
      setShowModal(false);
      setFrom('');
      setTo('');
      setReason('');
    } catch (err: any) {
      setMessage('❌ Failed to apply leave.');
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
              <select
                value={type}
                onChange={(e) => setType(e.target.value as keyof LeaveBalance)}
                aria-label="Select leave type"
              >
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
                aria-label="Select start date for leave"
              />

              <label>To Date:</label>
              <input
                type="date"
                min={getTodayDate()}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                aria-label="Select end date for leave"
              />

              <label>Reason:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for your leave"
                rows={3}
                required
                aria-label="Enter reason for leave"
              />

              <button type="submit" aria-label="Submit leave application">
                Submit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setMessage('');
                  setFrom('');
                  setTo('');
                  setReason('');
                }}
                aria-label="Cancel leave application"
              >
                Cancel
              </button>

              {message && (
                <p className="message" role="alert">
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}