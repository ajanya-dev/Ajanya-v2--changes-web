import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  signal
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartType,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
  type TooltipItem
} from 'chart.js';
import { LucideAngularModule } from 'lucide-angular';
import { ComingSoonCardV4Component } from '../coming-soon-card-v4/coming-soon-card-v4.component';

/** Tooltip options with callbacks for bar chart (used when mutating chart options in effect). */
interface BarTooltipOptionsWithCallbacks {
  callbacks?: {
    title?: (items: TooltipItem<'bar'>[]) => string | string[];
    label?: (item: TooltipItem<'bar'>) => string | string[];
  };
}

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

// Extend Chart.js plugin options to include todayLine.
// TType must match chart.js's original declaration (TypeScript 2428).
declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    todayLine?: { todayIndex: number };
  }
}

export interface ITimelineBar {
  label: string;
  value: number;
  amount: number;
  /** When true, renders a vertical dashed green line on this bar (due date). */
  isToday?: boolean;
}

export interface IPaymentReceiptTimelineData {
  bars: ITimelineBar[];
  onTimePercent: number;
  earlyAmount: string;
  onTimeAmount: string;
  lateAmount: string;
}

/**
 * Inline Chart.js plugin that draws a dashed vertical line on the "today" bar.
 * Typed as Plugin<ChartType> to avoid chart.js variance issues with 'bar'-specific types.
 * Cast to Plugin<'bar'> at the usage site in ChartConfiguration.
 */
function getV4CssVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || '';
}

const dashedGridPlugin: Plugin<'bar'> = {
  id: 'dashedGridLines',
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales } = chart;
    const yScale = scales.y;
    if (!yScale || !chartArea) return;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = getV4CssVar('--v4-border-color');
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

const todayLinePlugin = {
  id: 'todayLine',
  afterDraw(
    chart: Chart,
    _args: unknown,
    options: { todayIndex: number }
  ): void {
    if (options.todayIndex < 0) return;
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[options.todayIndex] as BarElement;
    if (!bar) return;
    const { ctx, chartArea } = chart;
    const strokeStyle = getV4CssVar('--v4-common-green-color');
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.moveTo(bar.x, chartArea.top);
    ctx.lineTo(bar.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  }
};

@Component({
  standalone: true,
  selector: 'app-payment-receipt-timeline-v4',
  templateUrl: './payment-receipt-timeline-v4.component.html',
  styleUrls: ['./payment-receipt-timeline-v4.component.scss'],
  imports: [LucideAngularModule, ComingSoonCardV4Component]
})
export class PaymentReceiptTimelineV4Component
  implements AfterViewInit, OnDestroy
{
  @ViewChild('chartCanvas')
  private chartCanvas!: ElementRef<HTMLCanvasElement>;

  title = input('Payment Receipt Timeline');
  description = input('When payments were received relative to expected dates');
  variant = input<'default' | 'comingSoon'>('default');
  data = input.required<IPaymentReceiptTimelineData>();

  activeMode = signal<'count' | 'amount'>('count');

  // Typed as Chart<'bar'> to match the bar ChartConfiguration passed to new Chart()
  private chartInstance: Chart<'bar'> | null = null;

  constructor() {
    // React to data input changes and mode toggle after the chart is initialized
    effect(() => {
      const d = this.data();
      const mode = this.activeMode();
      if (!this.chartInstance) return;
      const todayIndex = d.bars.findIndex((b) => b.isToday);
      this.chartInstance.data.labels = d.bars.map((b) => b.label);
      this.chartInstance.data.datasets[0].data = d.bars.map((b) =>
        mode === 'count' ? b.value : b.amount
      );
      this.chartInstance.data.datasets[0].backgroundColor = this.getBarColors(
        d.bars
      );
      const { plugins } = this.chartInstance.options;
      if (plugins) {
        plugins.todayLine = { todayIndex };
        if (plugins.tooltip) {
          (plugins.tooltip as BarTooltipOptionsWithCallbacks).callbacks = {
            title: (items: TooltipItem<'bar'>[]) =>
              this.getBarTitle(items[0]?.label ?? ''),
            label: (item: TooltipItem<'bar'>) => {
              const bar = this.data().bars[item.dataIndex];
              return [
                `Bills:    ${bar.value}`,
                `Total:    $${bar.amount.toLocaleString()}`
              ];
            }
          };
        }
      }
      // Update y-axis formatter and step size based on mode
      const yScale = this.chartInstance.options.scales?.y;
      if (yScale && 'ticks' in yScale) {
        (yScale.ticks as Record<string, unknown>).callback =
          mode === 'amount'
            ? (value: number | string) => this.formatAmount(Number(value))
            : undefined;
        (yScale.ticks as Record<string, unknown>).stepSize =
          mode === 'amount' ? undefined : 1;
      }
      this.chartInstance.update();
    });
  }

  private getBarTitle(label: string): string {
    const days = parseInt(label, 10);
    if (days === 0) return 'On due date';
    if (days < 0) return `${Math.abs(days)} days early`;
    return `${days} days late`;
  }

  private getBarColors(bars: ITimelineBar[]): string[] {
    const barColor = getV4CssVar('--v4-accent-violet-color');
    return bars.map(() => barColor);
  }

  private formatAmount(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value}`;
  }

  setMode(mode: 'count' | 'amount'): void {
    this.activeMode.set(mode);
  }

  ngAfterViewInit(): void {
    const d = this.data();
    const todayIndex = d.bars.findIndex((b) => b.isToday);

    const tickColor = getV4CssVar('--v4-tertiary-text-color');
    const gridColor = getV4CssVar('--v4-border-color');
    const barColors = this.getBarColors(d.bars);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: d.bars.map((b) => b.label),
        datasets: [
          {
            data: d.bars.map((b) => b.value),
            backgroundColor: barColors,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: getV4CssVar('--v4-secondary-background-color'),
            borderColor: getV4CssVar('--v4-border-color'),
            borderWidth: 1,
            titleColor: getV4CssVar('--v4-main-text-color'),
            bodyColor: getV4CssVar('--v4-secondary-text-color'),
            cornerRadius: 10,
            padding: 12,
            displayColors: false,
            titleFont: { size: 13, weight: 'bold' as const },
            bodyFont: { size: 12 },
            callbacks: {
              title: (items: TooltipItem<'bar'>[]) =>
                this.getBarTitle(items[0]?.label ?? ''),
              label: (item: TooltipItem<'bar'>) => {
                const bar = this.data().bars[item.dataIndex];
                return [
                  `Bills:    ${bar.value}`,
                  `Total:    $${bar.amount.toLocaleString()}`
                ];
              }
            }
          },
          todayLine: { todayIndex }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: true, color: gridColor, width: 2 },
            ticks: { font: { size: 10 }, color: tickColor },
            title: {
              display: true,
              text: 'Days from Due Date',
              color: tickColor,
              font: { size: 10 }
            }
          },
          y: {
            grid: { display: false },
            border: { display: true, color: gridColor, width: 2 },
            ticks: { font: { size: 10 }, color: tickColor, stepSize: 1 },
            beginAtZero: true
          }
        }
      },
      // Chart.js variance makes Plugin<ChartType> incompatible with Plugin<'bar'> structurally;
      // the cast is necessary and safe since the plugin operates on bar chart data.
      plugins: [dashedGridPlugin, todayLinePlugin] as unknown as Plugin<
        'bar',
        { todayIndex: number }
      >[]
    };

    this.chartInstance = new Chart(this.chartCanvas.nativeElement, config);
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
  }
}
