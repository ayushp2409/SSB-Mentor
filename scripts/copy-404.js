import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✓ Successfully created dist/404.html for GitHub Pages SPA routing fallback.');
} else {
  console.warn('Warning: dist/index.html was not found, could not create dist/404.html.');
}
