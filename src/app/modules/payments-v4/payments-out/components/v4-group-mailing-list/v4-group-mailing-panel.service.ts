import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class V4GroupMailingPanelService {
  isOpen = signal(false);
  groupId = signal<string | null>(null);
  groupName = signal<string>('');

  open(id: string, name: string = ''): void {
    this.groupId.set(id);
    this.groupName.set(name);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.groupId.set(null);
    this.groupName.set('');
  }
}
