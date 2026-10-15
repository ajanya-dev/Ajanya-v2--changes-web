import { Injectable, NgZone, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckerService {
  private swUpdate = inject(SwUpdate);
  private zone = inject(NgZone);

  isNewVersionAvailable: boolean = false;

  checkForUpdate(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.zone.runOutsideAngular(() => {
      this.swUpdate.checkForUpdate().then((isNewVersionAvailable) => {
        if (isNewVersionAvailable) {
          this.applyUpdate();
        }
      });
    });
  }

  /**
   * Reload the page to update to the latest version after the new version is activated
   */
  async applyUpdate() {
    this.swUpdate
      .activateUpdate()
      .then(() => document.location.reload())
      .catch(() => {});
  }

  /**
   * Clears cache and reload
   */
  async clearCache(): Promise<void> {
    const cacheItems = await caches.keys();
    if (cacheItems.length) {
      cacheItems.forEach(async (item) => {
        await caches.delete(item);
      });
    }
  }
}
