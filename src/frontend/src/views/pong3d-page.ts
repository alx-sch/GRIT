import { Component } from '../core/Component.js'; // Your base class
import {
  Engine,
  Scene,
  Vector3,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
} from '@babylonjs/core';

export class PongPage3d extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private scene: Scene | null = null;

  // Meshes
  private ball: Mesh | null = null;
  private player: Mesh | null = null;
  private ai: Mesh | null = null;

  // Game State
  private ballVelocity = new Vector3(0.2, 0, 0.2);
  private playerScore = 0;
  private aiScore = 0;
  private tableWidth = 20;
  private tableDepth = 14;

  render(): string {
    return `
      <section class="w-full h-full flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold mb-4 text-white">3D Pong (Babylon.js)</h1>
        <div style="position: relative; width: 800px; height: 600px;">
            <canvas id="renderCanvas" style="width: 100%; height: 100%; outline: none;"></canvas>
            <div id="scoreBoard" class="absolute top-4 w-full text-center text-white text-3xl font-bold pointer-events-none">
                0 - 0
            </div>
        </div>
        <p class="text-gray-300 mt-2">Move mouse vertically to control the left paddle</p>
      </section>
    `;
  }

  connectedCallback() {
    this.innerHTML = this.render();
    this.canvas = this.querySelector('#renderCanvas');

    if (this.canvas) {
      // 1. Init Babylon Engine
      this.engine = new Engine(this.canvas, true);

      // 2. Create Scene & Start Loop
      this.createScene();

      this.engine.runRenderLoop(() => {
        if (this.scene) {
          this.updateGameLogic();
          this.scene.render();
        }
      });

      // 3. Handle Window Resize
      window.addEventListener('resize', this.handleResize);
    }
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    this.engine?.dispose(); // Kills the loop and frees WebGL context
  }

  private handleResize = () => {
    this.engine?.resize();
  };

  private createScene() {
    this.scene = new Scene(this.engine!);

    // --- A. Camera ---
    // Place camera above looking down at an angle (Spectator view)
    const camera = new FreeCamera(
      'camera1',
      new Vector3(0, 15, -20),
      this.scene
    );
    camera.setTarget(Vector3.Zero()); // Look at center of table

    // --- B. Light ---
    const light = new HemisphericLight(
      'light1',
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 0.7;

    // --- C. Materials ---
    const matRed = new StandardMaterial('red', this.scene);
    matRed.diffuseColor = new Color3(1, 0.2, 0.2); // Player

    const matBlue = new StandardMaterial('blue', this.scene);
    matBlue.diffuseColor = new Color3(0.2, 0.2, 1); // AI

    const matWhite = new StandardMaterial('white', this.scene);
    matWhite.diffuseColor = new Color3(1, 1, 1); // Ball/Ground

    // --- D. Objects ---

    // 1. The Ground (Table)
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: this.tableWidth,
        height: this.tableDepth,
      },
      this.scene
    );
    ground.material = matWhite;

    // 2. Player Paddle (Left / -X)
    this.player = MeshBuilder.CreateBox(
      'player',
      { height: 1, width: 1, depth: 3 },
      this.scene
    );
    this.player.position.x = -9;
    this.player.position.y = 0.5; // Sit on top of ground
    this.player.material = matRed;

    // 3. AI Paddle (Right / +X)
    this.ai = MeshBuilder.CreateBox(
      'ai',
      { height: 1, width: 1, depth: 3 },
      this.scene
    );
    this.ai.position.x = 9;
    this.ai.position.y = 0.5;
    this.ai.material = matBlue;

    // 4. The Ball
    this.ball = MeshBuilder.CreateSphere('ball', { diameter: 0.8 }, this.scene);
    this.ball.position.y = 0.4;
    this.ball.material = matWhite;

    // --- E. Input Handling ---
    // Babylon has a built-in observable for inputs which handles canvas scaling better
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.scene) return;

      // Map Mouse Y (0 to Canvas Height) to Table Z (-7 to 7)
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      );

      // We create an invisible plane to catch mouse movements exactly on the board level
      // For MVP, let's just map screen coordinates roughly
      if (this.canvas && this.player) {
        // Normalize mouse Y from -1 to 1
        const mouseY = (this.scene.pointerY / this.canvas.height) * 2 - 1;
        // Invert because screen Y goes down, 3D Z goes up
        // Multiply by half table depth (roughly 6 to keep inside bounds)
        this.player.position.z = -mouseY * 6;
      }
    });
  }

  private updateGameLogic() {
    if (!this.ball || !this.player || !this.ai) return;

    // 1. Move Ball
    this.ball.position.addInPlace(this.ballVelocity);

    // 2. Wall Collision (Top/Bottom walls -> Z Axis)
    const limitZ = this.tableDepth / 2 - 0.5;
    if (this.ball.position.z > limitZ || this.ball.position.z < -limitZ) {
      this.ballVelocity.z *= -1;
    }

    // 3. Paddle Collision (Using Babylon's IntersectsMesh) [cite: 460]
    if (this.ball.intersectsMesh(this.player, false)) {
      this.ballVelocity.x = Math.abs(this.ballVelocity.x); // Force move Right
      this.increaseSpeed();
    } else if (this.ball.intersectsMesh(this.ai, false)) {
      this.ballVelocity.x = -Math.abs(this.ballVelocity.x); // Force move Left
      this.increaseSpeed();
    }

    // 4. Scoring (Left/Right walls -> X Axis)
    const limitX = this.tableWidth / 2 + 2; // Allow it to go slightly past paddle
    if (this.ball.position.x > limitX) {
      // AI Lost
      this.playerScore++;
      this.resetBall(-1);
    } else if (this.ball.position.x < -limitX) {
      // Player Lost
      this.aiScore++;
      this.resetBall(1);
    }

    // 5. AI Logic (Simple tracking)
    // Move AI paddle towards ball Z, with a speed limit (lerp)
    this.ai.position.z = Scalar.Lerp(
      this.ai.position.z,
      this.ball.position.z,
      0.05
    );
    // Clamp AI position
    this.ai.position.z = Math.max(-6, Math.min(6, this.ai.position.z));
  }

  private increaseSpeed() {
    this.ballVelocity.scaleInPlace(1.05); // Speed up by 5% on hit
  }

  private resetBall(direction: number) {
    if (!this.ball) return;
    this.ball.position = new Vector3(0, 0.4, 0);
    this.ballVelocity = new Vector3(
      0.2 * direction,
      0,
      (Math.random() - 0.5) * 0.2
    );
    this.updateScoreBoard();
  }

  private updateScoreBoard() {
    const el = this.querySelector('#scoreBoard');
    if (el) el.textContent = `${this.playerScore} - ${this.aiScore}`;
  }
}

// Helper utility for Lerp (or import Scalar from @babylonjs/core)
import { Scalar } from '@babylonjs/core';

customElements.define('pong3d-page', PongPage3d);
