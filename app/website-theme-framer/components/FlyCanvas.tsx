'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Natural model width in model-space units (X spans ~-0.95 to +0.95).
// Used to map "pixel size on screen" → model scale.
const MODEL_NATURAL_WIDTH = 1.9;

// Wing flap amplitude in model-space Z units.
// Wings oscillate ±FLAP_AMP at their tips.
const FLAP_AMP = 0.28;

/**
 * Inject a wing-flap displacement into any MeshStandard/MeshPhysical material
 * via onBeforeCompile so textures and lighting are preserved.
 *
 * Wing heuristic (original model coords):
 *   |x| > ~0.33  → laterally spread = wing region
 *   y  ∈ 0.32–1.10 → mid-to-upper body height = wing attachment zone
 *   tip factor grows linearly from root to tip
 */
function injectWingFlap(
  material: THREE.Material,
  uniforms: {
    uTime: THREE.IUniform<number>;
    uFlapSpeed: THREE.IUniform<number>;
    uFlapAmp: THREE.IUniform<number>;
  },
) {
  if (
    !(material instanceof THREE.MeshStandardMaterial) &&
    !(material instanceof THREE.MeshPhysicalMaterial)
  ) return;

  const mat = material as THREE.MeshStandardMaterial;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uFlapSpeed = uniforms.uFlapSpeed;
    shader.uniforms.uFlapAmp = uniforms.uFlapAmp;

    // Prepend uniform declarations
    shader.vertexShader =
      `uniform float uTime;\nuniform float uFlapSpeed;\nuniform float uFlapAmp;\n` +
      shader.vertexShader;

    // Inject displacement after Three.js resolves `transformed` (= position copy)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
  // Wing mask: vertices that spread laterally (high |x|) at mid-body height
  float wX   = smoothstep(0.33, 0.58, abs(position.x));
  float wY   = smoothstep(0.32, 0.52, position.y) * (1.0 - smoothstep(0.92, 1.12, position.y));
  float wing = wX * wY;
  // Tip factor: displacement grows from root → tip
  float tip  = smoothstep(0.33, 0.92, abs(position.x));
  // Flap: oscillate in Z, mirrored so both wings beat symmetrically
  float beat = sin(uTime * uFlapSpeed) * uFlapAmp;
  transformed.z += wing * tip * beat;`,
    );
  };

  mat.needsUpdate = true;
}

export default function FlyCanvas({ sizeVw = 0.22 }: { sizeVw?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    // Canvas dimensions — read from element, not window, to avoid scrollbar mismatch
    let W = el.clientWidth || window.innerWidth;
    let H = el.clientHeight || window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene & camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Orthographic in pixel space keeps position math identical to the sprite version
    const camera = new THREE.OrthographicCamera(
      -W / 2, W / 2, H / 2, -H / 2,
      0.1, 50000,
    );
    camera.position.z = 10000;

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(300, 600, 2000);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd9b0, 0.8);
    fillLight.position.set(-400, -300, 1000);
    scene.add(fillLight);

    // ── Wing-flap uniforms (shared across all mesh materials) ─────────────────
    const flapUniforms = {
      uTime:      { value: 0 } as THREE.IUniform<number>,
      uFlapSpeed: { value: 3.5 } as THREE.IUniform<number>,
      uFlapAmp:   { value: FLAP_AMP } as THREE.IUniform<number>,
    };

    // ── Fly pivot — positioned in pixel space ─────────────────────────────────
    const flyPivot = new THREE.Group();
    flyPivot.visible = false;
    scene.add(flyPivot);

    function flySize() { return W * sizeVw; }

    function updateScale() {
      flyPivot.scale.setScalar(flySize() / MODEL_NATURAL_WIDTH);
    }
    updateScale();

    // ── Load GLB ──────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load('/fly.glb', (gltf) => {
      const model = gltf.scene;

      // Center the model around its own origin so flyPivot.position drives it
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      // Slight upward tilt; Y rotation is driven dynamically in the render loop
      model.rotation.x = -0.25;
      model.rotation.y = 0;

      // Inject wing-flap into every mesh material
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => injectWingFlap(m, flapUniforms));
        }
      });

      flyPivot.add(model);
      flyPivot.visible = true;
    });

    // ── Scroll-driven movement path (identical to sprite version) ────────────
    function getTarget(t: number): [number, number] {
      const fs = flySize();
      const xPad = Math.max(40, W * 0.05);
      const yPad = Math.max(56, H * 0.08);
      const xBound = W / 2 - fs / 2 - xPad;
      const yBound = H / 2 - fs / 2 - yPad;

      // Wobble fades at start/end so the fly settles cleanly
      const wobbleEnvelope = Math.sin(t * Math.PI);

      const rawX =
        Math.sin(t * Math.PI * 2.0) * (xBound * 0.85) +
        Math.sin(t * Math.PI * 5.0) * (xBound * 0.12);
      const rawY =
        yBound - 2 * yBound * t +
        Math.sin(t * Math.PI * 3.3) * (yBound * 0.28) * wobbleEnvelope;

      return [
        Math.max(-xBound, Math.min(xBound, rawX)),
        Math.max(-yBound, Math.min(yBound, rawY)),
      ];
    }

    let [targetX, targetY] = getTarget(0);
    let currentX = targetX;
    let currentY = targetY;
    let prevX = currentX;
    let prevY = currentY;

    // Flap-speed state — ramps up on movement, decays at rest
    let flapSpeed = 3.5;
    let targetFlapSpeed = 3.5;

    // Smoothed horizontal velocity for yaw (side-profile) calculation
    let smoothDx = 0;

    flyPivot.position.set(currentX, currentY, 0);

    function handleScroll() {
      const maxScroll = Math.max(document.body.scrollHeight - H, 1);
      const progress = Math.min(window.scrollY / maxScroll, 1);
      [targetX, targetY] = getTarget(progress);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId: number;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth position lerp
      currentX += (targetX - currentX) * 0.065;
      currentY += (targetY - currentY) * 0.065;

      const bob = Math.sin(elapsed * 2.1) * 5;
      flyPivot.position.x = currentX;
      flyPivot.position.y = currentY + bob;

      // Banking (Z roll) + side-profile yaw (Y rotation)
      const dx = currentX - prevX;
      const bankTarget = -dx * 0.09;
      flyPivot.rotation.z += (bankTarget - flyPivot.rotation.z) * 0.1;

      // Yaw: smoothed dx → atan maps velocity to [-π/2, +π/2] side profile
      // divisor 1.5 means ~1.5 px/frame of lerped movement = 45° turn
      smoothDx += (dx - smoothDx) * 0.12;
      const targetYaw = Math.atan(smoothDx / 1.5);
      flyPivot.rotation.y += (targetYaw - flyPivot.rotation.y) * 0.06;

      // Wing flap speed: proportional to movement magnitude
      const dy = currentY - prevY;
      const moveSpeed = Math.sqrt(dx * dx + dy * dy);
      // Base 5 rad/s; each pixel of movement adds ~180 rad/s (saturates quickly)
      targetFlapSpeed = 3.5 + moveSpeed * 40;
      flapSpeed += (targetFlapSpeed - flapSpeed) * 0.07;

      prevX = currentX;
      prevY = currentY;

      flapUniforms.uTime.value      = elapsed;
      flapUniforms.uFlapSpeed.value = flapSpeed;

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize handler ────────────────────────────────────────────────────────
    function applySize(w: number, h: number) {
      W = w; H = h;
      renderer.setSize(W, H, false);
      camera.left   = -W / 2;
      camera.right  =  W / 2;
      camera.top    =  H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
      updateScale();
    }

    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) applySize(width, height);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      renderer.dispose();
    };
  }, [sizeVw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
