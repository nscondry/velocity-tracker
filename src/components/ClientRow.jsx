import React from 'react';
import VelocityBar from './VelocityBar.jsx';

function ClientRow({ client, maxVelocity, dateRanges, rank }) {
  const { name, avg_velocity, weekly_hours } = client;
  
  // Get velocity color based on performance
  const getVelocityColor = (velocity) => {
    if (velocity === 0) return '#64748b';
    if (velocity >= maxVelocity * 0.8) return '#059669'; // High performer
    if (velocity >= maxVelocity * 0.5) return '#3b82f6'; // Medium performer
    return '#f59e0b'; // Low performer
  };

  return (
    <div className="client-row">
      <div className="client-info">
        <div className="client-name">
          #{rank} {name}
        </div>
        <div 
          className="client-velocity"
          style={{ color: getVelocityColor(avg_velocity) }}
        >
          {avg_velocity.toFixed(1)}h/week average
        </div>
      </div>
      
      <div className="velocity-bars">
        {weekly_hours.map((hours, index) => (
          <VelocityBar
            key={index}
            hours={hours}
            maxHours={Math.max(...weekly_hours, 1)}
            weekNumber={index + 1}
            dateRange={dateRanges?.[index]}
          />
        ))}
      </div>
    </div>
  );
}

export default ClientRow; 