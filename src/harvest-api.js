import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class HarvestAPI {
  constructor() {
    this.accountId = process.env.HARVEST_ACCOUNT_ID;
    this.accessToken = process.env.HARVEST_ACCESS_TOKEN;
    this.baseUrl = process.env.HARVEST_BASE_URL || 'https://api.harvestapp.com';
    
    if (!this.accountId || !this.accessToken) {
      throw new Error('Missing required Harvest API credentials. Please set HARVEST_ACCOUNT_ID and HARVEST_ACCESS_TOKEN in your .env file.');
    }
    
    // Log configuration (without exposing sensitive data)
    console.log(`Harvest API configured for account: ${this.accountId}`);
    console.log(`API Base URL: ${this.baseUrl}`);
  }

  async fetchWeeklyData(fromDate, toDate) {
    const url = `${this.baseUrl}/v2/reports/time/projects`;
    const params = new URLSearchParams({
      from: fromDate,
      to: toDate,
      page: 1,
      per_page: 1000 // Adjust if needed
    });

    const fullUrl = `${url}?${params}`;
    console.log(`📊 Fetching: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Harvest-Account-ID': this.accountId,
          'User-Agent': 'Velocity-Tracker/1.0'
        }
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Harvest API error response:`, errorText);
        throw new Error(`Harvest API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 Received ${data.results ? data.results.length : data.length || 0} projects for ${fromDate} to ${toDate}`);
      
      // Handle different response structures
      if (data.results && Array.isArray(data.results)) {
        return this.filterActiveHourlyProjects(data.results);
      } else if (Array.isArray(data)) {
        return this.filterActiveHourlyProjects(data);
      } else {
        console.log('⚠️ Unexpected API response structure:', JSON.stringify(data, null, 2));
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching data for ${fromDate} to ${toDate}:`, error.message);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🔍 This might be a network or CORS issue. Check your internet connection and API credentials.');
      }
      return [];
    }
  }

  filterActiveHourlyProjects(projects) {
    return projects.filter(project => {
      // Check if project structure exists
      if (!project) {
        console.log('Skipping project with invalid structure:', project);
        return false;
      }
      
      // For flat structure, we can't filter by is_active or bill_by
      // So we'll include all projects with hours > 0
      return project.total_hours > 0;
    }).map(project => {
      // Transform to expected structure
      const projectData = project.project || project;
      const clientData = project.client || { name: project.client_name };
      
      return {
        project: {
          ...projectData,
          client: clientData,
          is_active: true, // Assume active since we can't check
          bill_by: 'People' // Assume hourly since we can't check
        },
        total_hours: project.total_hours,
        billable_hours: project.billable_hours || project.total_hours,
        project_name: project.project_name,
        project_id: project.project_id,
        client_name: project.client_name,
        client_id: project.client_id
      };
    });
  }



  async fetchAllWeeklyData(weeks) {
    const allData = [];
    
    for (const week of weeks) {
      console.log(`Fetching data for week ending ${week.to}...`);
      const weekData = await this.fetchWeeklyData(week.from, week.to);
      allData.push({
        weekEnding: week.to,
        projects: weekData
      });
      
      // Rate limiting - Harvest allows 100 requests per 15 seconds
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    return allData;
  }

  async fetchProjectBudgetData() {
    const url = `${this.baseUrl}/v2/reports/project_budget`;
    const params = new URLSearchParams({
      page: 1,
      per_page: 2000,
      is_active: true
    });

    const fullUrl = `${url}?${params}`;
    console.log(`📊 Fetching project budget data: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Harvest-Account-ID': this.accountId,
          'User-Agent': 'Velocity-Tracker/1.0'
        }
      });

      console.log(`📊 Project budget response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Project budget API error response:`, errorText);
        throw new Error(`Project budget API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 Received ${data.results ? data.results.length : 0} projects with budget data`);
      
      return data.results || [];
    } catch (error) {
      console.error(`❌ Error fetching project budget data:`, error.message);
      return [];
    }
  }

  async fetchProjectDetails(projectId) {
    const url = `${this.baseUrl}/v2/projects/${projectId}`;
    
    try {
      console.log(`📊 Fetching project details for ${projectId}...`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Harvest-Account-ID': this.accountId,
          'User-Agent': 'Velocity-Tracker/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Project details API error for ${projectId}:`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Fetched project details for ${projectId}`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching project details for ${projectId}:`, error.message);
      return null;
    }
  }
}

export default HarvestAPI; 