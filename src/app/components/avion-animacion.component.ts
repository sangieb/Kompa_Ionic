import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild,
} from '@angular/core';

// Mismos valores que AirplaneAnimationView.kt
const DURACION_VUELO_MS = 4000;
const DURACION_PAUSA_MS = 300;
const COLOR_FONDO = '#F2F2F2';
const COLOR_CUERPO = '#7B2CBF';
const COLOR_ALAS = '#9D4EDD';
const COLOR_ESTELA = '#9D4EDD';
const ALFA_MINIMO = 140 / 255;
const ANGULO_INICIO = -Math.PI / 2; // arriba del círculo

interface FormaAvion {
  cuerpo: Path2D;
  alas: Path2D;
  cola: Path2D;
}

/** Equivale a ui/widget/animacion/AirplaneAnimationView.kt */
@Component({
  selector: 'app-avion-animacion',
  template: '<canvas #lienzo></canvas>',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    canvas { display: block; width: 100%; height: 100%; }
  `],
})
export class AvionAnimacionComponent implements AfterViewInit, OnDestroy {
  @Output() vueloCompletado = new EventEmitter<void>();
  @ViewChild('lienzo', { static: true }) lienzo!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private avion!: FormaAvion;
  private ancho = 0;
  private alto = 0;
  private centroX = 0;
  private centroY = 0;
  private radio = 0;
  private frame = 0;

  ngAfterViewInit() {
    // Se espera un cuadro para que el canvas ya tenga tamaño (como onSizeChanged)
    this.frame = requestAnimationFrame(() => {
      this.preparar();
      this.iniciarVuelo();
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame); // como onDetachedFromWindow()
  }

  private preparar() {
    const canvas = this.lienzo.nativeElement;
    const densidad = window.devicePixelRatio || 1;
    this.ancho = canvas.clientWidth;
    this.alto = canvas.clientHeight;
    canvas.width = this.ancho * densidad;
    canvas.height = this.alto * densidad;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(densidad, 0, 0, densidad, 0, 0);

    const menor = Math.min(this.ancho, this.alto);
    this.avion = construirAvion(menor * 0.25);
    this.centroX = this.ancho / 2;
    this.centroY = this.alto / 2;
    this.radio = menor * 0.3;
  }

  /** Una vuelta completa en 4 s, acelerando y frenando */
  private iniciarVuelo() {
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / DURACION_VUELO_MS, 1);
      const angulo = ANGULO_INICIO + 2 * Math.PI * aceleraDesacelera(t);
      this.dibujar(angulo, 1);
      if (t < 1) {
        this.frame = requestAnimationFrame(paso);
      } else {
        this.iniciarPausa();
      }
    };
    this.frame = requestAnimationFrame(paso);
  }

  /** El avión parpadea (alfa 1 → 0.55 → 1) y luego avisa que terminó */
  private iniciarPausa() {
    const inicio = performance.now();
    const anguloFinal = ANGULO_INICIO + 2 * Math.PI;
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / DURACION_PAUSA_MS, 1);
      const alfa = t < 0.5
        ? 1 - (1 - ALFA_MINIMO) * (t / 0.5)
        : ALFA_MINIMO + (1 - ALFA_MINIMO) * ((t - 0.5) / 0.5);
      this.dibujar(anguloFinal, alfa);
      if (t < 1) {
        this.frame = requestAnimationFrame(paso);
      } else {
        this.dibujar(anguloFinal, 1);
        this.vueloCompletado.emit();
      }
    };
    this.frame = requestAnimationFrame(paso);
  }

  /** Equivale a onDraw(canvas) */
  private dibujar(angulo: number, alfa: number) {
    const ctx = this.ctx;

    ctx.globalAlpha = 1;
    ctx.fillStyle = COLOR_FONDO;
    ctx.fillRect(0, 0, this.ancho, this.alto);

    // Estela: el arco recorrido hasta ahora
    ctx.beginPath();
    ctx.arc(this.centroX, this.centroY, this.radio, ANGULO_INICIO, angulo);
    ctx.strokeStyle = COLOR_ESTELA;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Avión en su posición, girado según la tangente (tangente + 90° = ángulo + 180°)
    const x = this.centroX + this.radio * Math.cos(angulo);
    const y = this.centroY + this.radio * Math.sin(angulo);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angulo + Math.PI);
    ctx.globalAlpha = alfa;
    ctx.fillStyle = COLOR_ALAS;
    ctx.fill(this.avion.alas);
    ctx.fillStyle = COLOR_CUERPO;
    ctx.fill(this.avion.cola);
    ctx.fill(this.avion.cuerpo);
    ctx.restore();
  }
}

/** Igual que AccelerateDecelerateInterpolator */
function aceleraDesacelera(t: number): number {
  return Math.cos((t + 1) * Math.PI) / 2 + 0.5;
}

/** Equivale a Airplane.kt: buildBody(), buildWings() y buildTail() */
function construirAvion(s: number): FormaAvion {
  // Cuerpo
  const mitad = s * 0.08;
  const narizY = -s * 0.5;
  const colaY = s * 0.35;
  const cuerpo = new Path2D();
  cuerpo.moveTo(0, narizY);
  cuerpo.quadraticCurveTo(mitad * 1.3, narizY * 0.5, mitad, colaY * 0.3);
  cuerpo.lineTo(mitad * 0.6, colaY);
  cuerpo.lineTo(-mitad * 0.6, colaY);
  cuerpo.lineTo(-mitad, colaY * 0.3);
  cuerpo.quadraticCurveTo(-mitad * 1.3, narizY * 0.5, 0, narizY);
  cuerpo.closePath();

  // Alas
  const envergadura = s * 0.45;
  const alaY = s * 0.02;
  const puntaY = s * 0.22;
  const alas = new Path2D();
  alas.moveTo(s * 0.06, alaY);
  alas.lineTo(envergadura, puntaY);
  alas.quadraticCurveTo(envergadura * 0.85, puntaY + s * 0.05, s * 0.08, alaY + s * 0.12);
  alas.closePath();
  alas.moveTo(-s * 0.06, alaY);
  alas.lineTo(-envergadura, puntaY);
  alas.quadraticCurveTo(-envergadura * 0.85, puntaY + s * 0.05, -s * 0.08, alaY + s * 0.12);
  alas.closePath();

  // Cola
  const colaEnv = s * 0.2;
  const colaInicioY = s * 0.25;
  const colaPuntaY = s * 0.4;
  const cola = new Path2D();
  cola.moveTo(s * 0.05, colaInicioY);
  cola.lineTo(colaEnv, colaPuntaY);
  cola.lineTo(s * 0.06, colaInicioY + s * 0.08);
  cola.closePath();
  cola.moveTo(-s * 0.05, colaInicioY);
  cola.lineTo(-colaEnv, colaPuntaY);
  cola.lineTo(-s * 0.06, colaInicioY + s * 0.08);
  cola.closePath();

  return { cuerpo, alas, cola };
}