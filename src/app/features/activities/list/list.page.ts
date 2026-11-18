import { Component, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { SearchbarCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';

import { formatDate, formatDateTime } from '../../../shared/utils/dates';
import { ActivityService } from '../activity.service';
import type { ActivityFilter } from '../activity.service';
import type { Activity } from '../models/activity.model';
import { LOCAL_SOURCE } from '../models/activity.model';

export interface FilterOption<T> {
  label: string;
  value: T;
  etiqueta?: string;
  valor?: T;
}

export interface DurationRange {
  min: number | null;
  max: number | null;
}

@Component({
  selector: 'app-activities-list, app-lista',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonSearchbar, IonChip, IonIcon],
})
export class ListPage {
  readonly sourceOptions: FilterOption<string | null>[] = [
    { label: 'Todas', value: null, etiqueta: 'Todas', valor: null },
    { label: 'Locales', value: LOCAL_SOURCE, etiqueta: 'Locales', valor: LOCAL_SOURCE },
  ];
  readonly opcionesOrigen = this.sourceOptions;

  readonly durationOptions: FilterOption<DurationRange>[] = [
    {
      label: 'Cualquier duración',
      value: { min: null, max: null },
      etiqueta: 'Cualquier duración',
      valor: { min: null, max: null },
    },
    { label: 'Menos de 1 h', value: { min: 0, max: 60 }, etiqueta: 'Menos de 1 h', valor: { min: 0, max: 60 } },
    { label: '1 a 3 h', value: { min: 60, max: 180 }, etiqueta: '1 a 3 h', valor: { min: 60, max: 180 } },
    { label: 'Más de 3 h', value: { min: 180, max: null }, etiqueta: 'Más de 3 h', valor: { min: 180, max: null } },
  ];
  readonly opcionesDuracion = this.durationOptions;

  readonly results = signal<Activity[]>([]);
  readonly resultados = this.results;

  searchText = '';
  texto = '';
  selectedSource = this.sourceOptions[0];
  origenSeleccionado = this.selectedSource;
  selectedDuration = this.durationOptions[0];
  duracionSeleccionada = this.selectedDuration;

  private readonly activityService = inject(ActivityService);

  constructor() {
    addIcons({ imageOutline });
  }

  ionViewWillEnter(): void {
    void this.applyFilters();
  }

  onSearch(event: SearchbarCustomEvent): void {
    this.searchText = (event.detail.value ?? '').trim();
    this.texto = this.searchText;
    void this.applyFilters();
  }

  alBuscar(evento: SearchbarCustomEvent): void {
    this.onSearch(evento);
  }

  selectSource(option: FilterOption<string | null>): void {
    this.selectedSource = option;
    this.origenSeleccionado = option;
    void this.applyFilters();
  }

  elegirOrigen(opcion: FilterOption<string | null>): void {
    this.selectSource(opcion);
  }

  selectDuration(option: FilterOption<DurationRange>): void {
    this.selectedDuration = option;
    this.duracionSeleccionada = option;
    void this.applyFilters();
  }

  elegirDuracion(opcion: FilterOption<DurationRange>): void {
    this.selectDuration(opcion);
  }

  async applyFilters(): Promise<void> {
    const filter: ActivityFilter = {
      text: this.searchText,
      source: this.selectedSource.value,
      minDuration: this.selectedDuration.value.min,
      maxDuration: this.selectedDuration.value.max,
    };
    this.results.set(await this.activityService.search(filter));
  }

  aplicarFiltros(): Promise<void> {
    return this.applyFilters();
  }

  location(a: Activity): string {
    const loc = a.location ?? a.ubicacion ?? '';
    return loc.trim() || '—';
  }

  ubicacion(a: Activity): string {
    return this.location(a);
  }

  duration(a: Activity): string {
    if (a.durationMin == null) return '—';
    const hours = Math.floor(a.durationMin / 60);
    const rest = a.durationMin % 60;
    if (hours === 0) return `${a.durationMin} min`;
    if (rest === 0) return `${hours} h`;
    return `${hours} h ${rest} min`;
  }

  duracion(a: Activity): string {
    return this.duration(a);
  }

  date(a: Activity): string {
    const actDate = a.activityDate ?? a.fechaActividad;
    const crDate = a.createdAt ?? a.fechaCreacion;
    if (actDate != null) return formatDateTime(actDate);
    if (crDate != null) return formatDate(crDate);
    return '—';
  }

  fecha(a: Activity): string {
    return this.date(a);
  }
}
