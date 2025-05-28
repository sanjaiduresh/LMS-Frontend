import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Clock } from 'lucide-react';

import './LeaveCalendar.css';
import { LeaveCalendarProps, Leave, LeaveStatus } from '../../types';

// Interface for processed leave data with Date objects
interface ProcessedLeave extends Omit<Leave, 'from' | 'to' | 'createdAt'> {
  fromDate: Date;
  toDate: Date;
  createdDate: Date;
}

export default function LeaveCalendar({ leaves = [] }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hoveredLeave, setHoveredLeave] = useState<{ date: Date; leaves: ProcessedLeave[] } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: number): void => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const processedLeaves = useMemo<ProcessedLeave[]>(() =>
    leaves.map((leave:Leave) => ({
      ...leave,
      fromDate: new Date(leave.from),
      toDate: new Date(leave.to),
      createdDate: new Date(leave.createdAt || new Date()),
    })), [leaves]);

  const getLeavesForDate = (date: Date): ProcessedLeave[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    return processedLeaves.filter((leave) => {
      const from = new Date(leave.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(leave.toDate);
      to.setHours(0, 0, 0, 0);
      return dayStart >= from && dayStart <= to;
    });
  };

  const getStatusColor = (status: LeaveStatus): string => {
    switch (status.toLowerCase()) {
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#666666';
    }
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

  const calendarDays = useMemo<(Date | null)[]>(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const prefixDays = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array(prefixDays).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
  }, [currentDate]);

  const kpiApproved = processedLeaves.filter((leave) => leave.status.toLowerCase() === 'approved').length;
  const kpiRejected = processedLeaves.filter((leave) => leave.status.toLowerCase() === 'rejected').length;
  const kpiPending = processedLeaves.filter((leave) => leave.status.toLowerCase() === 'pending').length;

  return (
    <div className="lc-container">
      {/* Header */}
      <div className="lc-header">
        <h3 className="lc-title">
          <Calendar size={18} />
          Team Leave Calendar
        </h3>

        <div className="lc-month-nav">
          <button
            onClick={() => navigateMonth(-1)}
            className="lc-nav-btn"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="lc-month-label">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>

          <button
            onClick={() => navigateMonth(1)}
            className="lc-nav-btn"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend & KPIs */}
      <div className="lc-legend">
        <div className="lc-legend-items">
          {(['approved', 'rejected', 'pending'] as LeaveStatus[]).map((status) => (
            <div key={status} className="lc-legend-item">
              <div className={`lc-legend-dot lc-status-${status.toLowerCase()}`} />
              <span className="lc-legend-text">{status}</span>
            </div>
          ))}
        </div>

        <div className="lc-kpi">
          <span className="lc-kpi-approved">✓ {kpiApproved}</span>
          <span className="lc-kpi-rejected">✗ {kpiRejected}</span>
          <span className="lc-kpi-pending">⏳ {kpiPending}</span>
          <span className="lc-kpi-total">Total: {processedLeaves.length}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lc-grid">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div key={day} className="lc-day-header">{day}</div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="lc-day-empty" />;
          }

          const dayLeaves = getLeavesForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              className={`lc-day-cell ${isToday ? 'lc-day-today' : ''} ${dayLeaves.length > 0 ? 'lc-day-has-leaves' : ''}`}
              onMouseEnter={() => dayLeaves.length && setHoveredLeave({ date: day, leaves: dayLeaves })}
              onMouseLeave={() => setHoveredLeave(null)}
            >
              <span className="lc-day-number">{day.getDate()}</span>

              {dayLeaves.length > 0 && (
                <div className="lc-dots-wrapper">
                  {dayLeaves.slice(0, 3).map((leave, i) => (
                    <div
                      key={i}
                      className={`lc-dot lc-status-${leave.status.toLowerCase()}`}
                    />
                  ))}
                  {dayLeaves.length > 3 && (
                    <span className="lc-more">+{dayLeaves.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredLeave && (
        <div className="lc-tooltip">
          <div className="lc-tooltip-title">
            <Calendar size={12} />
            {formatDate(hoveredLeave.date)}
          </div>

          <div className="lc-tooltip-body">
            {hoveredLeave.leaves.map((leave, i) => (
              <div key={i} className={`lc-tooltip-item lc-status-${leave.status.toLowerCase()}`}>
                <div className="lc-tooltip-status">
                  <span className="lc-tooltip-status-text">{leave.status}</span>
                </div>

                <div className="lc-tooltip-info">
                  <div className="lc-tooltip-info-item">
                    <User size={10} />
                    <span className="lc-tooltip-info-name">{leave.userName || leave.userId}</span>
                  </div>

                  <div className="lc-tooltip-info-item">
                    <Clock size={10} />
                    {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                  </div>

                  <div className="lc-tooltip-info-detail">
                    <strong>Type:</strong> {leave.type}
                  </div>

                  {leave.reason && (
                    <div className="lc-tooltip-info-detail">
                      <strong>Reason:</strong> {leave.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}