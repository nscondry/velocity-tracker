import React, { useState, useMemo } from 'react';

function PortfolioSummary({ data, showOptimizationProjects }) {
  const { portfolio_velocity, clients, dateRanges } = data;
  const [activeTable, setActiveTable] = useState('all-time');
  const [sortConfig, setSortConfig] = useState({ key: 'hours', direction: 'desc' });

  // Filter clients based on optimization projects setting
  const filteredClients = useMemo(() => {
    if (!showOptimizationProjects) return clients;
    
    return clients.filter(client => {
      if (!client.latest_project?.project_name) return false;
      const projectName = client.latest_project.project_name;
      return projectName.includes("'24") || 
             projectName.includes("'25") || 
             projectName.includes(" 25") || 
             projectName.includes(" 50") || 
             projectName.includes(" 100");
    });
  }, [clients, showOptimizationProjects]);

  // Calculate weekly totals for the filtered clients
  const weeklyTotals = useMemo(() => {
    const totals = new Array(8).fill(0);
    filteredClients.forEach(client => {
      client.weekly_hours.forEach((hours, weekIndex) => {
        totals[weekIndex] += hours;
      });
    });
    return totals;
  }, [filteredClients]);

  // Calculate portfolio stats for filtered clients
  const portfolioStats = useMemo(() => {
    const totalVelocity = filteredClients.reduce((sum, client) => sum + client.avg_velocity, 0);
    const totalHours = totalVelocity * 8;
    const activeClients = filteredClients.filter(client => client.avg_velocity > 0).length;
    
    return {
      portfolio_velocity: totalVelocity,
      total_hours: totalHours,
      total_clients: filteredClients.length,
      active_clients: activeClients
    };
  }, [filteredClients]);

  // Calculate time period data
  const timePeriodData = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Helper function to get hours for a date range
    const getHoursForDateRange = (startDate, endDate) => {
      const clientData = [];
      filteredClients.forEach(client => {
        let totalHours = 0;
        let weekHours = 0;
        
        // Calculate hours for the date range
        client.weekly_hours.forEach((hours, weekIndex) => {
          const weekDate = new Date(dateRanges?.[weekIndex]?.to || new Date());
          if (weekDate >= startDate && weekDate <= endDate) {
            totalHours += hours;
            weekHours = hours; // For single week periods
          }
        });
        
        if (totalHours > 0) {
          clientData.push({
            client: client.name,
            project: client.latest_project?.project_name || 'Unknown',
            hours: totalHours,
            weekHours: weekHours,
            avgVelocity: client.avg_velocity,
            totalHoursUsed: client.total_hours_used
          });
        }
      });
      return clientData;
    };

    // Calculate current week (most recent week)
    const currentWeekData = getHoursForDateRange(
      new Date(dateRanges?.[7]?.from || new Date()),
      new Date(dateRanges?.[7]?.to || new Date())
    );

    // Calculate last week (second most recent week)
    const lastWeekData = getHoursForDateRange(
      new Date(dateRanges?.[6]?.from || new Date()),
      new Date(dateRanges?.[6]?.to || new Date())
    );

    // Calculate this month (last 4 weeks)
    const thisMonthData = getHoursForDateRange(
      new Date(dateRanges?.[4]?.from || new Date()),
      new Date(dateRanges?.[7]?.to || new Date())
    );

    // Calculate last month (weeks 1-4)
    const lastMonthData = getHoursForDateRange(
      new Date(dateRanges?.[0]?.from || new Date()),
      new Date(dateRanges?.[3]?.to || new Date())
    );

    // Calculate all time (all 8 weeks)
    const allTimeData = getHoursForDateRange(
      new Date(dateRanges?.[0]?.from || new Date()),
      new Date(dateRanges?.[7]?.to || new Date())
    );

    return {
      'this-week': {
        title: 'This Week',
        data: currentWeekData,
        total: currentWeekData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: lastWeekData.reduce((sum, item) => sum + item.hours, 0)
      },
      'last-week': {
        title: 'Last Week',
        data: lastWeekData,
        total: lastWeekData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: 0 // No previous week to compare
      },
      'this-month': {
        title: 'This Month',
        data: thisMonthData,
        total: thisMonthData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: lastMonthData.reduce((sum, item) => sum + item.hours, 0)
      },
      'last-month': {
        title: 'Last Month',
        data: lastMonthData,
        total: lastMonthData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: 0 // No previous month to compare
      },
      'all-time': {
        title: 'All Time (8 weeks)',
        data: allTimeData,
        total: allTimeData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: 0 // No previous period to compare
      }
    };
  }, [filteredClients, dateRanges]);

  // Sort data for current table
  const sortedTableData = useMemo(() => {
    const currentData = timePeriodData[activeTable]?.data || [];
    const sorted = [...currentData];
    
    sorted.sort((a, b) => {
      if (sortConfig.key === 'hours') {
        return sortConfig.direction === 'asc' ? a.hours - b.hours : b.hours - a.hours;
      } else if (sortConfig.key === 'client') {
        return sortConfig.direction === 'asc' 
          ? a.client.localeCompare(b.client) 
          : b.client.localeCompare(a.client);
      } else if (sortConfig.key === 'velocity') {
        return sortConfig.direction === 'asc' ? a.avgVelocity - b.avgVelocity : b.avgVelocity - a.avgVelocity;
      }
      return 0;
    });
    
    return sorted;
  }, [timePeriodData, activeTable, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const maxWeeklyHours = Math.max(...weeklyTotals, 1);

  // Calculate change percentage and direction
  const getChangeIndicator = (current, previous) => {
    if (previous === 0) return null;
    const change = current - previous;
    const percentage = (change / previous) * 100;
    
    if (change > 0) {
      return <span style={{ color: '#10b981', fontWeight: 'bold' }}>↗ +{percentage.toFixed(1)}%</span>;
    } else if (change < 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>↘ {percentage.toFixed(1)}%</span>;
    } else {
      return <span style={{ color: '#6b7280', fontWeight: 'bold' }}>→ 0%</span>;
    }
  };

  return (
    <div className="portfolio-summary">
      <h2>📈 Portfolio Overview {showOptimizationProjects && '(Optimization Projects Only)'}</h2>
      
      <div className="portfolio-stats">
        <div className="stat">
          <span className="stat-value">{portfolioStats.portfolio_velocity.toFixed(1)}</span>
          <span className="stat-label">Hours/Week Average</span>
        </div>
        <div className="stat">
          <span className="stat-value">{portfolioStats.total_hours.toFixed(0)}</span>
          <span className="stat-label">Total Hours (8 weeks)</span>
        </div>
        <div className="stat">
          <span className="stat-value">{portfolioStats.total_clients}</span>
          <span className="stat-label">Total Clients</span>
        </div>
        <div className="stat">
          <span className="stat-value">{portfolioStats.active_clients}</span>
          <span className="stat-label">Active Clients</span>
        </div>
      </div>

      {/* Weekly Hours Bar Graph */}
      <div className="weekly-overview">
        <h3>📊 Weekly Hours Overview</h3>
        <div className="weekly-bars">
          {weeklyTotals.map((total, index) => (
            <div key={index} className="weekly-bar-container">
              <div className="weekly-bar-label">
                {dateRanges?.[index]?.description || `W${index + 1}`}
              </div>
              <div className="weekly-bar">
                <div 
                  className="weekly-bar-fill"
                  style={{ 
                    height: `${(total / maxWeeklyHours) * 100}%`,
                    backgroundColor: total > 0 ? '#3b82f6' : '#e2e8f0'
                  }}
                >
                  <div className="weekly-bar-tooltip">
                    {total.toFixed(1)}h
                  </div>
                </div>
              </div>
              <div className="weekly-bar-value">
                {total.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Period Tables */}
      <div className="time-period-tables">
        <h3>📋 Client Contributions by Time Period</h3>
        
        {/* Table Navigation */}
        <div className="table-nav">
          {Object.entries(timePeriodData).map(([key, period]) => (
            <button
              key={key}
              className={`table-nav-button ${activeTable === key ? 'active' : ''}`}
              onClick={() => setActiveTable(key)}
            >
              {period.title}
              <div className="period-total">
                {period.total.toFixed(1)}h
                {getChangeIndicator(period.total, period.previousTotal)}
              </div>
            </button>
          ))}
        </div>
        
        {/* Active Table */}
        <div className="active-table-container">
          <div className="table-header">
            <h4>{timePeriodData[activeTable]?.title}</h4>
            <div className="table-summary">
              <span>Total: {timePeriodData[activeTable]?.total.toFixed(1)}h</span>
              {getChangeIndicator(
                timePeriodData[activeTable]?.total || 0,
                timePeriodData[activeTable]?.previousTotal || 0
              )}
            </div>
          </div>
          
          <div className="table-container">
            <table className="client-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('client')} className="sortable">
                    Client {sortConfig.key === 'client' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Project</th>
                  <th onClick={() => handleSort('hours')} className="sortable">
                    Hours {sortConfig.key === 'hours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('velocity')} className="sortable">
                    Avg Velocity {sortConfig.key === 'velocity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTableData.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.client}</td>
                    <td>{entry.project}</td>
                    <td>{entry.hours.toFixed(1)}h</td>
                    <td>{entry.avgVelocity.toFixed(1)}h/week</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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