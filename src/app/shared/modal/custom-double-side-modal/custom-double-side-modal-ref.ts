import { signal, computed, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import type {
  DoubleSideModalConfig,
  SidePanelConfig,
  SidePanelEntry
} from './custom-double-side-modal.model';

let panelIdCounter = 0;

export class DoubleSideModalRef<R = unknown> {
  private readonly afterClosedSubject = new Subject<R | undefined>();
  private readonly leftPanelsSignal = signal<SidePanelEntry[]>([]);
  private readonly rightPanelsSignal = signal<SidePanelEntry[]>([]);

  readonly leftPanels = this.leftPanelsSignal.asReadonly();
  readonly rightPanels = this.rightPanelsSignal.asReadonly();
  readonly hasLeftPanels = computed(() => this.leftPanelsSignal().length > 0);
  readonly hasRightPanels = computed(() => this.rightPanelsSignal().length > 0);

  constructor(readonly config: DoubleSideModalConfig) {}

  close(result?: R): void {
    this.afterClosedSubject.next(result);
    this.afterClosedSubject.complete();
  }

  afterClosed(): Observable<R | undefined> {
    return this.afterClosedSubject.asObservable();
  }

  addLeftPanel<C>(component: Type<C>, config?: SidePanelConfig): string {
    panelIdCounter += 1;
    const id = `left-panel-${panelIdCounter}`;
    this.leftPanelsSignal.update((panels) => [
      ...panels,
      { id, component, config: config ?? {} }
    ]);
    return id;
  }

  removeLeftPanel(panelId: string): void {
    this.leftPanelsSignal.update((panels) =>
      panels.filter((p) => p.id !== panelId)
    );
  }

  clearLeftPanels(): void {
    this.leftPanelsSignal.set([]);
  }

  addRightPanel<C>(component: Type<C>, config?: SidePanelConfig): string {
    panelIdCounter += 1;
    const id = `right-panel-${panelIdCounter}`;
    this.rightPanelsSignal.update((panels) => [
      ...panels,
      { id, component, config: config ?? {} }
    ]);
    return id;
  }

  removeRightPanel(panelId: string): void {
    this.rightPanelsSignal.update((panels) =>
      panels.filter((p) => p.id !== panelId)
    );
  }

  clearRightPanels(): void {
    this.rightPanelsSignal.set([]);
  }
}
