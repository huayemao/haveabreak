import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):\//, '$1:/');

const webDir = path.resolve(__dirname, '..');
const apiDir = path.join(webDir, 'app', 'api');
const apiBackupDir = path.join(webDir, 'app', '_api');
const modalsDir = path.join(webDir, 'app', '[lang]', 'card', '@modals');
const modalsBackupDir = path.join(webDir, 'app', '[lang]', 'card', '_modals');

function copyDir(src, dest) {
  try {
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.cpSync(src, dest, { recursive: true, force: true });
      console.log(`Copied: ${src} -> ${dest}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error copying ${src}:`, err);
    return false;
  }
}

function removeDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`Removed: ${dir}`);
    }
  } catch (err) {
    console.error(`Error removing ${dir}:`, err);
  }
}

function restoreDir(src, dest) {
  try {
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.cpSync(src, dest, { recursive: true, force: true });
      fs.rmSync(src, { recursive: true, force: true });
      console.log(`Restored: ${src} -> ${dest}`);
    }
  } catch (err) {
    console.error(`Error restoring ${src}:`, err);
  }
}

async function main() {
  console.log('=== Preparing Tauri Build ===');
  
  console.log('\n1. Backing up and hiding dynamic folders...');
  const apiCopied = copyDir(apiDir, apiBackupDir);
  const modalsCopied = copyDir(modalsDir, modalsBackupDir);
  
  if (apiCopied) removeDir(apiDir);
  if (modalsCopied) removeDir(modalsDir);

  console.log('\n2. Compiling Service Worker for Tauri...');
  execSync('node scripts/build-sw.mjs', {
    cwd: webDir,
    stdio: 'inherit',
  });

  try {
    console.log('\n3. Building Next.js static export...');
    execSync('npx cross-env TAURI_BUILD=true next build', {
      cwd: webDir,
      stdio: 'inherit',
    });

    const outDir = path.join(webDir, 'out');
    const outSw = path.join(outDir, 'sw.js');
    const publicSw = path.join(webDir, 'public', 'sw.js');
    if (fs.existsSync(publicSw) && fs.existsSync(outDir)) {
      fs.copyFileSync(publicSw, outSw);
      console.log('Ensured sw.js copied to out/sw.js');
    }

    console.log('\n✅ Build completed successfully!');
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    throw err;
  } finally {
    console.log('\n4. Restoring dynamic folders...');
    restoreDir(apiBackupDir, apiDir);
    restoreDir(modalsBackupDir, modalsDir);
  }
}

main().catch(err => {
  console.error('Build process failed:', err);
  process.exit(1);
});
