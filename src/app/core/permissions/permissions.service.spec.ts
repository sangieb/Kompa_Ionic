import { TestBed } from '@angular/core/testing';
import { Geolocation, type PermissionStatus } from '@capacitor/geolocation';
import { vi } from 'vitest';

import { MensajeService } from '../mensaje/mensaje.service';

import { PermisosService } from './permisos.service';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: { checkPermissions: vi.fn(), requestPermissions: vi.fn() },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { checkPermissions: vi.fn(), requestPermissions: vi.fn() },
}));

vi.mock('capacitor-native-settings', () => ({
  AndroidSettings: { ApplicationDetails: 'app', Location: 'location' },
  IOSSettings: { App: 'app', LocationServices: 'location' },
  NativeSettings: { open: vi.fn() },
}));

function estado(
  location: PermissionStatus['location'],
  coarseLocation: PermissionStatus['coarseLocation'],
): PermissionStatus {
  return { location, coarseLocation };
}

describe('PermisosService', () => {
  let servicio: PermisosService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [PermisosService, { provide: MensajeService, useValue: { mostrar: vi.fn() } }],
    });
    servicio = TestBed.inject(PermisosService);
  });

  it('acepta la ubicación aproximada como permiso válido', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('denied', 'granted'));

    await expect(servicio.estadoUbicacion()).resolves.toBe('granted');
    await expect(servicio.solicitarUbicacion()).resolves.toBe(true);
  });

  it('no vuelve a pedir el diálogo si ya hay un alias concedido', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('granted', 'granted'));

    await expect(servicio.solicitarUbicacion()).resolves.toBe(true);
    expect(Geolocation.requestPermissions).not.toHaveBeenCalled();
  });

  it('pide el permiso cuando ambos alias están en prompt', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('prompt', 'prompt'));
    vi.mocked(Geolocation.requestPermissions).mockResolvedValue(estado('denied', 'granted'));

    await expect(servicio.solicitarUbicacion()).resolves.toBe(true);
    expect(Geolocation.requestPermissions).toHaveBeenCalled();
  });

  it('devuelve false ante una denegación permanente', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(estado('denied', 'denied'));

    await expect(servicio.solicitarUbicacion()).resolves.toBe(false);
    await expect(servicio.estadoUbicacion()).resolves.toBe('denied');
  });

  it('informa los servicios de ubicación apagados en vez de "no disponible"', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' });

    await expect(servicio.estadoUbicacion()).resolves.toBe('servicios-apagados');
  });

  it('mantiene "no disponible" para un fallo de consulta desconocido', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue(new Error('boom'));

    await expect(servicio.estadoUbicacion()).resolves.toBe('unavailable');
  });
});
