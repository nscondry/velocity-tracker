#!/usr/bin/env node

import HarvestAPI from './src/harvest-api.js';
import ClientProcessor from './src/client-processor.js';
import DashboardRenderer from './src/dashboard-renderer.js';
import DateUtils from './src/date-utils.js';

class VelocityTracker {
  constructor() {
    this.harvestAPI = new HarvestAPI();
    this.clientProcessor = new ClientProcessor();
    this.dashboardRenderer = new DashboardRenderer();
    this.dateUtils = new DateUtils();
  }

  async run() {
    try {
      console.log('🚀 Starting Velocity Tracker...\n');
      
      // Generate 6 months of date ranges
      const monthlyRanges = this.dateUtils.generateMonthlyRanges(6);
      console.log('📅 Generated date ranges for the last 6 months:');
      monthlyRanges.forEach((range, index) => {
        const description = this.dateUtils.getMonthlyRangeDescription(range);
        console.log(`   Month ${index + 1}: ${description}`);
      });
      console.log();

      // Fetch data from Harvest API
      console.log('📊 Fetching data from Harvest API...');
      const monthlyData = await this.harvestAPI.fetchAllMonthlyData(monthlyRanges);
      
      if (monthlyData.length === 0) {
        console.log('❌ No data retrieved from Harvest API. Please check your credentials and try again.');
        return;
      }

      console.log(`✅ Successfully fetched data for ${monthlyData.length} months\n`);

      // Process and aggregate data by client
      console.log('🔧 Processing client data...');
      const clientData = await this.clientProcessor.aggregateByClient(monthlyData, this.harvestAPI);
      
      if (clientData.length === 0) {
        console.log('📊 No client data found for the selected time period.');
        return;
      }

      console.log(`✅ Found ${clientData.length} clients with activity\n`);

      // Calculate velocities
      console.log('📈 Calculating velocities...');
      const velocityData = this.clientProcessor.calculateVelocities(clientData);
      console.log('✅ Velocity calculations complete\n');

      // Render dashboard
      console.log('🎨 Rendering dashboard...');
      this.dashboardRenderer.renderEnhancedDashboard(velocityData);

    } catch (error) {
      console.error('❌ Error running Velocity Tracker:', error.message);
      
      if (error.message.includes('Missing required Harvest API credentials')) {
        console.log('\n📝 Setup Instructions:');
        console.log('1. Copy env.example to .env');
        console.log('2. Add your Harvest API credentials:');
        console.log('   - HARVEST_ACCOUNT_ID: Your Harvest account ID');
        console.log('   - HARVEST_ACCESS_TOKEN: Your Harvest access token');
        console.log('3. Run: npm install');
        console.log('4. Run: npm start');
      }
      
      process.exit(1);
    }
  }

  // Utility method for testing client name normalization
  testClientNameNormalization() {
    const testNames = [
      "Client Name Hours '25 Pack #1",
      "Client Name 25 '25 Pt 1",
      "Another Client '24 Hours",
      "Test Client Pack 2",
      "Simple Client Name",
      "Client with Numbers 123",
      "Client '25 Hours Part 2",
      "Complex Client Name '24 Pack #3 Pt 1"
    ];

    console.log('🧪 Testing Client Name Normalization:');
    console.log('-'.repeat(50));
    
    testNames.forEach(name => {
      const normalized = this.clientProcessor.normalizeClientName(name);
      console.log(`Original: "${name}"`);
      console.log(`Normalized: "${normalized}"`);
      console.log('');
    });
  }
}

// Main execution
const tracker = new VelocityTracker();

// Check for command line arguments
const args = process.argv.slice(2);

if (args.includes('--test-names')) {
  tracker.testClientNameNormalization();
} else {
  tracker.run();
} 