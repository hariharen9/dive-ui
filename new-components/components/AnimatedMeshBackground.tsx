import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import MobileMeshBackground from './MobileMeshBackground';

// --- Improved Shaders ---

const vertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uHoverState;
  uniform float uCursorForce;
  uniform float uIsDark;
  
  varying vec2 vUv;
  varying float vElevation;
  varying float vInteraction;

  // 2D Random
  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Organic noise movement
    float n = noise(pos.xy * 0.05 + uTime * 0.2);
    
    // Wave layers
    float wave1 = sin(pos.x * 0.1 + uTime * 0.5) * 1.0;
    float wave2 = sin(pos.y * 0.15 + uTime * 0.3) * 1.0;
    
    // Combine for final elevation
    float elevation = (wave1 + wave2) * 1.5 + n * 2.0;

    // Interaction
    float dist = distance(pos.xy, uMouse.xy);
    float interactionRadius = 20.0;
    float interaction = 1.0 - smoothstep(0.0, interactionRadius, dist);
    
    // Push effect
    elevation -= interaction * uCursorForce * uHoverState;

    pos.z += elevation;
    vElevation = elevation;
    vInteraction = interaction * uHoverState;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation - slightly larger for light mode (uIsDark == 0)
    float baseSize = mix(160.0, 120.0, uIsDark);
    gl_PointSize = (baseSize + interaction * 80.0) / -mvPosition.z; 
  }
`;

const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uOpacity;
  uniform float uIsPoints;
  uniform float uIsDark;
  
  varying float vElevation;
  varying float vInteraction;

  void main() {
    float alpha = uOpacity;
    vec3 finalColor = uColor1;

    // Gradient based on elevation
    float mixFactor = smoothstep(-5.0, 5.0, vElevation);
    finalColor = mix(uColor1, uColor2, mixFactor);

    if (uIsPoints > 0.5) {
      vec2 uv = gl_PointCoord;
      vec2 center = vec2(0.5);
      
      if (uIsDark > 0.5) {
          // Dark Mode: Glow Effect
          float dist = distance(uv, center);
          if (dist > 0.5) discard;

          float strength = 1.0 - (dist * 2.0);
          strength = pow(strength, 2.0);
          alpha = uOpacity * strength * 2.0;
          
          if (vInteraction > 0.0) {
            finalColor = mix(finalColor, vec3(1.0), vInteraction * 0.6);
            alpha += vInteraction * 0.5;
          }
      } else {
          // Light Mode: Defined Dot with Shadow
          
          // Shadow
          vec2 shadowOffset = vec2(0.04, 0.04);
          float shadowDist = distance(uv, center + shadowOffset);
          // Main Dot
          float mainDist = distance(uv, center);
          
          float radius = 0.4; // Increased from 0.35
          
          // Soft shadow
          float shadowAlpha = 1.0 - smoothstep(radius, radius + 0.15, shadowDist);
          shadowAlpha *= 0.3; // Shadow opacity
          
          // Main dot - crisper
          float mainAlpha = 1.0 - smoothstep(radius - 0.02, radius + 0.02, mainDist);
          mainAlpha *= uOpacity * 2.5;

          if (mainAlpha < 0.01 && shadowAlpha < 0.01) discard;

          // Interaction
          if (vInteraction > 0.0) {
             mainAlpha += vInteraction * 0.5;
             finalColor = mix(finalColor, vec3(1.0), vInteraction * 0.5);
          }
          
          // Composite: Source Over Destination
          // Draw shadow first (dest), then main (src)
          vec3 shadowColor = vec3(0.0, 0.0, 0.0);
          
          // We want the shadow to be visible where the main dot isn't opaque
          // Simple mix for color
          vec3 mixedColor = mix(shadowColor, finalColor, mainAlpha);
          
          // Final alpha is roughly max of both or additive
          alpha = max(mainAlpha, shadowAlpha);
          finalColor = mixedColor;
      }
    } else {
        // Wireframe enhancements
        alpha *= 0.6;
        if (vInteraction > 0.0) {
           finalColor = mix(finalColor, vec3(1.0), vInteraction * 0.3);
           alpha += vInteraction * 0.2;
        }
    }

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Floating particles shader
const particleVertexShader = `
  uniform float uTime;
  attribute float aScale;
  attribute vec3 aVelocity;
  
  void main() {
    vec3 pos = position;
    
    // Continuous floating movement
    float time = uTime * 0.5;
    pos.y += mod(time * aVelocity.y, 60.0) - 30.0;
    pos.x += sin(time * aVelocity.x) * 5.0;
    pos.z += cos(time * aVelocity.z) * 5.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * (150.0 / -mvPosition.z);
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 2.0);

    gl_FragColor = vec4(uColor, uOpacity * strength);
  }
`;

interface AnimatedMeshBackgroundProps {
  cursorForce?: number;
  fixed?: boolean;
}

const AnimatedMeshBackground: React.FC<AnimatedMeshBackgroundProps> = ({ cursorForce = 7.0, fixed = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef(new THREE.Vector2(0, 0));
  const isHovering = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const mountNode = mountRef.current;
    const containerNode = containerRef.current;

    // Scene Setup
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 20, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    // --- Main Mesh (Grid) ---
    // Increased segments for smoother waves
    const geometry = new THREE.PlaneGeometry(120, 120, 50, 50);

    const baseUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x3b82f6) },
      uColor2: { value: new THREE.Color(0x8b5cf6) },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uHoverState: { value: 0.0 },
      uCursorForce: { value: cursorForce },
      uIsDark: { value: 0.0 }
    };

    const meshUniforms = {
      ...baseUniforms,
      uOpacity: { value: 0.15 },
      uIsPoints: { value: 0.0 },
      uColor1: { value: new THREE.Color(0x3b82f6) },
      uColor2: { value: new THREE.Color(0x8b5cf6) },
      uIsDark: { value: 0.0 }
    };

    const pointsUniforms = {
      ...baseUniforms,
      uOpacity: { value: 0.8 },
      uIsPoints: { value: 1.0 },
      uColor1: { value: new THREE.Color(0x3b82f6) },
      uColor2: { value: new THREE.Color(0x8b5cf6) },
      uIsDark: { value: 0.0 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: meshUniforms,
      wireframe: true,
      transparent: true,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 3;
    scene.add(mesh);

    const pointsMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: pointsUniforms,
      wireframe: false,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending // Changed from Additive to Normal for better shadows in light mode
    });
    const points = new THREE.Points(geometry, pointsMaterial);
    points.rotation.x = -Math.PI / 3;
    scene.add(points);

    // --- Floating Particles (Dust) ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 100; // Efficient count
    const posArray = new Float32Array(particleCount * 3);
    const scaleArray = new Float32Array(particleCount);
    const velocityArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount; i++) {
        // Random spread
        posArray[i * 3] = (Math.random() - 0.5) * 120; // x
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 60;  // y
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 100; // z - deeper depth

        scaleArray[i] = Math.random();
        
        // Random velocity vectors
        velocityArray[i * 3] = (Math.random() - 0.5) * 0.2;
        velocityArray[i * 3 + 1] = Math.random() * 0.5 + 0.2; // mostly Up
        velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));
    particlesGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocityArray, 3));

    const particlesUniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x3b82f6) },
        uOpacity: { value: 0.6 }
    };

    const particlesMaterial = new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        uniforms: particlesUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // --- Interaction & Animation ---

    const raycaster = new THREE.Raycaster();
    const rotationNormal = new THREE.Vector3(0, Math.sin(Math.PI/3), Math.cos(Math.PI/3));
    const mathPlane = new THREE.Plane(rotationNormal, 0);

    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Theme palettes
      // Dark: Blue -> Teal/Cyan
      // Light: Purple -> Pink
      const c1Hex = isDark ? 0x3b82f6 : 0x7e22ce;
      const c2Hex = isDark ? 0x2dd4bf : 0xec4899;
      
      meshUniforms.uColor1.value.setHex(c1Hex);
      meshUniforms.uColor2.value.setHex(c2Hex);
      meshUniforms.uOpacity.value = isDark ? 0.15 : 0.3;
      meshUniforms.uIsDark.value = isDark ? 1.0 : 0.0;

      pointsUniforms.uColor1.value.setHex(c1Hex);
      pointsUniforms.uColor2.value.setHex(c2Hex);
      pointsUniforms.uIsDark.value = isDark ? 1.0 : 0.0;
      
      // Update blending mode based on theme for best results
      // Dark mode: Additive is glowy
      // Light mode: Normal is better for shadows
      pointsMaterial.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;
      
      particlesUniforms.uColor.value.setHex(isDark ? 0x60a5fa : 0xa855f7);
      particlesUniforms.uOpacity.value = isDark ? 0.5 : 0.6;
    };
    
    updateTheme();
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      isHovering.current = 1;
    };
    const handleMouseLeave = () => { isHovering.current = 0; };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(containerNode);

    let time = 0;
    let animationFrameId: number;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (!isVisible) return;

      time += 0.005; // Slightly slower base time for elegance
      
      // Update Uniforms
      meshUniforms.uTime.value = time;
      pointsUniforms.uTime.value = time;
      particlesUniforms.uTime.value = time;

      // Smooth hover state transition
      const targetHover = isHovering.current;
      const currentHover = meshUniforms.uHoverState.value;
      const newHover = currentHover + (targetHover - currentHover) * 0.05;
      
      meshUniforms.uHoverState.value = newHover;
      pointsUniforms.uHoverState.value = newHover;

      // Raycasting
      raycaster.setFromCamera(mousePosition.current, camera);
      const target = new THREE.Vector3();
      
      // Intersect with the mathematical plane of the grid
      if (raycaster.ray.intersectPlane(mathPlane, target)) {
         // Transform intersection back to local mesh space if needed, 
         // but our plane math handles the rotated projection.
         // We essentially project the mouse onto the angled plane.
         target.applyAxisAngle(new THREE.Vector3(1,0,0), Math.PI/3);
         meshUniforms.uMouse.value.copy(target);
         pointsUniforms.uMouse.value.copy(target);
      }

      // Gentle camera sway
      camera.position.x = Math.sin(time * 0.2) * 1.0;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      
      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement);
      }
      
      // Cleanup Three.js resources
      geometry.dispose();
      material.dispose();
      pointsMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [cursorForce, isMobile]);

  if (isMobile) {
    return <MobileMeshBackground cursorForce={cursorForce} fixed={fixed} />;
  }

  return (
    <div ref={containerRef} className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none`} style={{ zIndex: 0 }}>
      {/* Background base color transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-slate-900 transition-colors duration-500" />
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default AnimatedMeshBackground;







