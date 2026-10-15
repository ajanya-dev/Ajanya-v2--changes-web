import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class V4UserStateService {
  selectedTab = signal<string>('personal');
  selectedSettingsTab = signal<string>('general');
  userName = signal<string>('');
  isManualEntry = signal<boolean>(false);
  isLoading = signal<boolean>(false);
}
