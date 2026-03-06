import { FRONT_YARD_DAY_LEVEL, GAME_CONFIG, PLANT_DEFS, ZOMBIE_DEFS } from './content.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getCellCenter(config, row, col) {
  return {
    x: config.boardX + (col * config.tileWidth) + (config.tileWidth / 2),
    y: config.boardY + (row * config.tileHeight) + (config.tileHeight / 2)
  };
}

export function getLaneY(config, lane) {
  return config.boardY + (lane * config.tileHeight) + (config.tileHeight / 2);
}

function getRandomBetween(state, min, max) {
  return min + (state.randomFn() * (max - min));
}

function makeId(state, prefix) {
  state.idCounter += 1;
  return `${prefix}-${state.idCounter}`;
}

function setBanner(state, text, duration = 2.2) {
  state.banner = {
    text,
    expiresAt: state.time + duration
  };
}

function isPlantAlive(plant) {
  return plant && plant.health > 0 && !plant.remove;
}

function isZombieAlive(zombie) {
  return zombie && zombie.health > 0 && !zombie.remove && !zombie.isDead;
}

export function createPlantEntity(state, type, row, col) {
  const def = state.plantDefs[type];
  const { x, y } = getCellCenter(state.config, row, col);
  return {
    id: makeId(state, 'plant'),
    type,
    defId: def.id,
    row,
    col,
    x,
    y,
    health: def.health,
    maxHealth: def.health,
    age: 0,
    cooldown: 0,
    animation: 'idle',
    animationTimer: 0,
    armed: false,
    exploded: false
  };
}

export function createZombieEntity(state, type, lane, x = state.config.spawnX) {
  const def = state.zombieDefs[type];
  return {
    id: makeId(state, 'zombie'),
    type,
    defId: def.id,
    lane,
    x,
    y: getLaneY(state.config, lane),
    health: def.health,
    maxHealth: def.health,
    speed: def.speed,
    state: 'walking',
    hitTimer: 0,
    jumped: false,
    jumpTimer: 0,
    jumpDuration: state.config.poleJumpDuration,
    jumpFromX: x,
    jumpToX: x,
    isDead: false,
    deathTimer: 0,
    remove: false
  };
}

function createProjectile(state, row, x, y, damage) {
  return {
    id: makeId(state, 'pea'),
    row,
    x,
    y,
    damage,
    speed: state.config.projectileSpeed,
    remove: false
  };
}

function createSun(state, x, y, value, source = 'sky') {
  const targetY = source === 'sky'
    ? getRandomBetween(state, state.config.boardY - 30, state.config.boardY + (state.config.rows * state.config.tileHeight) - 40)
    : y - 34;

  return {
    id: makeId(state, 'sun'),
    source,
    x,
    y,
    targetY,
    value,
    age: 0,
    life: source === 'sky' ? state.config.skySunLife : state.config.skySunLife + 2,
    remove: false
  };
}

function createEffect(state, type, x, y, radius = 40, lane = null) {
  return {
    id: makeId(state, 'effect'),
    type,
    x,
    y,
    radius,
    lane,
    age: 0,
    life: type === 'explosion' ? 0.48 : 0.38,
    remove: false
  };
}

function createMowers(state) {
  return state.level.lawnMowers.map((lane) => ({
    id: `mower-${lane}`,
    lane,
    x: state.config.mowerX,
    y: getLaneY(state.config, lane),
    active: false,
    used: false,
    remove: false
  }));
}

export function createInitialState(options = {}) {
  const config = { ...GAME_CONFIG, ...(options.config || {}) };
  const level = options.level || FRONT_YARD_DAY_LEVEL;
  const plantDefs = options.plantDefs || PLANT_DEFS;
  const zombieDefs = options.zombieDefs || ZOMBIE_DEFS;
  const randomFn = options.randomFn || Math.random;

  return {
    config,
    level,
    plantDefs,
    zombieDefs,
    randomFn,
    idCounter: 0,
    time: 0,
    sun: level.startSun,
    selectedSeed: null,
    cursorMode: 'plant',
    hoverCell: null,
    paused: false,
    outcome: null,
    banner: { text: 'Prepare your defense', expiresAt: 4 },
    currentWave: 1,
    triggeredFlags: [],
    seedCooldowns: Object.fromEntries(level.availableSeeds.map((seedId) => [seedId, 0])),
    plants: [],
    zombies: [],
    projectiles: [],
    suns: [],
    effects: [],
    mowers: [],
    spawnIndex: 0,
    nextSkySunIn: getRandomBetween({ randomFn }, config.skySunInterval[0], config.skySunInterval[1]),
    stats: {
      sunCollected: 0,
      plantsPlaced: 0,
      zombiesDefeated: 0
    }
  };
}

export function initializeState(state) {
  state.mowers = createMowers(state);
  return state;
}

export function createGameState(options = {}) {
  return initializeState(createInitialState(options));
}

function getPlantAtCell(state, row, col) {
  return state.plants.find((plant) => plant.row === row && plant.col === col && isPlantAlive(plant)) || null;
}

function getLanePlants(state, lane) {
  return state.plants.filter((plant) => plant.row === lane && isPlantAlive(plant));
}

function getLaneZombies(state, lane) {
  return state.zombies.filter((zombie) => zombie.lane === lane && isZombieAlive(zombie));
}

function getNearestPlantForZombie(state, zombie) {
  const lanePlants = getLanePlants(state, zombie.lane);
  let candidate = null;
  let bestX = -Infinity;

  for (const plant of lanePlants) {
    if (plant.x <= zombie.x + state.config.zombieBiteReach && plant.x > bestX) {
      candidate = plant;
      bestX = plant.x;
    }
  }

  return candidate;
}

function hasZombieAhead(state, row, x) {
  return state.zombies.some((zombie) => isZombieAlive(zombie) && zombie.lane === row && zombie.x > x + 14);
}

function damageZombie(state, zombie, amount) {
  if (!isZombieAlive(zombie)) {
    return;
  }

  zombie.health -= amount;
  zombie.hitTimer = 0.14;
  if (zombie.health <= 0) {
    zombie.isDead = true;
    zombie.state = 'dead';
    zombie.deathTimer = 0.75;
    state.stats.zombiesDefeated += 1;
    state.effects.push(createEffect(state, 'zombieBurst', zombie.x, zombie.y - 18, 34, zombie.lane));
  }
}

function damagePlant(state, plant, amount) {
  if (!isPlantAlive(plant)) {
    return;
  }

  plant.health -= amount;
  if (plant.health <= 0) {
    plant.remove = true;
    state.effects.push(createEffect(state, 'plantBurst', plant.x, plant.y - 18, 28, plant.row));
  }
}

function removeDeadEntities(state) {
  state.plants = state.plants.filter((plant) => isPlantAlive(plant));
  state.zombies = state.zombies.filter((zombie) => !zombie.remove && (!zombie.isDead || zombie.deathTimer > 0));
  state.projectiles = state.projectiles.filter((projectile) => !projectile.remove);
  state.suns = state.suns.filter((sun) => !sun.remove);
  state.effects = state.effects.filter((effect) => !effect.remove);
  state.mowers = state.mowers.filter((mower) => !mower.remove);
}

function spawnScriptedZombies(state) {
  while (state.spawnIndex < state.level.spawns.length && state.level.spawns[state.spawnIndex].time <= state.time) {
    const spawn = state.level.spawns[state.spawnIndex];
    state.currentWave = Math.max(state.currentWave, spawn.wave);
    if (spawn.flag && !state.triggeredFlags.includes(spawn.wave)) {
      state.triggeredFlags.push(spawn.wave);
      setBanner(state, `Huge wave ${spawn.wave}!`, 2.8);
    } else if (state.level.spawns[state.spawnIndex - 1]?.wave !== spawn.wave) {
      setBanner(state, `Wave ${spawn.wave}`, 1.8);
    }

    state.zombies.push(createZombieEntity(state, spawn.type, spawn.lane));
    state.spawnIndex += 1;
  }
}

function updateSuns(state, dt) {
  state.nextSkySunIn -= dt;
  if (state.nextSkySunIn <= 0) {
    const x = getRandomBetween(state, state.config.boardX + 30, state.config.boardX + (state.config.cols * state.config.tileWidth) - 30);
    state.suns.push(createSun(state, x, state.config.boardY - 55, state.config.skySunValue, 'sky'));
    state.nextSkySunIn = getRandomBetween(state, state.config.skySunInterval[0], state.config.skySunInterval[1]);
  }

  for (const sun of state.suns) {
    if (sun.remove) {
      continue;
    }

    sun.age += dt;
    if (sun.source === 'sky') {
      sun.y = Math.min(sun.targetY, sun.y + (120 * dt));
    } else {
      sun.y = Math.max(sun.targetY, sun.y - (90 * dt));
    }

    if (sun.age >= sun.life) {
      sun.remove = true;
    }
  }
}

function updatePlantCooldowns(state, dt) {
  for (const seedId of Object.keys(state.seedCooldowns)) {
    state.seedCooldowns[seedId] = Math.max(0, state.seedCooldowns[seedId] - dt);
  }
}

function explodeCherryBomb(state, plant) {
  if (plant.exploded) {
    return;
  }

  const def = state.plantDefs[plant.type];
  plant.exploded = true;
  for (const zombie of state.zombies) {
    if (!isZombieAlive(zombie)) {
      continue;
    }

    const laneDiff = Math.abs(zombie.lane - plant.row);
    const xDiff = Math.abs(zombie.x - plant.x);
    if (laneDiff <= def.radiusRows && xDiff <= (state.config.tileWidth * (def.radiusCols + 0.7))) {
      damageZombie(state, zombie, def.damage);
    }
  }

  state.effects.push(createEffect(state, 'explosion', plant.x, plant.y - 14, 140, plant.row));
  plant.remove = true;
}

function detonatePotatoMine(state, plant) {
  const def = state.plantDefs[plant.type];
  for (const zombie of state.zombies) {
    if (!isZombieAlive(zombie) || zombie.lane !== plant.row) {
      continue;
    }

    if (Math.abs(zombie.x - plant.x) <= def.splashRadius) {
      damageZombie(state, zombie, def.damage);
    }
  }

  state.effects.push(createEffect(state, 'explosion', plant.x, plant.y - 10, 90, plant.row));
  plant.remove = true;
}

function updatePlants(state, dt) {
  for (const plant of state.plants) {
    if (!isPlantAlive(plant)) {
      continue;
    }

    const def = state.plantDefs[plant.type];
    plant.age += dt;
    plant.animationTimer = Math.max(0, plant.animationTimer - dt);
    if (plant.animationTimer === 0) {
      plant.animation = 'idle';
    }

    switch (def.behavior) {
      case 'sunflower': {
        plant.cooldown -= dt;
        if (plant.cooldown <= 0) {
          state.suns.push(createSun(state, plant.x + 12, plant.y - 20, state.config.sunflowerSunValue, 'sunflower'));
          plant.cooldown = state.config.sunflowerInterval;
          plant.animation = 'active';
          plant.animationTimer = 0.45;
        }
        break;
      }
      case 'peashooter': {
        plant.cooldown -= dt;
        if (plant.cooldown <= 0 && hasZombieAhead(state, plant.row, plant.x)) {
          state.projectiles.push(createProjectile(state, plant.row, plant.x + 34, plant.y - 30, def.projectileDamage));
          plant.cooldown = def.fireInterval;
          plant.animation = 'firing';
          plant.animationTimer = 0.22;
        }
        break;
      }
      case 'potatoMine': {
        if (!plant.armed && plant.age >= def.armTime) {
          plant.armed = true;
          plant.animation = 'armed';
          plant.animationTimer = 999;
        }

        if (plant.armed) {
          const trigger = state.zombies.find((zombie) =>
            isZombieAlive(zombie) &&
            zombie.lane === plant.row &&
            Math.abs(zombie.x - plant.x) <= def.triggerDistance
          );

          if (trigger) {
            detonatePotatoMine(state, plant);
          }
        }
        break;
      }
      case 'cherryBomb': {
        plant.cooldown -= dt;
        if (plant.cooldown <= 0) {
          explodeCherryBomb(state, plant);
        }
        break;
      }
      default:
        break;
    }
  }
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    if (projectile.remove) {
      continue;
    }

    projectile.x += projectile.speed * dt;
    const laneZombies = getLaneZombies(state, projectile.row).sort((a, b) => a.x - b.x);
    const target = laneZombies.find((zombie) => projectile.x >= zombie.x - 22 && projectile.x <= zombie.x + 40);

    if (target) {
      damageZombie(state, target, projectile.damage);
      projectile.remove = true;
    } else if (projectile.x > state.config.spawnX + 80) {
      projectile.remove = true;
    }
  }
}

function triggerMower(state, zombie) {
  const mower = state.mowers.find((candidate) => candidate.lane === zombie.lane && !candidate.active && !candidate.used);
  if (!mower) {
    return false;
  }

  if (zombie.x <= mower.x + 10) {
    mower.active = true;
    setBanner(state, `Lawn mower activated on lane ${zombie.lane + 1}`, 1.8);
    return true;
  }

  return false;
}

function updateMowers(state, dt) {
  for (const mower of state.mowers) {
    if (!mower.active) {
      continue;
    }

    mower.x += state.config.mowerSpeed * dt;
    for (const zombie of state.zombies) {
      if (!isZombieAlive(zombie) || zombie.lane !== mower.lane) {
        continue;
      }

      if (zombie.x <= mower.x + state.config.mowerKillReach) {
        damageZombie(state, zombie, 5000);
      }
    }

    if (mower.x > state.config.spawnX + 100) {
      mower.active = false;
      mower.used = true;
      mower.remove = true;
    }
  }
}

function updateZombies(state, dt) {
  for (const zombie of state.zombies) {
    zombie.hitTimer = Math.max(0, zombie.hitTimer - dt);

    if (zombie.isDead) {
      zombie.deathTimer -= dt;
      if (zombie.deathTimer <= 0) {
        zombie.remove = true;
      }
      continue;
    }

    const def = state.zombieDefs[zombie.type];

    if (zombie.jumpTimer > 0) {
      zombie.jumpTimer -= dt;
      const progress = clamp(1 - (zombie.jumpTimer / zombie.jumpDuration), 0, 1);
      zombie.x = zombie.jumpFromX + ((zombie.jumpToX - zombie.jumpFromX) * progress);
      zombie.state = 'jumping';
      if (zombie.jumpTimer <= 0) {
        zombie.jumped = true;
        zombie.speed = def.postJumpSpeed || def.speed;
        zombie.x = zombie.jumpToX;
        zombie.state = 'walking';
      }
      continue;
    }

    const targetPlant = getNearestPlantForZombie(state, zombie);
    const canPoleJump = def.behavior === 'poleVault' && !zombie.jumped && targetPlant && (zombie.x - targetPlant.x) <= state.config.poleJumpTriggerDistance;

    if (canPoleJump) {
      zombie.jumpTimer = zombie.jumpDuration;
      zombie.jumpFromX = zombie.x;
      zombie.jumpToX = Math.max(state.config.defeatX + 30, targetPlant.x - state.config.poleJumpDistance);
      zombie.state = 'jumping';
      continue;
    }

    if (targetPlant && (zombie.x - targetPlant.x) <= state.config.zombieBiteReach) {
      zombie.state = 'attacking';
      damagePlant(state, targetPlant, state.config.zombieBiteDps * dt);
    } else {
      zombie.state = 'walking';
      zombie.x -= zombie.speed * dt;
    }

    if (!triggerMower(state, zombie) && zombie.x <= state.config.defeatX) {
      state.outcome = 'lost';
      state.paused = true;
      setBanner(state, 'The zombies ate your brains', 10);
      return;
    }
  }
}

function updateEffects(state, dt) {
  for (const effect of state.effects) {
    effect.age += dt;
    if (effect.age >= effect.life) {
      effect.remove = true;
    }
  }
}

function updateOutcome(state) {
  const liveZombies = state.zombies.some((zombie) => isZombieAlive(zombie));
  if (!state.outcome && state.spawnIndex >= state.level.spawns.length && !liveZombies) {
    state.outcome = 'won';
    state.paused = true;
    setBanner(state, 'Victory!', 10);
  }
}

export function stepGame(state, dt) {
  if (state.paused || state.outcome) {
    if (state.banner && state.banner.expiresAt <= state.time) {
      state.banner = null;
    }
    return state;
  }

  const safeDt = clamp(dt, 0, state.config.maxFrameStep);
  state.time += safeDt;
  if (state.banner && state.banner.expiresAt <= state.time) {
    state.banner = null;
  }

  updatePlantCooldowns(state, safeDt);
  spawnScriptedZombies(state);
  updateSuns(state, safeDt);
  updatePlants(state, safeDt);
  updateProjectiles(state, safeDt);
  updateZombies(state, safeDt);
  updateMowers(state, safeDt);
  updateEffects(state, safeDt);
  removeDeadEntities(state);
  updateOutcome(state);
  return state;
}

export function canSelectSeed(state, seedId) {
  const def = state.plantDefs[seedId];
  return Boolean(def) && state.seedCooldowns[seedId] <= 0 && state.sun >= def.cost;
}

export function canPlantSeedAt(state, seedId, row, col) {
  if (!state.plantDefs[seedId]) {
    return false;
  }

  if (row < 0 || row >= state.config.rows || col < 0 || col >= state.config.cols) {
    return false;
  }

  if (!canSelectSeed(state, seedId)) {
    return false;
  }

  return !getPlantAtCell(state, row, col);
}

function plantSeed(state, seedId, row, col) {
  if (!canPlantSeedAt(state, seedId, row, col)) {
    return false;
  }

  const def = state.plantDefs[seedId];
  const plant = createPlantEntity(state, seedId, row, col);

  if (def.behavior === 'sunflower') {
    plant.cooldown = state.config.sunflowerInterval;
  } else if (def.behavior === 'cherryBomb') {
    plant.cooldown = def.fuseTime;
  } else if (def.behavior === 'peashooter') {
    plant.cooldown = 0.35;
  }

  state.sun -= def.cost;
  state.seedCooldowns[seedId] = def.cooldown;
  state.plants.push(plant);
  state.stats.plantsPlaced += 1;
  setBanner(state, `${def.name} planted`, 0.9);
  state.selectedSeed = null;
  return true;
}

function shovelPlant(state, row, col) {
  const plant = getPlantAtCell(state, row, col);
  if (!plant) {
    return false;
  }

  plant.remove = true;
  state.effects.push(createEffect(state, 'plantBurst', plant.x, plant.y - 18, 28, plant.row));
  setBanner(state, 'Plant removed', 0.8);
  return true;
}

export function collectSun(state, sunId) {
  const sun = state.suns.find((candidate) => candidate.id === sunId && !candidate.remove);
  if (!sun) {
    return false;
  }

  state.sun += sun.value;
  state.stats.sunCollected += sun.value;
  sun.remove = true;
  state.effects.push(createEffect(state, 'sunBurst', sun.x, sun.y, 26, null));
  return true;
}

export function spawnZombie(state, type, lane, x = state.config.spawnX) {
  const zombie = createZombieEntity(state, type, lane, x);
  state.zombies.push(zombie);
  return zombie;
}

export function plantSeedForTest(state, seedId, row, col) {
  state.selectedSeed = seedId;
  return plantSeed(state, seedId, row, col);
}

export function performAction(state, action) {
  switch (action.type) {
    case 'selectSeed': {
      if (canSelectSeed(state, action.seedId)) {
        state.selectedSeed = action.seedId;
        state.cursorMode = 'plant';
        return true;
      }
      return false;
    }
    case 'toggleShovel': {
      const nextActive = typeof action.active === 'boolean' ? action.active : state.cursorMode !== 'shovel';
      state.cursorMode = nextActive ? 'shovel' : 'plant';
      if (nextActive) {
        state.selectedSeed = null;
      }
      return true;
    }
    case 'cancelSelection': {
      state.selectedSeed = null;
      state.cursorMode = 'plant';
      return true;
    }
    case 'hoverCell': {
      state.hoverCell = action.row == null || action.col == null ? null : { row: action.row, col: action.col };
      return true;
    }
    case 'clickCell': {
      if (state.outcome) {
        return false;
      }

      if (state.cursorMode === 'shovel') {
        return shovelPlant(state, action.row, action.col);
      }

      if (!state.selectedSeed) {
        return false;
      }

      return plantSeed(state, state.selectedSeed, action.row, action.col);
    }
    case 'collectSun':
      return collectSun(state, action.sunId);
    case 'togglePause':
      state.paused = !state.paused;
      if (!state.paused && state.outcome) {
        state.paused = true;
      }
      return true;
    default:
      return false;
  }
}
