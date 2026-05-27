const fs = require('fs');
const path = require('path');

// Environment variable expected from Vercel: BACKEND_URL
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

const out = {
  backendUrl,
};

const outPath = path.join(__dirname, '..', 'src', 'assets', 'runtime.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Wrote runtime config to', outPath, 'with', out);
