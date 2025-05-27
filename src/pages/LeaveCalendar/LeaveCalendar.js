import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, Clock } from 'lucide-react';

export default function LeaveCalendar({ leaves = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredLeave, setHoveredLeave] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const processedLeaves = useMemo(() => (
    leaves.map((lv) => ({
      ...lv,
      fromDate: new Date(lv.from),
      toDate: new Date(lv.to),
      createdDate: new Date(lv.createdAt),
    }))
  ), [leaves]);

  const getLeavesForDate = (date) => {
    const dayStart = new Date(date); 
    dayStart.setHours(0, 0, 0, 0);
    return processedLeaves.filter((lv) => {
      const from = new Date(lv.fromDate); 
      from.setHours(0, 0, 0, 0);
      const to = new Date(lv.toDate); 
      to.setHours(0, 0, 0, 0);
      return dayStart >= from && dayStart <= to;
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#666666';
    }
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

  const calendarDays = useMemo(() => {
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    const first = new Date(y, m, 1);
    const prefix = first.getDay();
    const daysCnt = new Date(y, m + 1, 0).getDate();

    return [
      ...Array(prefix).fill(null),
      ...Array.from({ length: daysCnt }, (_, i) => new Date(y, m, i + 1)),
    ];
  }, [currentDate]);

  const kpiApproved = processedLeaves.filter((l) => l.status.toLowerCase() === 'approved').length;
  const kpiRejected = processedLeaves.filter((l) => l.status.toLowerCase() === 'rejected').length;
  const kpiPending = processedLeaves.filter((l) => l.status.toLowerCase() === 'pending').length;

  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #333333',
      borderRadius: '12px',
      padding: '20px',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid #333333'
      }}>
        <h3 style={{ 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          <Calendar size={18} />
          Team Leave Calendar
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              background: 'none',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.background = 'rgba(139, 92, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#333333';
              e.target.style.background = 'none';
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            minWidth: '140px',
            textAlign: 'center'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <button
            onClick={() => navigateMonth(1)}
            style={{
              background: 'none',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.background = 'rgba(139, 92, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#333333';
              e.target.style.background = 'none';
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend & KPIs in one row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {['approved', 'rejected', 'pending'].map((status) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(status)
              }} />
              <span style={{ 
                fontSize: '12px', 
                color: '#b3b3b3',
                textTransform: 'capitalize'
              }}>
                {status}
              </span>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <span style={{ color: '#22c55e' }}>✓ {kpiApproved}</span>
          <span style={{ color: '#ef4444' }}>✗ {kpiRejected}</span>
          <span style={{ color: '#f59e0b' }}>⏳ {kpiPending}</span>
          <span style={{ color: '#b3b3b3' }}>Total: {processedLeaves.length}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        background: '#333333',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              background: '#1a1a1a',
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '600',
              color: '#b3b3b3',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={idx}
                style={{
                  background: '#0d0d0d',
                  minHeight: '32px'
                }}
              />
            );
          }

          const dayLeaves = getLeavesForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              style={{
                background: isToday ? '#1a1a2e' : '#1e1e1e',
                minHeight: '32px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: dayLeaves.length > 0 ? 'pointer' : 'default',
                position: 'relative',
                border: isToday ? '1px solid #8b5cf6' : 'none'
              }}
              onMouseEnter={() => dayLeaves.length && setHoveredLeave({ date: day, leaves: dayLeaves })}
              onMouseLeave={() => setHoveredLeave(null)}
            >
              <span style={{
                fontSize: '12px',
                fontWeight: isToday ? '600' : '400',
                color: isToday ? '#8b5cf6' : '#ffffff',
                marginBottom: '2px'
              }}>
                {day.getDate()}
              </span>

              {dayLeaves.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayLeaves.slice(0, 3).map((leave, i) => (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(leave.status)
                      }}
                    />
                  ))}
                  {dayLeaves.length > 3 && (
                    <span style={{ 
                      fontSize: '8px', 
                      color: '#b3b3b3',
                      fontWeight: '600'
                    }}>
                      +{dayLeaves.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredLeave && (
        <div style={{
          position: 'fixed',
          background: '#0d0d0d',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          minWidth: '250px',
          maxWidth: '350px',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            <Calendar size={12} />
            {formatDate(hoveredLeave.date)}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hoveredLeave.leaves.map((leave, i) => (
              <div
                key={i}
                style={{
                  background: '#1a1a1a',
                  padding: '8px',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${getStatusColor(leave.status)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: getStatusColor(leave.status),
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {leave.status}
                  </span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#b3b3b3', lineHeight: '1.4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <User size={10} />
                    <span style={{ color: '#ffffff', fontWeight: '500' }}>
                      {leave.userName || leave.userId}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <Clock size={10} />
                    {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                  </div>
                  
                  <div style={{ marginTop: '4px' }}>
                    <strong style={{ color: '#ffffff' }}>Type:</strong> {leave.type}
                  </div>
                  
                  {leave.reason && (
                    <div style={{ marginTop: '2px' }}>
                      <strong style={{ color: '#ffffff' }}>Reason:</strong> {leave.reason}
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