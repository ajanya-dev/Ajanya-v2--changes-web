import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class V4SignDocDetailPanelService {
  readonly documentId = signal<string | null>(null);
  readonly isOpen = signal(false);

  open(documentId: string): void {
    this.documentId.set(documentId);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
