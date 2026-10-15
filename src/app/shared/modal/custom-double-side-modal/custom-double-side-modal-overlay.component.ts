import {
  Component,
  inject,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  HostListener,
  input
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CustomDoubleSideModalService } from './custom-double-side-modal.service';
import type { SidePanelEntry } from './custom-double-side-modal.model';

@Component({
  selector: 'app-double-side-panel-outlet',
  standalone: true,
  template: `<ng-container #panelHost></ng-container>`,
  styles: [':host { display: block; width: 100%; }']
})
export class DoubleSidePanelOutletComponent
  implements AfterViewInit, OnDestroy
{
  @ViewChild('panelHost', { read: ViewContainerRef })
  panelHost!: ViewContainerRef;

  readonly entry = input.required<SidePanelEntry>();

  private readonly service = inject(CustomDoubleSideModalService);

  ngAfterViewInit(): void {
    this.service.registerSidePanelHost(this.entry().id, this.panelHost);
    this.service.renderSidePanel(this.entry());
  }

  ngOnDestroy(): void {
    this.service.destroySidePanel(this.entry().id);
  }
}

@Component({
  selector: 'app-custom-double-side-modal-overlay',
  standalone: true,
  imports: [DoubleSidePanelOutletComponent],
  animations: [
    trigger('slideLeftPanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translateX(20px)' })
        )
      ])
    ]),
    trigger('slideRightPanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate(
          '250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translateX(-20px)' })
        )
      ])
    ])
  ],
  template: `
    <div
      role="presentation"
      aria-modal="true"
      [class]="
        service.isOpen()
          ? 'fixed inset-0 z-[10000] flex items-center justify-center bg-[#0000004D] backdrop-blur-sm p-4 box-border transition-opacity duration-200 ease-out'
          : 'fixed inset-0 z-[10000] flex items-center justify-center p-4 box-border pointer-events-none invisible opacity-0'
      "
      [attr.aria-hidden]="!service.isOpen()"
      (click)="onBackdropClick()"
    >
      <!-- Center wrapper: relative anchor for absolute side panels -->
      <div
        role="presentation"
        class="relative"
        (click)="$event.stopPropagation()"
      >
        <!-- Left panels: absolutely positioned to the left of center -->
        @if (service.modalRef()?.hasLeftPanels()) {
          <div
            class="hidden xl:flex absolute right-[calc(100%+16px)] top-0 flex-col gap-4 items-end"
            style="width: max-content;"
          >
            @for (panel of service.modalRef()!.leftPanels(); track panel.id) {
              <div
                @slideLeftPanel
                class="bg-v4-popup-background-color rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
                [style.width]="panel.config.width || '280px'"
              >
                <app-double-side-panel-outlet [entry]="panel" />
              </div>
            }
          </div>
        }

        <!-- Center panel -->
        <div
          class="bg-v4-popup-background-color rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-y-auto min-w-[320px] max-w-[95vw]"
          [style.width]="service.modalRef()?.config?.width || '700px'"
          [style.max-height]="service.modalRef()?.config?.maxHeight || '95vh'"
        >
          <ng-container #centerHost></ng-container>
        </div>

        <!-- Right panels: absolutely positioned to the right of center -->
        @if (service.modalRef()?.hasRightPanels()) {
          <div
            class="hidden xl:flex absolute left-[calc(100%+16px)] top-0 bottom-0 flex-col gap-4 items-start"
            style="width: max-content;"
            [style.max-height]="service.modalRef()?.config?.maxHeight || '95vh'"
          >
            @for (panel of service.modalRef()!.rightPanels(); track panel.id) {
              <div
                @slideRightPanel
                class="bg-card rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
                [class.mt-auto]="panel.config.stickyBottom"
                [style.width]="panel.config.width || '280px'"
              >
                <app-double-side-panel-outlet [entry]="panel" />
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CustomDoubleSideModalOverlayComponent implements AfterViewInit {
  @ViewChild('centerHost', { read: ViewContainerRef })
  centerHostRef!: ViewContainerRef;

  readonly service = inject(CustomDoubleSideModalService);

  ngAfterViewInit(): void {
    this.service.registerHost(this.centerHostRef);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.service.isOpen()) {
      this.service.attemptClose();
    }
  }

  onBackdropClick(): void {
    if (this.service.isOpen()) {
      this.service.attemptClose();
    }
  }
}
