#!/usr/bin/env node

import ClientProcessor from './src/client-processor.js';

const processor = new ClientProcessor();

// Test cases based on the requirements
const testCases = [
  "Client Name Hours '25 Pack #1",
  "Client Name 25 '25 Pt 1", 
  "Another Client '24 Hours",
  "Test Client Pack 2",
  "Simple Client Name",
  "Client with Numbers 123",
  "Client '25 Hours Part 2",
  "Complex Client Name '24 Pack #3 Pt 1",
  "Adaptive Security Hours '25",
  "Tech Startup Inc '24 Pack #2",
  "Design Agency '25 Pt 1",
  "Marketing Firm Hours Pack #1",
  "Consulting Group '24 Part 2",
  "Software Company '25 Hours",
  "Creative Studio Pack #3"
];

console.log('🧪 Client Name Normalization Test');
console.log('='.repeat(60));
console.log('This demonstrates how the tool extracts base client names');
console.log('from messy project names in Harvest.\n');

testCases.forEach((originalName, index) => {
  const normalized = processor.normalizeClientName(originalName);
  console.log(`${(index + 1).toString().padStart(2)}. Original: "${originalName}"`);
  console.log(`    Normalized: "${normalized}"`);
  console.log('');
});

console.log('='.repeat(60));
console.log('✅ Test completed! The normalized names will be used to');
console.log('   aggregate projects under the same client.'); 