class DashboardRenderer {
  constructor() {
    this.maxBarHeight = 20;
    this.maxBarWidth = 60;
  }

  renderDashboard(velocityData) {
    const { portfolio_velocity, clients } = velocityData;
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 VELOCITY TRACKER DASHBOARD');
    console.log('='.repeat(80));
    
    // Portfolio summary
    this.renderPortfolioSummary(portfolio_velocity);
    
    // Client details
    if (clients.length === 0) {
      console.log('\n📊 No client data available for the selected time period.');
      return;
    }
    
    this.renderClientTable(clients);
    
    console.log('\n' + '='.repeat(80));
    console.log('📅 Data covers the last 8 weeks (Monday-Sunday)');
    console.log('='.repeat(80));
  }

  renderPortfolioSummary(portfolioVelocity) {
    console.log('\n📈 PORTFOLIO VELOCITY');
    console.log('-'.repeat(40));
    console.log(`Total Average: ${portfolioVelocity} hours/week`);
    console.log(`Total Capacity: ${(portfolioVelocity * 8).toFixed(1)} hours (8 weeks)`);
  }

  renderClientTable(clients) {
    console.log('\n👥 CLIENT VELOCITY BREAKDOWN');
    console.log('-'.repeat(80));
    
    // Header
    const header = this.formatClientRow(
      'Client Name',
      'Avg Velocity',
      'Weekly Hours (W1 → W8)',
      true
    );
    console.log(header);
    console.log('-'.repeat(80));
    
    // Client rows
    clients.forEach((client, index) => {
      const row = this.formatClientRow(
        client.name,
        `${client.avg_velocity}h`,
        this.renderWeeklyBars(client.weekly_hours),
        false
      );
      console.log(row);
      
      // Add separator between clients
      if (index < clients.length - 1) {
        console.log('─'.repeat(80));
      }
    });
  }

  formatClientRow(clientName, avgVelocity, weeklyBars, isHeader = false) {
    const nameWidth = 25;
    const velocityWidth = 12;
    const barsWidth = 40;
    
    const formattedName = this.padRight(clientName, nameWidth);
    const formattedVelocity = this.padRight(avgVelocity, velocityWidth);
    
    if (isHeader) {
      return `${formattedName} | ${formattedVelocity} | ${weeklyBars}`;
    } else {
      return `${formattedName} | ${formattedVelocity} | ${weeklyBars}`;
    }
  }

  renderWeeklyBars(weeklyHours) {
    const maxHours = Math.max(...weeklyHours, 1); // Avoid division by zero
    const bars = weeklyHours.map((hours, index) => {
      const weekNum = index + 1;
      const barHeight = hours > 0 ? Math.max(1, Math.round((hours / maxHours) * this.maxBarHeight)) : 1;
      const bar = hours > 0 ? '█'.repeat(barHeight) : '░';
      const hoursLabel = hours > 0 ? hours.toString() : '0';
      
      return `${hoursLabel}\n${bar}\nW${weekNum}`;
    });
    
    return bars.join('  ');
  }

  padRight(str, width) {
    return String(str).padEnd(width);
  }

  padLeft(str, width) {
    return String(str).padStart(width);
  }

  // Alternative simple bar chart for better terminal compatibility
  renderSimpleBars(weeklyHours) {
    const maxHours = Math.max(...weeklyHours, 1);
    const bars = weeklyHours.map((hours, index) => {
      const weekNum = index + 1;
      const barLength = hours > 0 ? Math.max(1, Math.round((hours / maxHours) * this.maxBarWidth)) : 1;
      const bar = hours > 0 ? '█'.repeat(barLength) : '░';
      
      return `W${weekNum}: ${hours}h [${bar}]`;
    });
    
    return bars.join('  ');
  }

  // Enhanced rendering with better formatting
  renderEnhancedDashboard(velocityData) {
    const { portfolio_velocity, clients } = velocityData;
    
    console.log('\n' + '='.repeat(100));
    console.log('🚀 VELOCITY TRACKER DASHBOARD');
    console.log('='.repeat(100));
    
    this.renderPortfolioSummary(portfolio_velocity);
    
    if (clients.length === 0) {
      console.log('\n📊 No client data available for the selected time period.');
      return;
    }
    
    console.log('\n👥 CLIENT VELOCITY BREAKDOWN');
    console.log('-'.repeat(100));
    
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. ${client.name}`);
      console.log(`   Average Velocity: ${client.avg_velocity} hours/week`);
      console.log(`   Weekly Breakdown:`);
      
      client.weekly_hours.forEach((hours, weekIndex) => {
        const weekNum = weekIndex + 1;
        const barLength = hours > 0 ? Math.max(1, Math.round((hours / 20) * 30)) : 1; // Scale to 20h max
        const bar = hours > 0 ? '█'.repeat(barLength) : '░';
        console.log(`      Week ${weekNum}: ${hours.toString().padStart(4)}h [${bar}]`);
      });
      
      if (index < clients.length - 1) {
        console.log('   ' + '─'.repeat(80));
      }
    });
    
    console.log('\n' + '='.repeat(100));
  }
}

export default DashboardRenderer; 