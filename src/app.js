import { FRONT_YARD_DAY_LEVEL, GAME_CONFIG, PLANT_DEFS, ZOMBIE_DEFS } from './content.js';
import { createGameState, performAction, stepGame } from './engine.js';
import { GameRenderer } from './renderer.js';

export function createApp(documentRef = document) {
  if (typeof window !== 'undefined') {
    window.__PVZ_BOOTED = true;
  }

  const elements = {
    svg: documentRef.getElementById('board-svg'),
    seedbank: documentRef.getElementById('seedbank'),
    sunCount: documentRef.getElementById('sun-count'),
    waveLabel: documentRef.getElementById('wave-label'),
    statusLabel: documentRef.getElementById('status-label'),
    shovelButton: documentRef.getElementById('shovel-button'),
    pauseButton: documentRef.getElementById('pause-toggle'),
    restartButton: documentRef.getElementById('restart-button'),
    overlay: documentRef.getElementById('overlay'),
    overlayKicker: documentRef.getElementById('overlay-kicker'),
    overlayTitle: documentRef.getElementById('overlay-title'),
    overlayCopy: documentRef.getElementById('overlay-copy'),
    overlayRestart: documentRef.getElementById('overlay-restart'),
    banner: documentRef.getElementById('banner')
  };

  let state = createGameState({
    config: GAME_CONFIG,
    level: FRONT_YARD_DAY_LEVEL,
    plantDefs: PLANT_DEFS,
    zombieDefs: ZOMBIE_DEFS,
    randomFn: Math.random
  });

  const renderer = new GameRenderer({
    elements,
    callbacks: {
      onSeedClick(seedId) {
        performAction(state, { type: 'selectSeed', seedId });
        renderer.render(state);
      },
      onToggleShovel() {
        performAction(state, { type: 'toggleShovel' });
        renderer.render(state);
      },
      onPauseToggle() {
        if (!state.outcome) {
          performAction(state, { type: 'togglePause' });
          renderer.render(state);
        }
      },
      onRestart() {
        state = createGameState({
          config: GAME_CONFIG,
          level: FRONT_YARD_DAY_LEVEL,
          plantDefs: PLANT_DEFS,
          zombieDefs: ZOMBIE_DEFS,
          randomFn: Math.random
        });
        renderer.render(state);
        lastFrame = performance.now();
      },
      onHover(row, col) {
        performAction(state, { type: 'hoverCell', row, col });
        renderer.render(state);
      },
      onCellClick(row, col) {
        if (!state.paused && !state.outcome) {
          performAction(state, { type: 'clickCell', row, col });
          renderer.render(state);
        }
      },
      onSunClick(sunId) {
        if (performAction(state, { type: 'collectSun', sunId })) {
          renderer.render(state);
        }
      },
      onCancel() {
        performAction(state, { type: 'cancelSelection' });
        renderer.render(state);
      }
    }
  });

  function handleKeydown(event) {
    if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      return;
    }

    if (event.key >= '1' && event.key <= '5') {
      const seedId = state.level.availableSeeds[Number(event.key) - 1];
      if (seedId) {
        performAction(state, { type: 'selectSeed', seedId });
        renderer.render(state);
      }
      return;
    }

    if (event.key === 'Escape') {
      performAction(state, { type: 'cancelSelection' });
      renderer.render(state);
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (!state.outcome) {
        performAction(state, { type: 'togglePause' });
        renderer.render(state);
      }
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      renderer.callbacks.onRestart();
    }
  }

  documentRef.addEventListener('keydown', handleKeydown);

  let lastFrame = performance.now();
  documentRef.addEventListener('visibilitychange', () => {
    if (documentRef.visibilityState === 'hidden') {
      lastFrame = performance.now();
    }
  });

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, state.config.maxFrameStep);
    lastFrame = now;
    stepGame(state, dt);
    renderer.render(state);
    requestAnimationFrame(frame);
  }

  renderer.render(state);
  requestAnimationFrame(frame);

  return {
    getState() {
      return state;
    }
  };
}
