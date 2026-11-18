import type { AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';

const FLIGHT_DURATION_MS = 4000;
const PAUSE_DURATION_MS = 300;
const BG_COLOR = '#F2F2F2';
const BODY_COLOR = '#7B2CBF';
const WINGS_COLOR = '#9D4EDD';
const TRAIL_COLOR = '#9D4EDD';
const MIN_ALPHA = 140 / 255;
const START_ANGLE = -Math.PI / 2;

interface AirplaneShape {
  body: Path2D;
  wings: Path2D;
  tail: Path2D;
}

/** Airplane rotation animation. */
@Component({
  selector: 'app-plane-animation',
  template: '<canvas #canvas></canvas>',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class PlaneAnimationComponent implements AfterViewInit, OnDestroy {
  @Output() flightCompleted = new EventEmitter<void>();
  @Output() vueloCompletado = this.flightCompleted;

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private plane!: AirplaneShape;
  private width = 0;
  private height = 0;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;
  private frame = 0;

  ngAfterViewInit(): void {
    this.frame = requestAnimationFrame(() => {
      this.setup();
      this.startFlight();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }

  private setup(): void {
    const canvas = this.canvasRef.nativeElement;
    const density = window.devicePixelRatio || 1;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    canvas.width = this.width * density;
    canvas.height = this.height * density;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.ctx.setTransform(density, 0, 0, density, 0, 0);

    const minDimension = Math.min(this.width, this.height);
    this.plane = buildAirplane(minDimension * 0.25);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = minDimension * 0.3;
  }

  private startFlight(): void {
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min((now - start) / FLIGHT_DURATION_MS, 1);
      const angle = START_ANGLE + 2 * Math.PI * accelerateDecelerate(t);
      this.draw(angle, 1);
      if (t < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.startPause();
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  private startPause(): void {
    const start = performance.now();
    const finalAngle = START_ANGLE + 2 * Math.PI;
    const step = (now: number): void => {
      const t = Math.min((now - start) / PAUSE_DURATION_MS, 1);
      const alpha = t < 0.5 ? 1 - (1 - MIN_ALPHA) * (t / 0.5) : MIN_ALPHA + (1 - MIN_ALPHA) * ((t - 0.5) / 0.5);
      this.draw(finalAngle, alpha);
      if (t < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.draw(finalAngle, 1);
        this.flightCompleted.emit();
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  private draw(angle: number, alpha: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.globalAlpha = 1;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, START_ANGLE, angle);
    ctx.strokeStyle = TRAIL_COLOR;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const x = this.centerX + this.radius * Math.cos(angle);
    const y = this.centerY + this.radius * Math.sin(angle);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = WINGS_COLOR;
    ctx.fill(this.plane.wings);
    ctx.fillStyle = BODY_COLOR;
    ctx.fill(this.plane.tail);
    ctx.fill(this.plane.body);
    ctx.restore();
  }
}

function accelerateDecelerate(t: number): number {
  return Math.cos((t + 1) * Math.PI) / 2 + 0.5;
}

function buildAirplane(s: number): AirplaneShape {
  const half = s * 0.08;
  const noseY = -s * 0.5;
  const tailY = s * 0.35;
  const body = new Path2D();
  body.moveTo(0, noseY);
  body.quadraticCurveTo(half * 1.3, noseY * 0.5, half, tailY * 0.3);
  body.lineTo(half * 0.6, tailY);
  body.lineTo(-half * 0.6, tailY);
  body.lineTo(-half, tailY * 0.3);
  body.quadraticCurveTo(-half * 1.3, noseY * 0.5, 0, noseY);
  body.closePath();

  const wingspan = s * 0.45;
  const wingY = s * 0.02;
  const tipY = s * 0.22;
  const wings = new Path2D();
  wings.moveTo(s * 0.06, wingY);
  wings.lineTo(wingspan, tipY);
  wings.quadraticCurveTo(wingspan * 0.85, tipY + s * 0.05, s * 0.08, wingY + s * 0.12);
  wings.closePath();
  wings.moveTo(-s * 0.06, wingY);
  wings.lineTo(-wingspan, tipY);
  wings.quadraticCurveTo(-wingspan * 0.85, tipY + s * 0.05, -s * 0.08, wingY + s * 0.12);
  wings.closePath();

  const tailSpan = s * 0.2;
  const tailStartY = s * 0.25;
  const tailTipY = s * 0.4;
  const tail = new Path2D();
  tail.moveTo(s * 0.05, tailStartY);
  tail.lineTo(tailSpan, tailTipY);
  tail.lineTo(s * 0.06, tailStartY + s * 0.08);
  tail.closePath();
  tail.moveTo(-s * 0.05, tailStartY);
  tail.lineTo(-tailSpan, tailTipY);
  tail.lineTo(-s * 0.06, tailStartY + s * 0.08);
  tail.closePath();

  return { body, wings, tail };
}
