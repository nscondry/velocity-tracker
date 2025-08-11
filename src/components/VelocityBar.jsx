import React from 'react';

function VelocityBar({ hours, maxHours, weekNumber, dateRange }) {
  const height = hours > 0 ? Math.max(4, (hours / maxHours) * 100) : 2;
  const isZero = hours === 0;
  
  const tooltipText = dateRange 
    ? `${dateRange.description}: ${hours.toFixed(1)}h`
    : `Week ${weekNumber}: ${hours.toFixed(1)}h`;

  return (
    <div className="velocity-bar-container">
      <div className="bar-hours-label">
        {hours > 0 ? hours.toFixed(1) : '0'}
      </div>
      <div
        className={`velocity-bar ${isZero ? 'zero' : ''}`}
        style={{
          height: `${height}%`,
          backgroundColor: isZero ? '#e2e8f0' : undefined
        }}
      >
        <div className="bar-tooltip">
          {tooltipText}
        </div>
      </div>
    </div>
  );
}

export default VelocityBar; 