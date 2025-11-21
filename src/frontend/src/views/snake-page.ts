import { Component } from '../core/Component.js';
import {
  Engine,
  Scene,
  Vector3,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  GlowLayer,
} from '@babylonjs/core';

export class SnakePage extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;

  // --- GAME CONFIGURATION ---
  private arenaWidth = 60;
  private arenaHeight = 40;
  private speed = 0.3;
  private turnSpeed = 0.06;

  // --- GAME STATE ---
  private head: Mesh | null = null;
  private headLight: PointLight | null = null;
  private direction: number = 0;
  private inputMap: Record<string, boolean> = {};

  // --- TRAIL SYSTEM ---
  private lastPosition: Vector3 | null = null;
  private allTrails: Mesh[] = [];

  render(): string {
    return `
      <section class="w-full h-full flex flex-col items-center justify-center bg-gray-900">
        <h1 class="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-500" style="text-shadow: 0 0 10px rgba(0,255,255,0.5);">
            NEON SNAKE 3D
        </h1>
        
        <div style="position: relative; width: 1000px; height: 600px; border: 4px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.9);">
            <canvas id="renderCanvas" style="width: 100%; height: 100%; outline: none; cursor: grab;"></canvas>
            
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

  connectedCallback() {
    this.innerHTML = this.render();
    this.canvas = this.querySelector('#renderCanvas');

    if (this.canvas) {
      this.engine = new Engine(this.canvas, true);
      this.createScene();
      this.setupInput();

      this.engine.runRenderLoop(() => {
        if (this.scene) {
          this.updateGameLogic();
          this.scene.render();
        }
      });

      window.addEventListener('resize', this.handleResize);
    }
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

  private setupInput() {
    window.addEventListener('keydown', (evt) => {
      this.inputMap[evt.key] = true;
    });
    window.addEventListener('keyup', (evt) => {
      this.inputMap[evt.key] = false;
    });
  }

  private createScene() {
    this.scene = new Scene(this.engine!);
    this.scene.clearColor = new Color3(0.05, 0.05, 0.08).toColor4();

    // 1. GLOW LAYER
    const gl = new GlowLayer('glow', this.scene);
    gl.intensity = 0.7;

    // 2. CAMERA (ArcRotateCamera for Mouse Control)
    // Parameters: Name, Alpha, Beta, Radius, Target, Scene
    const camera = new ArcRotateCamera(
      'camera1',
      -Math.PI / 2, // Face "North"
      0.6,
      65, // Distance from center
      new Vector3(0, 0, 0),
      this.scene
    );

    // Attach controls so mouse works
    camera.attachControl(this.canvas, true);

    // Disable Keys (We want Arrow Keys for Snake, NOT Camera)
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];

    // Limits to keep camera sane
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 150;
    camera.lowerBetaLimit = 0.1;

    // 3. LIGHTING
    const light = new HemisphericLight(
      'light1',
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 0.6;

    // 4. GROUND (Wireframe Grid)
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: this.arenaWidth,
        height: this.arenaHeight,
        subdivisions: 20,
      },
      this.scene
    );

    const matGround = new StandardMaterial('matGround', this.scene);
    matGround.diffuseColor = new Color3(0.1, 0.1, 0.2);
    matGround.wireframe = true;
    ground.material = matGround;

    // 5. BORDER
    this.createBorders();

    // 6. TRAIL MATERIAL
    const matTrail = new StandardMaterial('matTrail', this.scene);
    matTrail.diffuseColor = new Color3(0, 1, 0);
    matTrail.emissiveColor = new Color3(0, 1, 0);

    this.createHead();
  }

  private createBorders() {
    const w = this.arenaWidth / 2;
    const h = this.arenaHeight / 2;

    const borderPoints = [
      new Vector3(-w, 0, h),
      new Vector3(w, 0, h),
      new Vector3(w, 0, -h),
      new Vector3(-w, 0, -h),
      new Vector3(-w, 0, h),
    ];

    const border = MeshBuilder.CreateLines(
      'border',
      { points: borderPoints },
      this.scene
    );
    border.color = new Color3(0, 0.5, 1);
  }

  private createHead() {
    if (this.head) this.head.dispose();
    if (this.headLight) this.headLight.dispose();

    this.head = MeshBuilder.CreateSphere('head', { diameter: 1 }, this.scene);
    this.head.position = new Vector3(0, 0.5, 0);

    const matHead = new StandardMaterial('matHead', this.scene);
    matHead.diffuseColor = new Color3(1, 1, 1);
    matHead.emissiveColor = new Color3(1, 1, 1);
    this.head.material = matHead;

    // Dynamic Light on Head
    this.headLight = new PointLight(
      'headLight',
      new Vector3(0, 2, 0),
      this.scene
    );
    this.headLight.parent = this.head;
    this.headLight.diffuse = new Color3(0, 1, 0);
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
    if (!this.head || !this.scene || !this.lastPosition) return;

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
    // Safe Zone: Don't check the last 15 segments (the tail right behind you)
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
      const segment = MeshBuilder.CreateTube(
        'trail',
        {
          path: [this.lastPosition, this.head.position],
          radius: 0.4,
          tessellation: 4, // Low detail square tube is faster
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
