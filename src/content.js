export const GAME_CONFIG = {
  svgWidth: 1280,
  svgHeight: 720,
  rows: 5,
  cols: 9,
  boardX: 270,
  boardY: 170,
  tileWidth: 96,
  tileHeight: 92,
  spawnX: 1185,
  defeatX: 170,
  mowerX: 215,
  projectileSpeed: 320,
  projectileDamage: 20,
  maxFrameStep: 0.08,
  skySunInterval: [7, 11],
  skySunValue: 25,
  skySunLife: 11,
  sunflowerSunValue: 25,
  sunflowerInterval: 24,
  zombieBiteReach: 44,
  zombieBiteDps: 18,
  poleJumpTriggerDistance: 88,
  poleJumpDistance: 104,
  poleJumpDuration: 0.42,
  mowerSpeed: 560,
  mowerKillReach: 70
};

export const PLANT_DEFS = {
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    cost: 50,
    cooldown: 7.5,
    health: 300,
    behavior: 'sunflower',
    spriteId: 'sunflower'
  },
  peashooter: {
    id: 'peashooter',
    name: 'Peashooter',
    cost: 100,
    cooldown: 7.5,
    health: 300,
    behavior: 'peashooter',
    fireInterval: 1.4,
    projectileDamage: 20,
    spriteId: 'peashooter'
  },
  wallnut: {
    id: 'wallnut',
    name: 'Wall-nut',
    cost: 50,
    cooldown: 30,
    health: 4000,
    behavior: 'wallnut',
    spriteId: 'wallnut'
  },
  potatoMine: {
    id: 'potatoMine',
    name: 'Potato Mine',
    cost: 25,
    cooldown: 30,
    health: 300,
    behavior: 'potatoMine',
    armTime: 15,
    damage: 1800,
    triggerDistance: 52,
    splashRadius: 82,
    spriteId: 'potatoMine'
  },
  cherryBomb: {
    id: 'cherryBomb',
    name: 'Cherry Bomb',
    cost: 150,
    cooldown: 50,
    health: 9999,
    behavior: 'cherryBomb',
    fuseTime: 0.32,
    damage: 1800,
    radiusCols: 1,
    radiusRows: 1,
    spriteId: 'cherryBomb'
  }
};

export const ZOMBIE_DEFS = {
  zombie: {
    id: 'zombie',
    name: 'Zombie',
    health: 200,
    speed: 15,
    spriteId: 'zombie'
  },
  coneheadZombie: {
    id: 'coneheadZombie',
    name: 'Conehead Zombie',
    health: 370,
    speed: 15,
    spriteId: 'coneheadZombie'
  },
  poleVaultingZombie: {
    id: 'poleVaultingZombie',
    name: 'Pole Vaulting Zombie',
    health: 340,
    speed: 22,
    postJumpSpeed: 15,
    spriteId: 'poleVaultingZombie',
    behavior: 'poleVault'
  },
  bucketheadZombie: {
    id: 'bucketheadZombie',
    name: 'Buckethead Zombie',
    health: 640,
    speed: 14,
    spriteId: 'bucketheadZombie'
  }
};

const WAVE_SCRIPT = [
  {
    wave: 1,
    time: 24,
    spawns: [{ type: 'zombie', lane: 2, offset: 0 }]
  },
  {
    wave: 2,
    time: 42,
    spawns: [{ type: 'zombie', lane: 1, offset: 0 }]
  },
  {
    wave: 3,
    time: 62,
    spawns: [
      { type: 'zombie', lane: 3, offset: 0 },
      { type: 'zombie', lane: 0, offset: 2.8 }
    ]
  },
  {
    wave: 4,
    time: 84,
    spawns: [
      { type: 'coneheadZombie', lane: 4, offset: 0 },
      { type: 'zombie', lane: 2, offset: 3 }
    ]
  },
  {
    wave: 5,
    time: 108,
    spawns: [
      { type: 'zombie', lane: 0, offset: 0 },
      { type: 'zombie', lane: 3, offset: 2.6 },
      { type: 'zombie', lane: 1, offset: 5.2 }
    ]
  },
  {
    wave: 6,
    time: 130,
    flag: true,
    spawns: [
      { type: 'coneheadZombie', lane: 4, offset: 0 },
      { type: 'coneheadZombie', lane: 1, offset: 2.3 },
      { type: 'zombie', lane: 2, offset: 4.8 },
      { type: 'poleVaultingZombie', lane: 0, offset: 7.1 }
    ]
  },
  {
    wave: 7,
    time: 156,
    spawns: [
      { type: 'coneheadZombie', lane: 3, offset: 0 },
      { type: 'zombie', lane: 0, offset: 2.4 },
      { type: 'zombie', lane: 2, offset: 4.8 }
    ]
  },
  {
    wave: 8,
    time: 181,
    spawns: [
      { type: 'bucketheadZombie', lane: 4, offset: 0 },
      { type: 'zombie', lane: 1, offset: 2.6 }
    ]
  },
  {
    wave: 9,
    time: 200,
    spawns: [
      { type: 'coneheadZombie', lane: 2, offset: 0 },
      { type: 'coneheadZombie', lane: 0, offset: 2.4 },
      { type: 'poleVaultingZombie', lane: 3, offset: 4.8 },
      { type: 'zombie', lane: 4, offset: 7.2 }
    ]
  },
  {
    wave: 10,
    time: 220,
    flag: true,
    spawns: [
      { type: 'bucketheadZombie', lane: 1, offset: 0 },
      { type: 'coneheadZombie', lane: 3, offset: 2.4 },
      { type: 'coneheadZombie', lane: 4, offset: 4.8 },
      { type: 'zombie', lane: 0, offset: 7.2 },
      { type: 'zombie', lane: 2, offset: 9.4 }
    ]
  }
];

export function buildFrontYardDayLevel() {
  const spawns = WAVE_SCRIPT.flatMap((wave) =>
    wave.spawns.map((spawn, index) => ({
      id: `wave-${wave.wave}-${index}`,
      time: wave.time + spawn.offset,
      wave: wave.wave,
      flag: Boolean(wave.flag),
      type: spawn.type,
      lane: spawn.lane
    }))
  ).sort((a, b) => a.time - b.time);

  return {
    id: 'front-yard-day',
    name: 'Front Yard Day',
    totalWaves: WAVE_SCRIPT.length,
    startSun: 150,
    availableSeeds: ['sunflower', 'peashooter', 'wallnut', 'potatoMine', 'cherryBomb'],
    lawnMowers: [0, 1, 2, 3, 4],
    flags: [6, 10],
    waves: WAVE_SCRIPT.map(({ wave, time, flag }) => ({ wave, time, flag: Boolean(flag) })),
    spawns
  };
}

export const FRONT_YARD_DAY_LEVEL = buildFrontYardDayLevel();
