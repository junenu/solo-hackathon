import { initDatabase } from './database';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase()
  .then(() => {
    console.log('Database migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database migration failed:', err);
    process.exit(1);
  });