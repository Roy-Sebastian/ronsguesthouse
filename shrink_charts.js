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

  const searchStr1 = `<div className="overflow-x-auto w-full pb-4">\r\n            <div\r\n              style={{\r\n                minWidth: \`\${Math.max(chartData.labels.length * 60, 600)}px\`,\r\n                height: 240,\r\n              }}\r\n            >`;
  const searchStr2 = `<div className="overflow-x-auto w-full pb-4">\n            <div\n              style={{\n                minWidth: \`\${Math.max(chartData.labels.length * 60, 600)}px\`,\n                height: 240,\n              }}\n            >`;

  const replaceStr = `<div className="w-full">\n            <div style={{ height: 280 }}>`;

  if (content.includes(searchStr1)) {
    content = content.split(searchStr1).join(replaceStr);
  } else if (content.includes(searchStr2)) {
    content = content.split(searchStr2).join(replaceStr);
  } else {
    // try regex for fallback
    const pattern = /<div className="overflow-x-auto w-full pb-4">[\s\S]*?minWidth: `\$\{Math\.max\(chartData\.labels\.length \* 60, 600\)\}px`,[\s\S]*?height: 240,[\s\S]*?\}[\s\S]*?>/m;
    content = content.replace(pattern, replaceStr);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated chart wrapper: ${filePath}`);
  }
}

FILES_TO_CHECK.forEach(processFile);
console.log('Done adjusting chart sizes.');
