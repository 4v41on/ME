// EvaSphere — Fragment Shader
// Color responds to displacement intensity.
// Base: deep black → violet at peak → cyan at maximum.
// Fresnel glow on edges.
// Original — written for ME / Cleopatra.

uniform float uAmplitude;

varying float vDisplacement;
varying vec3  vNormal;

void main() {
  // Normalize displacement to 0–1 range
  float d = clamp((vDisplacement + 0.1) / 0.45, 0.0, 1.0);

  // Color gradient: black → violet (#6C63FF) → cyan (#00D4FF)
  vec3 black  = vec3(0.02, 0.02, 0.03);
  vec3 violet = vec3(0.424, 0.388, 1.0);    // #6C63FF
  vec3 cyan   = vec3(0.0, 0.831, 1.0);       // #00D4FF

  vec3 color = mix(black, violet, smoothstep(0.0, 0.6, d));
  color = mix(color, cyan, smoothstep(0.5, 1.0, d * uAmplitude * 1.5));

  // Fresnel: glow on silhouette edges
  vec3 viewDir = normalize(cameraPosition - vNormal);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
  color += fresnel * violet * 0.4;

  gl_FragColor = vec4(color, 1.0);
}
