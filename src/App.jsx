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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching velocity data...');
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
      console.log('✅ Received velocity data:', result);
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

          {data && <PortfolioSummary data={data} />}

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