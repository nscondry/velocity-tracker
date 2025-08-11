class ClientProcessor {
  constructor() {
    // Keywords to split on for client name extraction
    this.splitKeywords = [
      'hours', 'Hours', 'HOURS',
      'pack', 'Pack', 'PACK',
      "'25", "'24", "'23", "'22", "'21", "'20",
      "'26", "'27", "'28", "'29", "'30"
    ];
    
    // Common patterns to clean up
    this.cleanupPatterns = [
      { pattern: /\s+/g, replacement: ' ' }, // Multiple spaces to single space
      { pattern: /^\s+|\s+$/g, replacement: '' }, // Trim whitespace
      { pattern: /^[0-9\s]+$/, replacement: '' }, // Remove lines that are only numbers/spaces
    ];
  }

  normalizeClientName(projectName) {
    if (!projectName || typeof projectName !== 'string') {
      return 'Unknown Client';
    }

    let clientName = projectName;

    // Remove common suffixes and patterns
    const patterns = [
      /\s*'[0-9]{2}\s*/g,                    // Remove '25, '24, etc.
      /\s*Pack\s*#?\d*\s*/gi,                // Remove "Pack #1", "Pack 2", etc.
      /\s*\bPt\s*\d*\s*/gi,                  // Remove "Pt 1", "Part 2", etc.
      /\s*\bPart\s*\d*\s*/gi,                // Remove "Part 1", "Part 2", etc.
      /\s*\bHours\b\s*/gi,                   // Remove "Hours" as whole word only
      /\s*\bPack\b\s*/gi,                    // Remove "Pack" as whole word
      /\s*\bPt\b\s*/gi,                      // Remove "Pt" as whole word
      /\s*\bPart\b\s*/gi,                    // Remove "Part" as whole word
    ];

    patterns.forEach(pattern => {
      clientName = clientName.replace(pattern, ' ');
    });

    // Split on remaining keywords and take the first part
    for (const keyword of this.splitKeywords) {
      const parts = clientName.split(keyword);
      if (parts.length > 1) {
        clientName = parts[0];
        break;
      }
    }

    // Apply cleanup patterns
    for (const { pattern, replacement } of this.cleanupPatterns) {
      if (typeof replacement === 'string') {
        clientName = clientName.replace(pattern, replacement);
      } else if (replacement === '') {
        // Handle empty replacement (for patterns that should remove content)
        clientName = clientName.replace(pattern, '');
      }
    }

    // Remove trailing numbers and common suffixes
    clientName = clientName.replace(/\s+\d+$/, ''); // Remove trailing numbers
    clientName = clientName.replace(/\s+\([^)]*\)$/, ''); // Remove trailing parentheses
    clientName = clientName.replace(/\s+-\s*$/, ''); // Remove trailing dash

    // Final cleanup
    clientName = clientName.trim();
    
    // If we ended up with an empty string, use a fallback
    if (!clientName || clientName.length === 0) {
      return 'Unknown Client';
    }

    return clientName;
  }

  aggregateByClient(weeklyData) {
    const clientMap = new Map();

    weeklyData.forEach((weekData, weekIndex) => {
      weekData.projects.forEach(project => {
        const clientName = this.normalizeClientName(project.project.client.name);
        const hours = project.total_hours || 0;

        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, {
            name: clientName,
            weekly_hours: new Array(8).fill(0)
          });
        }

        const client = clientMap.get(clientName);
        client.weekly_hours[weekIndex] += hours;
      });
    });

    return Array.from(clientMap.values());
  }

  calculateVelocities(clientData) {
    const clients = clientData.map(client => {
      const totalHours = client.weekly_hours.reduce((sum, hours) => sum + hours, 0);
      const avgVelocity = totalHours / 8;
      
      return {
        ...client,
        avg_velocity: Math.round(avgVelocity * 10) / 10 // Round to 1 decimal place
      };
    });

    // Calculate portfolio velocity
    const portfolioVelocity = clients.reduce((sum, client) => sum + client.avg_velocity, 0);

    return {
      portfolio_velocity: Math.round(portfolioVelocity * 10) / 10,
      clients: clients.sort((a, b) => b.avg_velocity - a.avg_velocity) // Sort by highest velocity first
    };
  }
}

export default ClientProcessor; 