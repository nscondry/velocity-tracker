import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import HarvestAPI from './src/harvest-api.js';
import ClientProcessor from './src/client-processor.js';
import DateUtils from './src/date-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize services
const harvestAPI = new HarvestAPI();
const clientProcessor = new ClientProcessor();
const dateUtils = new DateUtils();

// API Routes
app.get('/api/velocity', async (req, res) => {
  try {
    console.log('🚀 Fetching velocity data...');
    
    // Generate 8 weeks of date ranges
    const weeklyRanges = dateUtils.generateWeeklyRanges(8);
    
    // Fetch data from Harvest API
    const weeklyData = await harvestAPI.fetchAllWeeklyData(weeklyRanges);
    
    if (weeklyData.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Process and aggregate data by client
    const clientData = clientProcessor.aggregateByClient(weeklyData);
    
    if (clientData.length === 0) {
      return res.status(404).json({ error: 'No client data found' });
    }

    // Calculate velocities
    const velocityData = clientProcessor.calculateVelocities(clientData);
    
    // Add date ranges for display
    const dateRanges = weeklyRanges.map(range => ({
      week: range.weekNumber,
      from: range.from,
      to: range.to,
      description: dateUtils.getDateRangeDescription(range)
    }));

    res.json({
      ...velocityData,
      dateRanges,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching velocity data:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Velocity Tracker Web Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/velocity`);
}); 