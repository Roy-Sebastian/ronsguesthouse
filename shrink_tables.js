const fs = require('fs');
const path = require('path');

const FILES_TO_CHECK = [
  'frontend/src/app/(dashboard)/admin/income/page.tsx',
  'frontend/src/app/(dashboard)/admin/expenses/page.tsx',
  'frontend/src/app/(dashboard)/superadmin/income/page.tsx',
  'frontend/src/app/(dashboard)/superadmin/expenses/page.tsx',
  'frontend/src/app/(dashboard)/receptionist/income/page.tsx',
  'frontend/src/app/(dashboard)/receptionist/expenses/page.tsx'
];

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Decrease padding in th
  content = content.replace(/px-[56] py-[34](?:\.5)?/g, 'px-4 py-3');
  
  // Optional: Ensure text size is crisp if it was larger
  // content = content.replace(/text-sm/g, 'text-xs'); 

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

FILES_TO_CHECK.forEach(processFile);
console.log('Done adjusting table sizes.');
