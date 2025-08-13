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

  async aggregateByClient(monthlyData, harvestAPI) {
    const clientMap = new Map();

    // First, fetch all project budget data
    console.log('📊 Fetching project budget data...');
    const budgetData = await harvestAPI.fetchProjectBudgetData();
    console.log(`📊 Found ${budgetData.length} projects with budget data`);

    // Create a map of project budgets by client name
    const clientBudgetMap = new Map();
    budgetData.forEach(project => {
      const clientName = this.normalizeClientName(project.client_name);
      const projectInfo = {
        project_id: project.project_id,
        project_name: project.project_name,
        budget: project.budget,
        budget_spent: project.budget_spent,
        budget_remaining: project.budget_remaining,
        budget_by: project.budget_by,
        is_active: project.is_active
      };

      if (!clientBudgetMap.has(clientName)) {
        clientBudgetMap.set(clientName, []);
      }
      clientBudgetMap.get(clientName).push(projectInfo);
    });

    // Process monthly data and aggregate by client
    monthlyData.forEach((monthData, monthIndex) => {
      monthData.projects.forEach(project => {
        const clientName = this.normalizeClientName(project.project.client.name);
        const hours = project.total_hours || 0;

        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, {
            name: clientName,
            monthly_hours: new Array(6).fill(0),
            projects: [],
            total_hours_pack: 0,
            total_hours_used: 0,
            total_hours_remaining: 0,
            project_details: {},
            latest_project: null
          });
        }

        const client = clientMap.get(clientName);
        client.monthly_hours[monthIndex] += hours;
        
        // Add project info if not already added
        const existingProject = client.projects.find(p => p.project_id === project.project_id);
        if (!existingProject) {
          client.projects.push({
            project_id: project.project_id,
            project_name: project.project_name,
            client_name: project.client_name,
            client_id: project.client_id
          });
        }
      });
    });

    // Calculate total hours used
    clientMap.forEach((client, clientName) => {
      client.total_hours_used = client.weekly_hours.reduce((sum, hours) => sum + hours, 0);
    });

    // Now assign budget data to each client
    for (const [clientName, client] of clientMap) {
      const clientBudgets = clientBudgetMap.get(clientName) || [];
      
      if (clientBudgets.length > 0) {
        // Fetch project details to get start dates for proper sorting
        console.log(`📊 Fetching project details for ${clientName}...`);
        const projectsWithDetails = [];
        
        for (const budget of clientBudgets) {
          try {
            const projectDetails = await harvestAPI.fetchProjectDetails(budget.project_id);
            if (projectDetails) {
              projectsWithDetails.push({
                ...budget,
                start_date: projectDetails.starts_on,
                created_at: projectDetails.created_at,
                updated_at: projectDetails.updated_at
              });
            } else {
              // Fallback if we can't get details
              projectsWithDetails.push({
                ...budget,
                start_date: null,
                created_at: null,
                updated_at: null
              });
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.log(`⚠️ Could not fetch details for project ${budget.project_id}:`, error.message);
            projectsWithDetails.push({
              ...budget,
              start_date: null,
              created_at: null,
              updated_at: null
            });
          }
        }
        
        // Sort projects by start date (newest first), then by creation date, then by name
        const sortedBudgets = projectsWithDetails.sort((a, b) => {
          // First try to sort by start date
          if (a.start_date && b.start_date) {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateB.getTime() - dateA.getTime(); // Newest first
            }
          }
          
          // If start dates are the same or missing, sort by creation date
          if (a.created_at && b.created_at) {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateB.getTime() - dateA.getTime(); // Newest first
            }
          }
          
          // If dates are the same, fall back to name-based sorting
          const aHas25 = a.project_name.includes("'25");
          const bHas25 = b.project_name.includes("'25");
          const aHas24 = a.project_name.includes("'24");
          const bHas24 = b.project_name.includes("'24");
          
          // '25 projects are most recent
          if (aHas25 && !bHas25) return -1;
          if (!aHas25 && bHas25) return 1;
          
          // '24 projects are second most recent
          if (aHas24 && !bHas24) return -1;
          if (!aHas24 && bHas24) return 1;
          
          // For projects with same year, sort by project name (assuming newer projects have higher numbers)
          const aNumber = this.extractProjectNumber(a.project_name);
          const bNumber = this.extractProjectNumber(b.project_name);
          
          if (aNumber && bNumber) {
            return bNumber - aNumber; // Higher numbers first
          }
          
          return 0;
        });
        
        const latestBudget = sortedBudgets[0];
        client.latest_project = {
          project_id: latestBudget.project_id,
          project_name: latestBudget.project_name,
          start_date: latestBudget.start_date,
          created_at: latestBudget.created_at
        };
        
        console.log(`✅ Selected latest project for ${clientName}: ${latestBudget.project_name} (started: ${latestBudget.start_date || 'unknown'})`);
        
        // Use the actual budget from Harvest API
        if (latestBudget.budget_by === 'project') {
          // This is hours per project - use budget directly
          client.total_hours_pack = latestBudget.budget;
          // Use budget_remaining for hours remaining (not calculated from weekly data)
          client.total_hours_remaining = latestBudget.budget_remaining;
          console.log(`✅ Set hours pack for ${clientName}: ${latestBudget.budget} hours, ${latestBudget.budget_remaining} remaining (from project budget)`);
        } else if (latestBudget.budget_by === 'project_cost') {
          // This is total project fees - we can't convert to hours without hourly rate
          // For now, we'll use budget_remaining if available, otherwise estimate
          if (latestBudget.budget_remaining > 0) {
            client.total_hours_pack = latestBudget.budget_remaining;
            client.total_hours_remaining = latestBudget.budget_remaining;
            console.log(`⚠️ Using budget remaining for ${clientName}: ${latestBudget.budget_remaining} (cost-based project)`);
          } else {
            client.total_hours_pack = 0;
            client.total_hours_remaining = 0;
            console.log(`⚠️ No budget remaining for ${clientName} (cost-based project)`);
          }
        } else {
          // Other budget types - use budget if available
          client.total_hours_pack = latestBudget.budget || 0;
          client.total_hours_remaining = latestBudget.budget_remaining || 0;
          console.log(`✅ Set hours pack for ${clientName}: ${latestBudget.budget || 0} hours, ${latestBudget.budget_remaining || 0} remaining (${latestBudget.budget_by} budget)`);
        }
        
        // Store the budget details
        client.project_details[latestBudget.project_id] = latestBudget;
      } else {
        // No budget data found for this client
        console.log(`⚠️ No budget data found for ${clientName}`);
        client.total_hours_pack = 0;
      }
    }

    return Array.from(clientMap.values());
  }



  extractProjectNumber(projectName) {
    // Try to extract a number from the project name that might indicate recency
    const numberMatch = projectName.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1]) : null;
  }

  calculateVelocities(clientData) {
    const clients = clientData.map(client => {
      const totalHours = client.monthly_hours.reduce((sum, hours) => sum + hours, 0);
      const avgVelocity = totalHours / 6; // Average hours per month
      
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