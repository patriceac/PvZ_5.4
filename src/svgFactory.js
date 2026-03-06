const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function append(parent, ...children) {
  for (const child of children) {
    parent.append(child);
  }
  return parent;
}

function createPlantBase(type) {
  const root = svg('g', { class: `plant plant--${type}` });
  const bob = svg('g', { class: 'bob' });
  root.append(bob);
  return { root, bob, parts: {} };
}

function createSunflower() {
  const factory = createPlantBase('sunflower');
  const stem = svg('rect', { x: -6, y: -68, width: 12, height: 74, rx: 6, fill: '#4b9b2e' });
  const leafLeft = svg('ellipse', { class: 'leaf-sway', cx: -28, cy: -26, rx: 24, ry: 12, fill: '#59b33b', transform: 'rotate(-28 -28 -26)' });
  const leafRight = svg('ellipse', { class: 'leaf-sway', cx: 28, cy: -22, rx: 24, ry: 12, fill: '#59b33b', transform: 'rotate(28 28 -22)' });
  const petals = svg('g', { fill: '#ffd34f' });
  for (let index = 0; index < 10; index += 1) {
    petals.append(svg('ellipse', {
      cx: 0,
      cy: -86,
      rx: 13,
      ry: 24,
      transform: `rotate(${index * 36} 0 -62)`
    }));
  }
  const face = svg('circle', { cx: 0, cy: -62, r: 28, fill: '#8b4d17' });
  const center = svg('circle', { cx: 0, cy: -62, r: 22, fill: '#6a3710' });
  const eyeLeft = svg('circle', { cx: -9, cy: -68, r: 4, fill: '#201208' });
  const eyeRight = svg('circle', { cx: 9, cy: -68, r: 4, fill: '#201208' });
  const smile = svg('path', { d: 'M -10 -54 Q 0 -45 10 -54', fill: 'none', stroke: '#201208', 'stroke-width': 3, 'stroke-linecap': 'round' });
  append(factory.bob, stem, leafLeft, leafRight, petals, face, center, eyeLeft, eyeRight, smile);
  return { root: factory.root, parts: factory.parts };
}

function createPeashooter() {
  const factory = createPlantBase('peashooter');
  const body = svg('g', { class: 'head-pop' });
  const stem = svg('rect', { x: -6, y: -72, width: 12, height: 80, rx: 6, fill: '#45972d' });
  const base = svg('ellipse', { cx: 0, cy: 4, rx: 30, ry: 12, fill: '#3b7927' });
  const leafLeft = svg('ellipse', { class: 'leaf-sway', cx: -26, cy: -16, rx: 24, ry: 10, fill: '#57af39', transform: 'rotate(-22 -26 -16)' });
  const leafRight = svg('ellipse', { class: 'leaf-sway', cx: 24, cy: -14, rx: 24, ry: 10, fill: '#57af39', transform: 'rotate(22 24 -14)' });
  const head = svg('circle', { cx: 8, cy: -68, r: 28, fill: '#6ab53d' });
  const snout = svg('ellipse', { cx: 36, cy: -68, rx: 24, ry: 18, fill: '#6ab53d' });
  const muzzle = svg('circle', { cx: 49, cy: -68, r: 9, fill: '#2a4e16' });
  const eye = svg('circle', { cx: -2, cy: -74, r: 4, fill: '#1b1408' });
  append(body, head, snout, muzzle, eye);
  append(factory.bob, stem, base, leafLeft, leafRight, body);
  return { root: factory.root, parts: { head: body } };
}

function createWallnut() {
  const factory = createPlantBase('wallnut');
  const shell = svg('rect', { x: -30, y: -88, width: 60, height: 92, rx: 26, fill: '#a06222' });
  const highlight = svg('ellipse', { cx: -8, cy: -68, rx: 16, ry: 24, fill: 'rgba(255, 215, 157, 0.24)' });
  const eyeLeft = svg('circle', { cx: -10, cy: -55, r: 4, fill: '#291508' });
  const eyeRight = svg('circle', { cx: 10, cy: -55, r: 4, fill: '#291508' });
  const mouth = svg('path', { d: 'M -10 -34 Q 0 -25 10 -34', fill: 'none', stroke: '#291508', 'stroke-width': 3, 'stroke-linecap': 'round' });
  const crackA = svg('path', { class: 'crack-line', d: 'M -5 -78 L 4 -62 L -3 -46 L 5 -24', fill: 'none', stroke: '#4d2a0d', 'stroke-width': 3, opacity: 0 });
  const crackB = svg('path', { class: 'crack-line', d: 'M 12 -64 L 3 -52 L 12 -34', fill: 'none', stroke: '#4d2a0d', 'stroke-width': 2.6, opacity: 0 });
  append(factory.bob, shell, highlight, eyeLeft, eyeRight, mouth, crackA, crackB);
  return { root: factory.root, parts: { crackA, crackB } };
}

function createPotatoMine() {
  const factory = createPlantBase('potatoMine');
  const mound = svg('ellipse', { cx: 0, cy: -8, rx: 34, ry: 20, fill: '#7a4d24' });
  const body = svg('ellipse', { cx: 0, cy: -30, rx: 28, ry: 24, fill: '#8f6233' });
  const eyeLeft = svg('circle', { cx: -9, cy: -34, r: 4, fill: '#231209' });
  const eyeRight = svg('circle', { cx: 9, cy: -34, r: 4, fill: '#231209' });
  const sprout = svg('path', { class: 'leaf-sway', d: 'M 0 -54 C -8 -80 -32 -74 -18 -50 C -12 -42 -5 -38 0 -38 C 5 -38 12 -42 18 -50 C 32 -74 8 -80 0 -54', fill: '#5cae36' });
  const glow = svg('circle', { class: 'armed-glow', cx: 0, cy: -28, r: 36, fill: 'rgba(255, 226, 120, 0.28)', opacity: 0.12 });
  append(factory.bob, glow, mound, body, eyeLeft, eyeRight, sprout);
  return { root: factory.root, parts: { glow } };
}

function createCherryBomb() {
  const factory = createPlantBase('cherryBomb');
  const stemLeft = svg('path', { d: 'M -12 -26 C -12 -52 -18 -74 -36 -92', fill: 'none', stroke: '#4f9128', 'stroke-width': 6, 'stroke-linecap': 'round' });
  const stemRight = svg('path', { d: 'M 12 -24 C 12 -56 18 -76 36 -92', fill: 'none', stroke: '#4f9128', 'stroke-width': 6, 'stroke-linecap': 'round' });
  const cherryLeft = svg('circle', { cx: -16, cy: -34, r: 24, fill: '#c92222' });
  const cherryRight = svg('circle', { cx: 16, cy: -30, r: 24, fill: '#d1342d' });
  const face = svg('path', { d: 'M -6 -30 Q 0 -20 6 -30', fill: 'none', stroke: '#2a0e0e', 'stroke-width': 3, 'stroke-linecap': 'round' });
  const eyes = svg('g', { fill: '#2a0e0e' });
  eyes.append(svg('circle', { cx: -20, cy: -38, r: 4 }), svg('circle', { cx: 22, cy: -34, r: 4 }));
  const fuse = svg('path', { d: 'M 0 -64 C 4 -90 26 -96 40 -84', fill: 'none', stroke: '#80512b', 'stroke-width': 5, 'stroke-linecap': 'round' });
  append(factory.bob, stemLeft, stemRight, cherryLeft, cherryRight, face, eyes, fuse);
  return { root: factory.root, parts: factory.parts };
}

function createZombieBase(type) {
  const root = svg('g', { class: `zombie zombie--${type}` });
  const bob = svg('g', { class: 'bob' });
  const head = svg('circle', { cx: 0, cy: -98, r: 24, fill: '#b9c7ae' });
  const jaw = svg('rect', { x: -14, y: -86, width: 28, height: 14, rx: 5, fill: '#96a38c' });
  const eyeLeft = svg('circle', { cx: -8, cy: -103, r: 4, fill: '#26180f' });
  const eyeRight = svg('circle', { cx: 7, cy: -101, r: 4, fill: '#26180f' });
  const torso = svg('path', { d: 'M -16 -74 L 18 -74 L 24 -20 L -20 -20 Z', fill: '#5d402f' });
  const shirt = svg('rect', { x: -14, y: -70, width: 30, height: 32, rx: 7, fill: '#866fb0' });
  const armFront = svg('rect', { class: 'arm-swing', x: 12, y: -58, width: 12, height: 48, rx: 6, fill: '#b9c7ae', transform: 'rotate(14 18 -58)' });
  const armBack = svg('rect', { class: 'arm-swing', x: -24, y: -56, width: 12, height: 42, rx: 6, fill: '#b9c7ae', transform: 'rotate(-22 -18 -56)' });
  const legFront = svg('rect', { class: 'leg-swing', x: -4, y: -20, width: 12, height: 68, rx: 5, fill: '#4e5563', transform: 'rotate(6 2 -20)' });
  const legBack = svg('rect', { class: 'leg-swing', x: -20, y: -20, width: 12, height: 64, rx: 5, fill: '#3f4756', transform: 'rotate(-8 -14 -20)' });
  const shoeFront = svg('ellipse', { cx: 4, cy: 48, rx: 16, ry: 7, fill: '#2c1f17' });
  const shoeBack = svg('ellipse', { cx: -12, cy: 44, rx: 15, ry: 7, fill: '#2c1f17' });
  append(bob, head, jaw, eyeLeft, eyeRight, torso, shirt, armBack, armFront, legBack, legFront, shoeBack, shoeFront);
  root.append(bob);
  return { root, bob };
}

function createZombie() {
  const base = createZombieBase('zombie');
  return { root: base.root, parts: { head: base.bob } };
}

function createConeheadZombie() {
  const base = createZombieBase('coneheadZombie');
  const cone = svg('polygon', { points: '0,-154 -26,-104 26,-104', fill: '#d37319', stroke: '#f6c362', 'stroke-width': 4 });
  base.bob.append(cone);
  return { root: base.root, parts: { cone } };
}

function createBucketheadZombie() {
  const base = createZombieBase('bucketheadZombie');
  const bucket = svg('path', { d: 'M -26 -142 L 24 -142 L 20 -100 L -22 -100 Z', fill: '#bcc1cd', stroke: '#6f7886', 'stroke-width': 4 });
  const rim = svg('rect', { x: -30, y: -142, width: 58, height: 10, rx: 4, fill: '#9098a8' });
  base.bob.append(bucket, rim);
  return { root: base.root, parts: { bucket } };
}

function createPoleVaultingZombie() {
  const base = createZombieBase('poleVaultingZombie');
  const pole = svg('rect', { x: -8, y: -138, width: 8, height: 144, rx: 4, fill: '#8f612f', transform: 'rotate(-58 -8 -138)' });
  base.bob.append(pole);
  return { root: base.root, parts: { pole } };
}

function createPea() {
  const root = svg('g', { class: 'pea' });
  root.append(svg('circle', { cx: 0, cy: 0, r: 13, fill: '#7ed24b' }));
  root.append(svg('circle', { cx: -4, cy: -4, r: 4, fill: 'rgba(255,255,255,0.32)' }));
  return { root, parts: {} };
}

function createSun() {
  const root = svg('g', { class: 'sun-token' });
  const spin = svg('g', { class: 'sun-token__spin' });
  const rays = svg('g', { fill: '#ffd84a' });
  for (let index = 0; index < 12; index += 1) {
    rays.append(svg('rect', {
      x: -4,
      y: -38,
      width: 8,
      height: 16,
      rx: 4,
      transform: `rotate(${index * 30})`
    }));
  }
  const core = svg('circle', { cx: 0, cy: 0, r: 24, fill: '#ffea61' });
  const coreInner = svg('circle', { cx: 0, cy: 0, r: 14, fill: '#fff3ab' });
  append(spin, rays, core, coreInner);
  root.append(spin);
  return { root, parts: { spin } };
}

function createExplosion() {
  const root = svg('g', { class: 'effect--explosion' });
  root.append(svg('circle', { cx: 0, cy: 0, r: 22, fill: 'rgba(255, 202, 65, 0.6)' }));
  root.append(svg('circle', { cx: 0, cy: 0, r: 42, fill: 'rgba(255, 134, 34, 0.36)' }));
  root.append(svg('circle', { cx: 0, cy: 0, r: 64, fill: 'rgba(255, 87, 34, 0.18)' }));
  return { root, parts: {} };
}

function createBurst(color) {
  const root = svg('g', { class: 'effect--explosion' });
  root.append(svg('circle', { cx: 0, cy: 0, r: 18, fill: color }));
  root.append(svg('circle', { cx: 0, cy: 0, r: 30, fill: 'rgba(255,255,255,0.18)' }));
  return { root, parts: {} };
}

function createMower() {
  const root = svg('g', { class: 'lane-mower' });
  const base = svg('rect', { x: -36, y: -20, width: 64, height: 32, rx: 8, fill: '#d74b29' });
  const tray = svg('rect', { x: -24, y: -32, width: 30, height: 14, rx: 6, fill: '#f5bf60' });
  const handle = svg('path', { d: 'M 10 -22 C 18 -50 38 -68 62 -76', fill: 'none', stroke: '#70543a', 'stroke-width': 6, 'stroke-linecap': 'round' });
  const wheelBack = svg('circle', { cx: -18, cy: 16, r: 12, fill: '#39343a' });
  const wheelFront = svg('circle', { cx: 18, cy: 16, r: 12, fill: '#39343a' });
  append(root, handle, base, tray, wheelBack, wheelFront);
  return { root, parts: {} };
}

function createSeedPreview(type) {
  const icon = svg('svg', { viewBox: '-70 -120 140 160', class: 'seed-card__icon' });
  const scale = svg('g', { transform: 'scale(0.75)' });
  let entry;
  switch (type) {
    case 'sunflower':
      entry = createSunflower();
      break;
    case 'peashooter':
      entry = createPeashooter();
      break;
    case 'wallnut':
      entry = createWallnut();
      break;
    case 'potatoMine':
      entry = createPotatoMine();
      break;
    default:
      entry = createCherryBomb();
      break;
  }
  scale.append(entry.root);
  icon.append(scale);
  return icon;
}

export const SvgFactory = {
  createPlant(type) {
    switch (type) {
      case 'sunflower':
        return createSunflower();
      case 'peashooter':
        return createPeashooter();
      case 'wallnut':
        return createWallnut();
      case 'potatoMine':
        return createPotatoMine();
      default:
        return createCherryBomb();
    }
  },
  createZombie(type) {
    switch (type) {
      case 'coneheadZombie':
        return createConeheadZombie();
      case 'poleVaultingZombie':
        return createPoleVaultingZombie();
      case 'bucketheadZombie':
        return createBucketheadZombie();
      default:
        return createZombie();
    }
  },
  createProjectile() {
    return createPea();
  },
  createSun() {
    return createSun();
  },
  createEffect(type) {
    switch (type) {
      case 'explosion':
        return createExplosion();
      case 'sunBurst':
        return createBurst('rgba(255, 233, 92, 0.72)');
      case 'plantBurst':
        return createBurst('rgba(91, 177, 57, 0.56)');
      default:
        return createBurst('rgba(182, 191, 171, 0.56)');
    }
  },
  createMower() {
    return createMower();
  },
  createSeedPreview
};
