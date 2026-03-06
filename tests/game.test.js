import test from 'node:test';
import assert from 'node:assert/strict';

import { GAME_CONFIG, PLANT_DEFS, ZOMBIE_DEFS } from '../src/content.js';
import {
  createGameState,
  performAction,
  plantSeedForTest,
  spawnZombie,
  stepGame
} from '../src/engine.js';

function createTestState(overrides = {}) {
  return createGameState({
    config: {
      ...GAME_CONFIG,
      skySunInterval: [999, 999],
      ...overrides.config
    },
    level: {
      id: 'test',
      name: 'test',
      totalWaves: 1,
      startSun: 999,
      availableSeeds: ['sunflower', 'peashooter', 'wallnut', 'potatoMine', 'cherryBomb'],
      lawnMowers: [0, 1, 2, 3, 4],
      flags: [],
      waves: [{ wave: 1, time: 9999, flag: false }],
      spawns: [{ id: 'hold-open', time: 9999, wave: 1, flag: false, type: 'zombie', lane: 0 }],
      ...overrides.level
    },
    plantDefs: PLANT_DEFS,
    zombieDefs: ZOMBIE_DEFS,
    randomFn: overrides.randomFn || (() => 0)
  });
}

function advance(state, seconds, step = 0.05) {
  const iterations = Math.ceil(seconds / step);
  for (let index = 0; index < iterations; index += 1) {
    const dt = Math.min(step, seconds - (index * step));
    if (dt > 0) {
      stepGame(state, dt);
    }
  }
}

test('sun timing spawns sky sun and sunflower sun', () => {
  const state = createGameState({
    config: { ...GAME_CONFIG, skySunInterval: [7, 7] },
    level: {
      id: 'sun-test',
      name: 'sun-test',
      totalWaves: 1,
      startSun: 999,
      availableSeeds: ['sunflower'],
      lawnMowers: [0, 1, 2, 3, 4],
      flags: [],
      waves: [{ wave: 1, time: 9999, flag: false }],
      spawns: [{ id: 'hold-open', time: 9999, wave: 1, flag: false, type: 'zombie', lane: 0 }]
    },
    plantDefs: PLANT_DEFS,
    zombieDefs: ZOMBIE_DEFS,
    randomFn: () => 0
  });

  assert.equal(plantSeedForTest(state, 'sunflower', 2, 2), true);
  advance(state, 7.2);
  assert.ok(state.suns.some((sun) => sun.source === 'sky'));

  advance(state, 17.1);
  assert.ok(state.suns.some((sun) => sun.source === 'sunflower'));
});

test('cooldown enforcement blocks replant until recharge completes', () => {
  const state = createTestState();

  assert.equal(performAction(state, { type: 'selectSeed', seedId: 'sunflower' }), true);
  assert.equal(performAction(state, { type: 'clickCell', row: 0, col: 0 }), true);
  assert.equal(state.plants.length, 1);

  assert.equal(performAction(state, { type: 'selectSeed', seedId: 'sunflower' }), false);
  assert.equal(performAction(state, { type: 'clickCell', row: 0, col: 1 }), false);
  assert.equal(state.plants.length, 1);

  advance(state, 7.6);
  assert.equal(performAction(state, { type: 'selectSeed', seedId: 'sunflower' }), true);
});

test('invalid placement rejects occupied tile', () => {
  const state = createTestState();

  assert.equal(plantSeedForTest(state, 'wallnut', 1, 1), true);
  assert.equal(plantSeedForTest(state, 'peashooter', 1, 1), false);
  assert.equal(state.plants.length, 1);
});

test('lane targeting keeps peashooter focused on its own lane', () => {
  const state = createTestState();

  plantSeedForTest(state, 'peashooter', 1, 2);
  const sameLane = spawnZombie(state, 'zombie', 1, 650);
  const otherLane = spawnZombie(state, 'zombie', 2, 650);

  advance(state, 4);
  assert.ok(sameLane.health < sameLane.maxHealth);
  assert.equal(otherLane.health, otherLane.maxHealth);
});

test('projectiles collide and are consumed on hit', () => {
  const state = createTestState();

  plantSeedForTest(state, 'peashooter', 2, 2);
  const zombie = spawnZombie(state, 'zombie', 2, 760);
  advance(state, 4);

  assert.ok(zombie.health < zombie.maxHealth);
  assert.ok(state.projectiles.length <= 1);
});

test('zombie eating removes destroyed plant', () => {
  const state = createTestState();

  plantSeedForTest(state, 'wallnut', 2, 3);
  spawnZombie(state, 'zombie', 2, 640);
  advance(state, 240, 0.08);

  assert.equal(state.plants.length, 0);
});

test('mower is single-use and second breach loses the match', () => {
  const state = createTestState();

  const firstZombie = spawnZombie(state, 'zombie', 0, state.config.mowerX + 6);
  advance(state, 2.2);
  assert.ok(firstZombie.isDead || !state.zombies.includes(firstZombie));
  assert.equal(state.mowers.some((mower) => mower.lane === 0 && !mower.active && !mower.used), false);

  spawnZombie(state, 'zombie', 0, state.config.defeatX + 8);
  advance(state, 1);
  assert.equal(state.outcome, 'lost');
});

test('victory resolves when all scripted zombies are gone', () => {
  const state = createTestState();
  state.spawnIndex = state.level.spawns.length;
  advance(state, 0.1);
  assert.equal(state.outcome, 'won');
});

test('defeat resolves when a zombie reaches the house without a mower', () => {
  const state = createTestState({
    level: {
      lawnMowers: []
    }
  });

  spawnZombie(state, 'zombie', 2, state.config.defeatX + 2);
  advance(state, 0.3);
  assert.equal(state.outcome, 'lost');
});

test('potato mine arms and detonates once', () => {
  const state = createTestState();

  plantSeedForTest(state, 'potatoMine', 3, 3);
  advance(state, 15.1);
  const zombie = spawnZombie(state, 'zombie', 3, 610);
  advance(state, 6);

  assert.ok(zombie.isDead || !state.zombies.includes(zombie));
  assert.equal(state.plants.length, 0);
});

test('cherry bomb damages the 3x3 neighborhood only', () => {
  const state = createTestState();

  plantSeedForTest(state, 'cherryBomb', 2, 4);
  const centerX = state.config.boardX + (4 * state.config.tileWidth) + (state.config.tileWidth / 2);
  const hitA = spawnZombie(state, 'zombie', 1, centerX + 20);
  const hitB = spawnZombie(state, 'zombie', 2, centerX + 40);
  const miss = spawnZombie(state, 'zombie', 4, centerX + 230);
  advance(state, 0.6);

  assert.ok(hitA.isDead);
  assert.ok(hitB.isDead);
  assert.equal(miss.isDead, false);
});

test('pole vaulting zombie jumps only once and then attacks the next plant normally', () => {
  const state = createTestState();

  plantSeedForTest(state, 'wallnut', 2, 5);
  advance(state, 31);
  plantSeedForTest(state, 'sunflower', 2, 2);
  const poleZombie = spawnZombie(state, 'poleVaultingZombie', 2, 780);

  advance(state, 10, 0.04);
  const frontPlant = state.plants.find((plant) => plant.col === 5);
  const backPlant = state.plants.find((plant) => plant.col === 2);

  assert.equal(poleZombie.jumped, true);
  assert.ok(frontPlant);
  assert.ok(backPlant.health < backPlant.maxHealth);
});
