import React from 'react';
import VelocityBar from './VelocityBar.jsx';

function ClientRow({ client, maxVelocity, dateRanges, rank }) {
  const { name, avg_velocity, monthly_hours, total_hours_pack, total_hours_used, total_hours_remaining, latest_project } = client;
  
  // Get velocity color based on performance
  const getVelocityColor = (velocity) => {
    if (velocity === 0) return '#64748b';
    if (velocity >= maxVelocity * 0.8) return '#059669'; // High performer
    if (velocity >= maxVelocity * 0.5) return '#3b82f6'; // Medium performer
    return '#f59e0b'; // Low performer
  };

  // Use the hours remaining from the API, fallback to calculation if not available
  const hoursRemaining = total_hours_remaining !== undefined ? total_hours_remaining : (total_hours_pack > 0 ? total_hours_pack - total_hours_used : 0);
  const packInfo = total_hours_pack > 0 ? `${total_hours_pack}h pack` : 'No pack';
  
  let packStatus = '';
  if (total_hours_pack > 0) {
    if (hoursRemaining > 0) {
      packStatus = `${hoursRemaining.toFixed(1)}h remaining`;
    } else {
      const overage = Math.abs(hoursRemaining);
      packStatus = `${overage.toFixed(1)}h overage`;
    }
  }

  return (
    <div className="client-row">
      <div className="client-info">
        <div className="client-name">
          #{rank} {name}
        </div>
        <div className="client-details">
          <div 
            className="client-velocity"
            style={{ color: getVelocityColor(avg_velocity) }}
          >
            {avg_velocity.toFixed(1)}h/month average
          </div>
          <div className="client-pack-info">
            <span className="pack-label">{packInfo}</span>
            {total_hours_pack > 0 && (
              <span className="remaining-label" style={{ 
                color: hoursRemaining > 0 ? '#059669' : '#dc2626' 
              }}>
                • {packStatus}
              </span>
            )}
            {latest_project && (
              <div className="project-source" style={{ 
                fontSize: '0.75rem', 
                color: '#64748b', 
                marginTop: '0.25rem',
                fontStyle: 'italic'
              }}>
                Based on: {latest_project.project_name}
                {latest_project.start_date && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    (started {new Date(latest_project.start_date).toLocaleDateString()})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="velocity-bars">
        {monthly_hours.map((hours, index) => (
          <VelocityBar
            key={index}
            hours={hours}
            maxHours={Math.max(...monthly_hours, 1)}
            monthNumber={index + 1}
            dateRange={dateRanges?.[index]}
          />
        ))}
      </div>
    </div>
  );
}

export default ClientRow; 