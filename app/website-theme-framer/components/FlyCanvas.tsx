'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TOTAL_FRAMES = 250;
const OFFSCREEN_W = 512;
const OFFSCREEN_H = 512;

export default function FlyCanvas({ sizeVw = 0.22 }: { sizeVw?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    // W/H come from the canvas's actual rendered CSS size (via ResizeObserver),
    // not window.innerWidth — avoids scrollbar / 100vw vs innerWidth mismatches.
    let W = el.clientWidth || window.innerWidth;
    let H = el.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    // false = don't let THREE touch canvas.style — our CSS owns width/height
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 10;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = OFFSCREEN_W;
    offCanvas.height = OFFSCREEN_H;
    const offCtx = offCanvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(offCanvas);

    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.01,
    });
    const fly = new THREE.Mesh(geo, mat);
    fly.visible = false;
    scene.add(fly);

    function flySize() { return W * sizeVw; }
    fly.scale.setScalar(flySize());

    const frames: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    let drawnIdx = -1;

    function drawFrame(idx: number) {
      if (drawnIdx === idx) return;
      const img = frames[idx];
      if (!img) return;
      offCtx.clearRect(0, 0, OFFSCREEN_W, OFFSCREEN_H);
      offCtx.drawImage(img, 0, 0, OFFSCREEN_W, OFFSCREEN_H);
      texture.needsUpdate = true;
      drawnIdx = idx;
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(4, '0');
      img.src = `/frames-no-bg/frame_${num}.png`;
      img.onload = () => {
        frames[i] = img;
        if (i === 0) { drawFrame(0); fly.visible = true; }
      };
    }

    function getTarget(t: number): [number, number] {
      const fs = flySize();
      const xPad = Math.max(40, W * 0.05);
      const yPad = Math.max(56, H * 0.08);
      const xBound = W / 2 - fs / 2 - xPad;
      const yBound = H / 2 - fs / 2 - yPad;

      // wobble amplitude fades to 0 at scroll start/end — fly settles cleanly
      const wobbleEnvelope = Math.sin(t * Math.PI);

      const rawX =
        Math.sin(t * Math.PI * 2.0) * (xBound * 0.85) +
        Math.sin(t * Math.PI * 5.0) * (xBound * 0.12);
      const rawY =
        yBound - 2 * yBound * t +
        Math.sin(t * Math.PI * 3.3) * (yBound * 0.28) * wobbleEnvelope;

      const x = Math.max(-xBound, Math.min(xBound, rawX));
      const y = Math.max(-yBound, Math.min(yBound, rawY));
      return [x, y];
    }

    let [targetX, targetY] = getTarget(0);
    let currentX = targetX;
    let currentY = targetY;
    let prevX = currentX;
    let activeFrameIdx = 0;

    fly.position.set(currentX, currentY, 0);

    function handleScroll() {
      const maxScroll = Math.max(document.body.scrollHeight - H, 1);
      const progress = Math.min(window.scrollY / maxScroll, 1);
      const newIdx = Math.round(progress * (TOTAL_FRAMES - 1));
      if (newIdx !== activeFrameIdx) { activeFrameIdx = newIdx; drawFrame(activeFrameIdx); }
      [targetX, targetY] = getTarget(progress);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId: number;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      currentX += (targetX - currentX) * 0.065;
      currentY += (targetY - currentY) * 0.065;

      const bob = Math.sin(elapsed * 2.1) * 5;
      fly.position.x = currentX;
      fly.position.y = currentY + bob;

      const dx = currentX - prevX;
      const bankTarget = -dx * 0.09;
      fly.rotation.z += (bankTarget - fly.rotation.z) * 0.1;
      prevX = currentX;

      renderer.render(scene, camera);
    }

    animate();

    // ResizeObserver reads the canvas's actual rendered CSS size —
    // the only reliable source on all browsers/OSes.
    function applySize(w: number, h: number) {
      W = w;
      H = h;
      renderer.setSize(W, H, false);
      camera.left   = -W / 2;
      camera.right  =  W / 2;
      camera.top    =  H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
      fly.scale.setScalar(flySize());
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
      geo.dispose();
      mat.dispose();
      texture.dispose();
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
