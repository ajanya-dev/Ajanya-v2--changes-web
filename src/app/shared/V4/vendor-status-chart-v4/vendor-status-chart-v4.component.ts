import { NgClass, NgStyle } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  effect,
  input,
  signal
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
  type TooltipModel
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export interface IVendorData {
  /** Short label shown on the X-axis. */
  name: string;
  /** Full name shown in the tooltip (falls back to `name` if omitted). */
  fullName?: string;
  paid: number;
  overdue: number;
  pending: number;
  partial?: number;
  total: number;
}

/** Context for the chart tooltip template (ng-template). */
export interface ChartTooltipContext {
  displayName: string;
  truncated: string;
  rows: { color: string; label: string; amount: string }[];
  total: string;
}

interface IDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  stack: string;
  borderRadius:
    | number
    | {
        topLeft: number;
        topRight: number;
        bottomLeft: number;
        bottomRight: number;
      };
  maxBarThickness: number;
  categoryPercentage: number;
  barPercentage: number;
}

@Component({
  standalone: true,
  selector: 'app-vendor-status-chart-v4',
  templateUrl: './vendor-status-chart-v4.component.html',
  styleUrls: ['./vendor-status-chart-v4.component.scss'],
  imports: [NgClass, NgStyle]
})
export class VendorStatusChartV4Component implements AfterViewInit, OnDestroy {
  @HostBinding('attr.title') readonly hostTitle = null;

  @ViewChild('chartCanvas') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tooltipEl') private tooltipEl!: ElementRef<HTMLDivElement>;

  labelOverlays = signal<{ left: number; top: number; width: number; height: number; name: string }[]>([]);

  @ViewChild('tooltipAnchor', { read: ViewContainerRef })
  private tooltipVcRef!: ViewContainerRef;

  @ViewChild('tooltipTpl', { read: TemplateRef })
  private tooltipTpl!: TemplateRef<ChartTooltipContext>;

  @ViewChild('chartHost') private chartHost!: ElementRef<HTMLDivElement>;

  data = input<IVendorData[]>([]);
  title = input('Top 5 Vendors by Amount');
  subtitle = input('Payment status breakdown per vendor');
  showPartial = input(false);
  hideOverdue = input(false);
  hidePending = input(false);
  isLoading = input(false);

  legendTotals = computed(() => {
    const vendors = this.data();
    const paid = vendors.reduce((sum, v) => sum + v.paid, 0);
    const overdue = vendors.reduce((sum, v) => sum + v.overdue, 0);
    const pending = vendors.reduce((sum, v) => sum + v.pending, 0);
    return {
      paid: this.formatLegendAmount(paid),
      overdue: this.formatLegendAmount(overdue),
      pending: this.formatLegendAmount(pending)
    };
  });

  private chartInstance: Chart | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    // Re-build datasets whenever any bound input changes.
    effect(() => {
      const vendorData = this.data();
      const showPartial = this.showPartial();
      const hideOverdue = this.hideOverdue();
      const hidePending = this.hidePending();
      if (!this.chartInstance) return;
      this.chartInstance.data.labels = vendorData.map((v) => v.name);
      this.chartInstance.data.datasets = this.buildDatasets(
        vendorData,
        showPartial,
        hideOverdue,
        hidePending
      );
      const scale = this.niceScale(
        this.calcMaxStack(vendorData, showPartial, hideOverdue, hidePending)
      );
      const { scales } = this.chartInstance.options;
      if (scales && scales.y) {
        const yScale = scales.y as {
          max?: number;
          ticks?: { stepSize?: number };
        };
        yScale.max = scale.max;
        if (yScale.ticks) yScale.ticks.stepSize = scale.stepSize;
      }
      this.chartInstance.update();
      setTimeout(() => this.updateLabelOverlays(), 0);
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.watchTheme();
    // Let the chart fully render before measuring label positions
    setTimeout(() => this.updateLabelOverlays(), 50);
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
    this.themeObserver?.disconnect();
  }

  // ── X-axis label overlays ─────────────────────────────────────────────────

  /** Recalculate positions of transparent hit-area divs over each x-axis label. */
  updateLabelOverlays(): void {
    const chart = this.chartInstance;
    if (!chart) return;

    const xScale = chart.scales['x'];
    if (!xScale) return;

    const canvasRect = this.chartCanvas.nativeElement.getBoundingClientRect();
    const hostRect = this.chartHost.nativeElement.getBoundingClientRect();
    const offsetLeft = canvasRect.left - hostRect.left;
    const offsetTop = canvasRect.top - hostRect.top;

    const tickCount = xScale.ticks.length;
    const halfBand = tickCount > 0 ? xScale.width / tickCount / 2 : 40;
    const labelAreaHeight = xScale.bottom - xScale.top;

    this.labelOverlays.set(
      this.data().map((vendor, i) => ({
        left: offsetLeft + xScale.getPixelForTick(i) - halfBand,
        top: offsetTop + xScale.top,
        width: halfBand * 2,
        height: labelAreaHeight,
        name: vendor.fullName ?? vendor.name
      }))
    );
  }

  hoveredLabel = signal<{ x: number; y: number; name: string } | null>(null);

  onLabelMouseEnter(event: MouseEvent, name: string): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const hostRect = this.chartHost.nativeElement.getBoundingClientRect();
    this.hoveredLabel.set({
      x: rect.left - hostRect.left + rect.width / 2,
      y: rect.top - hostRect.top - 4,
      name
    });
  }

  onLabelMouseLeave(): void {
    this.hoveredLabel.set(null);
  }

  // ── Theme reactivity ───────────────────────────────────────────────────────

  private watchTheme(): void {
    const observer = new MutationObserver(() => this.updateChartColors());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    this.themeObserver = observer;
  }

  private themeObserver: MutationObserver | null = null;

  private updateChartColors(): void {
    if (!this.chartInstance) return;
    const borderColor = this.getV4Color('--v4-border-color');
    const tickColor = this.getV4Color('--v4-secondary-text-color');

    const scales = this.chartInstance.options.scales as Record<string, unknown>;
    if (scales?.x) {
      const x = scales.x as {
        ticks: { color: string };
        border: { color: string };
      };
      x.ticks.color = tickColor;
      x.border.color = borderColor;
    }
    if (scales?.y) {
      const y = scales.y as {
        ticks: { color: string };
        border: { color: string };
      };
      y.ticks.color = tickColor;
      y.border.color = borderColor;
    }

    this.chartInstance.update('none');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Resolve a V4 CSS variable (e.g. --v4-common-green-color) to computed color for Chart.js. */
  private getV4Color(cssVar: string): string {
    const value = getComputedStyle(document.body)
      .getPropertyValue(cssVar)
      .trim();
    return value || '#6b7280';
  }

  formatLegendAmount(amount: number): string {
    return amount >= 1000
      ? `$${(amount / 1000).toFixed(2)}k`
      : `$${amount.toFixed(2)}`;
  }

  private formatAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private calcMaxStack(
    vendorData: IVendorData[],
    showPartial: boolean,
    hideOverdue: boolean,
    hidePending: boolean
  ): number {
    return Math.max(
      0,
      ...vendorData.map(
        (v) =>
          v.paid +
          (!hideOverdue ? v.overdue : 0) +
          (!hidePending ? v.pending : 0) +
          (showPartial ? (v.partial ?? 0) : 0)
      )
    );
  }

  private niceScale(maxValue: number): { max: number; stepSize: number } {
    if (maxValue <= 0) return { max: 5000, stepSize: 1000 };
    const padded = maxValue * 1.15;
    const rawStep = padded / 5;
    const mag = 10 ** Math.floor(Math.log10(rawStep));
    const stepSize = Math.ceil(rawStep / mag) * mag;
    return { max: stepSize * 5, stepSize };
  }

  private buildDatasets(
    vendorData: IVendorData[],
    showPartial: boolean,
    hideOverdue: boolean,
    hidePending: boolean
  ): IDataset[] {
    const paidColor = this.getV4Color('--v4-common-green-color');
    const overdueColor = this.getV4Color('--v4-common-red-color');
    const partialColor = this.getV4Color('--v4-common-blue-color');
    const pendingColor = this.getV4Color('--v4-common-yellow-color');

    const datasets: IDataset[] = [
      {
        label: 'Paid',
        data: vendorData.map((v) => v.paid),
        backgroundColor: paidColor,
        stack: 'a',
        borderRadius: 0,
        maxBarThickness: 100,
        categoryPercentage: 0.7,
        barPercentage: 1.0
      }
    ];

    if (!hideOverdue) {
      datasets.push({
        label: 'Overdue',
        data: vendorData.map((v) => v.overdue),
        backgroundColor: overdueColor,
        stack: 'a',
        borderRadius: 0,
        maxBarThickness: 100,
        categoryPercentage: 0.7,
        barPercentage: 1.0
      });
    }

    if (showPartial) {
      datasets.push({
        label: 'Partial',
        data: vendorData.map((v) => v.partial ?? 0),
        backgroundColor: partialColor,
        stack: 'a',
        borderRadius: 0,
        maxBarThickness: 100,
        categoryPercentage: 0.7,
        barPercentage: 1.0
      });
    }

    if (!hidePending) {
      datasets.push({
        label: showPartial ? 'Unpaid' : 'Pending',
        data: vendorData.map((v) => v.pending),
        backgroundColor: pendingColor,
        stack: 'a',
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0
        },
        maxBarThickness: 100,
        categoryPercentage: 0.7,
        barPercentage: 1.0
      });
    }

    return datasets;
  }

  private buildTooltipContext(
    vendor: IVendorData,
    showPartial: boolean,
    hideOverdue: boolean,
    hidePending: boolean
  ): ChartTooltipContext {
    const displayName = vendor.fullName ?? vendor.name;
    const truncated =
      displayName.length > 20 ? `${displayName.slice(0, 20)}…` : displayName;

    const rows: { color: string; label: string; amount: string }[] = [
      {
        color: 'var(--v4-common-green-color)',
        label: 'Paid:',
        amount: this.formatAmount(vendor.paid)
      }
    ];

    if (!hideOverdue && vendor.overdue > 0)
      rows.push({
        color: 'var(--v4-common-red-color)',
        label: 'Overdue:',
        amount: this.formatAmount(vendor.overdue)
      });

    if (!hidePending && vendor.pending > 0)
      rows.push({
        color: 'var(--v4-common-yellow-color)',
        label: showPartial ? 'Unpaid:' : 'Pending:',
        amount: this.formatAmount(vendor.pending)
      });

    if (showPartial && vendor.partial && vendor.partial > 0)
      rows.push({
        color: 'var(--v4-common-blue-color)',
        label: 'Partial:',
        amount: this.formatAmount(vendor.partial)
      });

    return {
      displayName,
      truncated,
      rows,
      total: this.formatAmount(vendor.total)
    };
  }

  // ── Chart setup ────────────────────────────────────────────────────────────

  private initChart(): void {
    const vendorData = this.data();
    const showPartial = this.showPartial();
    const hideOverdue = this.hideOverdue();
    const hidePending = this.hidePending();
    const borderColor = this.getV4Color('--v4-border-color');
    const tickColor = this.getV4Color('--v4-secondary-text-color');
    const scale = this.niceScale(
      this.calcMaxStack(vendorData, showPartial, hideOverdue, hidePending)
    );

    const dashedGridPlugin: Plugin<'bar'> = {
      id: 'dashedGridLines',
      beforeDraw: (chart) => {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y;
        if (!yScale || !chartArea) return;
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = this.getV4Color('--v4-border-color');
        ctx.lineWidth = 1;
        yScale.ticks.forEach((_, i) => {
          const yPos = yScale.getPixelForTick(i);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, yPos);
          ctx.lineTo(chartArea.right, yPos);
          ctx.stroke();
        });
        ctx.restore();
      }
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      plugins: [dashedGridPlugin],
      data: {
        labels: vendorData.map((v) => v.name),
        datasets: this.buildDatasets(
          vendorData,
          showPartial,
          hideOverdue,
          hidePending
        )
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (ctx: { chart: Chart; tooltip: TooltipModel<'bar'> }) => {
              const { chart, tooltip } = ctx;
              const el = this.tooltipEl?.nativeElement;
              if (!el) return;

              if (tooltip.opacity === 0) {
                el.style.opacity = '0';
                this.tooltipVcRef?.clear();
                return;
              }

              const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
              if (dataIndex === undefined) return;
              const vendor = this.data()[dataIndex];
              if (!vendor) return;

              const context = this.buildTooltipContext(
                vendor,
                this.showPartial(),
                this.hideOverdue(),
                this.hidePending()
              );
              this.tooltipVcRef?.clear();
              this.tooltipVcRef?.createEmbeddedView(this.tooltipTpl, context);
              this.cdr.detectChanges();

              const canvasRect = chart.canvas.getBoundingClientRect();
              const hostRect =
                this.chartHost.nativeElement.getBoundingClientRect();

              const leftPos = canvasRect.left - hostRect.left + tooltip.caretX;
              const topPos = canvasRect.top - hostRect.top + tooltip.caretY;
              const tooltipH = el.offsetHeight || 130;

              // Flip to below when not enough space above inside the container
              if (topPos - tooltipH - 8 < 0) {
                el.style.transform = 'translate(-50%, 8px)';
              } else {
                el.style.transform = 'translate(-50%, calc(-100% - 8px))';
              }

              el.style.left = `${leftPos}px`;
              el.style.top = `${topPos}px`;
              el.style.opacity = '1';
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            border: { display: true, color: borderColor, width: 2 },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              maxRotation: 20,
              minRotation: 20,
              callback: (_, index) => {
                const label = this.data()[index]?.name ?? '';
                return label.length > 12 ? `${label.slice(0, 12)}…` : label;
              }
            }
          },
          y: {
            stacked: true,
            min: 0,
            max: scale.max,
            grid: { display: false },
            border: { display: true, color: borderColor, width: 2 },
            ticks: {
              stepSize: scale.stepSize,
              color: tickColor,
              font: { size: 12 },
              callback: (value) => {
                const k = Number(value) / 1000;
                return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
              }
            }
          }
        }
      }
    };

    this.chartInstance = new Chart(this.chartCanvas.nativeElement, config);
  }
}
