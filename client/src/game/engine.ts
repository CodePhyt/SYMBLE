import * as PIXI from 'pixi.js';

export let app: PIXI.Application;

export async function initEngine() {
  const container = document.getElementById('game-container')!;
  
  app = new PIXI.Application({
    resizeTo: container,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    backgroundColor: 0x121212,
    antialias: true
  });

  container.appendChild(app.view as HTMLCanvasElement);

  // Asset preloading goes here (Milestone 4)
  
  app.ticker.add(() => {
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
      fpsElement.innerText = Math.round(app.ticker.FPS).toString();
    }
  });

  window.addEventListener('resize', () => {
    // Logic to recenter the main scene container dynamically
  });

  return app;
}
