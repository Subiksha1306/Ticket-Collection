import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '.env') });

const CRON_SECRET = process.env.CRON_SECRET;
const TARGET_URL = 'http://localhost:3000/api/cron/process-emails';

async function testCronJob() {
  console.log(`🚀 Triggering Email Ingestion API at ${TARGET_URL}...`);
  console.log(`Using CRON_SECRET: ${CRON_SECRET ? '✅ Found' : '❌ Missing'}`);
  
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET is not defined in your .env file.');
    process.exit(1);
  }

  try {
    const response = await fetch(TARGET_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! API Response:');
      console.dir(data, { depth: null, colors: true });
    } else {
      console.error('❌ Failed! API returned status:', response.status);
      console.error(data);
    }
  } catch (error) {
    console.error('❌ Network error attempting to reach the API:');
    console.error(error.message);
    console.log('\nMake sure your Next.js development server is running on localhost:3000 (npm run dev)');
  }
}

testCronJob();
