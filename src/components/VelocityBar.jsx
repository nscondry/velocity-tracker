import React from 'react';

function VelocityBar({ hours, maxHours, monthNumber, dateRange }) {
  // Calculate flex-grow based on hours relative to maxHours for this client
  // Use a minimum flex-grow of 0.05 (5%) for visibility, and scale up from there
  const flexGrow = hours > 0 ? Math.max(0.05, hours / maxHours) : 0.02;
  const isZero = hours === 0;
  
  const tooltipText = dateRange 
    ? `${dateRange.description}: ${hours.toFixed(1)}h`
    : `Month ${monthNumber}: ${hours.toFixed(1)}h`;

  return (
    <div className="velocity-bar-container">
      <div className="bar-hours-label">
        {hours > 0 ? hours.toFixed(1) : '0'}
      </div>
      <div
        className={`velocity-bar ${isZero ? 'zero' : ''}`}
        style={{
          flexGrow: flexGrow,
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