import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Info, X } from 'lucide-react';
import MobileGithubCity from './MobileGithubCity';

interface GithubCityProps {
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

const GithubCity: React.FC<GithubCityProps> = ({ className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: Contribution } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  
  // Refs for cleanup and access in loops
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const platformRef = useRef<THREE.Mesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-1, -1));
  const contributionsRef = useRef<Contribution[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const hoveredInstanceRef = useRef<number | null>(null);
  const containerMouseRef = useRef({ x: 0, y: 0 });
  
  // Performance optimization refs
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const glowMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationMixerRef = useRef<{ [key: number]: { startTime: number; duration: number } }>({});
  const lastRaycastTime = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.1 }
    );
    
    if (mountRef.current) {
        observer.observe(mountRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Optimized theme colors with memoization
  const colors = useMemo(() => {
    const darkColors = [
      '#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'
    ];
    const lightColors = [
      '#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'
    ];
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  // Optimized shader materials
  const shaderMaterials = useMemo(() => {
    const glowVertexShader = `
      attribute float intensity;
      varying float vIntensity;
      varying vec3 vNormal;
      void main() {
        vIntensity = intensity;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const glowFragmentShader = `
      uniform vec3 glowColor;
      uniform float time;
      varying float vIntensity;
      varying vec3 vNormal;
      void main() {
        float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        float glow = rim * vIntensity * (0.8 + 0.2 * sin(time * 2.0));
        gl_FragColor = vec4(glowColor * glow, glow * 0.6);
      }
    `;

    return {
      glow: new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x39d353) },
          time: { value: 0 }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    };
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((contributions: Contribution[]): Stats => {
    if (!contributions.length) return {
      totalContributions: 0,
      maxStreak: 0,
      currentStreak: 0,
      averagePerDay: 0,
      mostActiveDay: '',
      dataRange: { start: '', end: '' }
    };

    const total = contributions.reduce((sum, day) => sum + day.count, 0);
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let maxDay = contributions[0];

    contributions.forEach((day, i) => {
      if (day.count > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
        if (day.count > maxDay.count) maxDay = day;
      } else {
        tempStreak = 0;
      }
      
      // Calculate current streak from the end
      if (i >= contributions.length - 30) { // Last 30 days
        if (day.count > 0) currentStreak++;
        else currentStreak = 0;
      }
    });

    return {
      totalContributions: total,
      maxStreak,
      currentStreak,
      averagePerDay: Math.round((total / contributions.length) * 10) / 10,
      mostActiveDay: maxDay.date,
      dataRange: {
        start: contributions[0]?.date || '',
        end: contributions[contributions.length - 1]?.date || ''
      }
    };
  }, []);

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isMobile) {
        setLoading(false); // Mobile view doesn't fetch complex data for now
        return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('https://github-contributions-api.jogruber.de/v4/hariharen9?y=last');
        const data = await response.json();
        contributionsRef.current = data.contributions;
        setStats(calculateStats(data.contributions));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch GitHub data:", error);
        // Fallback mock data
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

  // Update Three.js scene colors when theme changes
  useEffect(() => {
    if (!meshRef.current || !platformRef.current || contributionsRef.current.length === 0) return;

    const data = contributionsRef.current;
    const color = new THREE.Color();
    
    // Update block colors
    data.forEach((day, i) => {
      color.set(colors[day.level] || colors[0]);
      meshRef.current!.setColorAt(i, color);
    });
    meshRef.current.instanceColor!.needsUpdate = true;

    // Update platform color
    const platformMat = platformRef.current.material as THREE.MeshStandardMaterial;
    platformMat.color.set(isDark ? 0x0d1117 : 0xf3f4f6);
    
    // Update Lighting for theme changes
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isDark ? 0.8 : 1.2;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = isDark ? 1.8 : 2.2;
    }

  }, [isDark, loading, colors]);

  useEffect(() => {
    if (!mountRef.current || loading || contributionsRef.current.length === 0) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(isDark ? 0x000000 : 0xffffff, 50, 200);
    sceneRef.current = scene;
    
    // --- Camera ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const aspect = width / height;
    const d = 10; 
    
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(20, 20, 20); 
    camera.lookAt(0, 0, 0);
    camera.zoom = 2.2; 
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // --- Renderer with optimizations ---
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: window.devicePixelRatio <= 1,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true; 
    controls.minZoom = 0.5;
    controls.maxZoom = 6;
    controls.enablePan = true;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.2;
    controlsRef.current = controls;

    // --- Enhanced Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.2);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.8 : 2.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Additional fill light for better visibility
    const fillLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.8 : 1.0);
    fillLight.position.set(-10, 15, -10);
    scene.add(fillLight);

    // Stable colored accent lights
    const greenLight = new THREE.PointLight(0x39d353, isDark ? 0.8 : 0.5, 30);
    greenLight.position.set(0, 8, 0);
    scene.add(greenLight);

    const blueLight = new THREE.PointLight(0x4079ff, isDark ? 0.6 : 0.3, 25);
    blueLight.position.set(-10, 5, 10);
    scene.add(blueLight);

    // --- Optimized Particle System ---
    const particleCount = Math.min(200, contributionsRef.current.filter(d => d.level > 2).length * 2);
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 1] = Math.random() * 20;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      
      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      particleVelocities[i * 3 + 1] = Math.random() * 0.01 + 0.005;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x39d353,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particleSystemRef.current = particles;

    // --- City Generation with Animation ---
    const data = contributionsRef.current;
    const rows = 7;
    const cols = Math.ceil(data.length / rows);
    
    const boxGeometry = new THREE.BoxGeometry(0.85, 1, 0.85);
    boxGeometry.translate(0, 0.5, 0);

    // Enhanced material with better lighting response
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      envMapIntensity: 0.5
    });

    const mesh = new THREE.InstancedMesh(boxGeometry, material, data.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshRef.current = mesh;
    scene.add(mesh);

    // Enhanced Base Platform with reflection
    const platformGeo = new THREE.BoxGeometry(cols * 1.1, 0.3, rows * 1.1);
    const platformMat = new THREE.MeshStandardMaterial({ 
        color: isDark ? 0x0d1117 : 0xf3f4f6, 
        roughness: 0.1,
        metalness: 0.3
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.15;
    platform.receiveShadow = true;
    platformRef.current = platform;
    scene.add(platform);

    // --- Animated Block Setup ---
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const offsetX = (cols - 1) * 1.0 / 2;
    const offsetZ = (rows - 1) * 1.0 / 2;
    const startTime = clockRef.current.getElapsedTime();

    data.forEach((day, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const targetHeight = day.count === 0 ? 0.15 : Math.min(day.count * 0.4 + 0.5, 5);

      dummy.position.set(col * 1.0 - offsetX, 0, row * 1.0 - offsetZ);
      dummy.scale.set(1, targetHeight, 1); // Set to final height immediately
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.set(colors[day.level] || colors[0]);
      mesh.setColorAt(i, color);

      // Store target height for potential future animations
      animationMixerRef.current[i] = {
        startTime: startTime + (i * 0.005), // Staggered animation
        duration: 1.0
      };
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;

    // --- Efficient Interaction (Throttled Raycasting) ---
    const container = mountRef.current;
    
    const onMouseMove = (event: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      
      // Update normalized coordinates for occasional raycasting
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update container-relative coordinates for tooltip
      containerMouseRef.current = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
      };

      // Update tooltip position if one exists
      if (hoveredInstanceRef.current !== null) {
          setTooltip(prev => prev ? { 
            x: containerMouseRef.current.x, 
            y: containerMouseRef.current.y, 
            data: prev.data 
          } : null);
      }
    };

    const onMouseEnter = () => {
      container!.style.cursor = 'grab';
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
    };

    const onMouseLeave = () => {
      container!.style.cursor = 'default';
      setTooltip(null);
      hoveredInstanceRef.current = null;
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true;
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    // --- Simplified Animation Loop ---
    let frameCount = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Optimization: Skip rendering if not visible (managed by IntersectionObserver below)
      if (mountRef.current && !isVisibleRef.current) return;

      frameCount++;
      
      const elapsedTime = clockRef.current.getElapsedTime();
      
      // Update controls
      if (controlsRef.current) controlsRef.current.update();
      
      // Animate block growth (only for first few seconds) - Optional smooth entrance
      if (elapsedTime < 3 && meshRef.current && elapsedTime > 0.5) {
        const data = contributionsRef.current;
        const dummy = new THREE.Object3D();
        const offsetX = (Math.ceil(data.length / 7) - 1) * 1.0 / 2;
        const offsetZ = (7 - 1) * 1.0 / 2;
        let needsUpdate = false;

        // Optional: Add a subtle wave animation on first load
        data.forEach((day, i) => {
          const animData = animationMixerRef.current[i];
          if (!animData) return;

          const waveProgress = Math.sin((elapsedTime - 0.5) * 2 + i * 0.02) * 0.1 + 1;
          if (waveProgress > 0.95 && waveProgress < 1.05) {
            const col = Math.floor(i / 7);
            const row = i % 7;
            const baseHeight = day.count === 0 ? 0.15 : Math.min(day.count * 0.4 + 0.5, 5);
            const currentHeight = baseHeight * waveProgress;

            dummy.position.set(col * 1.0 - offsetX, 0, row * 1.0 - offsetZ);
            dummy.scale.set(1, currentHeight, 1);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          meshRef.current.instanceMatrix.needsUpdate = true;
        }
      }

      // Animate particles (every 3rd frame for performance)
      if (frameCount % 3 === 0 && particleSystemRef.current) {
        const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += 0.02; // Move up
          if (positions[i + 1] > 25) {
            positions[i + 1] = 0; // Reset to bottom
            positions[i] = (Math.random() - 0.5) * 40; // New random X
            positions[i + 2] = (Math.random() - 0.5) * 40; // New random Z
          }
        }
        
        particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Efficient hover detection (throttled raycasting - only every 200ms)
      const currentTime = elapsedTime * 1000;
      if (currentTime - lastRaycastTime.current > 200 && cameraRef.current && meshRef.current) {
        lastRaycastTime.current = currentTime;
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObject(meshRef.current);

        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          
          if (instanceId !== undefined && instanceId < contributionsRef.current.length) {
            if (hoveredInstanceRef.current !== instanceId) {
                hoveredInstanceRef.current = instanceId;
                const data = contributionsRef.current[instanceId];
                
                setTooltip({
                    x: containerMouseRef.current.x,
                    y: containerMouseRef.current.y,
                    data: data
                });
                
                container!.style.cursor = 'pointer';
            }
          }
        } else {
            if (hoveredInstanceRef.current !== null) {
                hoveredInstanceRef.current = null;
                setTooltip(null);
                container!.style.cursor = 'grab';
            }
        }
      }

      // Update shader uniforms
      if (shaderMaterials.glow) {
        shaderMaterials.glow.uniforms.time.value = elapsedTime;
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      
      // Enhanced cleanup
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose geometries and materials
      boxGeometry.dispose();
      material.dispose();
      platformGeo.dispose();
      platformMat.dispose();
      
      if (particleSystemRef.current) {
        particleSystemRef.current.geometry.dispose();
        (particleSystemRef.current.material as THREE.Material).dispose();
      }
      
      // Dispose shader materials
      Object.values(shaderMaterials).forEach(mat => mat.dispose());
      
      // Clear animation data
      animationMixerRef.current = {};
    };
  }, [loading, colors, shaderMaterials]);

  if (isMobile) {
    return <MobileGithubCity className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-900/10 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Mobile Stats Toggle */}
      {!loading && stats && (
        <button
          onClick={() => setShowMobileStats(true)}
          className={`absolute top-4 left-4 z-30 p-2 rounded-full border backdrop-blur-md transition-all duration-300 md:hidden ${
            showMobileStats 
              ? 'opacity-0 pointer-events-none scale-75' 
              : 'opacity-100 pointer-events-auto scale-100 hover:scale-110'
          } ${
            isDark 
              ? 'bg-gray-900/90 text-white border-gray-700 hover:bg-gray-800' 
              : 'bg-white/90 text-gray-900 border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Show Stats"
        >
          <Info size={20} />
        </button>
      )}

      {/* Stats Panel */}
      {stats && !loading && (
        <div className={`absolute top-4 left-4 z-30 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 origin-top-left ${
          isDark 
            ? 'bg-gray-900/90 text-white border-gray-700' 
            : 'bg-white/90 text-gray-900 border-gray-200'
        } ${
          showMobileStats 
            ? 'opacity-100 pointer-events-auto scale-100' 
            : 'opacity-0 pointer-events-none scale-90 md:opacity-100 md:pointer-events-auto md:scale-100'
        }`}>
          {/* Mobile Close Button */}
          <button
            onClick={() => setShowMobileStats(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-500/20 md:hidden transition-colors"
            aria-label="Close Stats"
          >
            <X size={16} />
          </button>

          <div className="space-y-2 text-sm">
            <div className="font-bold text-lg mb-3 flex items-center gap-2 pr-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              GitHub Activity
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Commits</div>
                <div className="font-bold text-lg text-green-500">{stats.totalContributions.toLocaleString()}</div>
              </div>
              
              <div>
                <div className="text-gray-500 dark:text-gray-400">Max Streak</div>
                <div className="font-bold text-lg text-blue-500">{stats.maxStreak} days</div>
              </div>
              
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg/Day</div>
                <div className="font-bold text-lg text-purple-500">{stats.averagePerDay}</div>
              </div>
              
              <div>
                <div className="text-gray-500 dark:text-gray-400">Current</div>
                <div className="font-bold text-lg text-orange-500">{stats.currentStreak} days</div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                Period: {new Date(stats.dataRange.start).toLocaleDateString()} - {new Date(stats.dataRange.end).toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Last Updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicator */}
      <div className={`absolute top-4 right-4 z-30 px-3 py-2 rounded-full text-xs font-medium ${
        isDark 
          ? 'bg-gray-900/80 text-green-400 border border-gray-700' 
          : 'bg-white/80 text-green-600 border border-gray-200'
      } backdrop-blur-sm`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          Live 3D
        </div>
      </div>
      
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="3D GitHub Contribution City"
      />

      {tooltip && (
        <div 
          className={`absolute z-[9999] pointer-events-none px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-150 ${
            isDark 
              ? 'bg-gray-900/95 text-white border-gray-700' 
              : 'bg-white/95 text-gray-900 border-gray-200'
          }`}
          style={{ 
            left: Math.min(Math.max(tooltip.x, 10), mountRef.current?.clientWidth ? mountRef.current.clientWidth - 220 : tooltip.x), 
            top: Math.max(tooltip.y - 90, 10),
            transform: 'translate(0, 0)' 
          }}
        >
          <div className="font-bold text-sm mb-2">{new Date(tooltip.data.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</div>
          <div className="text-xs opacity-90 flex items-center gap-2 mb-1">
            <span className={`w-3 h-3 rounded-full inline-block border-2 border-white/20 ${
                 ['bg-gray-200', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'][tooltip.data.level] || 'bg-gray-200'
            }`}></span>
            <span className="font-medium">{tooltip.data.count} contribution{tooltip.data.count !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Level {tooltip.data.level}/4
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubCity;