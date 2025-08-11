import dotenv from 'dotenv';
import HarvestAPI from './src/harvest-api.js';

dotenv.config();

async function testHarvestAPI() {
  console.log('🧪 Testing Harvest API connection...');
  
  try {
    const harvestAPI = new HarvestAPI();
    console.log('✅ Harvest API initialized successfully');
    
    // Test with a recent date range
    const fromDate = '2024-12-01';
    const toDate = '2024-12-07';
    
    console.log(`📊 Testing time reports API call for ${fromDate} to ${toDate}...`);
    const timeData = await harvestAPI.fetchWeeklyData(fromDate, toDate);
    
    console.log(`✅ Time reports API call successful! Received ${timeData.length} projects`);
    
    if (timeData.length > 0) {
      console.log('📋 Sample time data:');
      console.log(JSON.stringify(timeData[0], null, 2));
    }
    
    // Test the new project budget API
    console.log('\n📊 Testing project budget API...');
    const budgetData = await harvestAPI.fetchProjectBudgetData();
    
    console.log(`✅ Project budget API call successful! Received ${budgetData.length} projects with budgets`);
    
    if (budgetData.length > 0) {
      console.log('📋 Sample budget data:');
      console.log(JSON.stringify(budgetData[0], null, 2));
      
      // Show some budget statistics
      const projectBudgets = budgetData.filter(p => p.budget_by === 'project');
      const costBudgets = budgetData.filter(p => p.budget_by === 'project_cost');
      
      console.log(`\n📈 Budget Summary:`);
      console.log(`- Total projects with budgets: ${budgetData.length}`);
      console.log(`- Projects with hour budgets: ${projectBudgets.length}`);
      console.log(`- Projects with cost budgets: ${costBudgets.length}`);
      
      if (projectBudgets.length > 0) {
        const avgHours = projectBudgets.reduce((sum, p) => sum + p.budget, 0) / projectBudgets.length;
        console.log(`- Average hours per project: ${avgHours.toFixed(1)}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Run the test
testHarvestAPI().then(success => {
  if (success) {
    console.log('\n🎉 API test passed! You can now run the app.');
  } else {
    console.log('\n💥 API test failed! Please check your credentials and try again.');
    process.exit(1);
  }
}); 