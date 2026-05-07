import * as PIXI from 'pixi.js';
import gsap from 'gsap';

class Particle extends PIXI.Graphics {
  public active: boolean = false;
  constructor() {
    super();
    this.beginFill(0x2ecc71);
    this.drawRect(-5, -5, 10, 10);
    this.endFill();
    this.visible = false;
  }
  fire(x: number, y: number) {
    this.active = true; this.visible = true;
    this.x = x; this.y = y;
    this.scale.set(Math.random() * 0.5 + 0.5);
    this.rotation = Math.random() * Math.PI * 2;
    this.alpha = 1;
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 150 + 50;
    gsap.to(this, {
      x: x + Math.cos(angle) * velocity, y: y + Math.sin(angle) * velocity,
      rotation: this.rotation + Math.random() * 5, alpha: 0,
      duration: Math.random() * 0.5 + 0.5, ease: "power2.out",
      onComplete: () => { this.visible = false; this.active = false; }
    });
  }
}

export class ParticleSystem {
  private container: PIXI.Container;
  private pool: Particle[] = [];
  private poolSize: number = 100;
  constructor(container: PIXI.Container) {
    this.container = container;
    for (let i = 0; i < this.poolSize; i++) {
      const p = new Particle(); this.pool.push(p); this.container.addChild(p);
    }
  }
  public burst(x: number, y: number, count: number = 20) {
    let fired = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) { this.pool[i].fire(x, y); fired++; if (fired >= count) break; }
    }
  }
}
