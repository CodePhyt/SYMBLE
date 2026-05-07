import { Howl, Howler } from 'howler';

export enum AudioBus { MASTER = 'master', MUSIC = 'music', SFX = 'sfx', UI = 'ui' }

export class AudioManager {
  private static instance: AudioManager;
  private volumes: Record<AudioBus, number> = {
    [AudioBus.MASTER]: 1.0, [AudioBus.MUSIC]: 0.5, [AudioBus.SFX]: 0.8, [AudioBus.UI]: 0.7
  };
  private sounds: Record<string, Howl> = {};

  private constructor() { Howler.volume(this.volumes[AudioBus.MASTER]); }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  public load(id: string, src: string, bus: AudioBus = AudioBus.SFX, loop: boolean = false) {
    this.sounds[id] = new Howl({ src: [src], loop, volume: this.volumes[bus] });
  }

  public play(id: string, varyPitch: boolean = true) {
    const sound = this.sounds[id];
    if (!sound) return;
    const soundId = sound.play();
    if (varyPitch) { sound.rate(0.9 + Math.random() * 0.2, soundId); }
  }

  public setVolume(bus: AudioBus, volume: number) {
    this.volumes[bus] = volume;
    if (bus === AudioBus.MASTER) Howler.volume(volume);
  }
}

export const audio = AudioManager.getInstance();
