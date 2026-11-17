import { TestBed } from '@angular/core/testing';
import { Geolocation, type PermissionStatus, type Position } from '@capacitor/geolocation';
import { vi } from 'vitest';

import { PermisosService } from '../permisos/permisos.service';

import { UbicacionService } from './ubicacion.service';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: { getCurrentPosition: vi.fn(), checkPermissions: vi.fn() },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { checkPermissions: vi.fn(), requestPermissions: vi.fn() },
}));

vi.mock('capacitor-native-settings', () => ({
  AndroidSettings: { ApplicationDetails: 'app', Location: 'location' },
  IOSSettings: { App: 'app', LocationServices: 'location' },
  NativeSettings: { open: vi.fn() },
}));

function posicion(latitud: number, longitud: number, precision: number): Position {
  return {
    timestamp: Date.now(),
    coords: {
      latitude: latitud,
      longitude: longitud,
      accuracy: precision,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      magneticHeading: null,
      trueHeading: null,
      headingAccuracy: null,
      course: null,
    },
  };
}

function estado(
  location: PermissionStatus['location'],
  coarseLocation: PermissionStatus['coarseLocation'],
): PermissionStatus {
  return { location, coarseLocation };
}

describe('UbicacionService', () => {
  const permisos = {
    estadoUbicacion: vi.fn(),
    solicitarUbicacion: vi.fn(),
  };

  let servicio: UbicacionService;

  beforeEach(() => {
    vi.clearAllMocks();
    permisos.estadoUbicacion.mockResolvedValue('granted');
    permisos.solicitarUbicacion.mockResolvedValue(true);
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('granted', 'granted'));

    TestBed.configureTestingModule({
      providers: [UbicacionService, { provide: PermisosService, useValue: permisos }],
    });
    servicio = TestBed.inject(UbicacionService);
  });

  it('devuelve la coordenada cuando la lectura es válida', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(posicion(4.6, -74.08, 25));

    await expect(servicio.obtenerPosicion()).resolves.toEqual({
      estado: 'ok',
      coordenada: { lat: 4.6, lon: -74.08 },
    });
  });

  it('pide alta precisión cuando el permiso preciso está concedido', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(posicion(4.6, -74.08, 25));

    await servicio.obtenerPosicion();

    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: true }));
  });

  it('usa el alias aproximado cuando solo hay permiso coarse', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('denied', 'granted'));
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(posicion(4.6, -74.08, 800));

    await expect(servicio.obtenerPosicion()).resolves.toEqual({
      estado: 'ok',
      coordenada: { lat: 4.6, lon: -74.08 },
    });
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false }));
  });

  it('descarta lecturas fuera de rango', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(posicion(Number.NaN, -74.08, 25));

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'sin-senal', motivo: 'precision' });
  });

  it('descarta lecturas demasiado imprecisas', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(posicion(4.6, -74.08, 5000));

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'sin-senal', motivo: 'precision' });
  });

  it('clasifica el timeout del plugin como falta de tiempo, no de GPS', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0010' });

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'sin-senal', motivo: 'tiempo' });
  });

  it('distingue los servicios de ubicación apagados', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' });

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'servicios-apagados' });
  });

  it('clasifica un permiso revocado a mitad de la operación', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0003' });

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'sin-permiso' });
  });

  it('no intenta leer la posición si los servicios están apagados', async () => {
    permisos.estadoUbicacion.mockResolvedValue('servicios-apagados');

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'servicios-apagados' });
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('pide permiso cuando todavía no está concedido', async () => {
    permisos.estadoUbicacion.mockResolvedValue('prompt');
    permisos.solicitarUbicacion.mockResolvedValue(false);

    await expect(servicio.obtenerPosicion()).resolves.toEqual({ estado: 'sin-permiso' });
    expect(permisos.solicitarUbicacion).toHaveBeenCalled();
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});
