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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Global logs array to capture server logs
let serverLogs = [];

// Initialize services
let harvestAPI, clientProcessor, dateUtils;

try {
  harvestAPI = new HarvestAPI();
  clientProcessor = new ClientProcessor();
  dateUtils = new DateUtils();
  console.log('✅ Services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize services:', error.message);
  process.exit(1);
}

// API Routes
app.get('/api/velocity', async (req, res) => {
  try {
    // Clear previous logs
    serverLogs = [];
    
    // Capture console.log output
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      originalConsoleLog(...args);
      serverLogs.push(message);
    };
    
    console.log('🚀 Fetching velocity data...');
    
    // Generate 8 weeks of date ranges
    const weeklyRanges = dateUtils.generateWeeklyRanges(8);
    console.log(`📅 Generated date ranges: ${weeklyRanges.length} weeks`);
    
    // Fetch data from Harvest API
    console.log('📊 Fetching data from Harvest API...');
    const weeklyData = await harvestAPI.fetchAllWeeklyData(weeklyRanges);
    
    if (weeklyData.length === 0) {
      console.log('⚠️ No weekly data found');
      return res.status(404).json({ error: 'No data found from Harvest API' });
    }

    console.log(`✅ Fetched ${weeklyData.length} weeks of data`);

    // Process and aggregate data by client
    let clientData = [];
    try {
      console.log('🔄 Processing client data...');
      clientData = await clientProcessor.aggregateByClient(weeklyData, harvestAPI);
    } catch (error) {
      console.error('❌ Error processing client data:', error);
      return res.status(500).json({ 
        error: 'Failed to process client data',
        details: error.message,
        logs: serverLogs
      });
    }
    
    if (clientData.length === 0) {
      console.log('⚠️ No client data found after processing');
      return res.status(404).json({ error: 'No client data found', logs: serverLogs });
    }

    console.log(`✅ Processed ${clientData.length} clients`);

    // Calculate velocities
    const velocityData = clientProcessor.calculateVelocities(clientData);
    
    // Add date ranges for display
    const dateRanges = weeklyRanges.map(range => ({
      week: range.weekNumber,
      from: range.from,
      to: range.to,
      description: dateUtils.getDateRangeDescription(range)
    }));

    const response = {
      ...velocityData,
      dateRanges,
      generatedAt: new Date().toISOString(),
      logs: serverLogs
    };

    console.log(`✅ Sending response with ${velocityData.clients.length} clients`);
    
    // Restore original console.log
    console.log = originalConsoleLog;
    
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching velocity data:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Check server logs for more information',
      logs: serverLogs
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      harvestAPI: !!harvestAPI,
      clientProcessor: !!clientProcessor,
      dateUtils: !!dateUtils
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Velocity Tracker Web Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/velocity`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/api/health`);
}); 