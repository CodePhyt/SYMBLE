import * as PIXI from 'pixi.js';

const fragmentShader = `
precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uPointerPos;
uniform vec2 uResolution;
uniform float uTime;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);
    if (color.a > 0.1) {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        vec2 pointerSt = uPointerPos / uResolution.xy;
        float dist = distance(st, pointerSt);
        vec3 iridescence = vec3(
            0.5 + 0.5 * cos(uTime + dist * 10.0 + 0.0),
            0.5 + 0.5 * cos(uTime + dist * 10.0 + 2.0),
            0.5 + 0.5 * cos(uTime + dist * 10.0 + 4.0)
        );
        float glare = smoothstep(0.4, 0.0, dist) * 0.5;
        vec3 finalColor = mix(color.rgb, iridescence, 0.3) + glare;
        gl_FragColor = vec4(finalColor, color.a);
    } else {
        gl_FragColor = color;
    }
}
`;

export class HoloFilter extends PIXI.Filter {
  constructor(resolution: { width: number, height: number }) {
    super(undefined, fragmentShader, {
      uPointerPos: [resolution.width / 2, resolution.height / 2],
      uResolution: [resolution.width, resolution.height],
      uTime: 0.0
    });
  }
  public updatePointer(x: number, y: number) {
    this.uniforms.uPointerPos[0] = x;
    this.uniforms.uPointerPos[1] = y;
  }
  public updateTime(delta: number) {
    this.uniforms.uTime += delta * 0.05;
  }
}
