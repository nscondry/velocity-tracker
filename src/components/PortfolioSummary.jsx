import React from 'react';

function PortfolioSummary({ data }) {
  const { portfolio_velocity, clients, dateRanges } = data;
  const totalHours = portfolio_velocity * 8;
  const activeClients = clients.filter(client => client.avg_velocity > 0).length;

  return (
    <div className="portfolio-summary">
      <h2>📈 Portfolio Overview</h2>
      <div className="portfolio-stats">
        <div className="stat">
          <span className="stat-value">{portfolio_velocity.toFixed(1)}</span>
          <span className="stat-label">Hours/Week Average</span>
        </div>
        <div className="stat">
          <span className="stat-value">{totalHours.toFixed(0)}</span>
          <span className="stat-label">Total Hours (8 weeks)</span>
        </div>
        <div className="stat">
          <span className="stat-value">{clients.length}</span>
          <span className="stat-label">Total Clients</span>
        </div>
        <div className="stat">
          <span className="stat-value">{activeClients}</span>
          <span className="stat-label">Active Clients</span>
        </div>
      </div>
      
      {dateRanges && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
          <p>Data covers: {dateRanges[0]?.description} to {dateRanges[dateRanges.length - 1]?.description}</p>
        </div>
      )}
    </div>
  );
}

export default PortfolioSummary; 