const fs = require('fs');
const path = require('path');

// Adjust the path if your assets.js is elsewhere
const assetsPath = path.join(__dirname, 'src/assets/frontend_assets/assets.js');
const file = fs.readFileSync(assetsPath, 'utf8');

// Regex to match name and description fields
const nameRegex = /name:\s*["'`](.*?)["'`]/g;
const descRegex = /description:\s*["'`](.*?)["'`]/g;

const names = new Set();
const descriptions = new Set();

let match;
while ((match = nameRegex.exec(file)) !== null) {
  names.add(match[1]);
}
while ((match = descRegex.exec(file)) !== null) {
  descriptions.add(match[1]);
}

console.log('\n// --- ENGLISH ---');
names.forEach(name => console.log(`"${name}": "${name}",`));
descriptions.forEach(desc => console.log(`"${desc}": "${desc}",`));

console.log('\n// --- ARABIC (replace with your translations) ---');
names.forEach(name => console.log(`"${name}": "",`));
descriptions.forEach(desc => console.log(`"${desc}": "",`)); 