const fs = require('fs');
const path = require('path');

const UI_BUTTON_MAPPINGS = [
  // Generic Danger action buttons (trash)
  { regex: /className=["'][^"']*text-gray-400 hover:bg-red-50 hover:text-red-600[^"']*["']/g, replacement: 'className="btn btn-ghost btn-icon text-gray-400 hover:text-red-600 hover:bg-red-50"' },
  { regex: /className=["'][^"']*p-1\.5 min-w-\[32px\] min-h-\[32px\] text-gray-400 hover:text-red-600 hover:bg-red-50[^"']*["']/g, replacement: 'className="btn btn-ghost btn-icon text-gray-400 hover:text-red-600 hover:bg-red-50"' },
  { regex: /className=["'][^"']*text-red-400 hover:bg-red-50 rounded-lg transition-colors["']/g, replacement: 'className="btn btn-ghost btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"' },

  // Edit/Trash that wasn't caught
  { regex: /className=["'][^"']*p-1\.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors["']/g, replacement: 'className="btn btn-ghost btn-icon text-blue-600 hover:bg-blue-50"' },
  { regex: /className=["'][^"']*p-1\.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors["']/g, replacement: 'className="btn btn-ghost btn-icon text-red-600 hover:bg-red-50"' },

  // Create Plus buttons
  { regex: /className=["'][^"']*px-5 py-2\.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm["']/g, replacement: 'className="btn btn-primary btn-md"' },

  // Secondary buttons that have white text and a generic dark background
  { regex: /className=["'][^"']*px-3.5 py-2 bg-dark hover:bg-dark-2 text-white[^"']*["']/g, replacement: 'className="btn btn-secondary btn-sm"' },

  // Ghost cancel action
  { regex: /className=["'][^"']*px-[0-9.]+ py-[0-9.]+ border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors["']/g, replacement: 'className="btn btn-ghost btn-md"' },
  
  // Specific outline
  { regex: /className=["'][^"']*px-[0-9.]+ py-[0-9.]+ bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors["']/g, replacement: 'className="btn btn-outline btn-md"' },
  
  // Primary big
  { regex: /className=["'][^"']*py-[0-9.]+ bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm["']/g, replacement: 'className="btn btn-primary btn-md w-full disabled:opacity-60"' },

  // Exact class maps (Avoid double replacement by using lookaround if needed, but since we use Exact match and replace, double match won't happen if we search carefully, but we have "btn-primary" inside "btn btn-primary". Only convert if it's strictly the old standard.)
  { regex: /className="btn-dark"/g, replacement: 'className="btn btn-secondary btn-md"' },
  { regex: /className="btn-primary"/g, replacement: 'className="btn btn-primary btn-md"' },
  { regex: /className="btn-outline"/g, replacement: 'className="btn btn-outline btn-md"' },

  // Pagination buttons
  { regex: /className={`w-\[40px\] h-\[40px\] rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300 \${[^}]+ \? 'bg-primary text-white shadow-md shadow-primary\/20 scale-110' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-dark hover:border-gray-200'}`}/g, replacement: 'className={`btn btn-icon btn-sm ${page === p ? "btn-primary scale-110" : "btn-outline text-gray-500 hover:text-dark"}`}' }
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  UI_BUTTON_MAPPINGS.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

const targetDirs = [
  path.join(__dirname, 'frontend/src/app'),
  path.join(__dirname, 'frontend/src/components')
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});
console.log('Done cleaning up all pages.');
