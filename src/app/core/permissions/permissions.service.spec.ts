import { TestBed } from '@angular/core/testing';
import { Geolocation, type PermissionStatus } from '@capacitor/geolocation';
import { vi } from 'vitest';

import { MessageService } from '../message/message.service';

import { PermissionsService } from './permissions.service';

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

function status(
  location: PermissionStatus['location'],
  coarseLocation: PermissionStatus['coarseLocation'],
): PermissionStatus {
  return { location, coarseLocation };
}

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [PermissionsService, { provide: MessageService, useValue: { show: vi.fn(), mostrar: vi.fn() } }],
    });
    service = TestBed.inject(PermissionsService);
  });

  it('accepts coarse location as valid permission', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('denied', 'granted'));

    await expect(service.locationStatus()).resolves.toBe('granted');
    await expect(service.requestLocation()).resolves.toBe(true);
  });

  it('does not re-request prompt if an alias is already granted', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('granted', 'granted'));

    await expect(service.requestLocation()).resolves.toBe(true);
    expect(Geolocation.requestPermissions).not.toHaveBeenCalled();
  });

  it('requests permission when both aliases are prompt', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('prompt', 'prompt'));
    vi.mocked(Geolocation.requestPermissions).mockResolvedValue(status('denied', 'granted'));

    await expect(service.requestLocation()).resolves.toBe(true);
    expect(Geolocation.requestPermissions).toHaveBeenCalled();
  });

  it('returns false upon permanent denial', async () => {
    vi.mocked(Geolocation.checkPermissions).mockResolvedValue(status('denied', 'denied'));

    await expect(service.requestLocation()).resolves.toBe(false);
    await expect(service.locationStatus()).resolves.toBe('denied');
  });

  it('reports services-off instead of unavailable when location services are disabled', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' });

    await expect(service.locationStatus()).resolves.toBe('servicios-apagados');
  });

  it('maintains unavailable for unknown check errors', async () => {
    vi.mocked(Geolocation.checkPermissions).mockRejectedValue(new Error('boom'));

    await expect(service.locationStatus()).resolves.toBe('unavailable');
  });
});
