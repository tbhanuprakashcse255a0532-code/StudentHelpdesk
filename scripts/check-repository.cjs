const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden = files.filter(p => /(^|\/)(node_modules|build|__pycache__|\.venv)\//.test(p) ||
  /(^|\/)\.env($|\.)/.test(p) && !p.endsWith('.env.example') ||
  p.startsWith('Backend/uploads/') && !p.endsWith('/.gitkeep'));
if (forbidden.length) throw new Error('Remove private/generated files from Git index: ' + forbidden.join(', '));
console.log('Repository file exclusions passed. This is not a full secret scanner.');

