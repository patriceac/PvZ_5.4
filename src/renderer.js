import { canPlantSeedAt, canSelectSeed, getCellCenter } from './engine.js';
import { SvgFactory } from './svgFactory.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function syncEntities(items, registry, createEntry, updateEntry) {
  const seen = new Set();

  for (const item of items) {
    seen.add(item.id);
    let entry = registry.get(item.id);
    if (!entry) {
      entry = createEntry(item);
      registry.set(item.id, entry);
    }
    updateEntry(entry, item);
  }

  for (const [id, entry] of registry.entries()) {
    if (!seen.has(id)) {
      entry.root.remove();
      registry.delete(id);
    }
  }
}

function setTransform(node, x, y) {
  node.setAttribute('transform', `translate(${x} ${y})`);
}

export class GameRenderer {
  constructor({ elements, callbacks }) {
    this.elements = elements;
    this.callbacks = callbacks;
    this.seedButtons = new Map();
    this.cellNodes = new Map();
    this.plantNodes = new Map();
    this.zombieNodes = new Map();
    this.projectileNodes = new Map();
    this.sunNodes = new Map();
    this.effectNodes = new Map();
    this.mowerNodes = new Map();
    this.state = null;
    this.scene = this.buildScene();
  }

  buildScene() {
    const { svg: svgRoot } = this.elements;
    svgRoot.replaceChildren();

    const background = svg('g');
    const lawn = svg('rect', { x: 235, y: 140, width: 915, height: 470, rx: 38, fill: '#3f9135' });
    const house = svg('path', { d: 'M 0 220 L 130 130 L 240 220 L 240 610 L 0 610 Z', fill: '#ddb06b' });
    const porch = svg('rect', { x: 170, y: 140, width: 90, height: 470, rx: 22, fill: '#c5965e' });
    const path = svg('path', { d: 'M 0 640 C 170 600 250 580 1280 640 L 1280 720 L 0 720 Z', fill: '#c88e56' });
    const roof = svg('path', { d: 'M 8 220 L 128 122 L 244 220 Z', fill: '#b6482d' });
    background.append(path, house, porch, roof, lawn);

    for (let row = 0; row < 5; row += 1) {
      const stripe = svg('rect', {
        x: 250,
        y: 152 + (row * 92),
        width: 890,
        height: 76,
        rx: 20,
        fill: row % 2 === 0 ? 'rgba(110, 192, 79, 0.9)' : 'rgba(88, 170, 63, 0.9)'
      });
      background.append(stripe);
    }

    for (let col = 0; col <= 9; col += 1) {
      background.append(svg('line', {
        x1: 270 + (col * 96),
        x2: 270 + (col * 96),
        y1: 170,
        y2: 630,
        stroke: 'rgba(255,255,255,0.18)',
        'stroke-width': 2
      }));
    }

    for (let row = 0; row <= 5; row += 1) {
      background.append(svg('line', {
        x1: 270,
        x2: 1134,
        y1: 170 + (row * 92),
        y2: 170 + (row * 92),
        stroke: 'rgba(255,255,255,0.18)',
        'stroke-width': 2
      }));
    }

    const selectionLayer = svg('g');
    const mowerLayer = svg('g');
    const plantLayer = svg('g');
    const projectileLayer = svg('g');
    const zombieLayer = svg('g');
    const effectLayer = svg('g');
    const sunLayer = svg('g');
    const interactionLayer = svg('g');

    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const rect = svg('rect', {
          x: 270 + (col * 96),
          y: 170 + (row * 92),
          width: 96,
          height: 92,
          class: 'lane-cell',
          rx: 16
        });

        rect.addEventListener('mouseenter', () => this.callbacks.onHover(row, col));
        rect.addEventListener('mouseleave', () => this.callbacks.onHover(null, null));
        rect.addEventListener('click', () => this.callbacks.onCellClick(row, col));
        interactionLayer.append(rect);
        this.cellNodes.set(`${row}-${col}`, rect);
      }
    }

    svgRoot.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.callbacks.onCancel();
    });

    svgRoot.append(background, selectionLayer, mowerLayer, plantLayer, projectileLayer, zombieLayer, effectLayer, sunLayer, interactionLayer);

    return {
      selectionLayer,
      mowerLayer,
      plantLayer,
      projectileLayer,
      zombieLayer,
      effectLayer,
      sunLayer
    };
  }

  buildSeedBank(state) {
    const { seedbank, shovelButton, pauseButton, restartButton, overlayRestart } = this.elements;
    seedbank.replaceChildren();
    this.seedButtons.clear();

    for (const seedId of state.level.availableSeeds) {
      const def = state.plantDefs[seedId];
      const button = document.createElement('button');
      button.className = 'seed-card';
      button.type = 'button';
      button.innerHTML = `
        <div class="seed-card__thumb"></div>
        <div class="seed-card__meta">
          <strong class="seed-card__name">${def.name}</strong>
          <span class="seed-card__cost">${def.cost} sun</span>
          <span class="seed-card__cooldown"></span>
        </div>
      `;
      button.querySelector('.seed-card__thumb').append(SvgFactory.createSeedPreview(seedId));
      button.addEventListener('click', () => this.callbacks.onSeedClick(seedId));
      seedbank.append(button);
      this.seedButtons.set(seedId, button);
    }

    shovelButton.addEventListener('click', () => this.callbacks.onToggleShovel());
    pauseButton.addEventListener('click', () => this.callbacks.onPauseToggle());
    restartButton.addEventListener('click', () => this.callbacks.onRestart());
    overlayRestart.addEventListener('click', () => this.callbacks.onRestart());
  }

  render(state) {
    if (!this.state) {
      this.state = state;
      this.buildSeedBank(state);
    }
    this.state = state;

    this.renderHud(state);
    this.renderBoard(state);
  }

  renderHud(state) {
    const {
      sunCount,
      waveLabel,
      statusLabel,
      banner,
      overlay,
      overlayKicker,
      overlayTitle,
      overlayCopy,
      shovelButton,
      pauseButton
    } = this.elements;

    sunCount.textContent = String(state.sun);
    waveLabel.textContent = `Wave ${state.currentWave} / ${state.level.totalWaves}`;
    statusLabel.textContent = this.getStatusText(state);
    pauseButton.textContent = state.paused && !state.outcome ? 'Resume' : 'Pause';
    shovelButton.setAttribute('aria-pressed', String(state.cursorMode === 'shovel'));

    for (const [seedId, button] of this.seedButtons.entries()) {
      const def = state.plantDefs[seedId];
      const cooldown = state.seedCooldowns[seedId];
      const ready = canSelectSeed(state, seedId);
      button.disabled = !ready;
      button.classList.toggle('is-selected', state.selectedSeed === seedId);
      button.classList.toggle('is-cooling', cooldown > 0);
      button.querySelector('.seed-card__cooldown').textContent = cooldown > 0 ? `Recharge ${cooldown.toFixed(1)}s` : 'Ready';
      button.querySelector('.seed-card__cost').textContent = `${def.cost} sun`;
    }

    if (state.banner?.text) {
      banner.textContent = state.banner.text;
      banner.classList.add('is-visible');
    } else {
      banner.classList.remove('is-visible');
      banner.textContent = '';
    }

    if (state.outcome) {
      overlay.hidden = false;
      if (state.outcome === 'won') {
        overlayKicker.textContent = 'Lawn defended';
        overlayTitle.textContent = 'Victory';
        overlayCopy.textContent = 'The final wave broke against your yard.';
      } else {
        overlayKicker.textContent = 'House breached';
        overlayTitle.textContent = 'Defeat';
        overlayCopy.textContent = 'A zombie made it to the house. Restart and tighten the lanes.';
      }
    } else {
      overlay.hidden = true;
    }
  }

  getStatusText(state) {
    if (state.outcome === 'won') {
      return 'Lawn secured';
    }
    if (state.outcome === 'lost') {
      return 'Brains eaten';
    }
    if (state.paused) {
      return 'Paused';
    }
    if (state.triggeredFlags.includes(state.currentWave)) {
      return `Flag wave ${state.currentWave}`;
    }
    return 'Battle in progress';
  }

  renderBoard(state) {
    this.renderSelection(state);
    this.renderCells(state);

    syncEntities(
      state.mowers,
      this.mowerNodes,
      () => {
        const entry = SvgFactory.createMower();
        this.scene.mowerLayer.append(entry.root);
        return entry;
      },
      (entry, mower) => {
        setTransform(entry.root, mower.x, mower.y);
        entry.root.style.display = mower.used && !mower.active ? 'none' : '';
      }
    );

    syncEntities(
      state.plants,
      this.plantNodes,
      (plant) => {
        const entry = SvgFactory.createPlant(plant.type);
        this.scene.plantLayer.append(entry.root);
        return entry;
      },
      (entry, plant) => {
        setTransform(entry.root, plant.x, plant.y);
        entry.root.classList.toggle('is-firing', plant.animation === 'firing');
        entry.root.classList.toggle('is-armed', Boolean(plant.armed));
        entry.root.classList.toggle('is-damaged', plant.health / plant.maxHealth < 0.55);
      }
    );

    syncEntities(
      state.projectiles,
      this.projectileNodes,
      () => {
        const entry = SvgFactory.createProjectile();
        this.scene.projectileLayer.append(entry.root);
        return entry;
      },
      (entry, projectile) => {
        setTransform(entry.root, projectile.x, projectile.y);
      }
    );

    syncEntities(
      state.zombies,
      this.zombieNodes,
      (zombie) => {
        const entry = SvgFactory.createZombie(zombie.type);
        this.scene.zombieLayer.append(entry.root);
        return entry;
      },
      (entry, zombie) => {
        setTransform(entry.root, zombie.x, zombie.y);
        entry.root.classList.toggle('is-attacking', zombie.state === 'attacking');
        entry.root.classList.toggle('is-hit', zombie.hitTimer > 0);
        entry.root.classList.toggle('is-jumping', zombie.state === 'jumping');
        entry.root.classList.toggle('is-dead', zombie.isDead);
      }
    );

    syncEntities(
      state.effects,
      this.effectNodes,
      (effect) => {
        const entry = SvgFactory.createEffect(effect.type);
        this.scene.effectLayer.append(entry.root);
        return entry;
      },
      (entry, effect) => {
        setTransform(entry.root, effect.x, effect.y);
        entry.root.style.opacity = String(1 - (effect.age / effect.life));
      }
    );

    syncEntities(
      state.suns,
      this.sunNodes,
      (sun) => {
        const entry = SvgFactory.createSun();
        entry.root.style.cursor = 'pointer';
        entry.root.addEventListener('click', () => this.callbacks.onSunClick(sun.id));
        this.scene.sunLayer.append(entry.root);
        return entry;
      },
      (entry, sun) => {
        entry.root.onclick = () => this.callbacks.onSunClick(sun.id);
        setTransform(entry.root, sun.x, sun.y);
      }
    );
  }

  renderSelection(state) {
    const layer = this.scene.selectionLayer;
    layer.replaceChildren();

    if (!state.hoverCell) {
      return;
    }

    const cell = getCellCenter(state.config, state.hoverCell.row, state.hoverCell.col);
    const ring = svg('ellipse', {
      class: 'selection-ring',
      cx: cell.x,
      cy: cell.y - 10,
      rx: 38,
      ry: 18
    });
    layer.append(ring);
  }

  renderCells(state) {
    for (let row = 0; row < state.config.rows; row += 1) {
      for (let col = 0; col < state.config.cols; col += 1) {
        const rect = this.cellNodes.get(`${row}-${col}`);
        const isHovered = state.hoverCell && state.hoverCell.row === row && state.hoverCell.col === col;
        const isReady = isHovered && state.selectedSeed && canPlantSeedAt(state, state.selectedSeed, row, col);
        const hasPlant = state.plants.some((plant) => plant.row === row && plant.col === col);
        const isInvalid = isHovered && ((state.selectedSeed && !canPlantSeedAt(state, state.selectedSeed, row, col)) || (state.cursorMode === 'shovel' && !hasPlant));
        rect.classList.toggle('is-hovered', Boolean(isHovered));
        rect.classList.toggle('is-ready', Boolean(isReady));
        rect.classList.toggle('is-invalid', Boolean(isInvalid));
      }
    }
  }
}
