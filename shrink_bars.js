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

  // Replace borderRadius: 8 with borderRadius: 4 + barPercentages
  // We handle both variants of trailing comma
  content = content.replace(
    /borderRadius:\s*8,?/g, 
    'borderRadius: 4,\n          barPercentage: 0.6,\n          categoryPercentage: 0.8,'
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated bar thickness: ${filePath}`);
  }
}

FILES_TO_CHECK.forEach(processFile);
console.log('Done adjusting bar thicknesses.');
