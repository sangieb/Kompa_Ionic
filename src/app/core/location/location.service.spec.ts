import { TestBed } from '@angular/core/testing';
import { Geolocation, type PermissionStatus, type Position } from '@capacitor/geolocation';
import { vi } from 'vitest';

import { PermissionsService } from '../permissions/permissions.service';

import { LocationService } from './location.service';

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

function position(lat: number, lon: number, accuracy: number): Position {
  return {
    timestamp: Date.now(),
    coords: {
      latitude: lat,
      longitude: lon,
      accuracy,
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

function status(
  location: PermissionStatus['location'],
  coarseLocation: PermissionStatus['coarseLocation'],
): PermissionStatus {
  return { location, coarseLocation };
}

describe('LocationService', () => {
  const permissions = {
    locationStatus: vi.fn(),
    estadoUbicacion: vi.fn(),
    requestLocation: vi.fn(),
    solicitarUbicacion: vi.fn(),
  };

  let service: LocationService;

  beforeEach(() => {
    vi.clearAllMocks();
    permissions.locationStatus.mockResolvedValue('granted');
    permissions.estadoUbicacion.mockResolvedValue('granted');
    permissions.requestLocation.mockResolvedValue(true);
    permissions.solicitarUbicacion.mockResolvedValue(true);
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('granted', 'granted'));

    TestBed.configureTestingModule({
      providers: [LocationService, { provide: PermissionsService, useValue: permissions }],
    });
    service = TestBed.inject(LocationService);
  });

  it('returns coordinate when reading is valid', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(position(4.6, -74.08, 25));

    await expect(service.getCurrentPosition()).resolves.toEqual(
      expect.objectContaining({
        state: 'ok',
        coordinate: { lat: 4.6, lon: -74.08 },
      }),
    );
  });

  it('requests high accuracy when precise permission is granted', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(position(4.6, -74.08, 25));

    await service.getCurrentPosition();

    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: true }));
  });

  it('uses coarse alias when only coarse permission is available', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('denied', 'granted'));
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(position(4.6, -74.08, 800));

    await expect(service.getCurrentPosition()).resolves.toEqual(
      expect.objectContaining({
        state: 'ok',
        coordinate: { lat: 4.6, lon: -74.08 },
      }),
    );
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: false }));
  });

  it('discards out of range coordinates', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(position(Number.NaN, -74.08, 25));

    await expect(service.getCurrentPosition()).resolves.toEqual(
      expect.objectContaining({ state: 'no-signal', reason: 'accuracy' }),
    );
  });

  it('discards inaccurate readings', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(position(4.6, -74.08, 5000));

    await expect(service.getCurrentPosition()).resolves.toEqual(
      expect.objectContaining({ state: 'no-signal', reason: 'accuracy' }),
    );
  });

  it('classifies plugin timeout as timeout, not gps issue', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0010' });

    await expect(service.getCurrentPosition()).resolves.toEqual(
      expect.objectContaining({ state: 'no-signal', reason: 'timeout' }),
    );
  });

  it('distinguishes location services disabled', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' });

    await expect(service.getCurrentPosition()).resolves.toEqual(expect.objectContaining({ state: 'services-off' }));
  });

  it('classifies revoked permission during operation', async () => {
    vi.mocked(Geolocation.getCurrentPosition).mockRejectedValue({ code: 'OS-PLUG-GLOC-0003' });

    await expect(service.getCurrentPosition()).resolves.toEqual(expect.objectContaining({ state: 'no-permission' }));
  });

  it('does not attempt position read if services are disabled', async () => {
    permissions.locationStatus.mockResolvedValue('services-off');

    await expect(service.getCurrentPosition()).resolves.toEqual(expect.objectContaining({ state: 'services-off' }));
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted', async () => {
    permissions.locationStatus.mockResolvedValue('prompt');
    permissions.requestLocation.mockResolvedValue(false);

    await expect(service.getCurrentPosition()).resolves.toEqual(expect.objectContaining({ state: 'no-permission' }));
    expect(permissions.requestLocation).toHaveBeenCalled();
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});
