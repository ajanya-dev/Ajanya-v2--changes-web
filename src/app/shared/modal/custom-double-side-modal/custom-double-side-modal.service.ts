import {
  Injectable,
  Injector,
  Type,
  ViewContainerRef,
  ComponentRef,
  inject,
  signal
} from '@angular/core';
import type {
  DoubleSideModalConfig,
  SidePanelEntry
} from './custom-double-side-modal.model';
import { DoubleSideModalRef } from './custom-double-side-modal-ref';
import {
  DOUBLE_SIDE_MODAL_DATA,
  DOUBLE_SIDE_MODAL_REF,
  DOUBLE_SIDE_PANEL_DATA
} from './custom-double-side-modal.tokens';

/**
 * CustomDoubleSideModalService
 *
 * A reusable, MatDialog-style service for opening modals with optional left/right
 * side panels. The center panel stays perfectly centered regardless of which side
 * panels are open (side panels are absolutely positioned).
 *
 * ------------------------------------------------------------------
 * SETUP (already done)
 * ------------------------------------------------------------------
 * The overlay component `<app-custom-double-side-modal-overlay />` must be placed
 * once in `app.component.html`. It registers its ViewContainerRef on init so the
 * service can render components into it.
 *
 * ------------------------------------------------------------------
 * OPENING A MODAL (from any component / service)
 * ------------------------------------------------------------------
 *
 *   import { CustomDoubleSideModalService } from
 *     'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
 *
 *   private modalService = inject(CustomDoubleSideModalService);
 *
 *   openEditor(): void {
 *     const ref = this.modalService.open(MyEditorComponent, {
 *       width: '700px',           // center panel width (default '700px')
 *       maxHeight: '90vh',        // center panel max-height (default '95vh')
 *       data: { invoiceId: 42 },  // passed via DOUBLE_SIDE_MODAL_DATA token
 *       disableClose: true,       // block ESC / backdrop click
 *       panelClass: 'my-custom',  // extra CSS class (reserved for future use)
 *     });
 *
 *     ref.afterClosed().subscribe(result => {
 *       if (result?.saved) { ... }
 *     });
 *   }
 *
 * ------------------------------------------------------------------
 * CENTER COMPONENT — receiving data & controlling the modal
 * ------------------------------------------------------------------
 *
 *   import { DOUBLE_SIDE_MODAL_DATA, DOUBLE_SIDE_MODAL_REF }
 *     from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
 *   import { DoubleSideModalRef }
 *     from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
 *
 *   @Component({ ... })
 *   export class MyEditorComponent {
 *     private data     = inject(DOUBLE_SIDE_MODAL_DATA);           // { invoiceId: 42 }
 *     private modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);
 *
 *     // --- Add side panels dynamically ---
 *     private previewPanelId: string | null = null;
 *
 *     showPreview(): void {
 *       this.previewPanelId = this.modalRef.addRightPanel(PreviewPanelComponent, {
 *         width: '320px',
 *         data: { invoiceId: this.data.invoiceId },
 *       });
 *     }
 *
 *     hidePreview(): void {
 *       if (this.previewPanelId) {
 *         this.modalRef.removeRightPanel(this.previewPanelId);
 *         this.previewPanelId = null;
 *       }
 *     }
 *
 *     showHelp(): void {
 *       this.modalRef.addLeftPanel(HelpPanelComponent, { width: '260px' });
 *     }
 *
 *     // --- Close with result ---
 *     save(): void {
 *       this.modalRef.close({ saved: true });
 *     }
 *
 *     cancel(): void {
 *       this.modalRef.close(undefined);
 *     }
 *   }
 *
 * ------------------------------------------------------------------
 * SIDE PANEL COMPONENT — receiving panel-specific data
 * ------------------------------------------------------------------
 *
 *   import { DOUBLE_SIDE_PANEL_DATA, DOUBLE_SIDE_MODAL_REF }
 *     from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
 *   import { DoubleSideModalRef }
 *     from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
 *
 *   @Component({ ... })
 *   export class PreviewPanelComponent {
 *     private panelData = inject(DOUBLE_SIDE_PANEL_DATA);           // { invoiceId: 42 }
 *     private modalRef  = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF);
 *   }
 *
 * ------------------------------------------------------------------
 * DoubleSideModalRef API
 * ------------------------------------------------------------------
 *
 *   close(result?)                          — close the modal and emit result
 *   afterClosed(): Observable<R | undefined> — emits once when closed, then completes
 *
 *   addLeftPanel(component, config?): string   — add a left panel, returns panel ID
 *   removeLeftPanel(panelId): void             — remove a specific left panel
 *   clearLeftPanels(): void                    — remove all left panels
 *
 *   addRightPanel(component, config?): string  — add a right panel, returns panel ID
 *   removeRightPanel(panelId): void            — remove a specific right panel
 *   clearRightPanels(): void                   — remove all right panels
 *
 *   leftPanels: Signal<SidePanelEntry[]>       — current left panels (read-only)
 *   rightPanels: Signal<SidePanelEntry[]>      — current right panels (read-only)
 *   hasLeftPanels: Signal<boolean>             — true if any left panels exist
 *   hasRightPanels: Signal<boolean>            — true if any right panels exist
 *
 * ------------------------------------------------------------------
 * NOTES
 * ------------------------------------------------------------------
 * - Only one modal can be open at a time. Opening a new one destroys the current.
 * - Side panels are hidden below the `lg` breakpoint (< 1024px).
 * - Side panels stack vertically with a 16px gap when multiple are added to one side.
 * - Body scroll is locked while the modal is open.
 * - ESC key and backdrop click close the modal unless `disableClose: true`.
 */
@Injectable({ providedIn: 'root' })
export class CustomDoubleSideModalService {
  private readonly injector = inject(Injector);

  readonly isOpen = signal(false);
  readonly modalRef = signal<DoubleSideModalRef | null>(null);

  private hostViewRef: ViewContainerRef | null = null;
  private centerComponentRef: ComponentRef<unknown> | null = null;
  private sidePanelComponentRefs = new Map<string, ComponentRef<unknown>>();
  private sidePanelHostRefs = new Map<string, ViewContainerRef>();

  private pendingOpen: {
    component: Type<unknown>;
    config: DoubleSideModalConfig;
  } | null = null;

  /** Called by the overlay component on init. Registers the ViewContainerRef that hosts center components. */
  registerHost(ref: ViewContainerRef): void {
    this.hostViewRef = ref;
    if (this.pendingOpen) {
      this.renderCenter(this.pendingOpen.component, this.pendingOpen.config);
      this.pendingOpen = null;
    }
  }

  /** Unregisters the host. Called when the overlay is destroyed. */
  unregisterHost(): void {
    this.hostViewRef = null;
  }

  /**
   * Opens a modal with the given component as the center content.
   * @returns DoubleSideModalRef — use it to add side panels, close, or subscribe to afterClosed().
   */
  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config?: DoubleSideModalConfig<D>
  ): DoubleSideModalRef<R> {
    if (this.modalRef()) {
      this.destroyCurrentModal();
    }

    const modalConfig: DoubleSideModalConfig = config ?? {};
    const ref = new DoubleSideModalRef<R>(modalConfig);
    this.modalRef.set(ref as DoubleSideModalRef);

    ref.afterClosed().subscribe(() => {
      this.destroyCurrentModal();
    });

    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';

    if (this.hostViewRef) {
      this.renderCenter(component, modalConfig);
    } else {
      this.pendingOpen = { component, config: modalConfig };
    }

    return ref;
  }

  /** Closes the modal unless `disableClose` is true. Called by backdrop click / ESC. */
  attemptClose(): void {
    const ref = this.modalRef();
    if (!ref) return;
    if (ref.config.disableClose) return;
    ref.close(undefined);
  }

  /** @internal Called by DoubleSidePanelOutletComponent to register its ViewContainerRef. */
  registerSidePanelHost(panelId: string, vcr: ViewContainerRef): void {
    this.sidePanelHostRefs.set(panelId, vcr);
  }

  /** @internal Creates the side panel component inside its registered ViewContainerRef. */
  renderSidePanel(entry: SidePanelEntry): void {
    const vcr = this.sidePanelHostRefs.get(entry.id);
    const ref = this.modalRef();
    if (!vcr || !ref) return;

    if (this.sidePanelComponentRefs.has(entry.id)) return;

    const injector = Injector.create({
      providers: [
        {
          provide: DOUBLE_SIDE_PANEL_DATA,
          useValue: entry.config.data ?? null
        },
        { provide: DOUBLE_SIDE_MODAL_REF, useValue: ref }
      ],
      parent: this.injector
    });

    vcr.clear();
    const compRef = vcr.createComponent(entry.component, { injector });
    this.sidePanelComponentRefs.set(entry.id, compRef);
  }

  /** @internal Destroys a side panel component and cleans up its references. */
  destroySidePanel(panelId: string): void {
    const compRef = this.sidePanelComponentRefs.get(panelId);
    if (compRef) {
      compRef.destroy();
      this.sidePanelComponentRefs.delete(panelId);
    }
    this.sidePanelHostRefs.delete(panelId);
  }

  private renderCenter(
    component: Type<unknown>,
    config: DoubleSideModalConfig
  ): void {
    if (!this.hostViewRef) {
      this.isOpen.set(false);
      return;
    }

    this.hostViewRef.clear();

    const injector = Injector.create({
      providers: [
        { provide: DOUBLE_SIDE_MODAL_DATA, useValue: config.data ?? null },
        { provide: DOUBLE_SIDE_MODAL_REF, useValue: this.modalRef() }
      ],
      parent: this.injector
    });

    this.centerComponentRef = this.hostViewRef.createComponent(component, {
      injector
    });
  }

  /** Closes the currently open modal (if any). Can be called externally (e.g. on logout). */
  closeAll(): void {
    const ref = this.modalRef();
    if (ref) {
      ref.close();
    }
  }

  private destroyCurrentModal(): void {
    try {
      if (this.centerComponentRef) {
        this.centerComponentRef.destroy();
        this.centerComponentRef = null;
      }
      this.sidePanelComponentRefs.forEach((ref) => ref.destroy());
    } finally {
      this.sidePanelComponentRefs.clear();
      this.sidePanelHostRefs.clear();
      this.modalRef.set(null);
      this.isOpen.set(false);
      document.body.style.overflow = '';
    }
  }
}
