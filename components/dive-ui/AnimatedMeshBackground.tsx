"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import MobileMeshBackground from './MobileMeshBackground';

const vertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uHoverState;
  uniform float uCursorForce;
  uniform float uIsDark;
  
  varying vec2 vUv;
  varying float vElevation;
  varying float vInteraction;

  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float n = noise(pos.xy * 0.05 + uTime * 0.2);
    float wave1 = sin(pos.x * 0.1 + uTime * 0.5) * 1.0;
    float wave2 = sin(pos.y * 0.15 + uTime * 0.3) * 1.0;
    float elevation = (wave1 + wave2) * 1.5 + n * 2.0;
    float dist = distance(pos.xy, uMouse.xy);
    float interactionRadius = 20.0;
    float interaction = 1.0 - smoothstep(0.0, interactionRadius, dist);
    elevation -= interaction * uCursorForce * uHoverState;
    pos.z += elevation;
    vElevation = elevation;
    vInteraction = interaction * uHoverState;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
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
    float mixFactor = smoothstep(-5.0, 5.0, vElevation);
    finalColor = mix(uColor1, uColor2, mixFactor);

    if (uIsPoints > 0.5) {
      vec2 uv = gl_PointCoord;
      vec2 center = vec2(0.5);
      if (uIsDark > 0.5) {
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
          vec2 shadowOffset = vec2(0.04, 0.04);
          float shadowDist = distance(uv, center + shadowOffset);
          float mainDist = distance(uv, center);
          float radius = 0.4;
          float shadowAlpha = (1.0 - smoothstep(radius, radius + 0.15, shadowDist)) * 0.3;
          float mainAlpha = (1.0 - smoothstep(radius - 0.02, radius + 0.02, mainDist)) * uOpacity * 2.5;
          if (mainAlpha < 0.01 && shadowAlpha < 0.01) discard;
          if (vInteraction > 0.0) {
             mainAlpha += vInteraction * 0.5;
             finalColor = mix(finalColor, vec3(1.0), vInteraction * 0.5);
          }
          vec3 shadowColor = vec3(0.0, 0.0, 0.0);
          vec3 mixedColor = mix(shadowColor, finalColor, mainAlpha);
          alpha = max(mainAlpha, shadowAlpha);
          finalColor = mixedColor;
      }
    } else {
        alpha *= 0.6;
        if (vInteraction > 0.0) {
           finalColor = mix(finalColor, vec3(1.0), vInteraction * 0.3);
           alpha += vInteraction * 0.2;
        }
    }
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const particleVertexShader = `
  uniform float uTime;
  attribute float aScale;
  attribute vec3 aVelocity;
  void main() {
    vec3 pos = position;
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
    float strength = pow(1.0 - (dist * 2.0), 2.0);
    gl_FragColor = vec4(uColor, uOpacity * strength);
  }
`;

export interface AnimatedMeshBackgroundProps {
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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile || !mountRef.current || !containerRef.current) return;
    const mountNode = mountRef.current;
    const containerNode = containerRef.current;
    const width = containerNode.clientWidth;
    const height = containerNode.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 20, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

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

    const meshUniforms = { ...baseUniforms, uOpacity: { value: 0.15 }, uIsPoints: { value: 0.0 } };
    const pointsUniforms = { ...baseUniforms, uOpacity: { value: 0.8 }, uIsPoints: { value: 1.0 } };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: meshUniforms, wireframe: true, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 3;
    scene.add(mesh);

    const pointsMaterial = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: pointsUniforms, transparent: true, depthWrite: false, blending: THREE.NormalBlending });
    const points = new THREE.Points(geometry, pointsMaterial);
    points.rotation.x = -Math.PI / 3;
    scene.add(points);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const posArray = new Float32Array(particleCount * 3);
    const scaleArray = new Float32Array(particleCount);
    const velocityArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 120;
        posArray[i * 3 + 1] = (Math.random() - 0.5) * 60;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 100;
        scaleArray[i] = Math.random();
        velocityArray[i * 3] = (Math.random() - 0.5) * 0.2;
        velocityArray[i * 3 + 1] = Math.random() * 0.5 + 0.2;
        velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));
    particlesGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocityArray, 3));

    const particlesUniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x3b82f6) }, uOpacity: { value: 0.6 } };
    const particlesMaterial = new THREE.ShaderMaterial({ vertexShader: particleVertexShader, fragmentShader: particleFragmentShader, uniforms: particlesUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const raycaster = new THREE.Raycaster();
    const mathPlane = new THREE.Plane(new THREE.Vector3(0, Math.sin(Math.PI/3), Math.cos(Math.PI/3)), 0);

    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const c1Hex = isDark ? 0x3b82f6 : 0x7e22ce;
      const c2Hex = isDark ? 0x2dd4bf : 0xec4899;
      meshUniforms.uColor1.value.setHex(c1Hex);
      meshUniforms.uColor2.value.setHex(c2Hex);
      meshUniforms.uOpacity.value = isDark ? 0.15 : 0.3;
      meshUniforms.uIsDark.value = isDark ? 1.0 : 0.0;
      pointsUniforms.uColor1.value.setHex(c1Hex);
      pointsUniforms.uColor2.value.setHex(c2Hex);
      pointsUniforms.uIsDark.value = isDark ? 1.0 : 0.0;
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
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.005;
      meshUniforms.uTime.value = time;
      pointsUniforms.uTime.value = time;
      particlesUniforms.uTime.value = time;
      const targetHover = isHovering.current;
      const newHover = meshUniforms.uHoverState.value + (targetHover - meshUniforms.uHoverState.value) * 0.05;
      meshUniforms.uHoverState.value = newHover;
      pointsUniforms.uHoverState.value = newHover;
      raycaster.setFromCamera(mousePosition.current, camera);
      const target = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(mathPlane, target)) {
         target.applyAxisAngle(new THREE.Vector3(1,0,0), Math.PI/3);
         meshUniforms.uMouse.value.copy(target);
         pointsUniforms.uMouse.value.copy(target);
      }
      camera.position.x = Math.sin(time * 0.2) * 1.0;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      themeObserver.disconnect();
      if (mountNode && renderer.domElement) mountNode.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      pointsMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [cursorForce, isMobile]);

  if (isMobile) return <MobileMeshBackground cursorForce={cursorForce} fixed={fixed} />;

  return (
    <div ref={containerRef} className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none`} style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-slate-900 transition-colors duration-500" />
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default AnimatedMeshBackground;
