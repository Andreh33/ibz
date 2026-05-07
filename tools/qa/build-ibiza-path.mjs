// Stitches Ibiza coastline (OSM relation 6076060) into a single SVG path,
// simplifies via Douglas-Peucker, and projects to a 600x400 viewBox suitable
// for the IbizaSilhouette component.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IN = join(ROOT, '_source/qa/step7/ibiza-geom.json');

const data = JSON.parse(readFileSync(IN, 'utf-8'));
const rel = data.elements.find((e) => e.type === 'relation');
const outers = rel.members.filter((m) => m.role === 'outer' && m.geometry && m.geometry.length >= 2);

// Stitch ways into closed rings. Each ring is a sequence of [lon, lat] pairs.
function stitchRings(ways) {
  const rings = [];
  const remaining = ways.map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  while (remaining.length) {
    let current = remaining.shift().slice();
    let extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i];
        const last = current[current.length - 1];
        const wFirst = w[0];
        const wLast = w[w.length - 1];
        const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
        if (eq(last, wFirst)) {
          current.push(...w.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
        if (eq(last, wLast)) {
          current.push(...w.slice().reverse().slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
      if (eq(current[0], current[current.length - 1])) break;
    }
    rings.push(current);
  }
  return rings;
}
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];

const rings = stitchRings(outers);
console.log('stitched rings:', rings.length, 'sizes:', rings.map((r) => r.length));

// Pick the biggest ring (the main island) — discard tiny offshore rocks.
rings.sort((a, b) => b.length - a.length);
const main = rings[0];
console.log('main ring points:', main.length);

// Douglas-Peucker simplification on lon/lat (tolerance in degrees).
function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const cx = a[0] + Math.max(0, Math.min(1, t)) * dx;
  const cy = a[1] + Math.max(0, Math.min(1, t)) * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}
function simplify(points, tol) {
  if (points.length < 3) return points.slice();
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let maxD = 0;
    let maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const d = perpDist(points[k], points[i], points[j]);
      if (d > maxD) {
        maxD = d;
        maxK = k;
      }
    }
    if (maxD > tol && maxK !== -1) {
      keep[maxK] = true;
      stack.push([i, maxK], [maxK, j]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Tolerance ~0.0008° ≈ 90m at 39°N — enough to read shape, far below pixel
// resolution at 600×400 viewBox.
const simplified = simplify(main, 0.0008);
console.log('simplified to:', simplified.length, 'points');

// Compute bbox in lon/lat.
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const [lon, lat] of simplified) {
  if (lon < minLon) minLon = lon;
  if (lon > maxLon) maxLon = lon;
  if (lat < minLat) minLat = lat;
  if (lat > maxLat) maxLat = lat;
}
console.log(`bbox lon: ${minLon}–${maxLon}  lat: ${minLat}–${maxLat}`);

// Project to viewBox 600×400. Account for latitude distortion (cos at 39°N
// stretches lon → x ratio): use simple equirectangular with lat scale.
const latMid = (minLat + maxLat) / 2;
const lonScale = Math.cos((latMid * Math.PI) / 180);
const lonRange = (maxLon - minLon) * lonScale;
const latRange = maxLat - minLat;

// Fit shape into the viewBox with 40px margin, preserving aspect ratio.
const VB_W = 600;
const VB_H = 400;
const MARGIN = 40;
const innerW = VB_W - MARGIN * 2;
const innerH = VB_H - MARGIN * 2;
const scale = Math.min(innerW / lonRange, innerH / latRange);
const drawW = lonRange * scale;
const drawH = latRange * scale;
const offsetX = (VB_W - drawW) / 2;
const offsetY = (VB_H - drawH) / 2;

function project(lon, lat) {
  const x = offsetX + (lon - minLon) * lonScale * scale;
  const y = offsetY + (maxLat - lat) * scale; // invert Y: north up
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// Build SVG path "M x y L x y L ... Z".
const projected = simplified.map(([lon, lat]) => project(lon, lat));
let d = `M ${projected[0][0]} ${projected[0][1]}`;
for (let i = 1; i < projected.length; i++) {
  d += ` L ${projected[i][0]} ${projected[i][1]}`;
}
d += ' Z';

// Project Cala San Vicente coords (39.0867°N, 1.4750°E) for the pin.
const pinLat = 39.0867;
const pinLon = 1.4750;
const [pinX, pinY] = project(pinLon, pinLat);
console.log(`pin at SVG (${pinX}, ${pinY})`);

const out = {
  path: d,
  viewBox: `0 0 ${VB_W} ${VB_H}`,
  pin: { x: pinX, y: pinY },
  pointCount: projected.length,
};
writeFileSync(join(ROOT, '_source/qa/step7/ibiza-path.json'), JSON.stringify(out, null, 2));
console.log(`wrote ibiza-path.json — ${out.pointCount} pts, path length ${d.length} chars`);

// Also write a preview SVG for visual inspection.
const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}">
  <rect width="100%" height="100%" fill="#0E202C"/>
  <path d="${d}" fill="rgba(201, 168, 107, 0.2)" stroke="#C9A86B" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="${pinX}" cy="${pinY}" r="6" fill="#C9A86B" opacity="0.4"/>
  <circle cx="${pinX}" cy="${pinY}" r="3" fill="#C9A86B"/>
  <text x="${pinX + 10}" y="${pinY - 6}" fill="#F5F0E6" font-family="monospace" font-size="10">CALA SAN VICENTE</text>
</svg>`;
writeFileSync(join(ROOT, '_source/qa/step7/ibiza-preview.svg'), previewSvg);
console.log('wrote ibiza-preview.svg');
