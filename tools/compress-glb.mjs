import { spawn } from 'node:child_process';
import { mkdir, copyFile, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'modelo');
const DEST = join(ROOT, 'public/models');

// Animated GLBs must skip mesh simplification — welding can corrupt skinning weights
// and ruin the AnimationMixer playback.
const MODELS = [
  { src: 'agua.glb',                out: 'agua.final.glb',                 textureSize: 2048, simplify: true },
  { src: 'algas.glb',               out: 'algas.final.glb',                textureSize: 1024, simplify: true },
  { src: 'ancla.glb',               out: 'ancla.final.glb',                textureSize: 1024, simplify: true },
  { src: 'burbujas.glb',            out: 'burbujas.final.glb',             textureSize: 1024, simplify: false },
  { src: 'cadenaparaelancla.glb',   out: 'cadenaparaelancla.final.glb',    textureSize: 1024, simplify: true },
  { src: 'coral.glb',               out: 'coral.final.glb',                textureSize: 1024, simplify: true },
  { src: 'coral_azul.glb',          out: 'coral_azul.final.glb',           textureSize: 1024, simplify: true },
  { src: 'infralitoral.glb',        out: 'infralitoral.final.glb',         textureSize: 2048, simplify: true },
  { src: 'tortuga.glb',             out: 'tortuga.final.glb',              textureSize: 1024, simplify: false },
  { src: 'boeing/source/Atlas Air Boeing 747-100 N3203Y.glb',
    out: 'boeing/boeing.final.glb', textureSize: 1024, simplify: true },
];

async function exists(p) { try { await access(p); return true; } catch { return false; } }

function run(cmd, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    let stderr = '';
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => code === 0 ? resolveRun() : reject(new Error(`${cmd} exited ${code}\n${stderr}`)));
  });
}

await mkdir(DEST, { recursive: true });
await mkdir(join(DEST, 'boeing'), { recursive: true });

for (const m of MODELS) {
  const inPath = join(SRC, m.src);
  const outPath = join(DEST, m.out);
  if (!(await exists(inPath))) {
    console.warn(`[skip] ${m.src} (not found)`);
    continue;
  }
  const args = [
    '-y', '@gltf-transform/cli', 'optimize', inPath, outPath,
    '--compress', 'draco',
    '--texture-compress', 'webp',
    '--texture-size', String(m.textureSize),
    '--simplify', String(m.simplify),
  ];
  if (m.simplify) args.push('--weld', 'true');
  process.stdout.write(`[compress] ${m.src} → ${m.out} ... `);
  const t0 = Date.now();
  await run('npx', args);
  process.stdout.write(`${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

console.log('done');
