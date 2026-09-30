import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prodBundle = path.resolve(__dirname, 'dist-server', 'index.js');

async function run() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(prodBundle)) {
    await import('./dist-server/index.js');
  } else {
    await import('./server-core.ts');
  }
}

run().catch((err) => {
  console.error('[TenderGuard] Server failed to start:', err);
  process.exit(1);
});
