import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FieldFocusRegistry {
  private readonly anchors = new Map<string, HTMLElement>();

  register(key: string, el: HTMLElement): () => void {
    this.anchors.set(key, el);
    return () => {
      if (this.anchors.get(key) === el) this.anchors.delete(key);
    };
  }

  resolve(key: string): HTMLElement | undefined {
    return this.anchors.get(key);
  }
}
