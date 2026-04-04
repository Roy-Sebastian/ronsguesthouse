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

  // We are looking for
  //      {/* Chart */}
  //      {chartData.labels.length > 0 && (
  //        <div className="card p-6 mb-6">
  
  if (content.includes('<div className="card p-6 mb-6">')) {
     const replacement = '<div className="card p-6 mb-6 lg:w-2/3">';
     
     // Only replace the first occurrence after Chart tag to avoid replacing other cards
     // we can do a targeted regex
     content = content.replace(
       /\{\/\* Chart \*\/\}\s*\{chartData\.labels\.length > 0 && \(\s*<div className="card p-6 mb-6">/,
       '{/* Chart */}\n      {chartData.labels.length > 0 && (\n        <div className="card p-6 mb-6 lg:w-2/3">'
     );
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated width: ${filePath}`);
  }
}

FILES_TO_CHECK.forEach(processFile);
console.log('Done adjusting max width');
