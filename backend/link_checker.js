const fs = require('fs');
const path = require('path');
const https = require('https');

// Path to mockData.ts
const mockDataPath = path.resolve(__dirname, '../frontend/lib/utils/mockData.ts');

if (!fs.existsSync(mockDataPath)) {
  console.error(`mockData.ts not found at ${mockDataPath}`);
  process.exit(1);
}

const content = fs.readFileSync(mockDataPath, 'utf8');

// We want to find the SEED_SUBJECTS array specifically
// It starts at: export const SEED_SUBJECTS: Subject[] = [
// and ends before: export const SEED_CONCEPTS
const subjectsStartIndex = content.indexOf('export const SEED_SUBJECTS: Subject[] =');
const subjectsEndIndex = content.indexOf('export const SEED_CONCEPTS');

if (subjectsStartIndex === -1) {
  console.error('Could not find SEED_SUBJECTS in mockData.ts');
  process.exit(1);
}

const subjectsContent = content.substring(subjectsStartIndex, subjectsEndIndex === -1 ? content.length : subjectsEndIndex);

// Extract all links
const linkRegex = /resourceLink:\s*'([^']+)'/g;
const links = [];
let match;
while ((match = linkRegex.exec(subjectsContent)) !== null) {
  links.push(match[1]);
}

const uniqueLinks = Array.from(new Set(links));
console.log(`Found ${uniqueLinks.length} unique resource links in SEED_SUBJECTS.`);

// Helper to check a URL status
function checkUrl(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000
    };
    
    const req = https.get(url, options, (res) => {
      // Check if redirects (3xx)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve({ url, status: res.statusCode, redirect: res.headers.location, ok: true });
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ url, status: res.statusCode, ok: true });
      } else {
        resolve({ url, status: res.statusCode, ok: false });
      }
    });

    req.on('error', (e) => {
      resolve({ url, status: null, error: e.message, ok: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: null, error: 'TIMEOUT', ok: false });
    });
  });
}

async function checkAll() {
  const results = [];
  const batchSize = 5; // run in batches to avoid rate limit or timeout
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize);
    console.log(`Checking batch ${i/batchSize + 1} of ${Math.ceil(uniqueLinks.length / batchSize)}...`);
    const batchResults = await Promise.all(batch.map(url => checkUrl(url)));
    results.push(...batchResults);
  }

  console.log('\n======================================');
  console.log('            LINK CHECK REPORT          ');
  console.log('======================================\n');

  const broken = results.filter(r => !r.ok);
  const ok = results.filter(r => r.ok);

  console.log(`Total checked: ${results.length}`);
  console.log(`OK: ${ok.length}`);
  console.log(`Broken/404/Error: ${broken.length}\n`);

  if (broken.length > 0) {
    console.log('Broken Links List:');
    broken.forEach((r, idx) => {
      console.log(`${idx + 1}. [Status ${r.status || 'ERROR'}] ${r.url} ${r.error ? `(Error: ${r.error})` : ''}`);
    });
  } else {
    console.log('All links are fully functional!');
  }
}

checkAll();
