#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Deleted: ${dirPath}`);
  } else {
    console.log(`⚠️  Directory not found: ${dirPath}`);
  }
}

function clearNextCache() {
  console.log('🧹 Clearing Next.js cache...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  
  // Clear .next directory
  const nextDir = path.join(projectRoot, '.next');
  deleteDirectory(nextDir);
  
  // Clear node_modules/.cache
  const nodeModulesCache = path.join(projectRoot, 'node_modules', '.cache');
  deleteDirectory(nodeModulesCache);
  
  console.log('\n✨ Cache cleared successfully!');
  console.log('💡 You can now restart your dev server.');
}

// Run the cache clearing
clearNextCache(); 