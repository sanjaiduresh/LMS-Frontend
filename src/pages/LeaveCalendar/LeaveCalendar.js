import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, User, Clock,
} from 'lucide-react';
import './LeaveCalendar.css';

export default function LeaveCalendar({ leaves = [] }) {
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [hoveredLeave, setHoveredLeave] = useState(null);
//   const [leavesData, setLeavesData] = useState(leaves);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  /* ----------------------- data prep ------------------------------ */
  const processedLeaves = useMemo(() => (
    leaves.map((lv) => ({
      ...lv,
      fromDate:    new Date(lv.from),
      toDate:      new Date(lv.to),
      createdDate: new Date(lv.createdAt),
    }))
  ), [leaves]);

  const getLeavesForDate = (date) => {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    return processedLeaves.filter((lv) => {
      const from = new Date(lv.fromDate); from.setHours(0, 0, 0, 0);
      const to   = new Date(lv.toDate);   to.setHours(0, 0, 0, 0);
      return dayStart >= from && dayStart <= to;
    });
  };

  const getStatusColourClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'lc-status-approved';
      case 'rejected': return 'lc-status-rejected';
      case 'pending':  return 'lc-status-pending';
      default:         return 'lc-status-other';
    }
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

  /* ----------------------- calendar array ------------------------- */
  const calendarDays = useMemo(() => {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();

    const first   = new Date(y, m, 1);
    const prefix  = first.getDay();              // empty slots before 1st
    const daysCnt = new Date(y, m + 1, 0).getDate();

    return [
      ...Array(prefix).fill(null),
      ...Array.from({ length: daysCnt }, (_, i) => new Date(y, m, i + 1)),
    ];
  }, [currentDate]);

  /* ----------------------- KPI counters --------------------------- */
  const kpiApproved = processedLeaves.filter((l) => l.status.toLowerCase() === 'approved').length;
  const kpiRejected = processedLeaves.filter((l) => l.status.toLowerCase() === 'rejected').length;
  const kpiPending  = processedLeaves.filter((l) => l.status.toLowerCase() === 'pending').length;

  return (
    <div className="lc-container">
      {/* header */}
      <header className="lc-header">
        <h2 className="lc-title">
          <Calendar size={22} /> Leave Calendar
        </h2>

        <div className="lc-month-nav">
          <button className="lc-nav-btn" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="lc-month-label">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button className="lc-nav-btn" onClick={() => navigateMonth(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* legend */}
      <div className="lc-legend">
        {['approved', 'rejected', 'pending'].map((st) => (
          <div key={st} className="lc-legend-item">
            <span className={`lc-legend-dot ${getStatusColourClass(st)}`} />
            <span className="lc-legend-text">{st}</span>
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="lc-grid">
        {dayNames.map((d) => (
          <div key={d} className="lc-day-header">{d}</div>
        ))}

        {calendarDays.map((day, idx) => {
          if (!day) return <div key={idx} className="lc-day-empty" />;

          const items   = getLeavesForDate(day);
          const isToday = day.toDateString() === (new Date()).toDateString();

          return (
            <div
              key={idx}
              className={`lc-day-cell ${isToday ? 'lc-day-today' : ''}`}
              onMouseEnter={() => items.length && setHoveredLeave({ date: day, leaves: items })}
              onMouseLeave={() => setHoveredLeave(null)}
            >
              <span className="lc-day-number">{day.getDate()}</span>

              {items.length > 0 && (
                <div className="lc-dots-wrapper">
                  {items.slice(0, 2).map((lv, i) => (
                    <span
                      key={i}
                      className={`lc-dot ${getStatusColourClass(lv.status)}`}
                    />
                  ))}
                  {items.length > 2 && (
                    <span className="lc-more">+{items.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* tooltip */}
      {hoveredLeave && (
        <div className="lc-tooltip">
          <h4 className="lc-tooltip-title">
            <Calendar size={14} /> {formatDate(hoveredLeave.date)}
          </h4>
          <div className="lc-tooltip-body">
            {hoveredLeave.leaves.map((lv, i) => (
              <div key={i} className="lc-tooltip-item">
                <div className="lc-tooltip-status">
                  <span className={`lc-dot ${getStatusColourClass(lv.status)}`} />
                  <span className="lc-tooltip-status-text">{lv.status}</span>
                </div>
                <div className="lc-tooltip-info">
                  <div><User size={12}/> {lv.userId}</div>
                  <div><Clock size={12}/> {formatDate(lv.fromDate)} - {formatDate(lv.toDate)}</div>
                  <div><b>Type:</b> {lv.type}</div>
                  {lv.reason && <div><b>Reason:</b> {lv.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI bar */}
      <div className="lc-kpi-grid">
        {[
          { label: 'Approved', val: kpiApproved, cls: 'lc-kpi-approved' },
          { label: 'Rejected', val: kpiRejected, cls: 'lc-kpi-rejected' },
          { label: 'Pending',  val: kpiPending,  cls: 'lc-kpi-pending'  },
          { label: 'Total',    val: processedLeaves.length, cls: 'lc-kpi-total' },
        ].map((k) => (
          <div key={k.label} className={`lc-kpi-card ${k.cls}`}>
            <div className="lc-kpi-label">{k.label}</div>
            <div className="lc-kpi-value">{k.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
