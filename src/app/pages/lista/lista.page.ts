import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
  IonSearchbar, IonChip, IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { ActividadService, FiltroActividades } from '../../services/actividad.service';
import { Actividad, ORIGEN_API, ORIGEN_LOCAL } from '../../models/actividad.model';
import { formatearFecha, formatearFechaHora } from '../../core/fechas';

interface OpcionFiltro<T> {
  etiqueta: string;
  valor: T;
}

interface RangoDuracion {
  min: number | null;
  max: number | null;
}

/** Equivale a ui/lista/ListaActividadesActivity.kt + ViewModel + ActividadAdapter */
@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonSearchbar, IonChip, IonIcon,
  ],
})
export class ListaPage {
  readonly opcionesOrigen: OpcionFiltro<string | null>[] = [
    { etiqueta: 'Todas', valor: null },
    { etiqueta: 'Locales', valor: ORIGEN_LOCAL },
    { etiqueta: 'API', valor: ORIGEN_API },
  ];

  readonly opcionesDuracion: OpcionFiltro<RangoDuracion>[] = [
    { etiqueta: 'Cualquier duración', valor: { min: null, max: null } },
    { etiqueta: 'Menos de 1 h', valor: { min: 0, max: 60 } },
    { etiqueta: '1 a 3 h', valor: { min: 60, max: 180 } },
    { etiqueta: 'Más de 3 h', valor: { min: 180, max: null } },
  ];

  texto = '';
  origenSeleccionado = this.opcionesOrigen[0];
  duracionSeleccionada = this.opcionesDuracion[0];
  resultados: Actividad[] = [];

  constructor(private actividades: ActividadService) {
    addIcons({ imageOutline });
  }

  /** Cada vez que se entra a la pantalla se vuelve a consultar */
  ionViewWillEnter() {
    this.aplicarFiltros();
  }

  alBuscar(valor: string | null | undefined) {
    this.texto = (valor ?? '').trim();
    this.aplicarFiltros();
  }

  elegirOrigen(opcion: OpcionFiltro<string | null>) {
    this.origenSeleccionado = opcion;
    this.aplicarFiltros();
  }

  elegirDuracion(opcion: OpcionFiltro<RangoDuracion>) {
    this.duracionSeleccionada = opcion;
    this.aplicarFiltros();
  }

  /** Siempre filtra sobre la lista completa guardada, nunca sobre la ya filtrada */
  async aplicarFiltros() {
    const filtro: FiltroActividades = {
      texto: this.texto,
      origen: this.origenSeleccionado.valor,
      duracionMinima: this.duracionSeleccionada.valor.min,
      duracionMaxima: this.duracionSeleccionada.valor.max,
    };
    this.resultados = await this.actividades.buscar(filtro);
  }

  // ---- Igual que ActividadViewHolder.vincular() ----

  ubicacion(a: Actividad): string {
    return a.ubicacion.trim() || '—';
  }

  duracion(a: Actividad): string {
    if (a.duracionMin == null) return '—';
    const horas = Math.floor(a.duracionMin / 60);
    const resto = a.duracionMin % 60;
    if (horas === 0) return `${a.duracionMin} min`;
    if (resto === 0) return `${horas} h`;
    return `${horas} h ${resto} min`;
  }

  fecha(a: Actividad): string {
    if (a.fechaActividad != null) return formatearFechaHora(a.fechaActividad);
    if (a.fechaCreacion != null) return formatearFecha(a.fechaCreacion);
    return '—';
  }
}