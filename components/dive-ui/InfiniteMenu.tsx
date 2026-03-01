"use client";

import { FC, useRef, useState, useEffect, MutableRefObject } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';

const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    
    float scale = max(imageAspect / containerAspect, 
                     containerAspect / imageAspect);
    
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;
    
    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

class Face {
  public a: number;
  public b: number;
  public c: number;

  constructor(a: number, b: number, c: number) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

class Vertex {
  public position: vec3;
  public normal: vec3;
  public uv: vec2;

  constructor(x: number, y: number, z: number) {
    this.position = vec3.fromValues(x, y, z);
    this.normal = vec3.create();
    this.uv = vec2.create();
  }
}

class Geometry {
  public vertices: Vertex[];
  public faces: Face[];

  constructor() {
    this.vertices = [];
    this.faces = [];
  }

  public addVertex(...args: number[]): this {
    for (let i = 0; i < args.length; i += 3) {
      this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
    }
    return this;
  }

  public addFace(...args: number[]): this {
    for (let i = 0; i < args.length; i += 3) {
      this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
    }
    return this;
  }

  public get lastVertex(): Vertex {
    return this.vertices[this.vertices.length - 1];
  }

  public subdivide(divisions = 1): this {
    const midPointCache: Record<string, number> = {};
    let f = this.faces;

    for (let div = 0; div < divisions; ++div) {
      const newFaces = new Array<Face>(f.length * 4);

      f.forEach((face, ndx) => {
        const mAB = this.getMidPoint(face.a, face.b, midPointCache);
        const mBC = this.getMidPoint(face.b, face.c, midPointCache);
        const mCA = this.getMidPoint(face.c, face.a, midPointCache);

        const i = ndx * 4;
        newFaces[i + 0] = new Face(face.a, mAB, mCA);
        newFaces[i + 1] = new Face(face.b, mBC, mAB);
        newFaces[i + 2] = new Face(face.c, mCA, mBC);
        newFaces[i + 3] = new Face(mAB, mBC, mCA);
      });

      f = newFaces;
    }

    this.faces = f;
    return this;
  }

  public spherize(radius = 1): this {
    this.vertices.forEach(vertex => {
      vec3.normalize(vertex.normal, vertex.position);
      vec3.scale(vertex.position, vertex.normal, radius);
    });
    return this;
  }

  public get data(): {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    uvs: Float32Array;
  } {
    return {
      vertices: this.vertexData,
      indices: this.indexData,
      normals: this.normalData,
      uvs: this.uvData
    };
  }

  public get vertexData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.position)));
  }

  public get normalData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal)));
  }

  public get uvData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv)));
  }

  public get indexData(): Uint16Array {
    return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c]));
  }

  public getMidPoint(ndxA: number, ndxB: number, cache: Record<string, number>): number {
    const cacheKey = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`;
    if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
      return cache[cacheKey];
    }
    const a = this.vertices[ndxA].position;
    const b = this.vertices[ndxB].position;
    const ndx = this.vertices.length;
    cache[cacheKey] = ndx;
    this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
    return ndx;
  }
}

class IcosahedronGeometry extends Geometry {
  constructor() {
    super();
    const t = Math.sqrt(5) * 0.5 + 0.5;
    this.addVertex(
      -1,
      t,
      0,
      1,
      t,
      0,
      -1,
      -t,
      0,
      1,
      -t,
      0,
      0,
      -1,
      t,
      0,
      1,
      t,
      0,
      -1,
      -t,
      0,
      1,
      -t,
      t,
      0,
      -1,
      t,
      0,
      1,
      -t,
      0,
      -1,
      -t,
      0,
      1
    ).addFace(
      0,
      11,
      5,
      0,
      5,
      1,
      0,
      1,
      7,
      0,
      7,
      10,
      0,
      10,
      11,
      1,
      5,
      9,
      5,
      11,
      4,
      11,
      10,
      2,
      10,
      7,
      6,
      7,
      1,
      8,
      3,
      9,
      4,
      3,
      4,
      2,
      3,
      2,
      6,
      3,
      6,
      8,
      3,
      8,
      9,
      4,
      9,
      5,
      2,
      4,
      11,
      6,
      2,
      10,
      8,
      6,
      7,
      9,
      8,
      1
    );
  }
}

class DiscGeometry extends Geometry {
  constructor(steps = 4, radius = 1) {
    super();
    const safeSteps = Math.max(4, steps);
    const alpha = (2 * Math.PI) / safeSteps;

    this.addVertex(0, 0, 0);
    this.lastVertex.uv[0] = 0.5;
    this.lastVertex.uv[1] = 0.5;

    for (let i = 0; i < safeSteps; ++i) {
      const x = Math.cos(alpha * i);
      const y = Math.sin(alpha * i);
      this.addVertex(radius * x, radius * y, 0);
      this.lastVertex.uv[0] = x * 0.5 + 0.5;
      this.lastVertex.uv[1] = y * 0.5 + 0.5;

      if (i > 0) {
        this.addFace(0, i, i + 1);
      }
    }
    this.addFace(0, safeSteps, 1);
  }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (success) {
    return shader;
  }

  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  shaderSources: [string, string],
  transformFeedbackVaryings?: string[] | null,
  attribLocations?: Record<string, number>
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
    const shader = createShader(gl, type, shaderSources[ndx]);
    if (shader) {
      gl.attachShader(program, shader);
    }
  });

  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
  }

  if (attribLocations) {
    for (const attrib in attribLocations) {
      if (Object.prototype.hasOwnProperty.call(attribLocations, attrib)) {
        gl.bindAttribLocation(program, attribLocations[attrib], attrib);
      }
    }
  }

  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (success) {
    return program;
  }

  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

function makeVertexArray(
  gl: WebGL2RenderingContext,
  bufLocNumElmPairs: Array<[WebGLBuffer, number, number]>,
  indices?: Uint16Array
): WebGLVertexArrayObject | null {
  const va = gl.createVertexArray();
  if (!va) return null;

  gl.bindVertexArray(va);

  for (const [buffer, loc, numElem] of bufLocNumElmPairs) {
    if (loc === -1) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0);
  }

  if (indices) {
    const indexBuffer = gl.createBuffer();
    if (indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
  }

  gl.bindVertexArray(null);
  return va;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);
  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  return needResize;
}

function makeBuffer(gl: WebGL2RenderingContext, sizeOrData: number | ArrayBufferView, usage: number): WebGLBuffer {
  const buf = gl.createBuffer();
  if (!buf) {
    throw new Error('Failed to create WebGL buffer.');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);

  if (typeof sizeOrData === 'number') {
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
  } else {
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buf;
}

function createAndSetupTexture(
  gl: WebGL2RenderingContext,
  minFilter: number,
  magFilter: number,
  wrapS: number,
  wrapT: number
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create WebGL texture.');
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  return texture;
}

type UpdateCallback = (deltaTime: number) => void;

class ArcballControl {
  private canvas: HTMLCanvasElement;
  private updateCallback: UpdateCallback;

  public isPointerDown = false;
  public orientation = quat.create();
  public pointerRotation = quat.create();
  public rotationVelocity = 0;
  public rotationAxis = vec3.fromValues(1, 0, 0);

  public snapDirection = vec3.fromValues(0, 0, -1);
  public snapTargetDirection: vec3 | null = null;

  private pointerPos = vec2.create();
  private previousPointerPos = vec2.create();
  private _rotationVelocity = 0;
  private _combinedQuat = quat.create();

  private readonly EPSILON = 0.1;
  private readonly IDENTITY_QUAT = quat.create();

  constructor(canvas: HTMLCanvasElement, updateCallback?: UpdateCallback) {
    this.canvas = canvas;
    this.updateCallback = updateCallback || (() => undefined);

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      vec2.set(this.pointerPos, e.clientX - rect.left, e.clientY - rect.top);
      vec2.copy(this.previousPointerPos, this.pointerPos);
      this.isPointerDown = true;
    });
    canvas.addEventListener('pointerup', (e: PointerEvent) => {
      e.preventDefault();
      this.isPointerDown = false;
    });
    canvas.addEventListener('pointerleave', (e: PointerEvent) => {
      e.preventDefault();
      this.isPointerDown = false;
    });
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      e.preventDefault();
      if (this.isPointerDown) {
        const rect = this.canvas.getBoundingClientRect();
        vec2.set(this.pointerPos, e.clientX - rect.left, e.clientY - rect.top);
      }
    });
    
    // Add mouse events for better compatibility
    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      vec2.set(this.pointerPos, e.clientX - rect.left, e.clientY - rect.top);
      vec2.copy(this.previousPointerPos, this.pointerPos);
      this.isPointerDown = true;
    });
    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      e.preventDefault();
      this.isPointerDown = false;
    });
    canvas.addEventListener('mouseleave', (e: MouseEvent) => {
      e.preventDefault();
      this.isPointerDown = false;
    });
    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      e.preventDefault();
      if (this.isPointerDown) {
        const rect = this.canvas.getBoundingClientRect();
        vec2.set(this.pointerPos, e.clientX - rect.left, e.clientY - rect.top);
      }
    });
    
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
  }

  public update(deltaTime: number, targetFrameDuration = 16): void {
    const timeScale = deltaTime / targetFrameDuration + 0.00001;
    let angleFactor = timeScale;
    const snapRotation = quat.create();

    if (this.isPointerDown) {
      const INTENSITY = 0.3 * timeScale;
      const ANGLE_AMPLIFICATION = 5 / timeScale;
      const midPointerPos = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
      vec2.scale(midPointerPos, midPointerPos, INTENSITY);

      if (vec2.sqrLen(midPointerPos) > this.EPSILON) {
        vec2.add(midPointerPos, this.previousPointerPos, midPointerPos);

        const p = this.project(midPointerPos);
        const q = this.project(this.previousPointerPos);
        const a = vec3.normalize(vec3.create(), p);
        const b = vec3.normalize(vec3.create(), q);

        vec2.copy(this.previousPointerPos, midPointerPos);

        angleFactor *= ANGLE_AMPLIFICATION;

        this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
      } else {
        quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY);
      }
    } else {
      const INTENSITY = 0.1 * timeScale;
      quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY);

      if (this.snapTargetDirection) {
        const SNAPPING_INTENSITY = 0.2;
        const a = this.snapTargetDirection;
        const b = this.snapDirection;
        const sqrDist = vec3.squaredDistance(a, b);
        const distanceFactor = Math.max(0.1, 1 - sqrDist * 10);
        angleFactor *= SNAPPING_INTENSITY * distanceFactor;
        this.quatFromVectors(a, b, snapRotation, angleFactor);
      }
    }

    const combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation);
    this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation);
    quat.normalize(this.orientation, this.orientation);

    const RA_INTENSITY = 0.8 * timeScale;
    quat.slerp(this._combinedQuat, this._combinedQuat, combinedQuat, RA_INTENSITY);
    quat.normalize(this._combinedQuat, this._combinedQuat);

    const rad = Math.acos(this._combinedQuat[3]) * 2.0;
    const s = Math.sin(rad / 2.0);
    let rv = 0;
    if (s > 0.000001) {
      rv = rad / (2 * Math.PI);
      this.rotationAxis[0] = this._combinedQuat[0] / s;
      this.rotationAxis[1] = this._combinedQuat[1] / s;
      this.rotationAxis[2] = this._combinedQuat[2] / s;
    }

    const RV_INTENSITY = 0.5 * timeScale;
    this._rotationVelocity += (rv - this._rotationVelocity) * RV_INTENSITY;
    this.rotationVelocity = this._rotationVelocity / timeScale;

    this.updateCallback(deltaTime);
  }

  private quatFromVectors(a: vec3, b: vec3, out: quat, angleFactor = 1): { q: quat; axis: vec3; angle: number } {
    const axis = vec3.cross(vec3.create(), a, b);
    vec3.normalize(axis, axis);
    const d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
    const angle = Math.acos(d) * angleFactor;
    quat.setAxisAngle(out, axis, angle);
    return { q: out, axis, angle };
  }

  private project(pos: vec2): vec3 {
    const r = 2;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const s = Math.max(w, h) - 1;

    const x = (2 * pos[0] - w - 1) / s;
    const y = (2 * pos[1] - h - 1) / s;
    let z = 0;
    const xySq = x * x + y * y;
    const rSq = r * r;

    if (xySq <= rSq / 2.0) {
      z = Math.sqrt(rSq - xySq);
    } else {
      z = rSq / (2.0 * Math.sqrt(xySq));
    }
    return vec3.fromValues(-x, y, z);
  }
}

export interface MenuItem {
  image: string;
  link: string;
  title: string;
  description: string;
  github?: string;
  demo?: string;
  type?: string;
}

type ActiveItemCallback = (index: number) => void;
type MovementChangeCallback = (isMoving: boolean) => void;
type InitCallback = (instance: InfiniteGridMenu) => void;

interface Camera {
  matrix: mat4;
  near: number;
  far: number;
  fov: number;
  aspect: number;
  position: vec3;
  up: vec3;
  matrices: {
    view: mat4;
    projection: mat4;
    inversProjection: mat4;
  };
}

class InfiniteGridMenu {
  private gl: WebGL2RenderingContext | null = null;
  private discProgram: WebGLProgram | null = null;
  private discVAO: WebGLVertexArrayObject | null = null;
  private discBuffers!: {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    uvs: Float32Array;
  };
  private icoGeo!: IcosahedronGeometry;
  private discGeo!: DiscGeometry;
  private worldMatrix = mat4.create();
  private tex: WebGLTexture | null = null;
  private control!: ArcballControl;

  private discLocations!: {
    aModelPosition: number;
    aModelUvs: number;
    aInstanceMatrix: number;
    uWorldMatrix: WebGLUniformLocation | null;
    uViewMatrix: WebGLUniformLocation | null;
    uProjectionMatrix: WebGLUniformLocation | null;
    uCameraPosition: WebGLUniformLocation | null;
    uScaleFactor: WebGLUniformLocation | null;
    uRotationAxisVelocity: WebGLUniformLocation | null;
    uTex: WebGLUniformLocation | null;
    uFrames: WebGLUniformLocation | null;
    uItemCount: WebGLUniformLocation | null;
    uAtlasSize: WebGLUniformLocation | null;
  };

  private viewportSize = vec2.create();
  private drawBufferSize = vec2.create();

  private discInstances!: {
    matricesArray: Float32Array;
    matrices: Float32Array[];
    buffer: WebGLBuffer | null;
  };

  private instancePositions: vec3[] = [];
  private DISC_INSTANCE_COUNT = 0;
  private atlasSize = 1;

  private _time = 0;
  private _deltaTime = 0;
  private _deltaFrames = 0;
  private _frames = 0;
  private _hasUserInteracted = false;

  private movementActive = false;

  private TARGET_FRAME_DURATION = 1000 / 60;
  private SPHERE_RADIUS = 2;

  public camera: Camera = {
    matrix: mat4.create(),
    near: 0.1,
    far: 40,
    fov: Math.PI / 4,
    aspect: 1,
    position: vec3.fromValues(0, 0, 3),
    up: vec3.fromValues(0, 1, 0),
    matrices: {
      view: mat4.create(),
      projection: mat4.create(),
      inversProjection: mat4.create()
    }
  };

  public smoothRotationVelocity = 0;
  public scaleFactor = 1.0;

  constructor(
    private canvas: HTMLCanvasElement,
    private items: MenuItem[],
    private onActiveItemChange: ActiveItemCallback,
    private onMovementChange: MovementChangeCallback,
    onInit?: InitCallback
  ) {
    this.init(onInit);
  }

  public resize(): void {
    const needsResize = resizeCanvasToDisplaySize(this.canvas);
    if (!this.gl) return;
    if (needsResize) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
    this.updateProjectionMatrix();
  }

  public run(time = 0): void {
    this._deltaTime = Math.min(32, time - this._time);
    this._time = time;
    this._deltaFrames = this._deltaTime / this.TARGET_FRAME_DURATION;
    this._frames += this._deltaFrames;

    this.animate(this._deltaTime);
    this.render();
  }

  private init(onInit?: InitCallback): void {
    const gl = this.canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    if (!gl) {
      console.error('WebGL2 not supported');
      throw new Error('No WebGL 2 context!');
    }
    this.gl = gl;

    vec2.set(this.viewportSize, this.canvas.clientWidth, this.canvas.clientHeight);
    vec2.clone(this.drawBufferSize);

    try {
      this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
        aModelPosition: 0,
        aModelNormal: 1,
        aModelUvs: 2,
        aInstanceMatrix: 3
      });

      if (!this.discProgram) {
        throw new Error('Failed to create shader program');
      }

      this.discLocations = {
        aModelPosition: gl.getAttribLocation(this.discProgram!, 'aModelPosition'),
        aModelUvs: gl.getAttribLocation(this.discProgram!, 'aModelUvs'),
        aInstanceMatrix: gl.getAttribLocation(this.discProgram!, 'aInstanceMatrix'),
        uWorldMatrix: gl.getUniformLocation(this.discProgram!, 'uWorldMatrix'),
        uViewMatrix: gl.getUniformLocation(this.discProgram!, 'uViewMatrix'),
        uProjectionMatrix: gl.getUniformLocation(this.discProgram!, 'uProjectionMatrix'),
        uCameraPosition: gl.getUniformLocation(this.discProgram!, 'uCameraPosition'),
        uScaleFactor: gl.getUniformLocation(this.discProgram!, 'uScaleFactor'),
        uRotationAxisVelocity: gl.getUniformLocation(this.discProgram!, 'uRotationAxisVelocity'),
        uTex: gl.getUniformLocation(this.discProgram!, 'uTex'),
        uFrames: gl.getUniformLocation(this.discProgram!, 'uFrames'),
        uItemCount: gl.getUniformLocation(this.discProgram!, 'uItemCount'),
        uAtlasSize: gl.getUniformLocation(this.discProgram!, 'uAtlasSize')
      };

      this.discGeo = new DiscGeometry(56, 1);
      this.discBuffers = this.discGeo.data;
      this.discVAO = makeVertexArray(
        gl,
        [
          [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
          [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2]
        ],
        this.discBuffers.indices
      );

      this.icoGeo = new IcosahedronGeometry();
      this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS);
      this.instancePositions = this.icoGeo.vertices.map(v => v.position);
      this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length;
      this.initDiscInstances(this.DISC_INSTANCE_COUNT);
      this.initTexture();
      this.control = new ArcballControl(this.canvas, deltaTime => this.onControlUpdate(deltaTime));

      this.updateCameraMatrix();
      this.updateProjectionMatrix();
      this.resize();

      console.log('InfiniteGridMenu initialized successfully');
      
      if (onInit) {
        onInit(this);
      }
    } catch (error) {
      console.error('Failed to initialize InfiniteGridMenu:', error);
      throw error;
    }
  }

  private initTexture(): void {
    if (!this.gl) return;
    const gl = this.gl;
    this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

    const itemCount = Math.max(1, this.items.length);
    this.atlasSize = Math.ceil(Math.sqrt(itemCount));
    const cellSize = 512;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = this.atlasSize * cellSize;
    canvas.height = this.atlasSize * cellSize;

    // Fill with a default color first
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImageWithFallback = (item: MenuItem, index: number): Promise<HTMLImageElement> => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Failed to load image: ${item.image}`);
          // Create a fallback colored circle
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = cellSize;
          fallbackCanvas.height = cellSize;
          const fallbackCtx = fallbackCanvas.getContext('2d')!;
          
          // Generate a color based on the index
          const hue = (index * 137.5) % 360;
          const centerX = cellSize / 2;
          const centerY = cellSize / 2;
          const radius = cellSize / 2;
          
          // Create circular gradient background
          const gradient = fallbackCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          gradient.addColorStop(0, `hsl(${hue}, 70%, 70%)`);
          gradient.addColorStop(1, `hsl(${hue}, 70%, 50%)`);
          
          fallbackCtx.fillStyle = gradient;
          fallbackCtx.beginPath();
          fallbackCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          fallbackCtx.fill();
          
          // Add project title text
          fallbackCtx.fillStyle = 'white';
          fallbackCtx.font = 'bold 28px sans-serif';
          fallbackCtx.textAlign = 'center';
          fallbackCtx.textBaseline = 'middle';
          fallbackCtx.strokeStyle = 'rgba(0,0,0,0.3)';
          fallbackCtx.lineWidth = 1;
          
          const text = item.title.slice(0, 8);
          fallbackCtx.strokeText(text, centerX, centerY);
          fallbackCtx.fillText(text, centerX, centerY);
          
          // Add border
          fallbackCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          fallbackCtx.lineWidth = 3;
          fallbackCtx.beginPath();
          fallbackCtx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
          fallbackCtx.stroke();
          
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.src = fallbackCanvas.toDataURL();
        };
        
        img.src = item.image;
      });
    };

    Promise.all(
      this.items.map((item, index) => loadImageWithFallback(item, index))
    ).then(images => {
      images.forEach((img, i) => {
        const x = (i % this.atlasSize) * cellSize;
        const y = Math.floor(i / this.atlasSize) * cellSize;
        
        // Save current context state
        ctx.save();
        
        // Create circular clipping path
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        const radius = cellSize / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.clip();
        
        // Calculate dimensions to fill the circle while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (aspectRatio > 1) {
          // Landscape image - fit by height
          drawHeight = cellSize;
          drawWidth = cellSize * aspectRatio;
          offsetX = x - (drawWidth - cellSize) / 2;
          offsetY = y;
        } else {
          // Portrait image - fit by width
          drawWidth = cellSize;
          drawHeight = cellSize / aspectRatio;
          offsetX = x;
          offsetY = y - (drawHeight - cellSize) / 2;
        }
        
        // Draw the image to fill the circular area
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Restore context state
        ctx.restore();
        
        // Add subtle border around the circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
        ctx.stroke();
      });

      if (this.gl && this.tex) {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
      
      console.log('Texture atlas created successfully');
    }).catch(error => {
      console.error('Failed to create texture atlas:', error);
      if (this.gl && this.tex) {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      }
    });
  }

  private initDiscInstances(count: number): void {
    if (!this.gl || !this.discVAO) return;
    const gl = this.gl;

    const matricesArray = new Float32Array(count * 16);
    const matrices: Float32Array[] = [];
    for (let i = 0; i < count; ++i) {
      const instanceMatrixArray = new Float32Array(matricesArray.buffer, i * 16 * 4, 16);
      mat4.identity(instanceMatrixArray as unknown as mat4);
      matrices.push(instanceMatrixArray);
    }

    this.discInstances = {
      matricesArray,
      matrices,
      buffer: gl.createBuffer()
    };

    gl.bindVertexArray(this.discVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);

    const mat4AttribSlotCount = 4;
    const bytesPerMatrix = 16 * 4;
    for (let j = 0; j < mat4AttribSlotCount; ++j) {
      const loc = this.discLocations.aInstanceMatrix + j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, j * 4 * 4);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  private animate(deltaTime: number): void {
    if (!this.gl) return;
    this.control.update(deltaTime, this.TARGET_FRAME_DURATION);

    const positions = this.instancePositions.map(p => vec3.transformQuat(vec3.create(), p, this.control.orientation));
    const scale = 0.25;
    const SCALE_INTENSITY = 0.6;

    positions.forEach((p, ndx) => {
      const s = (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY + (1 - SCALE_INTENSITY);
      const finalScale = s * scale;
      const matrix = mat4.create();

      mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)));
      mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0]));
      mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]));
      mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]));

      mat4.copy(this.discInstances.matrices[ndx], matrix);
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.discInstances.buffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.smoothRotationVelocity = this.control.rotationVelocity;
  }

  private render(): void {
    if (!this.gl || !this.discProgram) return;
    const gl = this.gl;

    gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix);
    gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
    gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
    gl.uniform3f(
      this.discLocations.uCameraPosition,
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2]
    );
    gl.uniform4f(
      this.discLocations.uRotationAxisVelocity,
      this.control.rotationAxis[0],
      this.control.rotationAxis[1],
      this.control.rotationAxis[2],
      this.smoothRotationVelocity * 1.1
    );

    gl.uniform1i(this.discLocations.uItemCount, this.items.length);
    gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);

    gl.uniform1f(this.discLocations.uFrames, this._frames);
    gl.uniform1f(this.discLocations.uScaleFactor, this.scaleFactor);

    gl.uniform1i(this.discLocations.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      this.discBuffers.indices.length,
      gl.UNSIGNED_SHORT,
      0,
      this.DISC_INSTANCE_COUNT
    );
    gl.bindVertexArray(null);
  }

  private updateCameraMatrix(): void {
    mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up);
    mat4.invert(this.camera.matrices.view, this.camera.matrix);
  }

  private updateProjectionMatrix(): void {
    if (!this.gl) return;
    const canvasEl = this.gl.canvas as HTMLCanvasElement;
    this.camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    const height = this.SPHERE_RADIUS * 0.35;
    const distance = this.camera.position[2];
    if (this.camera.aspect > 1) {
      this.camera.fov = 2 * Math.atan(height / distance);
    } else {
      this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
    }
    mat4.perspective(
      this.camera.matrices.projection,
      this.camera.fov,
      this.camera.aspect,
      this.camera.near,
      this.camera.far
    );
    mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
  }

  private onControlUpdate(deltaTime: number): void {
    const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
    let damping = 5 / timeScale;
    let cameraTargetZ = 3;

    const isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01;

    if (isMoving !== this.movementActive) {
      this.movementActive = isMoving;
      this.onMovementChange(isMoving);
    }

    if (!this.control.isPointerDown) {
      const nearestVertexIndex = this.findNearestVertexIndex();
      let itemIndex = nearestVertexIndex % Math.max(1, this.items.length);
      
      // On first load or when no interaction has occurred, prioritize the first project
      if (!this._hasUserInteracted && this._frames < 60) {
        itemIndex = 0;
      }
      
      this.onActiveItemChange(itemIndex);
      const snapDirection = vec3.normalize(vec3.create(), this.getVertexWorldPosition(nearestVertexIndex));
      this.control.snapTargetDirection = snapDirection;
    } else {
      this._hasUserInteracted = true;
      cameraTargetZ += this.control.rotationVelocity * 80 + 2.5;
      damping = 7 / timeScale;
    }

    this.camera.position[2] += (cameraTargetZ - this.camera.position[2]) / damping;
    this.updateCameraMatrix();
  }

  private findNearestVertexIndex(): number {
    const n = this.control.snapDirection;
    const inversOrientation = quat.conjugate(quat.create(), this.control.orientation);
    const nt = vec3.transformQuat(vec3.create(), n, inversOrientation);

    let maxD = -1;
    let nearestVertexIndex = 0;
    for (let i = 0; i < this.instancePositions.length; ++i) {
      const d = vec3.dot(nt, this.instancePositions[i]);
      if (d > maxD) {
        maxD = d;
        nearestVertexIndex = i;
      }
    }
    return nearestVertexIndex;
  }

  private getVertexWorldPosition(index: number): vec3 {
    const nearestVertexPos = this.instancePositions[index];
    return vec3.transformQuat(vec3.create(), nearestVertexPos, this.control.orientation);
  }
}

const defaultItems: MenuItem[] = [
  {
    image: 'https://picsum.photos/900/900?grayscale',
    link: 'https://google.com/',
    title: '',
    description: ''
  }
];

interface InfiniteMenuProps {
  items?: MenuItem[];
  onInitialized?: () => void;
}

const InfiniteMenu: FC<InfiniteMenuProps> = ({ items = [], onInitialized }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null) as MutableRefObject<HTMLCanvasElement | null>;
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const sketchRef = useRef<InfiniteGridMenu | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleActiveItem = (index: number) => {
      if (!items.length) return;
      const itemIndex = index % items.length;
      setActiveItem(items[itemIndex]);
    };

    try {
      const sketch = new InfiniteGridMenu(
        canvas, 
        items.length ? items : defaultItems, 
        handleActiveItem, 
        setIsMoving, 
        (sk) => {
          sketchRef.current = sk;
          if (onInitialized) {
            onInitialized();
          }
          const animate = (time: number) => {
            sk.run(time);
            animationRef.current = requestAnimationFrame(animate);
          };
          animationRef.current = requestAnimationFrame(animate);
        }
      );
    } catch (error) {
      console.error('Failed to initialize InfiniteGridMenu:', error);
    }

    const handleResize = () => {
      if (sketchRef.current) {
        sketchRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [items, onInitialized]);

  const handleButtonClick = (type: 'github' | 'demo') => {
    if (!activeItem) return;
    
    let url = '';
    if (type === 'github' && activeItem.github) {
      url = activeItem.github;
    } else if (type === 'demo') {
      if (activeItem.type === 'blogs' && activeItem.link) {
        url = activeItem.link;
      } else if (activeItem.demo) {
        url = activeItem.demo;
      }
    } else if (activeItem.link) {
      url = activeItem.link;
    }
    
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full overflow-hidden relative outline-none"
        style={{
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none'
        }}
      />

      {activeItem && (
        <>
          <h2
            className={`
          select-none absolute font-black text-gray-900 dark:text-white text-2xl md:[font-size:3.5rem]
          left-1/2 md:left-[5%] top-[8%] md:top-1/2 transform -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2
          max-w-[90%] md:max-w-[8ch] text-center md:text-left leading-tight transition-all ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${isMoving ? 'opacity-0 pointer-events-none duration-[100ms]' : 'opacity-100 pointer-events-auto duration-[500ms]'}
        `}
          >
            {activeItem.title.length > 30 ? `${activeItem.title.substring(0, 30)}...` : activeItem.title}
          </h2>

          <p
            className={`
          select-none absolute max-w-[90%] md:max-w-[14ch] text-base md:text-[1.1rem] leading-snug
          text-gray-600 dark:text-gray-300 bottom-[20%] md:top-[45%] left-1/2 md:left-auto md:right-[5%]
          text-center md:text-left max-h-[20vh] md:max-h-[40vh] overflow-visible transition-all ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${isMoving ? 'opacity-0 pointer-events-none -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2' : 'opacity-100 pointer-events-auto -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2'}
        `}
          >
            {activeItem.description.length > 150 ? `${activeItem.description.substring(0, 150)}...` : activeItem.description}
          </p>

          {(activeItem.github || activeItem.demo || activeItem.link) && (
            <div className={`
              absolute left-1/2 -translate-x-1/2 flex gap-3 transition-all ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
              ${isMoving ? 'bottom-[-100px] opacity-0 pointer-events-none scale-0' : 'bottom-[2em] md:bottom-[3.5em] opacity-100 pointer-events-auto scale-100'}
            `}>
              {activeItem.github && activeItem.type !== 'blogs' && (
                <button
                  onClick={() => handleButtonClick('github')}
                  className="w-[55px] h-[55px] grid place-items-center bg-gray-800/90 dark:bg-gray-700/90 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border-2 border-gray-600"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
              )}
              
              {(activeItem.demo || activeItem.type === 'blogs') && (
                <button
                  onClick={() => handleButtonClick('demo')}
                  className="w-[55px] h-[55px] grid place-items-center bg-blue-600/90 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border-2 border-blue-500"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {activeItem.type === 'blogs' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InfiniteMenu;
