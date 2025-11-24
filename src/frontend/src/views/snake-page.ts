import { Component } from '../core/Component.js';
// IMPORT TYPE ONLY (Does not download code yet)
import type * as BABYLON from '@babylonjs/core';

export class SnakePage extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;

  // This holds the loaded library
  private B: any | null = null;

  // --- GAME CONFIGURATION ---
  private arenaWidth = 60;
  private arenaHeight = 40;
  private speed = 0.3;
  private turnSpeed = 0.06;

  // --- GAME STATE ---
  private head: BABYLON.Mesh | null = null;
  private headLight: BABYLON.PointLight | null = null;
  private direction: number = 0;
  private inputMap: Record<string, boolean> = {};

  // --- TRAIL SYSTEM ---
  private lastPosition: BABYLON.Vector3 | null = null;
  private allTrails: BABYLON.Mesh[] = [];

  render(): string {
    return `
      <section class="w-full h-full flex flex-col items-center justify-center bg-gray-900">
        <h1 class="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-500" style="text-shadow: 0 0 10px rgba(0,255,255,0.5);">
            NEON SNAKE 3D
        </h1>

        <div class="relative w-full max-w-5xl aspect-video border-4 border-gray-800 shadow-2xl">
            <canvas id="renderCanvas" style="width: 100%; height: 100%; outline: none; cursor: grab;"></canvas>

            <div id="loader" class="absolute inset-0 flex items-center justify-center bg-black z-50 text-white font-mono">
                Loading 3D Engine...
            </div>

            <div id="deathMsg" class="absolute top-1/2 left-0 w-full text-center text-red-500 font-bold text-6xl hidden" style="text-shadow: 0 0 20px red; transform: translateY(-50%); pointer-events: none;">
                CRASHED!
            </div>
        </div>

        <p class="text-gray-400 mt-4 text-center">
           <b>Arrow Keys</b> to turn.<br>
           <b>Mouse Drag</b> to rotate view. <b>Scroll</b> to zoom.
        </p>
      </section>
    `;
  }

  async connectedCallback() {
    this.innerHTML = this.render();
    this.canvas = this.querySelector('#renderCanvas');

    if (this.canvas) {
      try {
        // 1. LOAD THE CHUNK MANUALLY
        const { Engine, Scene, Vector3, ArcRotateCamera, HemisphericLight, PointLight, MeshBuilder, StandardMaterial, Color3, GlowLayer } = await import('@babylonjs/core');

        this.B = {
          Engine,
          Scene,
          Vector3,
          ArcRotateCamera,
          HemisphericLight,
          PointLight,
          MeshBuilder,
          StandardMaterial,
          Color3,
          GlowLayer,
        };

        // 2. HIDE LOADER
        const loader = this.querySelector('#loader');
        if (loader) loader.remove();

        // 3. START GAME (Now that we have the library)
        this.initGame();
      } catch (error) {
        console.error('Failed to load 3D engine:', error);
      }
    }
  }

  // --- ADDED THIS MISSING METHOD ---
  private initGame() {
    // Safety check: Ensure library (B) and canvas exist
    if (!this.B || !this.canvas) return;
    const B = this.B; // Shortcut

    this.engine = new B.Engine(this.canvas, true);
    this.createScene();
    this.setupInput();

    if (!this.engine) return;
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.updateGameLogic();
        this.scene.render();
      }
    });

    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.engine?.dispose();
    this.allTrails = [];
  }

  private handleResize = () => {
    this.engine?.resize();
  };

  private handleKeyDown = (evt: KeyboardEvent) => {
    this.inputMap[evt.key] = true;
  };

  private handleKeyUp = (evt: KeyboardEvent) => {
    this.inputMap[evt.key] = false;
  };

  private setupInput() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private createScene() {
    if (!this.engine || !this.B) return;
    const B = this.B; // IMPORTANT: Use this shortcut!

    this.scene = new B.Scene(this.engine);

    if (!this.scene) return;
    this.scene.clearColor = new B.Color3(0.05, 0.05, 0.08).toColor4();

    const gl = new B.GlowLayer('glow', this.scene);
    gl.intensity = 0.7;

    const camera = new B.ArcRotateCamera('camera1', -Math.PI / 2, 0.6, 65, new B.Vector3(0, 0, 0), this.scene);

    camera.attachControl(this.canvas, true);
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 150;
    camera.lowerBetaLimit = 0.1;

    const light = new B.HemisphericLight('light1', new B.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.6;

    const ground = B.MeshBuilder.CreateGround('ground', { width: this.arenaWidth, height: this.arenaHeight, subdivisions: 20 }, this.scene);

    const matGround = new B.StandardMaterial('matGround', this.scene);
    matGround.diffuseColor = new B.Color3(0.1, 0.1, 0.2);
    matGround.wireframe = true;
    ground.material = matGround;

    this.createBorders();

    const matTrail = new B.StandardMaterial('matTrail', this.scene);
    matTrail.diffuseColor = new B.Color3(0, 1, 0);
    matTrail.emissiveColor = new B.Color3(0, 1, 0);

    this.createHead();
  }

  private createBorders() {
    if (!this.B || !this.scene) return;
    const B = this.B;

    const w = this.arenaWidth / 2;
    const h = this.arenaHeight / 2;

    const borderPoints = [new B.Vector3(-w, 0, h), new B.Vector3(w, 0, h), new B.Vector3(w, 0, -h), new B.Vector3(-w, 0, -h), new B.Vector3(-w, 0, h)];

    const border = B.MeshBuilder.CreateLines('border', { points: borderPoints }, this.scene);
    border.color = new B.Color3(0, 0.5, 1);
  }

  private createHead() {
    if (!this.B || !this.scene) return;
    const B = this.B;

    if (this.head) this.head.dispose();
    if (this.headLight) this.headLight.dispose();

    this.head = B.MeshBuilder.CreateSphere('head', { diameter: 1 }, this.scene);
    if(!this.head) return;
    this.head.position = new B.Vector3(0, 0.5, 0);

    const matHead = new B.StandardMaterial('matHead', this.scene);
    matHead.diffuseColor = new B.Color3(1, 1, 1);
    matHead.emissiveColor = new B.Color3(1, 1, 1);
    this.head.material = matHead;

    this.headLight = new B.PointLight('headLight', new B.Vector3(0, 2, 0), this.scene);
    if(!this.headLight) return;
    this.headLight.parent = this.head;
    this.headLight.diffuse = new B.Color3(0, 1, 0);
    this.headLight.intensity = 0.5;
    this.headLight.range = 20;

    this.direction = 0;
    this.lastPosition = this.head.position.clone();
  }

  private resetGame() {
    const msg = this.querySelector('#deathMsg');
    if (msg) {
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 1500);
    }

    this.allTrails.forEach((mesh) => mesh.dispose());
    this.allTrails = [];
    this.createHead();
  }

  private updateGameLogic() {
    if (!this.head || !this.scene || !this.lastPosition || !this.B) return;
    const B = this.B;

    // 1. Turn
    if (this.inputMap['ArrowLeft']) this.direction -= this.turnSpeed;
    if (this.inputMap['ArrowRight']) this.direction += this.turnSpeed;

    // 2. Move
    const velocityX = Math.sin(this.direction) * this.speed;
    const velocityZ = Math.cos(this.direction) * this.speed;

    this.head.position.x += velocityX;
    this.head.position.z += velocityZ;

    // 3. Teleport Check
    let didTeleport = false;
    const hw = this.arenaWidth / 2;
    const hh = this.arenaHeight / 2;

    if (this.head.position.x > hw) {
      this.head.position.x = -hw;
      didTeleport = true;
    } else if (this.head.position.x < -hw) {
      this.head.position.x = hw;
      didTeleport = true;
    }

    if (this.head.position.z > hh) {
      this.head.position.z = -hh;
      didTeleport = true;
    } else if (this.head.position.z < -hh) {
      this.head.position.z = hh;
      didTeleport = true;
    }

    // 4. Collision Check
    const safeZone = 15;
    const limit = this.allTrails.length - safeZone;
    for (let i = 0; i < limit; i++) {
      if (this.head.intersectsMesh(this.allTrails[i], true)) {
        this.resetGame();
        return;
      }
    }

    // 5. Draw Trail
    if (didTeleport) {
      this.lastPosition = this.head.position.clone();
    } else {
      // NOTE: B.MeshBuilder used here
      const segment = B.MeshBuilder.CreateTube(
        'trail',
        {
          path: [this.lastPosition, this.head.position],
          radius: 0.4,
          tessellation: 4,
          cap: 0,
          updatable: false,
        },
        this.scene
      );

      const mat = this.scene.getMaterialByName('matTrail');
      if (mat) segment.material = mat;

      this.allTrails.push(segment);
      this.lastPosition = this.head.position.clone();
    }
  }
}

customElements.define('snake-page', SnakePage);
