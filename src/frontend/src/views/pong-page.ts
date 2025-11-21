import { Component } from '../core/Component.js';

export class PongPage extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private requestID: number = 0; // To stop the loop later

  // Game State
  private ball = { x: 400, y: 300, radius: 10, dx: 4, dy: 4, color: 'white' };
  private paddleWidth = 10;
  private paddleHeight = 100;
  private user = { x: 0, y: 250, score: 0, color: 'white' };
  private com = { x: 790, y: 250, score: 0, color: 'white' };

  render(): string {
    return ` 
        <section class="game-container" style="display:flex; flex-direction:column; align-items:center;">
        <h1 class="text-2xl font-bold mb-4">Pong</h1>
        <canvas id="pongCanvas" width="800" height="600" style="background: #000; border: 2px solid #fff;"></canvas>
        <p>Use your mouse to move the left paddle</p>
        </section>
    `;
  }

  // This fires when the component is inserted into the DOM
  connectedCallback() {
    // 1. Initialize Canvas
    this.innerHTML = this.render(); // Render the HTML first
    this.canvas = this.querySelector('#pongCanvas');

    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');

      // 2. Add Event Listeners
      this.canvas.addEventListener('mousemove', this.handleMouseMove);

      // 3. Start the Game Loop
      this.gameLoop();
    }
  }

  // This fires when the user leaves the page (CRITICAL FOR SPAs)
  disconnectedCallback() {
    // 1. Stop the animation loop
    if (this.requestID) {
      cancelAnimationFrame(this.requestID);
    }

    // 2. Remove Event Listeners to prevent memory leaks
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    }
  }

  // --- Game Logic Methods ---

  private handleMouseMove = (evt: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.user.y = evt.clientY - rect.top - this.paddleHeight / 2;
  };

  private drawRect(x: number, y: number, w: number, h: number, color: string) {
    if (!this.ctx) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  private drawCircle(x: number, y: number, r: number, color: string) {
    if (!this.ctx) return;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.fill();
  }

  private drawText(text: string, x: number, y: number) {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '50px Arial';
    this.ctx.fillText(text, x, y);
  }

  private update() {
    if (!this.canvas) return;

    // Move Ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Wall Collision (Top/Bottom)
    if (
      this.ball.y + this.ball.radius > this.canvas.height ||
      this.ball.y - this.ball.radius < 0
    ) {
      this.ball.dy = -this.ball.dy;
    }

    // Computer AI (Simple tracking)
    let computerLevel = 0.1;
    this.com.y +=
      (this.ball.y - (this.com.y + this.paddleHeight / 2)) * computerLevel;

    // Paddle Collision Logic (Simplified for brevity)
    let player = this.ball.x < this.canvas.width / 2 ? this.user : this.com;

    // Simple AABB collision check
    if (
      this.ball.x - this.ball.radius < player.x + this.paddleWidth &&
      this.ball.x + this.ball.radius > player.x &&
      this.ball.y - this.ball.radius < player.y + this.paddleHeight &&
      this.ball.y + this.ball.radius > player.y
    ) {
      // Reverse ball & speed up slightly
      this.ball.dx = -this.ball.dx;
    }
  }

  private gameLoop = () => {
    if (!this.ctx || !this.canvas) return;

    this.update();

    // Clear Screen
    this.drawRect(0, 0, this.canvas.width, this.canvas.height, '#000');

    // Draw Elements
    this.drawText(
      this.user.score.toString(),
      this.canvas.width / 4,
      this.canvas.height / 5
    );
    this.drawText(
      this.com.score.toString(),
      (3 * this.canvas.width) / 4,
      this.canvas.height / 5
    );
    this.drawRect(
      this.user.x,
      this.user.y,
      this.paddleWidth,
      this.paddleHeight,
      this.user.color
    );
    this.drawRect(
      this.com.x,
      this.com.y,
      this.paddleWidth,
      this.paddleHeight,
      this.com.color
    );
    this.drawCircle(
      this.ball.x,
      this.ball.y,
      this.ball.radius,
      this.ball.color
    );

    // Loop
    this.requestID = requestAnimationFrame(this.gameLoop);
  };
}

customElements.define('pong-page', PongPage);
