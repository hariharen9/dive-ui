import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Info, X } from 'lucide-react';

interface MobileGithubCityProps {
  className?: string;
}

interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface Stats {
  totalContributions: number;
  maxStreak: number;
  currentStreak: number;
  averagePerDay: number;
  mostActiveDay: string;
  dataRange: { start: string; end: string };
}

const MobileGithubCity: React.FC<MobileGithubCityProps> = ({ className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: Contribution } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [stats, setStats] = useState<Stats | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const platformRef = useRef<THREE.Mesh | null>(null);
  const contributionsRef = useRef<Contribution[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const hoveredInstanceRef = useRef<number | null>(null);
  const containerMouseRef = useRef({ x: 0, y: 0 });
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-1, -1));
  const lastRaycastTime = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const colors = useMemo(() => {
    const darkColors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    const lightColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const calculateStats = useCallback((contributions: Contribution[]): Stats => {
    if (!contributions.length) return {
      totalContributions: 0, maxStreak: 0, currentStreak: 0, averagePerDay: 0, mostActiveDay: '', dataRange: { start: '', end: '' }
    };
    const total = contributions.reduce((sum, day) => sum + day.count, 0);
    let maxStreak = 0, currentStreak = 0, tempStreak = 0;
    let maxDay = contributions[0];

    contributions.forEach((day, i) => {
      if (day.count > 0) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); if (day.count > maxDay.count) maxDay = day; }
      else tempStreak = 0;
      if (i >= contributions.length - 30) { if (day.count > 0) currentStreak++; else currentStreak = 0; }
    });

    return {
      totalContributions: total, maxStreak, currentStreak, averagePerDay: Math.round((total / contributions.length) * 10) / 10, mostActiveDay: maxDay.date,
      dataRange: { start: contributions[0]?.date || '', end: contributions[contributions.length - 1]?.date || '' }
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://github-contributions-api.jogruber.de/v4/hariharen9?y=last');
        const data = await response.json();
        contributionsRef.current = data.contributions;
        setStats(calculateStats(data.contributions));
        setLoading(false);
      } catch (error) {
        // Fallback mock
        const mockData = Array.from({ length: 365 }, (_, i) => ({
          date: new Date(Date.now() - (364 - i) * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5),
          level: Math.floor(Math.random() * 5)
        }));
        contributionsRef.current = mockData;
        setStats(calculateStats(mockData));
        setLoading(false);
      }
    };
    fetchData();
  }, [calculateStats]);

  useEffect(() => {
    if (!meshRef.current || !platformRef.current || contributionsRef.current.length === 0) return;
    const data = contributionsRef.current;
    const color = new THREE.Color();
    data.forEach((day, i) => {
      color.set(colors[day.level] || colors[0]);
      meshRef.current!.setColorAt(i, color);
    });
    meshRef.current.instanceColor!.needsUpdate = true;
    (platformRef.current.material as THREE.MeshLambertMaterial).color.set(isDark ? 0x0d1117 : 0xf3f4f6);
  }, [isDark, loading, colors]);

  useEffect(() => {
    if (!mountRef.current || loading || contributionsRef.current.length === 0) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(isDark ? 0x000000 : 0xffffff, 50, 200);
    sceneRef.current = scene;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const aspect = width / height;
    const d = 10;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    camera.zoom = 2.0; // Slightly zoomed out for mobile
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // --- Mobile Optimized Renderer ---
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false, // Performance win
      powerPreference: "high-performance",
      precision: "lowp" // Performance win
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio
    renderer.shadowMap.enabled = false; // No shadows for mobile
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.minZoom = 0.5;
    controls.maxZoom = 4;
    controls.enablePan = true;
    controlsRef.current = controls;

    // --- Optimized Lighting (No Shadows) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.2);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 2.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // --- City Generation (Instanced Mesh) ---
    const data = contributionsRef.current;
    const rows = 7;
    const cols = Math.ceil(data.length / rows);
    
    const boxGeometry = new THREE.BoxGeometry(0.85, 1, 0.85);
    boxGeometry.translate(0, 0.5, 0);

    // Cheap Material
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(boxGeometry, material, data.length);
    meshRef.current = mesh;
    scene.add(mesh);

    const platformGeo = new THREE.BoxGeometry(cols * 1.1, 0.3, rows * 1.1);
    const platformMat = new THREE.MeshLambertMaterial({ color: isDark ? 0x0d1117 : 0xf3f4f6 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.15;
    platformRef.current = platform;
    scene.add(platform);

    // --- Setup Instances ---
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const offsetX = (cols - 1) * 1.0 / 2;
    const offsetZ = (rows - 1) * 1.0 / 2;

    data.forEach((day, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const targetHeight = day.count === 0 ? 0.15 : Math.min(day.count * 0.4 + 0.5, 5);
      dummy.position.set(col * 1.0 - offsetX, 0, row * 1.0 - offsetZ);
      dummy.scale.set(1, targetHeight, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(colors[day.level] || colors[0]);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    // --- Interaction ---
    const container = mountRef.current;
    const onMouseMove = (event: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      containerMouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      
      // Update tooltip if dragging/touching
      if (hoveredInstanceRef.current !== null) {
          setTooltip(prev => prev ? { x: containerMouseRef.current.x, y: containerMouseRef.current.y, data: prev.data } : null);
      }
    };
    // Add touch support for tooltip
    const onTouchMove = (event: TouchEvent) => {
        if (event.touches.length > 0) {
             const rect = container!.getBoundingClientRect();
             const touch = event.touches[0];
             mouseRef.current.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
             mouseRef.current.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
             containerMouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    
    // --- Animation Loop ---
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();

      // Throttled Raycasting
      const currentTime = clockRef.current.getElapsedTime() * 1000;
      if (currentTime - lastRaycastTime.current > 200 && cameraRef.current && meshRef.current) {
        lastRaycastTime.current = currentTime;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(meshRef.current);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && instanceId < contributionsRef.current.length) {
             if (hoveredInstanceRef.current !== instanceId) {
                hoveredInstanceRef.current = instanceId;
                setTooltip({ x: containerMouseRef.current.x, y: containerMouseRef.current.y, data: contributionsRef.current[instanceId] });
             }
          }
        } else {
             if (hoveredInstanceRef.current !== null) {
                hoveredInstanceRef.current = null;
                setTooltip(null);
             }
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('touchmove', onTouchMove);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
      boxGeometry.dispose();
      material.dispose();
      platformGeo.dispose();
      platformMat.dispose();
    };
  }, [loading, colors]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-900/10 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {!loading && stats && (
        <button
          onClick={() => setShowMobileStats(true)}
          className={`absolute top-4 left-4 z-30 p-2 rounded-full border backdrop-blur-md transition-all duration-300 md:hidden ${
            showMobileStats ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 pointer-events-auto scale-100'
          } ${isDark ? 'bg-gray-900/90 text-white border-gray-700' : 'bg-white/90 text-gray-900 border-gray-200'}`}
        >
          <Info size={20} />
        </button>
      )}

      {stats && !loading && (
        <div className={`absolute top-4 left-4 z-30 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 origin-top-left ${
          isDark ? 'bg-gray-900/90 text-white border-gray-700' : 'bg-white/90 text-gray-900 border-gray-200'
        } ${
          showMobileStats ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-90'
        }`}>
          <button onClick={() => setShowMobileStats(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-500/20 md:hidden"><X size={16} /></button>
          <div className="space-y-2 text-sm">
            <div className="font-bold text-lg mb-3 flex items-center gap-2 pr-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> GitHub Activity
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><div className="text-gray-500">Total</div><div className="font-bold text-lg text-green-500">{stats.totalContributions}</div></div>
              <div><div className="text-gray-500">Streak</div><div className="font-bold text-lg text-blue-500">{stats.maxStreak}d</div></div>
            </div>
          </div>
        </div>
      )}

      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" role="img" aria-label="3D GitHub Contribution City" />

      {tooltip && (
        <div className={`absolute z-[9999] pointer-events-none px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-150 ${isDark ? 'bg-gray-900/95 text-white border-gray-700' : 'bg-white/95 text-gray-900 border-gray-200'}`}
          style={{ left: Math.min(Math.max(tooltip.x, 10), mountRef.current?.clientWidth ? mountRef.current.clientWidth - 220 : tooltip.x), top: Math.max(tooltip.y - 90, 10) }}>
          <div className="font-bold text-sm mb-2">{new Date(tooltip.data.date).toLocaleDateString()}</div>
          <div className="text-xs opacity-90 flex items-center gap-2 mb-1">
             <span className="font-medium">{tooltip.data.count} contributions</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGithubCity;