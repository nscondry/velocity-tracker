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

  // Calculate monthly totals for the filtered clients
  const monthlyTotals = useMemo(() => {
    const totals = new Array(6).fill(0);
    filteredClients.forEach(client => {
      const monthlyHours = Array.isArray(client.monthly_hours) ? client.monthly_hours : new Array(6).fill(0);
      monthlyHours.forEach((hours, monthIndex) => {
        totals[monthIndex] += hours;
      });
    });
    return totals;
  }, [filteredClients]);

  // Calculate portfolio stats for filtered clients
  const portfolioStats = useMemo(() => {
    const totalVelocity = filteredClients.reduce((sum, client) => sum + client.avg_velocity, 0);
    const totalHours = totalVelocity * 6; // 6 months
    const activeClients = filteredClients.filter(client => client.avg_velocity > 0).length;
    
    return {
      portfolio_velocity: totalVelocity,
      total_hours: totalHours,
      total_clients: filteredClients.length,
      active_clients: activeClients
    };
  }, [filteredClients]);

  // Helper function to format date range for display
  const formatDateRange = (startDate, endDate) => {
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Calculate time period data
  const timePeriodData = useMemo(() => {
    
    // Helper function to get hours for a date range
    const getHoursForDateRange = (startDate, endDate) => {
      const clientData = [];
      filteredClients.forEach(client => {
        let totalHours = 0;
        let monthHours = 0;
        
        // Calculate hours for the date range
        client.monthly_hours.forEach((hours, monthIndex) => {
          const monthDate = new Date(dateRanges?.[monthIndex]?.to || new Date());
          if (monthDate >= startDate && monthDate <= endDate) {
            totalHours += hours;
            monthHours = hours; // For single month periods
          }
        });
        
        if (totalHours > 0) {
          clientData.push({
            client: client.name,
            project: client.latest_project?.project_name || 'Unknown',
            hours: totalHours,
            monthHours: monthHours,
            avgVelocity: client.avg_velocity,
            totalHoursUsed: client.total_hours_used
          });
        }
      });
      return clientData;
    };

    // Calculate current month (most recent month)
    const currentMonthStart = new Date(dateRanges?.[5]?.from || new Date());
    const currentMonthEnd = new Date(dateRanges?.[5]?.to || new Date());
    const currentMonthData = getHoursForDateRange(currentMonthStart, currentMonthEnd);

    // Calculate last month (second most recent month)
    const lastMonthStart = new Date(dateRanges?.[4]?.from || new Date());
    const lastMonthEnd = new Date(dateRanges?.[4]?.to || new Date());
    const lastMonthData = getHoursForDateRange(lastMonthStart, lastMonthEnd);

    // Calculate this quarter (last 3 months)
    const thisQuarterStart = new Date(dateRanges?.[3]?.from || new Date());
    const thisQuarterEnd = new Date(dateRanges?.[5]?.to || new Date());
    const thisQuarterData = getHoursForDateRange(thisQuarterStart, thisQuarterEnd);

    // Calculate last quarter (first 3 months)
    const lastQuarterStart = new Date(dateRanges?.[0]?.from || new Date());
    const lastQuarterEnd = new Date(dateRanges?.[2]?.to || new Date());
    const lastQuarterData = getHoursForDateRange(lastQuarterStart, lastQuarterEnd);

    // Calculate all time (all 6 months)
    const allTimeStart = new Date(dateRanges?.[0]?.from || new Date());
    const allTimeEnd = new Date(dateRanges?.[5]?.to || new Date());
    const allTimeData = getHoursForDateRange(allTimeStart, allTimeEnd);

    return {
      'this-month': {
        title: `This Month (${formatDateRange(currentMonthStart, currentMonthEnd)})`,
        data: currentMonthData,
        total: currentMonthData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: lastMonthData.reduce((sum, item) => sum + item.hours, 0)
      },
      'last-month': {
        title: `Last Month (${formatDateRange(lastMonthStart, lastMonthEnd)})`,
        data: lastMonthData,
        total: lastMonthData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: 0 // No previous month to compare
      },
      'this-quarter': {
        title: `This Quarter (${formatDateRange(thisQuarterStart, thisQuarterEnd)})`,
        data: thisQuarterData,
        total: thisQuarterData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: lastQuarterData.reduce((sum, item) => sum + item.hours, 0)
      },
      'last-quarter': {
        title: `Last Quarter (${formatDateRange(lastQuarterStart, lastQuarterEnd)})`,
        data: lastQuarterData,
        total: lastQuarterData.reduce((sum, item) => sum + item.hours, 0),
        previousTotal: 0 // No previous quarter to compare
      },
      'all-time': {
        title: `All Time (${formatDateRange(allTimeStart, allTimeEnd)})`,
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

  const maxMonthlyHours = Math.max(...monthlyTotals, 1);

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
          <span className="stat-label">Hours/Month Average</span>
        </div>
        <div className="stat">
          <span className="stat-value">{portfolioStats.total_hours.toFixed(0)}</span>
          <span className="stat-label">Total Hours (6 months)</span>
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

      {/* Monthly Hours Bar Graph */}
      <div className="monthly-overview">
        <h3>📊 Monthly Hours Overview</h3>
        <div className="monthly-bars">
          {monthlyTotals.map((total, index) => (
            <div key={index} className="monthly-bar-container">
              <div className="monthly-bar-label">
                {dateRanges?.[index]?.description || `M${index + 1}`}
              </div>
              <div className="monthly-bar">
                <div 
                  className="monthly-bar-fill"
                  style={{ 
                    height: `${(total / maxMonthlyHours) * 100}%`,
                    backgroundColor: total > 0 ? '#3b82f6' : '#e2e8f0'
                  }}
                >
                  <div className="monthly-bar-tooltip">
                    {total.toFixed(1)}h
                  </div>
                </div>
              </div>
              <div className="monthly-bar-value">
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
                    <td>{entry.avgVelocity.toFixed(1)}h/month</td>
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