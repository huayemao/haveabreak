import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const swSrc = path.join(rootDir, 'app', 'sw.ts');
const swDest = path.join(rootDir, 'public', 'sw.js');

async function build() {
  console.log('[SW Build] Bundling Service Worker with esbuild...');
  const isProd = process.env.NODE_ENV === 'production' || process.env.TAURI_BUILD === 'true';
  await esbuild.build({
    entryPoints: [swSrc],
    bundle: true,
    outfile: swDest,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: isProd,
    sourcemap: !isProd,
  });
  console.log('[SW Build] Successfully generated public/sw.js');
}

build().catch((err) => {
  console.error('[SW Build] Build failed:', err);
  process.exit(1);
});
