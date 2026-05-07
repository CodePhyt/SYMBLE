import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { generateDeck } from '@symble/shared';
import { sendMatchAttempt } from '../network/colyseus';
import { audio } from '../audio/AudioManager';

const REFERENCE_DECK = generateDeck(7);

export class CardSprite extends PIXI.Container {
  public cardId: number;
  private background: PIXI.Graphics;

  constructor(cardId: number) {
    super();
    this.cardId = cardId;
    this.background = new PIXI.Graphics();
    this.drawBackground();
    this.addChild(this.background);
    this.renderSymbols();
  }

  private drawBackground() {
    this.background.beginFill(0xFFFFFF);
    this.background.lineStyle(4, 0xDDDDDD);
    this.background.drawCircle(0, 0, 100);
    this.background.endFill();
  }

  private renderSymbols() {
    const symbols = REFERENCE_DECK[this.cardId];
    if (!symbols) return;
    const radius = 60;
    const angleStep = (Math.PI * 2) / symbols.length;
    symbols.forEach((symbolId, index) => {
      const angle = index * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const text = new PIXI.Text(symbolId.toString(), { fontSize: 24, fill: 0x333333, fontWeight: 'bold' });
      text.anchor.set(0.5);
      text.x = x; text.y = y;
      text.interactive = true; text.cursor = 'pointer';
      text.on('pointerdown', (e) => {
        audio.play('tap_sound', true);
        gsap.to(text.scale, { x: 1.5, y: 1.5, duration: 0.1, yoyo: true, repeat: 1 });
        sendMatchAttempt(symbolId);
        this.emit('matchAttempted', { x: e.global.x, y: e.global.y, symbolId });
      });
      this.addChild(text);
    });
  }

  public flyToHand(targetX: number, targetY: number) {
    gsap.to(this, { x: targetX, y: targetY, duration: 0.5, ease: "back.out(1.7)", rotation: Math.random() * 0.2 - 0.1 });
  }

  public rollback(originX: number, originY: number) {
    const tintFlash = new PIXI.ColorMatrixFilter();
    tintFlash.tint(0xff0000);
    this.filters = [tintFlash];
    gsap.to(this, { x: originX, y: originY, duration: 0.3, ease: "power4.inOut", onComplete: () => { this.filters = []; } });
  }
}
