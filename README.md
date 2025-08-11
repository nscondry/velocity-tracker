# Velocity Tracker

A simple tool to calculate weekly client velocity (hours per week) from Harvest time tracking data over the last 8 weeks.

## Features

- 📊 **Data Collection**: Fetches time tracking data from Harvest API v2 for the last 8 weeks
- 🔍 **Smart Filtering**: Focuses on active, hourly projects only (excludes archived and fixed-fee projects)
- 🏷️ **Client Name Processing**: Intelligently extracts base client names from messy project names
- 📈 **Velocity Calculation**: Calculates 8-week average velocity per client and portfolio total
- 📋 **Dashboard Visualization**: Clean terminal-based dashboard with bar charts and metrics

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd velocity-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Add your Harvest API credentials to `.env`:
```
HARVEST_ACCOUNT_ID=your_account_id_here
HARVEST_ACCESS_TOKEN=your_access_token_here
HARVEST_BASE_URL=https://api.harvestapp.com
```

## Usage

### Basic Usage
```bash
npm start
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Test Client Name Normalization
```bash
node index.js --test-names
```

## How It Works

### 1. Data Collection
- Generates 8 weeks of Monday-Sunday date ranges
- Makes API calls to Harvest `/v2/reports/time/projects` endpoint
- Filters for active, hourly projects only

### 2. Client Name Processing
The tool intelligently extracts base client names from project names using these patterns:

**Input Examples:**
- `"Client Name Hours '25 Pack #1"` → `"Client Name"`
- `"Client Name 25 '25 Pt 1"` → `"Client Name"`
- `"Another Client '24 Hours"` → `"Another Client"`

**Processing Rules:**
- Splits on keywords: "hours", "pack", "'25", "'24", numbers, "pt", "part"
- Removes trailing numbers and parentheses
- Cleans up multiple spaces and trims whitespace

### 3. Data Aggregation
- Groups all projects under normalized client names
- Sums weekly hours per client
- Calculates 8-week average velocity

### 4. Dashboard Output
```
====================================================================================================
🚀 VELOCITY TRACKER DASHBOARD
====================================================================================================

📈 PORTFOLIO VELOCITY
----------------------------------------
Total Average: 45.2 hours/week
Total Capacity: 361.6 hours (8 weeks)

👥 CLIENT VELOCITY BREAKDOWN
----------------------------------------------------------------------------------------------------

1. Adaptive Security
   Average Velocity: 12.5 hours/week
   Weekly Breakdown:
      Week  1: 15.0h [██████████████████████████████]
      Week  2:  8.0h [████████████████]
      Week  3: 12.0h [████████████████████████]
      Week  4:  0.0h [░]
      Week  5: 18.0h [████████████████████████████████████████████████]
      Week  6: 10.0h [████████████████████]
      Week  7: 14.0h [████████████████████████████████████]
      Week  8: 11.0h [████████████████████████████]

2. Tech Startup Inc
   Average Velocity: 8.3 hours/week
   Weekly Breakdown:
      Week  1: 10.0h [████████████████████████████████████████]
      Week  2:  5.0h [████████████████████]
      Week  3: 12.0h [████████████████████████████████████████████████]
      Week  4:  8.0h [████████████████████████████████]
      Week  5:  6.0h [████████████████████████]
      Week  6: 10.0h [████████████████████████████████████████]
      Week  7:  7.0h [████████████████████████████]
      Week  8:  9.0h [████████████████████████████████████]

====================================================================================================
```

## API Requirements

### Harvest API v2
- **Endpoint**: `/v2/reports/time/projects`
- **Authentication**: Bearer token + Account ID
- **Rate Limit**: 100 requests per 15 seconds
- **Date Format**: YYYY-MM-DD

### Required Permissions
- Read access to time entries
- Read access to projects
- Read access to clients

## Configuration

### Environment Variables
- `HARVEST_ACCOUNT_ID`: Your Harvest account ID
- `HARVEST_ACCESS_TOKEN`: Your Harvest access token
- `HARVEST_BASE_URL`: Harvest API base URL (default: https://api.harvestapp.com)

### Customization
You can modify the following in the source code:
- Number of weeks to analyze (default: 8)
- Client name normalization patterns
- Dashboard visualization style
- API rate limiting

## Troubleshooting

### Common Issues

1. **"Missing required Harvest API credentials"**
   - Ensure `.env` file exists with correct credentials
   - Verify account ID and access token are valid

2. **"No data retrieved from Harvest API"**
   - Check API credentials and permissions
   - Verify projects exist in the date range
   - Ensure projects are active and hourly-billed

3. **"No client data found"**
   - Check if any time entries exist in the date range
   - Verify projects are not archived or fixed-fee

### Debug Mode
Add `console.log` statements in the source files to debug specific issues:
- `src/harvest-api.js` for API call debugging
- `src/client-processor.js` for client name processing
- `src/dashboard-renderer.js` for visualization issues

## Development

### Project Structure
```
velocity-tracker/
├── src/
│   ├── harvest-api.js      # Harvest API client
│   ├── client-processor.js # Client name processing
│   ├── dashboard-renderer.js # Dashboard visualization
│   └── date-utils.js       # Date utilities
├── index.js                # Main entry point
├── package.json            # Dependencies and scripts
├── env.example             # Environment variables template
└── README.md              # This file
```

### Adding Features
1. **New Client Name Patterns**: Modify `splitKeywords` array in `ClientProcessor`
2. **Different Date Ranges**: Update `generateWeeklyRanges()` in `DateUtils`
3. **Custom Dashboard**: Extend `DashboardRenderer` class
4. **Additional Filters**: Modify `filterActiveHourlyProjects()` in `HarvestAPI`

## License

MIT License - see LICENSE file for details.
