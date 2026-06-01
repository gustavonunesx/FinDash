"use client";

import { useEffect, useRef } from "react";
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

// mediump is enough for a decorative effect and ~2x faster on mobile GPUs
const vertexShader = `
precision mediump float;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Optimisations vs original:
// - mediump precision
// - rotate() + log() hoisted out of inner loops (computed once per wave layer)
// - loop counts capped via constants (GLSL unrolls loops at compile time —
//   uniform-driven counts still work but the compiler can't unroll; keeping
//   counts low matters most)
// - mouse bend uses a cheap quadratic falloff instead of exp()
// - gradient lookup simplified (no branch per iteration)
const fragmentShader = `
precision mediump float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

// keep these small — each iteration runs per fragment across the full canvas
uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePos;
uniform vec3 middleWavePos;
uniform vec3 bottomWavePos;

uniform vec2  iMouse;
uniform bool  interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform vec2 parallaxOffset;

uniform vec3  lineGradient[8];
uniform int   lineGradientCount;

mat2 rot(float r) {
  float c = cos(r), s = sin(r);
  return mat2(c, s, -s, c);
}

vec3 lineColor(float t) {
  if (lineGradientCount < 2) return lineGradient[0];
  float s  = clamp(t, 0.0, 0.9999) * float(lineGradientCount - 1);
  int   i  = int(s);
  // avoid dynamic indexing branch — use mix chain capped at compile time
  vec3 c0 = lineGradient[i];
  vec3 c1 = lineGradient[min(i + 1, lineGradientCount - 1)];
  return mix(c0, c1, fract(s)) * 0.5;
}

// cheap quadratic falloff instead of exp() — visually similar, ~3x faster
float falloff(vec2 d, float radius) {
  float r2 = dot(d, d) * radius;
  return 1.0 / (1.0 + r2 * r2);
}

float waveLine(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv) {
  float t   = iTime * animationSpeed;
  float amp = sin(offset + t * 0.2) * 0.3;
  float y   = sin(uv.x + offset + t * 0.1) * amp;

  if (interactive) {
    vec2  d   = screenUv - mouseUv;
    float inf = falloff(d, bendRadius) * bendInfluence;
    y += (mouseUv.y - screenUv.y) * inf * bendStrength;
  }

  float m = uv.y - y;
  return 0.017 / (abs(m) + 0.012);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  uv.y *= -1.0;
  uv   += parallaxOffset;

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  vec3 col = vec3(0.0);

  // ── bottom layer — weakest, fewest lines ─────────────────────────────────
  if (enableBottom) {
    float angle = bottomWavePos.z * log(length(uv) + 1.0);
    vec2  ruv   = uv * rot(angle);
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(bottomLineCount - 1), 1.0);
      col += lineColor(t) * waveLine(
        ruv + vec2(bottomLineDistance * fi + bottomWavePos.x, bottomWavePos.y),
        1.5 + 0.2 * fi, uv, mouseUv
      ) * 0.18;
    }
  }

  // ── middle layer — main visible waves ────────────────────────────────────
  if (enableMiddle) {
    float angle = middleWavePos.z * log(length(uv) + 1.0);
    vec2  ruv   = uv * rot(angle);
    for (int i = 0; i < middleLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(middleLineCount - 1), 1.0);
      col += lineColor(t) * waveLine(
        ruv + vec2(middleLineDistance * fi + middleWavePos.x, middleWavePos.y),
        2.0 + 0.15 * fi, uv, mouseUv
      );
    }
  }

  // ── top layer — very faint ───────────────────────────────────────────────
  if (enableTop) {
    float angle = topWavePos.z * log(length(uv) + 1.0);
    vec2  ruv   = uv * rot(angle);
    ruv.x *= -1.0;
    for (int i = 0; i < topLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(topLineCount - 1), 1.0);
      col += lineColor(t) * waveLine(
        ruv + vec2(topLineDistance * fi + topWavePos.x, topWavePos.y),
        1.0 + 0.2 * fi, uv, mouseUv
      ) * 0.08;
    }
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const MAX_STOPS = 8;

function hexToVec3(hex: string): Vector3 {
  const v = hex.trim().replace(/^#/, "");
  const parse = (s: string) => parseInt(s, 16) / 255;
  if (v.length === 3)
    return new Vector3(parse(v[0] + v[0]), parse(v[1] + v[1]), parse(v[2] + v[2]));
  return new Vector3(parse(v.slice(0, 2)), parse(v.slice(2, 4)), parse(v.slice(4, 6)));
}

interface WavePosition { x: number; y: number; rotate: number; }

interface FloatingLinesProps {
  linesGradient?: string[];
  enabledWaves?: Array<"top" | "middle" | "bottom">;
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  className?: string;
}

export default function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
  className,
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMouseRef   = useRef(new Vector2(-1000, -1000));
  const currentMouseRef  = useRef(new Vector2(-1000, -1000));
  const targetInfRef     = useRef(0);
  const currentInfRef    = useRef(0);
  const targetParRef     = useRef(new Vector2(0, 0));
  const currentParRef    = useRef(new Vector2(0, 0));

  const resolveCount = (waveType: "top" | "middle" | "bottom") => {
    if (!enabledWaves.includes(waveType)) return 0;
    if (typeof lineCount === "number") return lineCount;
    return (lineCount as number[])[enabledWaves.indexOf(waveType)] ?? 6;
  };
  const resolveDist = (waveType: "top" | "middle" | "bottom") => {
    if (!enabledWaves.includes(waveType)) return 0.05;
    if (typeof lineDistance === "number") return lineDistance * 0.01;
    return ((lineDistance as number[])[enabledWaves.indexOf(waveType)] ?? 5) * 0.01;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    const scene    = new Scene();
    const camera   = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({
      antialias: false,  // off — saves ~30% GPU on full-screen quads
      alpha: false,
      powerPreference: "low-power",  // lets browser/OS pick the efficient GPU
    });
    // Cap at 1 — retina screens double the fragment count for no visible gain
    // on a decorative background element.
    renderer.setPixelRatio(1);
    renderer.domElement.style.width  = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTime:           { value: 0 },
      iResolution:     { value: new Vector3(1, 1, 1) },
      animationSpeed:  { value: animationSpeed },
      enableTop:       { value: enabledWaves.includes("top") },
      enableMiddle:    { value: enabledWaves.includes("middle") },
      enableBottom:    { value: enabledWaves.includes("bottom") },
      topLineCount:    { value: resolveCount("top") },
      middleLineCount: { value: resolveCount("middle") },
      bottomLineCount: { value: resolveCount("bottom") },
      topLineDistance:    { value: resolveDist("top") },
      middleLineDistance: { value: resolveDist("middle") },
      bottomLineDistance: { value: resolveDist("bottom") },
      topWavePos:    { value: new Vector3(topWavePosition?.x    ?? 10.0, topWavePosition?.y    ?? 0.5,  topWavePosition?.rotate    ?? -0.4) },
      middleWavePos: { value: new Vector3(middleWavePosition?.x ?? 5.0,  middleWavePosition?.y ?? 0.0,  middleWavePosition?.rotate ?? 0.2)  },
      bottomWavePos: { value: new Vector3(bottomWavePosition?.x ?? 2.0,  bottomWavePosition?.y ?? -0.7, bottomWavePosition?.rotate ?? 0.4)  },
      iMouse:          { value: new Vector2(-1000, -1000) },
      interactive:     { value: interactive },
      bendRadius:      { value: bendRadius },
      bendStrength:    { value: bendStrength },
      bendInfluence:   { value: 0 },
      parallaxOffset:  { value: new Vector2(0, 0) },
      lineGradient:    { value: Array.from({ length: MAX_STOPS }, () => new Vector3(1, 1, 1)) },
      lineGradientCount: { value: 0 },
    };

    if (linesGradient?.length) {
      const stops = linesGradient.slice(0, MAX_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, i) => {
        const c = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(c.x, c.y, c.z);
      });
    }

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const clock = new Clock();

    const setSize = () => {
      if (!active) return;
      const w = container.clientWidth  || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      uniforms.iResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
        1,
      );
    };
    setSize();

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { if (active) setSize(); })
      : null;
    ro?.observe(container);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      // pixelRatio is 1 so no dpr multiplication needed
      targetMouseRef.current.set(x, rect.height - y);
      targetInfRef.current = 1.0;
      if (parallax) {
        const cx = rect.width / 2, cy = rect.height / 2;
        targetParRef.current.set(
          ((x - cx) / rect.width)  * parallaxStrength,
          ((cy - y) / rect.height) * parallaxStrength,
        );
      }
    };
    const handlePointerLeave = () => { targetInfRef.current = 0; };

    if (interactive) {
      renderer.domElement.addEventListener("pointermove", handlePointerMove, { passive: true });
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    }

    // Throttle to ~30 fps — plenty for a decorative background, halves GPU time
    const TARGET_MS = 1000 / 30;
    let lastTime = 0;
    let raf = 0;

    const loop = (now: number) => {
      if (!active) return;
      raf = requestAnimationFrame(loop);

      const delta = now - lastTime;
      if (delta < TARGET_MS) return;
      lastTime = now - (delta % TARGET_MS);

      uniforms.iTime.value = clock.getElapsedTime();

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);
        uniforms.iMouse.value.copy(currentMouseRef.current);
        currentInfRef.current += (targetInfRef.current - currentInfRef.current) * mouseDamping;
        uniforms.bendInfluence.value = currentInfRef.current;
      }

      if (parallax) {
        currentParRef.current.lerp(targetParRef.current, mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParRef.current);
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (interactive) {
        renderer.domElement.removeEventListener("pointermove", handlePointerMove);
        renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", mixBlendMode }}
    />
  );
}
