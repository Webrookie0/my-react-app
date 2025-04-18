/**
 * Script to initialize Supabase and start the application
 * 
 * Usage:
 * node src/scripts/start-supabase.js
 * 
 * This script will:
 * 1. Check if Supabase is properly configured
 * 2. Seed dummy users if they don't exist
 * 3. Start the React application
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if Supabase is configured
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Supabase configuration is missing!');
  console.log('\x1b[33m%s\x1b[0m', 'Please create a .env file with the following variables:');
  console.log('REACT_APP_SUPABASE_URL=your-supabase-url');
  console.log('REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.log('\nOr copy the .env.example file:');
  console.log('\x1b[36m%s\x1b[0m', 'cp .env.example .env');
  process.exit(1);
}

console.log('\x1b[32m%s\x1b[0m', '✓ Supabase configuration found');
console.log('\x1b[36m%s\x1b[0m', `URL: ${SUPABASE_URL.substring(0, 25)}...`);

// Check if SQL schema exists
const schemaPath = path.join(__dirname, '../../supabase/schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('\x1b[33m%s\x1b[0m', 'Warning: SQL schema file not found at supabase/schema.sql');
  console.log('This is not an error, but you should configure your Supabase database tables manually.');
} else {
  console.log('\x1b[32m%s\x1b[0m', '✓ SQL schema file found');
  console.log('\x1b[36m%s\x1b[0m', `You can run this SQL script in the Supabase dashboard: ${schemaPath}`);
}

console.log('\x1b[32m%s\x1b[0m', '\n✓ Starting React application with Supabase...');
console.log('\x1b[36m%s\x1b[0m', 'When the app starts, click the "Add Demo Users" button on the home page to populate the database');

// Start the React application
const reactApp = exec('npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

reactApp.stdout.on('data', (data) => {
  console.log(data);
});

reactApp.stderr.on('data', (data) => {
  console.error(data);
}); 