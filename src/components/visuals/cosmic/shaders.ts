/* GLSL shaders for the procedural cosmic scene. */

export const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p) {
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    f += a * snoise(p);
    p = p * 2.02 + 13.7;
    a *= 0.5;
  }
  return f;
}
`

/* Surface albedo, evaluated once and baked into an equirectangular texture. */
export const surfaceGLSL = /* glsl */ `
vec3 surfaceColor(vec3 nd, int t, vec3 cA, vec3 cB, vec3 cC, float seed, float tm) {
  if (t == 1) {
    float warp = snoise(vec3(nd.x * 1.5, nd.y * 3.0, nd.z * 1.5) + seed) * 0.35;
    float band = fbm(vec3(nd.x, nd.y * 5.0 + warp, nd.z) + seed);
    vec3 base = mix(cA, cB, smoothstep(-0.55, 0.55, band));
    base = mix(base, cC, smoothstep(0.45, 0.9, band));
    float spot = 1.0 - smoothstep(0.0, 0.22, length(vec2(nd.x, nd.y * 1.7) - vec2(0.55, -0.15)));
    base = mix(base, cC * 1.25, spot * 0.6);
    return base;
  } else if (t == 2) {
    float land = fbm(nd * 2.0 + seed);
    float oceanMask = smoothstep(-0.05, 0.12, land);
    vec3 ocean = cB * (0.75 + 0.25 * (land * 0.5 + 0.5));
    vec3 landCol = cA * (0.8 + 0.3 * (land * 0.5 + 0.5));
    vec3 base = mix(ocean, landCol, oceanMask);
    base = mix(base, cC, smoothstep(0.75, 0.95, abs(nd.y)));
    float cloud = smoothstep(0.45, 0.85, fbm(nd * 2.6 + seed + tm * 0.05));
    base = mix(base, vec3(1.0), cloud * 0.45);
    return base;
  } else if (t == 3) {
    float m = fbm(nd * 2.0 + seed);
    vec3 base = mix(cB, cA, smoothstep(-0.5, 0.5, m));
    base = mix(base, cC, abs(nd.y) * 0.5);
    return base;
  }
  float m = fbm(nd * 2.6 + seed);
  vec3 base = mix(cB, cA, smoothstep(-0.45, 0.5, m));
  float crater = 1.0 - smoothstep(0.0, 0.18, abs(m));
  return mix(base, cC, crater * 0.4);
}
`

export const surfaceBakeFragmentShader = /* glsl */ `
${noiseGLSL}
${surfaceGLSL}
uniform int uType;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uSeed;
uniform float uTime;
varying vec2 vUv;
void main() {
  float lon = (vUv.x - 0.5) * 6.28318530718;
  float lat = (0.5 - vUv.y) * 3.14159265359;
  vec3 nd = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
  gl_FragColor = vec4(surfaceColor(nd, uType, uColorA, uColorB, uColorC, uSeed, uTime), 1.0);
}
`

export const planetVertexShader = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vPos = position;
  vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

/* Cheap per-frame fragment: sample the baked albedo + apply lighting. */
export const planetFragmentShader = /* glsl */ `
uniform sampler2D uSurface;
uniform vec3 uSunDir;
uniform vec3 uAtmo;
uniform int uType;
varying vec3 vPos;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 viewDir = normalize(cameraPosition - vPosW);
  vec3 nd = normalize(vPos);
  vec3 sun = normalize(uSunDir);

  float u = atan(nd.z, nd.x) * 0.15915494309 + 0.5;
  float v = acos(clamp(nd.y, -1.0, 1.0)) * 0.31830988618;
  vec3 base = texture2D(uSurface, vec2(u, v)).rgb;

  float ndl = dot(n, sun);
  float lit = smoothstep(-0.12, 0.5, ndl);
  vec3 col = base * (0.05 + lit * 1.45);

  vec3 h = normalize(sun + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 40.0);
  col += vec3(1.0) * spec * (uType == 2 ? 0.7 : 0.2);

  float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);
  col += uAtmo * fres * (0.15 + 0.95 * lit);

  gl_FragColor = vec4(col, 1.0);
}
`

export const earthVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const earthFragmentShader = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uClouds;
uniform vec3 uSunDir;
uniform vec3 uAtmo;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 viewDir = normalize(cameraPosition - vPosW);
  vec3 sun = normalize(uSunDir);

  vec3 albedo = texture2D(uDay, vUv).rgb;
  float cloud = texture2D(uClouds, vUv).a;
  float ocean = smoothstep(0.02, 0.12, albedo.b - albedo.g);
  albedo = mix(albedo, vec3(1.0), cloud * 0.9);

  float ndl = dot(n, sun);
  float lit = smoothstep(-0.12, 0.5, ndl);
  vec3 col = albedo * (0.05 + lit * 1.45);

  vec3 h = normalize(sun + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 48.0) * ocean * 0.8;
  col += vec3(1.0) * spec;

  float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);
  col += uAtmo * fres * (0.15 + 0.95 * lit);

  gl_FragColor = vec4(col, 1.0);
}
`

export const texturedPlanetFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSunDir;
uniform vec3 uAtmo;
uniform float uSpec;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 viewDir = normalize(cameraPosition - vPosW);
  vec3 sun = normalize(uSunDir);

  vec3 albedo = texture2D(uMap, vUv).rgb;
  float ndl = dot(n, sun);
  float lit = smoothstep(-0.12, 0.5, ndl);
  vec3 col = albedo * (0.05 + lit * 1.45);

  vec3 h = normalize(sun + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 40.0) * uSpec;
  col += vec3(1.0) * spec;

  float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.0);
  col += uAtmo * fres * (0.15 + 0.95 * lit);

  gl_FragColor = vec4(col, 1.0);
}
`

export const ringVertexShader = /* glsl */ `
varying float vR;
void main() {
  vR = length(position.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const ringFragmentShader = /* glsl */ `
uniform sampler2D uRing;
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
varying float vR;
void main() {
  float t = (vR - uInner) / (uOuter - uInner);
  if (t < 0.0 || t > 1.0) discard;
  vec4 tex = texture2D(uRing, vec2(t, 0.5));
  vec3 col = mix(uColor, tex.rgb, 0.6);
  gl_FragColor = vec4(col, tex.a * 0.95);
}
`

export const nebulaVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const nebulaFragmentShader = /* glsl */ `
${noiseGLSL}
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float d = length(p);
  float falloff = 1.0 - smoothstep(0.1, 1.0, d);
  vec3 sp = vec3(vUv * 3.0 + uSeed, uTime * 0.015);
  float n = fbm(sp) * 0.5 + 0.5;
  float alpha = falloff * (0.2 + 0.8 * n) * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`

export const starVertexShader = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vTw;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);
  vTw = tw;
  gl_PointSize = aSize * uPixelRatio * (260.0 / max(1.0, -mv.z)) * tw;
}
`

export const starFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vTw;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float a = 1.0 - smoothstep(0.0, 0.5, r);
  gl_FragColor = vec4(vColor * vTw, a * vTw);
}
`
