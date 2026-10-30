import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from '../public/vendor/three/three.module.min.js';
import { logoShapes, extrudeLogo } from '../public/logo-geometry.js';

// The supplied asset uses M/C/Z only. Construct those exact curves without a
// browser DOM, so the production fill-rule and extrusion functions can run.
const svg = readFileSync(new URL('../public/assets/moonshine-logo.svg', import.meta.url), 'utf8');
const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(([,d]) => {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g);
  const path = new THREE.ShapePath();
  path.userData = {style: {}};
  let i = 0, command;
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) command = tokens[i++];
    if (command === 'M') {path.moveTo(+tokens[i++], +tokens[i++]); command='L';}
    else if (command === 'C') path.bezierCurveTo(...tokens.slice(i, i+=6).map(Number));
    else if (command === 'Z') {path.currentPath.closePath(); command=null;}
    else throw new Error('Unsupported supplied SVG command: '+command);
  }
  return path;
});

const shapes = logoShapes(paths);
assert.equal(shapes.length, 6, 'Preserve all six logo components');
assert.equal(shapes.reduce((n,shape)=>n+shape.holes.length,0), 2, 'Preserve both O openings');
const bounds = new THREE.Box2();
let triangles = 0;
for (const shape of shapes) {
  const outline = shape.extractPoints(1);
  outline.shape.forEach(p=>bounds.expandByPoint(p));
  const expectedArea = Math.abs(THREE.ShapeUtils.area(outline.shape))-
    outline.holes.reduce((n,hole)=>n+Math.abs(THREE.ShapeUtils.area(hole)),0);
  const geometry = extrudeLogo(shape);
  const position = geometry.attributes.position, normal=geometry.attributes.normal;
  let capArea=0;
  const a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
  const ab=new THREE.Vector3(), ac=new THREE.Vector3(), cross=new THREE.Vector3(), n=new THREE.Vector3();
  for (let i=0;i<position.count;i+=3) {
    a.fromBufferAttribute(position,i);b.fromBufferAttribute(position,i+1);c.fromBufferAttribute(position,i+2);
    assert.ok([...a,...b,...c].every(Number.isFinite),'Finite extrusion vertices');
    cross.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a));
    if (cross.lengthSq()<1e-14) continue;
    n.fromBufferAttribute(normal,i);
    assert.ok(cross.dot(n)>0,'Triangle winding agrees with normals');
    if (geometry.groups.some(group=>group.materialIndex===0&&i>=group.start&&i<group.start+group.count)) capArea+=Math.abs(cross.z)/2;
    triangles++;
  }
  assert.ok(Math.abs(capArea/2-expectedArea)<expectedArea*.0001,'Caps preserve the SVG fill area and holes');
  geometry.dispose();
}
assert.ok(bounds.min.x>20 && bounds.max.x<475,'Preserve supplied horizontal outline');
assert.ok(bounds.min.y>-410 && bounds.max.y<-90,'Flip SVG Y coordinates before extrusion');
console.log(`Logo geometry OK: ${shapes.length} components, 2 holes, ${triangles} checked triangles; original silhouette preserved.`);
