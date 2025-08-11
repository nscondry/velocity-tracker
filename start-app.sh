#!/bin/bash

echo "🚀 Starting Velocity Tracker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Harvest API credentials:"
    echo "HARVEST_ACCOUNT_ID=your_account_id"
    echo "HARVEST_ACCESS_TOKEN=your_access_token"
    echo "HARVEST_BASE_URL=https://api.harvestapp.com"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Start the server
echo "🌐 Starting server..."
npm run web 