import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../storage/storage-keys';
import { StorageService } from '../storage/storage.service';

/**
 * Erases all local data stored by the app on the device.
 */
@Injectable({ providedIn: 'root' })
export class UserDataService {
  private readonly storage = inject(StorageService);

  async deleteAll(): Promise<void> {
    const keys = [
      StorageKeys.profile,
      StorageKeys.accounts,
      StorageKeys.session,
      StorageKeys.activities,
      StorageKeys.posts,
      StorageKeys.consent,
      StorageKeys.locationRequested,
    ];
    await Promise.all(keys.map((key) => this.storage.remove(key)));
  }

  async eliminarTodo(): Promise<void> {
    return this.deleteAll();
  }
}
