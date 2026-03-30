import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walkSync(p, filelist);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(p);
    }
  }
  return filelist;
}

const dashboardDir = path.join(process.cwd(), 'src', 'app', '(dashboard)');
const files = walkSync(dashboardDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // 1. Remove statusBadge definition
  content = content.replace(/const\s+statusBadge.*=\s*\{[\s\S]*?\};\n?/g, '');
  // 2. Remove statusLabel definition
  content = content.replace(/const\s+statusLabel.*=\s*\{[\s\S]*?\};\n?/g, '');
  
  // 3. Remove formatRp definitions
  content = content.replace(/const\s+formatRp\s*=\s*\([^\)]*\)\s*=>\s*new\s+Intl\.NumberFormat\([^)]*\)\.format\([^)]*\);\n?/g, '');
  content = content.replace(/const\s+formatRp\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?return\s*new\s+Intl\.NumberFormat\([^)]*\)\.format\([^)]*\);\s*\};\n?/g, '');
  content = content.replace(/const\s+formatRp\s*=\s*\(\s*v\s*:\s*number\s*\)\s*=>\s*new\s+Intl\.NumberFormat\('id-ID',\s*\{\s*style:\s*'currency',\s*currency:\s*'IDR',\s*maximumFractionDigits:\s*0\s*\}\)\.format\(v\);\n?/g, '');
  content = content.replace(/const\s+formatRp\s*=\s*\([^)]+\)\s*=>\s*new\s+Intl\.NumberFormat[^;]+;\n?/g, '');
  
  // 4. Remove fmtDate definitions
  content = content.replace(/const\s+fmtDate\s*=\s*\([^)]*\)\s*=>\s*new\s+Date\([^)]*\)\.toLocaleDateString\([^)]*\);\n?/g, '');
  content = content.replace(/const\s+fmtDate\s*=\s*\([^)]*\)\s*=>\s*new\s+Date\([^)]*\)\.toLocaleString\([^)]*\);\n?/g, '');
  content = content.replace(/const\s+fmtDate\s*=\s*\(d:\s*any\)\s*=>\s*new\s+Date\([^)]*\)\.toLocaleDateString\([^)]*\);\n?/g, '');

  
  // 5. Remove calculateDays definition
  content = content.replace(/const\s+calculateDays\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?return\s*diffDays\s*>\s*0\s*\?\s*diffDays\s*:\s*1;\s*\n?\};\n?/g, '');
  content = content.replace(/const\s+calculateDays\s*=\s*\([^\)]+\)\s*=>\s*\{[^}]+\};\n?/g, '');


  // 6. Replace usages
  content = content.replace(/statusBadge(?!\w)/g, 'STATUS_BADGE');
  content = content.replace(/statusLabel(?!\w)/g, 'STATUS_LABEL');

  // Track dependencies
  const needsConstants = /STATUS_BADGE|STATUS_LABEL/.test(content);
  let importFormatters = [];
  if (content.includes('formatRp(')) importFormatters.push('formatRp');
  if (content.includes('fmtDate(')) importFormatters.push('fmtDate');
  if (content.includes('calculateDays(')) importFormatters.push('calculateDays');
  // fallback calculations could be 'calculateNights' but usually here it's calculateDays
  
  // Add formatters imports if needed and not present
  if (importFormatters.length > 0) {
    if (!content.includes('@/lib/formatters')) {
      const importStmt = `import { ${importFormatters.join(', ')} } from '@/lib/formatters';\n`;
      const match = content.match(/^import .*;$/m) || content.match(/^import .*$/m);
      if (match) {
        content = content.replace(match[0], match[0] + '\n' + importStmt);
      } else {
        content = importStmt + content;
      }
    } else {
      // It exists, try to ensure elements are exported
      const mr = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/formatters['"]/);
      if (mr) {
        const existing = mr[1].split(',').map(s => s.trim());
        importFormatters.forEach(imp => {
           if(!existing.includes(imp)) existing.push(imp);
        });
        content = content.replace(mr[0], `import { ${existing.join(', ')} } from '@/lib/formatters'`);
      }
    }
  }

  // Add constants imports
  if (needsConstants) {
    if (!content.includes('@/lib/constants')) {
      const importStmt = `import { STATUS_BADGE, STATUS_LABEL } from '@/lib/constants';\n`;
      const match = content.match(/^import .*;$/m) || content.match(/^import .*$/m);
      if (match) {
        content = content.replace(match[0], match[0] + '\n' + importStmt);
      } else {
        content = importStmt + content;
      }
    } else {
      // It exists
      const mr = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/constants['"]/);
      if (mr) {
        let existing = mr[1].split(',').map(s => s.trim());
        if(content.includes('STATUS_BADGE') && !existing.includes('STATUS_BADGE')) existing.push('STATUS_BADGE');
        if(content.includes('STATUS_LABEL') && !existing.includes('STATUS_LABEL')) existing.push('STATUS_LABEL');
        content = content.replace(mr[0], `import { ${existing.join(', ')} } from '@/lib/constants'`);
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Refactored: ${file.replace(process.cwd(), '')}`);
  }
});

console.log('Dashboard refactoring completed.');
