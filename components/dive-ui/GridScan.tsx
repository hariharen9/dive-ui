"use client";

import React, { useEffect, useRef, useState } from 'react';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';
import { gridScanVert as vert, gridScanFrag as frag } from './shaders/gridscan';

type GridScanProps = {
  quality?: 'high' | 'low';
  isPaused?: boolean;
  enableWebcam?: boolean;
  showPreview?: boolean;
  modelsPath?: string;

  lineThickness?: number;
  linesColor?: string;

  gridScale?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineJitter?: number;

  enablePost?: boolean;
  bloomIntensity?: number;
  chromaticAberration?: number;
  noiseIntensity?: number;

  scanColor?: string;
  scanOpacity?: number;
  scanDirection?: 'forward' | 'backward' | 'pingpong';
  scanSoftness?: number;
  scanGlow?: number;
  scanPhaseTaper?: number;
  scanDuration?: number;
  scanDelay?: number;
  scanDepth?: number;
  
  particleCount?: number;
  colorMode?: 'solid' | 'depth' | 'rainbow';
  depthColor?: string;
  scanEffect?: 'glow' | 'shadow';

  enableGyro?: boolean;
  scanOnClick?: boolean;
  snapBackDelay?: number;
  className?: string;
  style?: React.CSSProperties;
};



export const GridScan: React.FC<GridScanProps> = ({
  quality = 'high',
  enableWebcam = false,
  showPreview = false,
  modelsPath = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights',
  lineThickness = 1,
  linesColor = '#392e4e',
  scanColor = '#FF9FFC',
  scanOpacity = 0.4,
  gridScale = 0.1,
  lineStyle = 'solid',
  lineJitter: lineJitterProp = 0.1,
  scanDirection = 'pingpong',
  enablePost: enablePostProp = true,
  bloomIntensity = 0,
  chromaticAberration = 0.002,
  noiseIntensity: noiseIntensityProp = 0.01,
  scanGlow = 0.5,
  scanSoftness = 2,
  scanPhaseTaper = 0.9,
  scanDuration = 2.0,
  scanDelay = 2.0,
  scanDepth = 4.0,
  particleCount = 100,
  colorMode = 'solid',
  depthColor = '#7f00ff',
  scanEffect = 'glow',
  enableGyro = false,
  scanOnClick = false,
  snapBackDelay = 250,
  isPaused = false,
  className,
  style
}) => {
  const isLowQuality = quality === 'low';
  const enablePost = isLowQuality ? false : enablePostProp;
  const lineJitter = isLowQuality ? 0 : lineJitterProp;
  const noiseIntensity = isLowQuality ? 0 : noiseIntensityProp;
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomRef = useRef<BloomEffect | null>(null);
  const chromaRef = useRef<ChromaticAberrationEffect | null>(null);
  const rafRef = useRef<number | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [uiFaceActive, setUiFaceActive] = useState(false);
  const [faceapi, setFaceapi] = useState<any | null>(null);


  const lookTarget = useRef(new THREE.Vector2(0, 0));
  const tiltTarget = useRef(0);
  const yawTarget = useRef(0);

  const lookCurrent = useRef(new THREE.Vector2(0, 0));
  const lookVel = useRef(new THREE.Vector2(0, 0));
  const tiltCurrent = useRef(0);
  const tiltVel = useRef(0);
  const yawCurrent = useRef(0);
  const yawVel = useRef(0);

  const MAX_SCANS = 8;
  const scanStartsRef = useRef<number[]>([]);

  const pushScan = (t: number) => {
    const arr = scanStartsRef.current.slice();
    if (arr.length >= MAX_SCANS) arr.shift();
    arr.push(t);
    scanStartsRef.current = arr;
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      const buf = new Array(MAX_SCANS).fill(0);
      for (let i = 0; i < arr.length && i < MAX_SCANS; i++) buf[i] = arr[i];
      u.uScanStarts.value = buf;
      u.uScanCount.value = arr.length;
    }
  };

  const bufX = useRef<number[]>([]);
  const bufY = useRef<number[]>([]);
  const bufT = useRef<number[]>([]);
  const bufYaw = useRef<number[]>([]);

  // Fixed values after removing `sensitivity` prop
  const skewScale = 0.12;
  const tiltScale = 0.2;
  const yawScale = 0.18;
  const depthResponse = 0.35;
  const smoothTime = 0.25;
  const maxSpeed = Infinity;
  const yBoost = 1.4;


  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let leaveTimer: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (uiFaceActive) return;
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      lookTarget.current.set(nx, ny);
    };
    const onClick = async () => {
      const nowSec = performance.now() / 1000;
      if (scanOnClick) pushScan(nowSec);
      if (
        enableGyro &&
        typeof window !== 'undefined' &&
        (window as any).DeviceOrientationEvent &&
        (DeviceOrientationEvent as any).requestPermission
      ) {
        try {
          await (DeviceOrientationEvent as any).requestPermission();
        } catch {}
      }
    };
    const onEnter = () => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
    };
    const onLeave = () => {
      if (uiFaceActive) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(
        () => {
          lookTarget.current.set(0, 0);
          tiltTarget.current = 0;
          yawTarget.current = 0;
        },
        Math.max(0, snapBackDelay || 0)
      );
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    if (scanOnClick) el.addEventListener('click', onClick);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      if (scanOnClick) el.removeEventListener('click', onClick);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [uiFaceActive, snapBackDelay, scanOnClick, enableGyro]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const uniforms = {
      iResolution: {
        value: new THREE.Vector3(container.clientWidth, container.clientHeight, renderer.getPixelRatio())
      },
      iTime: { value: 0 },
      uSkew: { value: new THREE.Vector2(0, 0) },
      uTilt: { value: 0 },
      uYaw: { value: 0 },
      uLineThickness: { value: lineThickness },
      uLinesColor: { value: srgbColor(linesColor) },
      uScanColor: { value: srgbColor(scanColor) },
      uGridScale: { value: gridScale },
      uLineStyle: { value: lineStyle === 'dashed' ? 1 : lineStyle === 'dotted' ? 2 : 0 },
      uLineJitter: { value: Math.max(0, Math.min(1, lineJitter || 0)) },
      uScanOpacity: { value: scanOpacity },
      uNoise: { value: noiseIntensity },
      uBloomOpacity: { value: bloomIntensity },
      uScanGlow: { value: scanGlow },
      uScanSoftness: { value: scanSoftness },
      uPhaseTaper: { value: scanPhaseTaper },
      uScanDuration: { value: scanDuration },
      uScanDelay: { value: scanDelay },
      uScanDepth: { value: scanDepth },
      uParticleDensity: { value: particleCount / 1000.0 },
      uColorMode: { value: colorMode === 'depth' ? 1 : colorMode === 'rainbow' ? 2 : 0 },
      uDepthColor: { value: srgbColor(depthColor) },
      uScanEffect: { value: scanEffect === 'shadow' ? 1.0 : 0.0 },
      uScanDirection: { value: scanDirection === 'backward' ? 1 : scanDirection === 'pingpong' ? 2 : 0 },
      uScanStarts: { value: new Array(MAX_SCANS).fill(0) },
      uScanCount: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });
    materialRef.current = material;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let composer: EffectComposer | null = null;
    if (enablePost) {
      composer = new EffectComposer(renderer);
      composerRef.current = composer;
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloom = new BloomEffect({
        intensity: 1.0,
        luminanceThreshold: 0.6,
        luminanceSmoothing: 0.8
      });
      bloom.blendMode.opacity.value = Math.max(0, bloomIntensity);
      bloomRef.current = bloom;

      const chroma = new ChromaticAberrationEffect({
        offset: new THREE.Vector2(chromaticAberration, chromaticAberration),
        radialModulation: true,
        modulationOffset: 0.0
      });
      chromaRef.current = chroma;

      const effectPass = new EffectPass(camera, bloom, chroma);
      effectPass.renderToScreen = true;
      composer.addPass(effectPass);
    }

    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      material.uniforms.iResolution.value.set(container.clientWidth, container.clientHeight, renderer.getPixelRatio());
      if (composerRef.current) composerRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;

      lookCurrent.current.copy(
        smoothDampVec2(lookCurrent.current, lookTarget.current, lookVel.current, smoothTime, maxSpeed, dt)
      );

      const tiltSm = smoothDampFloat(
        tiltCurrent.current,
        tiltTarget.current,
        { v: tiltVel.current },
        smoothTime,
        maxSpeed,
        dt
      );
      tiltCurrent.current = tiltSm.value;
      tiltVel.current = tiltSm.v;

      const yawSm = smoothDampFloat(
        yawCurrent.current,
        yawTarget.current,
        { v: yawVel.current },
        smoothTime,
        maxSpeed,
        dt
      );
      yawCurrent.current = yawSm.value;
      yawVel.current = yawSm.v;

      const skew = new THREE.Vector2(lookCurrent.current.x * skewScale, -lookCurrent.current.y * yBoost * skewScale);
      material.uniforms.uSkew.value.set(skew.x, skew.y);
      material.uniforms.uTilt.value = tiltCurrent.current * tiltScale;
      material.uniforms.uYaw.value = THREE.MathUtils.clamp(yawCurrent.current * yawScale, -0.6, 0.6);

      if (!isPaused) {
        material.uniforms.iTime.value = now / 1000;
      }
      renderer.clear(true, true, true);
      if (composerRef.current) {
        composerRef.current.render(dt);
      } else {
        renderer.render(scene, camera);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      material.dispose();
      (quad.geometry as THREE.BufferGeometry).dispose();
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [
    lineThickness,
    linesColor,
    scanColor,
    scanOpacity,
    gridScale,
    lineStyle,
    lineJitter,
    scanDirection,
    enablePost,
    isPaused
  ]);

  useEffect(() => {
    const m = materialRef.current;
    if (m) {
      const u = m.uniforms;
      u.uLineThickness.value = lineThickness;
      (u.uLinesColor.value as THREE.Color).copy(srgbColor(linesColor));
      (u.uScanColor.value as THREE.Color).copy(srgbColor(scanColor));
      u.uGridScale.value = gridScale;
      u.uLineStyle.value = lineStyle === 'dashed' ? 1 : lineStyle === 'dotted' ? 2 : 0;
      u.uLineJitter.value = Math.max(0, Math.min(1, lineJitter || 0));
      u.uBloomOpacity.value = Math.max(0, bloomIntensity);
      u.uNoise.value = Math.max(0, noiseIntensity);
      u.uScanGlow.value = scanGlow;
      u.uScanOpacity.value = Math.max(0, Math.min(1, scanOpacity));
      u.uScanDirection.value = scanDirection === 'backward' ? 1 : scanDirection === 'pingpong' ? 2 : 0;
      u.uScanSoftness.value = scanSoftness;
      u.uPhaseTaper.value = scanPhaseTaper;
      u.uScanDuration.value = Math.max(0.05, scanDuration);
      u.uScanDelay.value = Math.max(0.0, scanDelay);
      u.uScanDepth.value = scanDepth;
      u.uParticleDensity.value = particleCount / 1000.0;
      u.uColorMode.value = colorMode === 'depth' ? 1 : colorMode === 'rainbow' ? 2 : 0;
      (u.uDepthColor.value as THREE.Color).copy(srgbColor(depthColor));
      u.uScanEffect.value = scanEffect === 'shadow' ? 1.0 : 0.0;
    }
    if (bloomRef.current) {
      bloomRef.current.blendMode.opacity.value = Math.max(0, bloomIntensity);
    }
    if (chromaRef.current) {
      chromaRef.current.offset.set(chromaticAberration, chromaticAberration);
    }
  }, [
    lineThickness,
    linesColor,
    scanColor,
    gridScale,
    lineStyle,
    lineJitter,
    bloomIntensity,
    chromaticAberration,
    noiseIntensity,
    scanGlow,
    scanOpacity,
    scanDirection,
    scanSoftness,
    scanPhaseTaper,
    scanDuration,
    scanDelay,
    scanDepth,
    particleCount,
    colorMode,
    depthColor,
    scanEffect
  ]);

  useEffect(() => {
    if (!enableGyro) return;
    const handler = (e: DeviceOrientationEvent) => {
      if (uiFaceActive) return;
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      const nx = THREE.MathUtils.clamp(gamma / 45, -1, 1);
      const ny = THREE.MathUtils.clamp(-beta / 30, -1, 1);
      lookTarget.current.set(nx, ny);
      tiltTarget.current = THREE.MathUtils.degToRad(gamma) * 0.4;
    };
    window.addEventListener('deviceorientation', handler);
    return () => {
      window.removeEventListener('deviceorientation', handler);
    };
  }, [enableGyro, uiFaceActive]);

  useEffect(() => {
    if (enableWebcam && !faceapi) {
      import('face-api.js').then(module => setFaceapi(module));
    }
  }, [enableWebcam, faceapi]);

  useEffect(() => {
    if (!faceapi) return;

    let canceled = false;
    const load = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsPath)
        ]);
        if (!canceled) setModelsReady(true);
      } catch {
        if (!canceled) setModelsReady(false);
      }
    };

    load();

    return () => {
      canceled = true;
    };
  }, [faceapi, modelsPath]);

  useEffect(() => {
    let stop = false;
    let animationFrameId: number;

    const cleanup = () => {
      stop = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setUiFaceActive(false);
    };

    if (!faceapi || !enableWebcam || !modelsReady) {
      cleanup();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
      } catch (err) {
        console.error("Error accessing webcam:", err);
        cleanup();
        return;
      }

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      let lastDetect = 0;

      const detect = async (ts: number) => {
        if (stop) return;

        if (ts - lastDetect >= 33) {
          lastDetect = ts;
          try {
            const res = await faceapi.detectSingleFace(video, opts).withFaceLandmarks(true);
            if (stop) return;

            if (res && res.detection) {
              const det = res.detection;
              const box = det.box;
              const vw = video.videoWidth || 1;
              const vh = video.videoHeight || 1;

              const cx = box.x + box.width * 0.5;
              const cy = box.y + box.height * 0.5;
              const nx = (cx / vw) * 2 - 1;
              const ny = (cy / vh) * 2 - 1;
              medianPush(bufX.current, nx, 5);
              medianPush(bufY.current, ny, 5);
              const nxm = median(bufX.current);
              const nym = median(bufY.current);

              const look = new THREE.Vector2(Math.tanh(nxm), Math.tanh(nym));

              const faceSize = Math.min(1, Math.hypot(box.width / vw, box.height / vh));
              const depthScale = 1 + depthResponse * (faceSize - 0.25);
              lookTarget.current.copy(look.multiplyScalar(depthScale));

              const leftEye = res.landmarks.getLeftEye();
              const rightEye = res.landmarks.getRightEye();
              const lc = centroid(leftEye);
              const rc = centroid(rightEye);
              const tilt = Math.atan2(rc.y - lc.y, rc.x - lc.x);
              medianPush(bufT.current, tilt, 5);
              tiltTarget.current = median(bufT.current);

              const nose = res.landmarks.getNose();
              const tip = nose[nose.length - 1] || nose[Math.floor(nose.length / 2)];
              const jaw = res.landmarks.getJawOutline();
              const leftCheek = jaw[3] || jaw[2];
              const rightCheek = jaw[13] || jaw[14];
              const dL = dist2(tip, leftCheek);
              const dR = dist2(tip, rightCheek);
              const eyeDist = Math.hypot(rc.x - lc.x, rc.y - lc.y) + 1e-6;
              let yawSignal = THREE.MathUtils.clamp((dR - dL) / (eyeDist * 1.6), -1, 1);
              yawSignal = Math.tanh(yawSignal);
              medianPush(bufYaw.current, yawSignal, 5);
              yawTarget.current = median(bufYaw.current);

              setUiFaceActive(true);
            } else {
              setUiFaceActive(false);
            }
          } catch {
            setUiFaceActive(false);
          }
        }

        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && !stop) {
          (video as any).requestVideoFrameCallback(detect);
        } else if (!stop) {
          animationFrameId = requestAnimationFrame(detect);
        }
      };

      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        (video as any).requestVideoFrameCallback(detect);
      } else {
        animationFrameId = requestAnimationFrame(detect);
      }
    };

    start();

    return cleanup;
  }, [faceapi, enableWebcam, modelsReady, depthResponse]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className ?? ''}`} style={style}>
      {showPreview && (
        <div className="absolute right-3 bottom-3 w-[220px] h-[132px] rounded-lg overflow-hidden border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.4)] bg-black text-white text-[12px] leading-[1.2] font-sans pointer-events-none">
          <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover -scale-x-100" />
          <div className="absolute left-2 top-2 px-[6px] py-[2px] bg-black/50 rounded-[6px] backdrop-blur-[4px]">
            {enableWebcam
              ? modelsReady
                ? uiFaceActive
                  ? 'Face: tracking'
                  : 'Face: searching'
                : 'Loading models'
              : 'Webcam disabled'}
          </div>
        </div>
      )}
    </div>
  );
};
function srgbColor(hex: string) {
  const c = new THREE.Color(hex);
  return c.convertSRGBToLinear();
}

function smoothDampVec2(
  current: THREE.Vector2,
  target: THREE.Vector2,
  currentVelocity: THREE.Vector2,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): THREE.Vector2 {
  const out = current.clone();
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = current.clone().sub(target);
  const originalTo = target.clone();

  const maxChange = maxSpeed * smoothTime;
  if (change.length() > maxChange) change.setLength(maxChange);

  target = current.clone().sub(change);
  const temp = currentVelocity.clone().addScaledVector(change, omega).multiplyScalar(deltaTime);
  currentVelocity.sub(temp.clone().multiplyScalar(omega));
  currentVelocity.multiplyScalar(exp);

  out.copy(target.clone().add(change.add(temp).multiplyScalar(exp)));

  const origMinusCurrent = originalTo.clone().sub(current);
  const outMinusOrig = out.clone().sub(originalTo);
  if (origMinusCurrent.dot(outMinusOrig) > 0) {
    out.copy(originalTo);
    currentVelocity.set(0, 0);
  }
  return out;
}

function smoothDampFloat(
  current: number,
  target: number,
  velRef: { v: number },
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): { value: number; v: number } {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = current - target;
  const originalTo = target;

  const maxChange = maxSpeed * smoothTime;
  change = Math.sign(change) * Math.min(Math.abs(change), maxChange);

  target = current - change;
  const temp = (velRef.v + omega * change) * deltaTime;
  velRef.v = (velRef.v - omega * temp) * exp;

  let out = target + (change + temp) * exp;

  const origMinusCurrent = originalTo - current;
  const outMinusOrig = out - originalTo;
  if (origMinusCurrent * outMinusOrig > 0) {
    out = originalTo;
    velRef.v = 0;
  }
  return { value: out, v: velRef.v };
}

function medianPush(buf: number[], v: number, maxLen: number) {
  buf.push(v);
  if (buf.length > maxLen) buf.shift();
}

function median(buf: number[]) {
  if (buf.length === 0) return 0;
  const a = [...buf].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) * 0.5;
}

function centroid(points: { x: number; y: number }[]) {
  let x = 0,
    y = 0;
  const n = points.length || 1;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / n, y: y / n };
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
