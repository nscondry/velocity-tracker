import React, { useState, useEffect } from 'react';
import VelocityBar from './components/VelocityBar.jsx';
import PortfolioSummary from './components/PortfolioSummary.jsx';
import ClientRow from './components/ClientRow.jsx';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('velocity'); // 'velocity' or 'name'
  const [showOptimizationProjects, setShowOptimizationProjects] = useState(true); // Default to true
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);
      setProgress(0);
      
      // Simulate progress based on typical processing time
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      
      const response = await fetch('/api/velocity');
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(`Server error (${response.status}): ${errorData.error || errorText}`);
      }
      
      const result = await response.json();
      
      // Add server logs to the logs state
      if (result.logs && Array.isArray(result.logs)) {
        setLogs(result.logs);
      }
      
      setProgress(100);
      clearInterval(progressInterval);
      setData(result);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedClients = () => {
    if (!data?.clients) return [];
    
    let filtered = data.clients;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by optimization projects (if enabled)
    if (showOptimizationProjects) {
      filtered = filtered.filter(client => {
        if (!client.latest_project?.project_name) return false;
        const projectName = client.latest_project.project_name;
        return projectName.includes("'24") || 
               projectName.includes("'25") || 
               projectName.includes(" 25") || 
               projectName.includes(" 50") || 
               projectName.includes(" 100");
      });
    }
    
    // Sort clients
    filtered.sort((a, b) => {
      if (sortBy === 'velocity') {
        return b.avg_velocity - a.avg_velocity;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>🚀 Loading velocity data...</h2>
          <p>Fetching the last 8 weeks from Harvest</p>
          
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease',
                borderRadius: '10px'
              }} />
            </div>
            <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {Math.round(progress)}% complete
            </p>
          </div>
          
          <p style={{ color: '#64748b', marginTop: '2rem', fontSize: '0.8rem', textAlign: 'center' }}>
            Check the terminal for detailed progress logs
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h3>❌ Error loading data</h3>
          <p>{error}</p>
          <button onClick={fetchData} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

        const clients = filteredAndSortedClients();

      return (
        <div className="app">
          <div className="header">
            <h1>🚀 Velocity Tracker</h1>
            <p>Client velocity over the last 8 weeks</p>
          </div>

          {data && <PortfolioSummary data={data} showOptimizationProjects={showOptimizationProjects} />}

          <div className="controls">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="velocity">Sort by Velocity</option>
              <option value="name">Sort by Name</option>
            </select>

            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showOptimizationProjects}
                onChange={(e) => setShowOptimizationProjects(e.target.checked)}
              />
              <span>Optimization Projects Only (25/50/100h packs)</span>
            </label>

            <button
              onClick={fetchData}
              style={{
                padding: '0.75rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="clients-container">
            {clients.length === 0 ? (
              <div className="empty-state">
                <h3>No clients found</h3>
                <p>
                  {searchTerm 
                    ? `No clients match "${searchTerm}"`
                    : showOptimizationProjects
                    ? 'No optimization projects found (projects with \'24, \'25, 25, 50, or 100 in the name)'
                    : 'No client data available'
                  }
                </p>
              </div>
            ) : (
              <>
                {clients.map((client, index) => (
                  <ClientRow
                    key={client.name}
                    client={client}
                    maxVelocity={Math.max(...clients.map(c => c.avg_velocity))}
                    dateRanges={data?.dateRanges}
                    rank={index + 1}
                  />
                ))}
                
                {data?.dateRanges && (
                  <div className="week-labels">
                    {data.dateRanges.map((range, index) => (
                      <div key={index} className="week-label">
                        W{range.week}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

      {data && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          <p>Data generated at {new Date(data.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default App; 