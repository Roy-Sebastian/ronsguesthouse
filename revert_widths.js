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

  // Revert lg:w-2/3 back to full width
  content = content.replace(
    /<div className="card p-6 mb-6 lg:w-2\/3">/g, 
    '<div className="card p-6 mb-6">'
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Reverted width: ${filePath}`);
  }
}

FILES_TO_CHECK.forEach(processFile);
console.log('Done reverting widths.');
