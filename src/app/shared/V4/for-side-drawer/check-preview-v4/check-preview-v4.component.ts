import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  ViewChild
} from '@angular/core';
import type { IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { fabric } from 'fabric';
import { LucideAngularModule } from 'lucide-angular';

const VOID_STATUS_CODES = [2, 507, 807];

@Component({
  standalone: true,
  selector: 'app-check-preview-v4',
  templateUrl: './check-preview-v4.component.html',
  styleUrls: ['./check-preview-v4.component.scss'],
  imports: [LucideAngularModule]
})
export class CheckPreviewV4Component implements AfterViewInit, OnDestroy {
  checkData = input<IReceiveCheckDetails | null>(null);
  checkStatus = input<number | null>(null);
  loading = input<boolean>(false);
  error = input<string | null>(null);
  /** Embedded flush in a host card: drop our own frame and collapse header. */
  bare = input(false);
  closed = output<void>();

  /**
   * Fabric.js JSON template string (from ICheckDetailsData.template).
   * When provided, the component renders the check using Fabric.js canvas
   * instead of the static SVG template.
   */
  templateJson = input<string | null>(null);

  /**
   * Whether to draw the sample cheque while no design has arrived.
   *
   * On by default: the panels that never fetch a design have nothing else to
   * show. A caller that does fetch one turns it off — the sample is a different
   * size from the rendered design, so it lands and everything below it jumps.
   * With it off the box is held at the design's own proportions and only its
   * contents change.
   */
  showSampleCheck = input(true);

  @ViewChild('fabricCanvas') fabricCanvasRef!: ElementRef<HTMLCanvasElement>;

  private fabricCanvas: fabric.Canvas | null = null;
  private resizeObserver: ResizeObserver | null = null;
  // private lastWrapperWidth = 0;

  // Body is hidden with a class (not @if) so the fabric canvas stays mounted —
  // re-adding it would need a re-render pass.
  collapsed = signal(false);

  /**
   * True from the moment a fabric render starts until the canvas is filled and
   * scaled. Without it the 675px canvas paints unscaled inside a ~440px wrapper
   * for the length of loadFromJSON + the 200ms settle, so the check flashed
   * cropped and zoomed before snapping into place.
   */
  rendering = signal(false);

  isVoided = computed(() => {
    const s = this.checkStatus();
    return s != null && VOID_STATUS_CODES.includes(s);
  });

  useFabric = computed(() => !!this.templateJson());

  /**
   * Fabric paints the design at its authored 675×295 the moment it loads, and it
   * is only scaled to the box a tick later — so the full-size, overflowing
   * version was on screen first and the design appeared to break and redraw.
   * The canvas is held invisible (not hidden: the box keeps its size) until it
   * has been scaled and finished, and the spinner stays up for exactly that
   * span: the caller's `loading` ends when the design arrives, which is the
   * beginning of the work, not the end of it.
   */
  readonly canvasReady = signal(false);

  /**
   * The scale is measured off the wrapper, and a modal measures narrow while it
   * is still opening — the design was drawn to a box that was about to grow,
   * then jumped when something re-rendered it at the real width. Re-scaling on
   * every resize absorbs that: it happens while the canvas is still invisible.
   */
  // private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const json = this.templateJson();
      const status = this.checkStatus();
      if (!json) return;
      setTimeout(() => {
        if (this.fabricCanvasRef?.nativeElement) {
          this.renderFabricCanvas(json, status);
        }
      }, 0);
    });
  }

  ngAfterViewInit(): void {
    const json = this.templateJson();
    if (json && this.fabricCanvasRef?.nativeElement) {
      this.renderFabricCanvas(json, this.checkStatus());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroyFabricCanvas();
  }

  private watchWrapperWidth(wrapper: HTMLElement): void {
    if (this.resizeObserver) {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.scaleCanvasToFit()) {
        this.canvasReady.set(true);
      }
    });
    this.resizeObserver.observe(wrapper);
  }

  private renderFabricCanvas(jsonStr: string, status: number | null): void {
    this.destroyFabricCanvas();
    this.canvasReady.set(false);

    const canvasEl = this.fabricCanvasRef?.nativeElement;
    if (!canvasEl) return;

    this.rendering.set(true);
    this.fabricCanvas = new fabric.Canvas(canvasEl, {
      selection: false,
      interactive: false
    });
    // Fit before anything paints — fabric has created .canvas-container by now,
    // so the transform is in place for the very first frame.
    this.scaleCanvasToFit();

    try {
      const json = JSON.parse(jsonStr);
      this.removeNullText(json);

      this.fabricCanvas.loadFromJSON(json, () => {
        setTimeout(() => {
          if (!this.fabricCanvas) return;
          this.routingBoxFix();
          this.preventCanvasEdit();
          this.fabricCanvas.renderAll();
          const scaled = this.scaleCanvasToFit();
          if (status != null && VOID_STATUS_CODES.includes(status)) {
            this.drawVoidOverlay();
          }
          // Not scaled means not laid out yet; the resize observer finishes it.
          this.canvasReady.set(scaled);
        }, 200);
      });
    } catch {
      // Invalid JSON — leave the canvas blank, but stop waiting on it. A spinner
      // that never ends is worse than an empty box.
      this.canvasReady.set(true);
    }
  }

  private removeNullText(data: { objects?: { text?: string | null }[] }): void {
    if (data?.objects?.length) {
      data.objects.forEach((obj) => {
        if (obj && obj.text == null) {
          Object.assign(obj, { text: '' });
        }
      });
    }
  }

  private routingBoxFix(): void {
    this.fabricCanvas
      ?.getObjects()
      .forEach((ele: fabric.Object & { id?: string }) => {
        if (ele.id === "dynamic['bank_account_routing_no']") {
          ele.set({ width: 500 });
        }
      });
  }

  private preventCanvasEdit(): void {
    this.fabricCanvas?.forEachObject((object) => {
      object.set({ selectable: false, evented: false });
    });
  }

  private drawVoidOverlay(): void {
    if (!this.fabricCanvas) return;
    const context = this.fabricCanvas.getContext();
    // Keep a sans-serif fallback so the watermark never drops to the browser's
    // default serif when Roboto isn't loaded yet (e.g. on first panel open).
    context.font = 'bold 49px Roboto, Arial, sans-serif';
    context.fillStyle = '#5252524f';
    context.fillText(
      'VOIDED',
      (this.fabricCanvas.width ?? 675) * 0.4,
      (this.fabricCanvas.height ?? 295) * 0.5
    );
  }

  /**
   * Uniformly scale the fabric.js canvas-container to fill the wrapper width
   * (like V3 check-view). Answers whether it had a width to scale against: a
   * panel that has not been laid out yet measures zero, and scaling to nothing
   * and calling it done is what put a collapsed design on screen before the
   * real one.
   */
  private scaleCanvasToFit(): boolean {
    if (!this.fabricCanvas || !this.fabricCanvasRef?.nativeElement) return false;
    const wrapper = this.fabricCanvasRef.nativeElement.closest(
      '.fabric-canvas-wrapper'
    ) as HTMLElement;
    if (!wrapper) return false;

    this.watchWrapperWidth(wrapper);

    const wrapperWidth = wrapper.clientWidth;
    if (!wrapperWidth) return false;

    const scale = wrapperWidth / 675;

    // Fabric.js wraps the canvas in a .canvas-container div
    const fabricContainer = wrapper.querySelector(
      '.canvas-container'
    ) as HTMLElement;
    if (fabricContainer) {
      fabricContainer.style.transformOrigin = 'top left';
      fabricContainer.style.transform = `scale(${scale})`;
    }
    wrapper.style.height = `${Math.round(295 * scale)}px`;
    return true;
  }

  private destroyFabricCanvas(): void {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
  }
}
