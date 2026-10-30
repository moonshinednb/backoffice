import * as THREE from './vendor/three/three.module.min.js';
import { SVGLoader } from './vendor/three/SVGLoader.js';

// Transform the contours before extrusion. A mirrored mesh reverses winding
// and makes the bevel/shadow result harder to reason about.
function contour(points) {
  const result = [];
  for (const point of points) {
    const next = new THREE.Vector2(point.x, -point.y);
    if (!result.length || next.distanceToSquared(result.at(-1)) > 0.000001) result.push(next);
  }
  if (result.length > 1 && result[0].distanceToSquared(result.at(-1)) < 0.000001) result.pop();
  if (result.length < 3) throw new Error('Invalid logo contour');
  return result;
}

export function logoShapes(paths) {
  const shapes = paths.flatMap(path => {
    // This Moonshine asset declares evenodd on the SVG root. Make it explicit
    // on every path, including engines that omit inherited SVG inline styles.
    path.userData = { ...path.userData, style: { ...path.userData?.style, fillRule: 'evenodd' } };
    return SVGLoader.createShapes(path).map(source => {
      const points = source.extractPoints(48);
      const shape = new THREE.Shape(contour(points.shape));
      shape.holes = points.holes.map(hole => new THREE.Path(contour(hole)));
      return shape;
    });
  });
  const holes = shapes.reduce((count, shape) => count + shape.holes.length, 0);
  if (shapes.length !== 6 || holes !== 2) throw new Error(`Invalid Moonshine silhouette: ${shapes.length} components, ${holes} holes`);
  return shapes;
}

/* Chunky round profile: the bevel swells bevelSize outside the SVG outline
   while the front cap keeps the exact SVG fill. An inset cap (negative
   bevelOffset) would be rounder, but this traced SVG has tiny notches that
   make inset contours self-intersect and flood the N. */
export const PROFILE = Object.freeze({
  depth: 14,
  bevelEnabled: true,
  bevelThickness: 8,
  bevelSize: 6,
  bevelSegments: 12,
});

/* Smooth bevels by exact quantized position. Numeric packed keys exceeded
   JavaScript's 53-bit integer precision and merged unrelated vertices,
   producing broken metal highlights. Tuple keys preserve the silhouette. */
export function extrudeLogo(shape) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    ...PROFILE,
    curveSegments: 1,
    steps: 1,
  });

  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const count = position.count;

  // Which vertices belong to the side/bevel group (material index 1).
  const side = new Uint8Array(count);
  for (const group of geometry.groups) {
    if (group.materialIndex === 1) side.fill(1, group.start, group.start + group.count);
  }

  // Fixed-point lattice: multiply by 1e4 and round to int. These bounds are
  // derived from the real extent so the table size stays proportional to the
  // mesh instead of assuming a coordinate range.
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  for (let i = 0; i < count; i++) {
    if (position.getX(i) < minX) minX = position.getX(i);
    if (position.getY(i) < minY) minY = position.getY(i);
    if (position.getZ(i) < minZ) minZ = position.getZ(i);

  }
  const SCALE = 1e4;
  // Hash lattice coords into one integer key per vertex.
  const key = new Int32Array(count * 3);
  for (let i = 0; i < count; i++) {
    key[i * 3] = Math.round((position.getX(i) - minX) * SCALE);
    key[i * 3 + 1] = Math.round((position.getY(i) - minY) * SCALE);
    key[i * 3 + 2] = Math.round((position.getZ(i) - minZ) * SCALE);
  }

  // Accumulate angle-weighted face normals per unique lattice position.
  const map = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), face = new THREE.Vector3();
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();

  for (let i = 0; i < count; i += 3) {
    v0.fromBufferAttribute(position, i);
    v1.fromBufferAttribute(position, i + 1);
    v2.fromBufferAttribute(position, i + 2);
    face.crossVectors(a.subVectors(v1, v0), b.subVectors(v2, v0));
    if (face.lengthSq() < 1e-14) continue;
    face.normalize();
    for (let j = 0; j < 3; j++) {
      const index = i + j;
      // Exact tuple key; no lossy integer packing.
      const id = `${key[index * 3]},${key[index * 3 + 1]},${key[index * 3 + 2]}`;
      a.subVectors(v1, v0); b.subVectors(v2, v0);
      if (j === 1) { a.subVectors(v2, v1); b.subVectors(v0, v1); }
      if (j === 2) { a.subVectors(v0, v2); b.subVectors(v1, v2); }
      const length = a.length() * b.length();
      const angle = length > 0 ? Math.acos(THREE.MathUtils.clamp(a.dot(b) / length, -1, 1)) : 0;
      let sum = map.get(id);
      if (!sum) { sum = new THREE.Vector3(); map.set(id, sum); }
      sum.addScaledVector(face, angle);
    }
  }
  for (const sum of map.values()) sum.normalize();

  // Apply smoothed normals only to side/bevel vertices; the planar front
  // keeps its exact flat normal.
  const smoothed = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    if (!side[i]) continue;
    const id = `${key[i * 3]},${key[i * 3 + 1]},${key[i * 3 + 2]}`;
    const sum = map.get(id);
    if (!sum) continue;
    smoothed.set(normal.getX(i), normal.getY(i), normal.getZ(i));
    if (sum.dot(smoothed) > 0.01) normal.setXYZ(i, sum.x, sum.y, sum.z);
  }
  normal.needsUpdate = true;
  return geometry;
}
