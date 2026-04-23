"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSphere } from "@/app/context/SphereContext";
import { useSphereDebug } from "@/app/context/SphereDebugContext";
import { BINAURAL_PRESETS } from "./BinauralEngine";

// Classic 4D Perlin Noise — idéntico al de vo1d, probado en producción
const cnoiseGLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec4 fade(vec4 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec4 P){
  vec4 Pi0 = floor(P); vec4 Pi1 = Pi0 + 1.0;
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec4 Pf0 = fract(P); vec4 Pf1 = Pf0 - 1.0;
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.zzzz); vec4 iz1 = vec4(Pi1.zzzz);
  vec4 iw0 = vec4(Pi0.wwww); vec4 iw1 = vec4(Pi1.wwww);
  vec4 ixy  = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
  vec4 ixy00 = permute(ixy0 + iw0); vec4 ixy01 = permute(ixy0 + iw1);
  vec4 ixy10 = permute(ixy1 + iw0); vec4 ixy11 = permute(ixy1 + iw1);
  vec4 gx00 = ixy00/7.0; vec4 gy00 = floor(gx00)/7.0; vec4 gz00 = floor(gy00)/6.0;
  gx00 = fract(gx00)-0.5; gy00 = fract(gy00)-0.5; gz00 = fract(gz00)-0.5;
  vec4 gw00 = vec4(0.75)-abs(gx00)-abs(gy00)-abs(gz00);
  vec4 sw00 = step(gw00,vec4(0.0)); gx00 -= sw00*(step(0.0,gx00)-0.5); gy00 -= sw00*(step(0.0,gy00)-0.5);
  vec4 gx01 = ixy01/7.0; vec4 gy01 = floor(gx01)/7.0; vec4 gz01 = floor(gy01)/6.0;
  gx01 = fract(gx01)-0.5; gy01 = fract(gy01)-0.5; gz01 = fract(gz01)-0.5;
  vec4 gw01 = vec4(0.75)-abs(gx01)-abs(gy01)-abs(gz01);
  vec4 sw01 = step(gw01,vec4(0.0)); gx01 -= sw01*(step(0.0,gx01)-0.5); gy01 -= sw01*(step(0.0,gy01)-0.5);
  vec4 gx10 = ixy10/7.0; vec4 gy10 = floor(gx10)/7.0; vec4 gz10 = floor(gy10)/6.0;
  gx10 = fract(gx10)-0.5; gy10 = fract(gy10)-0.5; gz10 = fract(gz10)-0.5;
  vec4 gw10 = vec4(0.75)-abs(gx10)-abs(gy10)-abs(gz10);
  vec4 sw10 = step(gw10,vec4(0.0)); gx10 -= sw10*(step(0.0,gx10)-0.5); gy10 -= sw10*(step(0.0,gy10)-0.5);
  vec4 gx11 = ixy11/7.0; vec4 gy11 = floor(gx11)/7.0; vec4 gz11 = floor(gy11)/6.0;
  gx11 = fract(gx11)-0.5; gy11 = fract(gy11)-0.5; gz11 = fract(gz11)-0.5;
  vec4 gw11 = vec4(0.75)-abs(gx11)-abs(gy11)-abs(gz11);
  vec4 sw11 = step(gw11,vec4(0.0)); gx11 -= sw11*(step(0.0,gx11)-0.5); gy11 -= sw11*(step(0.0,gy11)-0.5);
  vec4 g0000=vec4(gx00.x,gy00.x,gz00.x,gw00.x); vec4 g1000=vec4(gx00.y,gy00.y,gz00.y,gw00.y);
  vec4 g0100=vec4(gx00.z,gy00.z,gz00.z,gw00.z); vec4 g1100=vec4(gx00.w,gy00.w,gz00.w,gw00.w);
  vec4 g0010=vec4(gx10.x,gy10.x,gz10.x,gw10.x); vec4 g1010=vec4(gx10.y,gy10.y,gz10.y,gw10.y);
  vec4 g0110=vec4(gx10.z,gy10.z,gz10.z,gw10.z); vec4 g1110=vec4(gx10.w,gy10.w,gz10.w,gw10.w);
  vec4 g0001=vec4(gx01.x,gy01.x,gz01.x,gw01.x); vec4 g1001=vec4(gx01.y,gy01.y,gz01.y,gw01.y);
  vec4 g0101=vec4(gx01.z,gy01.z,gz01.z,gw01.z); vec4 g1101=vec4(gx01.w,gy01.w,gz01.w,gw01.w);
  vec4 g0011=vec4(gx11.x,gy11.x,gz11.x,gw11.x); vec4 g1011=vec4(gx11.y,gy11.y,gz11.y,gw11.y);
  vec4 g0111=vec4(gx11.z,gy11.z,gz11.z,gw11.z); vec4 g1111=vec4(gx11.w,gy11.w,gz11.w,gw11.w);
  vec4 norm00=taylorInvSqrt(vec4(dot(g0000,g0000),dot(g0100,g0100),dot(g1000,g1000),dot(g1100,g1100)));
  g0000*=norm00.x; g0100*=norm00.y; g1000*=norm00.z; g1100*=norm00.w;
  vec4 norm01=taylorInvSqrt(vec4(dot(g0001,g0001),dot(g0101,g0101),dot(g1001,g1001),dot(g1101,g1101)));
  g0001*=norm01.x; g0101*=norm01.y; g1001*=norm01.z; g1101*=norm01.w;
  vec4 norm10=taylorInvSqrt(vec4(dot(g0010,g0010),dot(g0110,g0110),dot(g1010,g1010),dot(g1110,g1110)));
  g0010*=norm10.x; g0110*=norm10.y; g1010*=norm10.z; g1110*=norm10.w;
  vec4 norm11=taylorInvSqrt(vec4(dot(g0011,g0011),dot(g0111,g0111),dot(g1011,g1011),dot(g1111,g1111)));
  g0011*=norm11.x; g0111*=norm11.y; g1011*=norm11.z; g1111*=norm11.w;
  float n0000=dot(g0000,Pf0); float n1000=dot(g1000,vec4(Pf1.x,Pf0.yzw));
  float n0100=dot(g0100,vec4(Pf0.x,Pf1.y,Pf0.zw)); float n1100=dot(g1100,vec4(Pf1.xy,Pf0.zw));
  float n0010=dot(g0010,vec4(Pf0.xy,Pf1.z,Pf0.w)); float n1010=dot(g1010,vec4(Pf1.x,Pf0.y,Pf1.z,Pf0.w));
  float n0110=dot(g0110,vec4(Pf0.x,Pf1.yz,Pf0.w)); float n1110=dot(g1110,vec4(Pf1.xyz,Pf0.w));
  float n0001=dot(g0001,vec4(Pf0.xyz,Pf1.w)); float n1001=dot(g1001,vec4(Pf1.x,Pf0.yz,Pf1.w));
  float n0101=dot(g0101,vec4(Pf0.x,Pf1.y,Pf0.z,Pf1.w)); float n1101=dot(g1101,vec4(Pf1.xy,Pf0.z,Pf1.w));
  float n0011=dot(g0011,vec4(Pf0.xy,Pf1.zw)); float n1011=dot(g1011,vec4(Pf1.x,Pf0.y,Pf1.zw));
  float n0111=dot(g0111,vec4(Pf0.x,Pf1.yzw)); float n1111=dot(g1111,Pf1);
  vec4 fade_xyzw=fade(Pf0);
  vec4 n_0w=mix(vec4(n0000,n1000,n0100,n1100),vec4(n0001,n1001,n0101,n1101),fade_xyzw.w);
  vec4 n_1w=mix(vec4(n0010,n1010,n0110,n1110),vec4(n0011,n1011,n0111,n1111),fade_xyzw.w);
  vec4 n_zw=mix(n_0w,n_1w,fade_xyzw.z);
  vec2 n_yzw=mix(n_zw.xy,n_zw.zw,fade_xyzw.y);
  float n_xyzw=mix(n_yzw.x,n_yzw.y,fade_xyzw.x);
  return 2.2*n_xyzw;
}
`;

const VERTEX_SHADER = `
uniform float uTime;
uniform float uFrequency;
uniform float uLiteMode;
uniform float uAmplitude;
uniform float uMicroAmplitude;
uniform vec3  uPrimaryColor;
uniform vec3  uSecondaryColor;

varying vec3 vColor;
varying vec3 vPosition;

${cnoiseGLSL}

void main(){
  float d     = cnoise(vec4(normal * uFrequency, uTime)) * uAmplitude;
  float micro = (1.0 - uLiteMode) * cnoise(vec4(normal * uFrequency * 3.5, uTime * 1.8 + 4.2)) * uMicroAmplitude;

  float total = d + micro;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.xyz += normal * total;
  vPosition = modelPosition.xyz;
  vColor = mix(uPrimaryColor, uSecondaryColor, smoothstep(0.1, 0.9, total));
  gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
`;

const FRAGMENT_SHADER = `
uniform float uAudioLevel;
uniform float uLiteMode;
uniform float uFresnelPower;
uniform float uGlowBase;
uniform float uGlowAudio;
uniform float uSpecPower;
uniform float uSpecIntensity;
uniform float uWhitening;
uniform float uChromaAb;

varying vec3 vColor;
varying vec3 vPosition;

void main(){
  // Modo lite — fragmento mínimo
  if (uLiteMode > 0.5) {
    gl_FragColor = vec4(vColor * 1.2, 0.92);
    return;
  }

  vec3  viewDir = normalize(cameraPosition - vPosition);
  vec3  n       = normalize(cross(dFdx(vPosition), dFdy(vPosition)));

  // Fresnel base
  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uFresnelPower);

  // Aberración cromática en el rim — split RGB por canal
  vec3 viewDirR = normalize(viewDir + vec3(uChromaAb, 0.0, 0.0));
  vec3 viewDirB = normalize(viewDir - vec3(uChromaAb, 0.0, 0.0));
  float fresnelR = pow(1.0 - max(dot(viewDirR, n), 0.0), uFresnelPower);
  float fresnelB = pow(1.0 - max(dot(viewDirB, n), 0.0), uFresnelPower);
  // Con uChromaAb=0 los tres son iguales (sin efecto). Con uChromaAb>0 el glow
  // se separa en R/G/B creando el halo RGB-split en el borde de la esfera.
  vec3 rimFresnel = vec3(fresnelR, fresnel, fresnelB);

  vec3 col  = mix(vColor, vec3(1.0, 1.0, 1.0), uAudioLevel * fresnel * uWhitening);
  vec3 r    = normalize(reflect(-normalize(vec3(1.0,1.0,1.0)), n));
  vec3 glow = vColor * rimFresnel * (uGlowBase + uAudioLevel * uGlowAudio);
  vec3 final = col * (vec3(0.9) + max(dot(viewDir, n), 0.0))
             + vec3(pow(max(dot(viewDir, r), 0.0), uSpecPower)) * uSpecIntensity
             + glow;

  gl_FragColor = vec4(final, 0.92 + fresnel * 0.08);
}
`;

const PRESET_COLORS: Record<string, { primary: number; secondary: number }> = {
  delta: { primary: 0x0f0c3a, secondary: 0x6366f1 }, // azul índigo profundo → índigo brillante
  theta: { primary: 0x2d0a5e, secondary: 0xc084fc }, // violeta oscuro → violeta claro
  alpha: { primary: 0x4a0a2e, secondary: 0xf472b6 }, // rosa oscuro → rosa brillante
  beta:  { primary: 0x002a3a, secondary: 0x22d3ee }, // cian oscuro → cian brillante
  gamma: { primary: 0x3a1a00, secondary: 0xfde68a }, // ámbar oscuro → oro brillante
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function EvaSphere() {
  const shaderRef  = useRef<THREE.ShaderMaterial>(null);
  const { audioRef, quality, setQuality } = useSphere();
  const { params, fpsRef } = useSphereDebug();

  // Uniforms — todos los valores del debug panel se escriben aquí cada frame
  const uniforms = useRef({
    uTime:           { value: 0 },
    uFrequency:      { value: 1.5 },
    uAudioLevel:     { value: 0.15 },
    uLiteMode:       { value: quality === "lite" ? 1.0 : 0.0 },
    uAmplitude:      { value: params.noiseAmplitude },
    uMicroAmplitude: { value: params.microAmplitude },
    uFresnelPower:   { value: params.fresnelPower },
    uGlowBase:       { value: params.glowBase },
    uGlowAudio:      { value: params.glowAudio },
    uSpecPower:      { value: params.specPower },
    uSpecIntensity:  { value: params.specIntensity },
    uWhitening:      { value: params.whitening },
    uChromaAb:       { value: params.chromaAb },
    uPrimaryColor:   { value: new THREE.Color(0x4c1d95) },
    uSecondaryColor: { value: new THREE.Color(0xa855f7) },
  });

  // Estado interpolado — refs, cero re-renders
  const tRef         = useRef(0);
  const curFreq      = useRef(1.5);
  const curAudio     = useRef(0.15);
  const curPrimary   = useRef(new THREE.Color(0x4c1d95));
  const curSecondary = useRef(new THREE.Color(0xa855f7));
  const tgtPrimary   = useRef(new THREE.Color(0x4c1d95));
  const tgtSecondary = useRef(new THREE.Color(0xa855f7));

  // Auto-detección de calidad (si no hay preferencia guardada)
  const fpsWindow    = useRef<number[]>([]);
  const fpsChecked   = useRef(false);
  const hasStoredPref = typeof window !== "undefined" && localStorage.getItem("me_quality") !== null;

  useFrame((_s, delta) => {
    if (!shaderRef.current || delta <= 0) return;

    // FPS rolling — actualiza el ref del debug panel (30 frames de ventana)
    const instantFPS = Math.min(1 / delta, 120);
    fpsWindow.current.push(instantFPS);
    if (fpsWindow.current.length > 30) fpsWindow.current.shift();
    fpsRef.current = Math.round(
      fpsWindow.current.reduce((a, b) => a + b) / fpsWindow.current.length
    );

    // Auto-calidad al arrancar
    if (!fpsChecked.current && !hasStoredPref && fpsWindow.current.length >= 90) {
      fpsChecked.current = true;
      if (fpsRef.current < 40) setQuality("lite");
    }

    const audio    = audioRef.current;
    const hasAudio = audio.amplitude > 0.05;

    let presetKey = "theta";
    if (hasAudio) {
      const ci = audio.frequency;
      if      (ci <= 0.12) presetKey = "delta";
      else if (ci <= 0.37) presetKey = "theta";
      else if (ci <= 0.62) presetKey = "alpha";
      else if (ci <= 0.87) presetKey = "beta";
      else                 presetKey = "gamma";
    }

    const colors = PRESET_COLORS[presetKey];
    tgtPrimary.current.setHex(colors.primary);
    tgtSecondary.current.setHex(colors.secondary);

    const tFreq = hasAudio
      ? 1.5 + audio.frequency * 1.5
      : 1.5 + Math.sin(tRef.current * 0.4) * 0.15;

    const tAudio = hasAudio
      ? audio.amplitude
      : 0.12 + Math.sin(tRef.current * 0.8) * 0.05;

    const preset = BINAURAL_PRESETS[presetKey as keyof typeof BINAURAL_PRESETS];
    const tSpeed = hasAudio ? 0.6 + preset.sphereSpeed * 2.0 : 0.6;

    curFreq.current  = lerp(curFreq.current,  tFreq,  0.05);
    curAudio.current = lerp(curAudio.current, tAudio, 0.1);
    curPrimary.current.lerp(tgtPrimary.current, 0.03);
    curSecondary.current.lerp(tgtSecondary.current, 0.03);
    tRef.current += delta * tSpeed;

    // Uniforms de animación
    shaderRef.current.uniforms.uTime.value       = tRef.current;
    shaderRef.current.uniforms.uFrequency.value  = curFreq.current;
    shaderRef.current.uniforms.uAudioLevel.value = curAudio.current;
    shaderRef.current.uniforms.uLiteMode.value   = quality === "lite" ? 1.0 : 0.0;
    shaderRef.current.uniforms.uPrimaryColor.value.copy(curPrimary.current);
    shaderRef.current.uniforms.uSecondaryColor.value.copy(curSecondary.current);

    // Uniforms del debug panel — se aplican en tiempo real cada frame
    shaderRef.current.uniforms.uAmplitude.value      = params.noiseAmplitude;
    shaderRef.current.uniforms.uMicroAmplitude.value = params.microAmplitude;
    shaderRef.current.uniforms.uFresnelPower.value   = params.fresnelPower;
    shaderRef.current.uniforms.uGlowBase.value       = params.glowBase;
    shaderRef.current.uniforms.uGlowAudio.value      = params.glowAudio;
    shaderRef.current.uniforms.uSpecPower.value      = params.specPower;
    shaderRef.current.uniforms.uSpecIntensity.value  = params.specIntensity;
    shaderRef.current.uniforms.uWhitening.value      = params.whitening;
    shaderRef.current.uniforms.uChromaAb.value       = params.chromaAb;

    // Wireframe — prop directa en el material
    shaderRef.current.wireframe = params.wireframe;
  });

  const subdivisions = params.subdivisions;

  return (
    <mesh>
      <icosahedronGeometry args={[0.75, subdivisions]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms.current}
        transparent
      />
    </mesh>
  );
}
