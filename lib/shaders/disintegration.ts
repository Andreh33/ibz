// Vertex + fragment shaders for the act-to-act disintegration transition.
// Subdivided plane (256×256) + per-region temporal staggering + two-layer
// displacement noise so the banner breaks into fine particles instead of
// translating element-sized blocks. Gold tint peaks mid-transition.

const SIMPLEX_2D = /* glsl */ `
  // Ashima/IQ simplex 2D — short, fast, well-distributed.
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

export const DISINTEGRATION_VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uYDrift;
  uniform float uXJitter;

  varying vec2 vUv;
  varying float vNoise;
  varying float vLocalProgress;

  ${SIMPLEX_2D}

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Per-region temporal staggering — uv*12 = ~144 distinct cells across the
    // banner so each glyph/button sub-region gets multiple internal timings.
    // Without this density the button moved as one block.
    float regionDelay = (snoise(uv * 12.0) * 0.5 + 0.5) * 0.4;
    float localProgress = clamp(uProgress * 1.4 - regionDelay, 0.0, 1.0);
    vLocalProgress = localProgress;

    // Two-layer displacement noise: coarse uv*16 carries the bulk motion,
    // fine uv*32 breaks the coarse pattern into smaller dust grains.
    float dispBase = snoise(uv * 16.0 + uTime * 0.03);
    float dispDetail = snoise(uv * 32.0);
    float disp = dispBase * 0.7 + dispDetail * 0.3;
    vNoise = disp;

    float disp01 = disp * 0.5 + 0.5;

    pos.y += localProgress * uYDrift + disp01 * localProgress * uYDrift * 0.5;
    pos.x += disp * localProgress * uXJitter;
    pos.z += disp * localProgress * 20.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const DISINTEGRATION_FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec3 uGoldColor;
  uniform float uTime;

  varying vec2 vUv;
  varying float vNoise;
  varying float vLocalProgress;

  ${SIMPLEX_2D}

  void main() {
    // Liquid wobble — distort the texture sample as localProgress grows so the
    // banner reads as melting before it fragments into dust. Wider waves (freq
    // 22) read as "liquid" rather than "noise"; amplitude 0.045 makes the
    // displacement clearly perceptible (>2× the original 0.02). Time multiplier
    // 1.4 quickens the ripple so the eye registers the motion before particles
    // dominate.
    vec2 wobbleUv = vUv;
    wobbleUv.x += sin(vUv.y * 22.0 + uTime * 1.4) * 0.045 * vLocalProgress;
    wobbleUv.y += cos(vUv.x * 22.0 + uTime * 1.4) * 0.045 * vLocalProgress;

    vec4 tex = texture2D(uTexture, wobbleUv);

    // Granular dissolve threshold — uv*40 gives near-pixel-level dust.
    float fineNoise = snoise(vUv * 40.0) * 0.5 + 0.5;

    float threshold = vLocalProgress;
    if (fineNoise < threshold) discard;

    // Gold tint peaks in the middle of the transition (around 0.4–0.5):
    // smoothstep ramp-up 0→0.4 multiplied by ramp-down 1.0→0.5.
    // mix(tex, gold, edge * 0.85) keeps 15% of original color even at peak.
    float edge = smoothstep(0.0, 0.4, vLocalProgress)
               * smoothstep(1.0, 0.5, vLocalProgress);
    vec3 color = mix(tex.rgb, uGoldColor, edge * 0.85);

    // Eased alpha decay + per-particle noise modulation so individual fragments
    // fade at varying rates rather than in lock-step.
    float n01 = vNoise * 0.5 + 0.5;
    float alpha = tex.a
      * pow(1.0 - vLocalProgress, 1.8)
      * (1.0 - n01 * vLocalProgress * 0.6);

    if (alpha < 0.04) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;
