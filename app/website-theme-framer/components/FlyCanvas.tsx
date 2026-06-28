'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TOTAL_FRAMES = 200;
const OFFSCREEN_W = 256;
const OFFSCREEN_H = 256; // square — PNGs are already transparent
const FLY_SIZE = 420;    // display size in px (ortho camera: 1 unit = 1 px)

export default function FlyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 10;

    // Single GPU texture backed by an off-screen canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = OFFSCREEN_W;
    offCanvas.height = OFFSCREEN_H;
    const offCtx = offCanvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(offCanvas);

    const geo = new THREE.PlaneGeometry(FLY_SIZE, FLY_SIZE);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.01,
    });
    const fly = new THREE.Mesh(geo, mat);
    fly.visible = false;
    scene.add(fly);

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
      const num = String(i + 1).padStart(5, '0');
      img.src = `/frames-no-bg/frame_${num}.png`;
      img.onload = () => {
        frames[i] = img;
        if (i === 0) {
          drawFrame(0);
          fly.visible = true;
        }
      };
    }

    function getTarget(t: number): [number, number] {
      const x =
        Math.sin(t * Math.PI * 2.6) * (W * 0.35) +
        Math.sin(t * Math.PI * 6.0) * (W * 0.07);
      const yTop = H / 2 - FLY_SIZE / 2 - 56;
      const yBot = -(H / 2 - FLY_SIZE / 2 - 56);
      const y = yTop + (yBot - yTop) * t + Math.sin(t * Math.PI * 3.3) * (H * 0.12);
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
      if (newIdx !== activeFrameIdx) {
        activeFrameIdx = newIdx;
        drawFrame(activeFrameIdx);
      }
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

    function handleResize() {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.left = -W / 2;
      camera.right = W / 2;
      camera.top = H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      texture.dispose();
    };
  }, []);

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
