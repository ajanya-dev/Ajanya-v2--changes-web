import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
  type TooltipModel
} from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip
);

export interface IRevenueTimelineData {
  month: string;
  paid: number;
  pending: number;
}

export interface RevenueTooltipContext {
  month: string;
  rows: { color: string; label: string; amount: string }[];
}

@Component({
  standalone: true,
  selector: 'app-revenue-chart-line-graph-v4',
  templateUrl: './revenue-chart-line-graph-v4.component.html',
  styleUrls: ['./revenue-chart-line-graph-v4.component.scss'],
  imports: [NgClass, LucideAngularModule]
})
export class RevenueChartLineGraphV4Component implements AfterViewInit {
  @HostBinding('attr.title') readonly hostTitle = null;

  @ViewChild('chartCanvas') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tooltipEl') private tooltipEl!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltipAnchor', { read: ViewContainerRef })
  private tooltipVcRef!: ViewContainerRef;

  @ViewChild('tooltipTpl', { read: TemplateRef })
  private tooltipTpl!: TemplateRef<RevenueTooltipContext>;

  @ViewChild('chartHost') private chartHost!: ElementRef<HTMLDivElement>;

  data = input<IRevenueTimelineData[]>([]);
  title = input('Revenue Timeline');
  subtitle = input('Paid vs Pending invoices over time');
  isLoading = input(false);

  trendPercentage = computed(() => {
    const d = this.data();
    if (d.length < 2 || d[0].paid === 0) return null;
    const pct = ((d[d.length - 1].paid - d[0].paid) / d[0].paid) * 100;
    return pct;
  });

  trendLabel = computed(() => {
    const pct = this.trendPercentage();
    if (pct === null) return null;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  });

  private chartInstance: Chart | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(private cdr: ChangeDetectorRef) {
    this.destroyRef.onDestroy(() => this.chartInstance?.destroy());
    effect(() => {
      const chartData = this.data();
      if (!this.chartInstance) return;
      this.chartInstance.data.labels = chartData.map((d) => d.month);
      this.chartInstance.data.datasets[0].data = chartData.map((d) => d.paid);
      this.chartInstance.data.datasets[1].data = chartData.map(
        (d) => d.pending
      );
      this.chartInstance.update();
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.watchTheme();
  }

  private getV4Color(cssVar: string): string {
    return (
      getComputedStyle(document.body).getPropertyValue(cssVar).trim() ||
      '#6b7280'
    );
  }

  private formatAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  private watchTheme(): void {
    const observer = new MutationObserver(() => this.updateChartColors());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private updateChartColors(): void {
    if (!this.chartInstance) return;
    const borderColor = this.getV4Color('--v4-border-color');
    const tickColor = this.getV4Color('--v4-secondary-text-color');
    const greenColor = this.getV4Color('--v4-common-green-color');
    const blueColor = this.getV4Color('--v4-common-blue-color');

    const scales = this.chartInstance.options.scales as Record<string, unknown>;
    if (scales?.x) {
      const x = scales.x as {
        ticks: { color: string };
        border: { color: string };
        grid: { color: string };
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

    const [paid, pending] = this.chartInstance.data.datasets as Array<{
      borderColor: string;
      backgroundColor: string;
      pointBackgroundColor: string;
    }>;
    if (paid) {
      paid.borderColor = greenColor;
      paid.backgroundColor = `${greenColor}33`;
      paid.pointBackgroundColor = greenColor;
    }
    if (pending) {
      pending.borderColor = blueColor;
      pending.backgroundColor = `${blueColor}22`;
      pending.pointBackgroundColor = blueColor;
    }

    this.chartInstance.update('none');
  }

  private initChart(): void {
    const chartData = this.data();
    const greenColor = this.getV4Color('--v4-common-green-color');
    const blueColor = this.getV4Color('--v4-common-blue-color');
    const borderColor = this.getV4Color('--v4-border-color');
    const tickColor = this.getV4Color('--v4-secondary-text-color');

    const dashedGridPlugin: Plugin<'line'> = {
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

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      plugins: [dashedGridPlugin],
      data: {
        labels: chartData.map((d) => d.month),
        datasets: [
          {
            label: 'Paid',
            data: chartData.map((d) => d.paid),
            borderColor: greenColor,
            backgroundColor: `${greenColor}33`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: greenColor,
            borderWidth: 2
          },
          {
            label: 'Pending',
            data: chartData.map((d) => d.pending),
            borderColor: blueColor,
            backgroundColor: `${blueColor}22`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: blueColor,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: (ctx: {
              chart: Chart;
              tooltip: TooltipModel<'line'>;
            }) => {
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
              const point = this.data()[dataIndex];
              if (!point) return;

              const context: RevenueTooltipContext = {
                month: point.month,
                rows: [
                  {
                    color: this.getV4Color('--v4-common-green-color'),
                    label: 'Paid:',
                    amount: `$${this.formatAmount(point.paid)}`
                  },
                  {
                    color: this.getV4Color('--v4-common-blue-color'),
                    label: 'Pending:',
                    amount: `$${this.formatAmount(point.pending)}`
                  }
                ]
              };

              this.tooltipVcRef?.clear();
              this.tooltipVcRef?.createEmbeddedView(this.tooltipTpl, context);
              this.cdr.detectChanges();

              const canvasRect = chart.canvas.getBoundingClientRect();
              const hostRect =
                this.chartHost.nativeElement.getBoundingClientRect();

              el.style.left = `${canvasRect.left - hostRect.left + tooltip.caretX}px`;
              el.style.top = `${canvasRect.top - hostRect.top + tooltip.caretY}px`;
              el.style.opacity = '1';
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: true, color: borderColor, width: 2 },
            ticks: { color: tickColor, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { display: false },
            border: { display: true, color: borderColor, width: 2 },
            ticks: {
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
