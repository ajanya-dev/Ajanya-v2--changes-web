import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface ICashFlowPoint {
  day: number;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-cash-flow-forecast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cash-flow-forecast.component.html'
})
export class CashFlowForecastComponent {
  readonly data = input<ICashFlowPoint[]>([]);
  readonly isLoading = input(false);

  hoveredDataPoint = signal<ICashFlowPoint | null>(null);
  mousePosition = signal({ x: 0, y: 0 });

  readonly chartWidth = 820;
  readonly chartHeight = 270;

  readonly maxValue = computed(() => {
    const items = this.data();
    const rawMax = items.length
      ? Math.max(...items.map((d) => Math.max(d.income, d.expense)))
      : 0;
    return this.niceMax(rawMax);
  });

  readonly yAxisLabels = computed(() => {
    const max = this.maxValue();
    const step = max / 5;
    return [0, 1, 2, 3, 4, 5].map((i) => this.formatAxisLabel(max - i * step));
  });

  private niceMax(rawMax: number): number {
    if (rawMax <= 0) return 100; // safe non-zero ceiling (avoids div-by-zero in y calc)
    const magnitude = 10 ** Math.floor(Math.log10(rawMax));
    const fraction = rawMax / magnitude;
    const niceFraction = this.niceFraction(fraction);
    return niceFraction * magnitude;
  }

  private niceFraction(fraction: number): number {
    if (fraction <= 1) return 1;
    if (fraction <= 2) return 2;
    if (fraction <= 2.5) return 2.5;
    if (fraction <= 5) return 5;
    return 10;
  }

  private formatAxisLabel(value: number): string {
    const abbr = (n: number, suffix: string): string =>
      `$${n % 1 === 0 ? n : n.toFixed(1)}${suffix}`;
    if (value >= 1e6) return abbr(value / 1e6, 'M');
    if (value >= 1e3) return abbr(value / 1e3, 'k');
    return `$${Math.round(value)}`;
  }

  readonly spacing = computed(() => {
    const len = this.data().length;
    return len > 1 ? this.chartWidth / (len - 1) : this.chartWidth;
  });

  readonly incomePoints = computed(() =>
    this.data().map((d, i) => ({
      x: i * this.spacing(),
      y: this.chartHeight - (d.income / this.maxValue()) * this.chartHeight
    }))
  );

  readonly expensePoints = computed(() =>
    this.data().map((d, i) => ({
      x: i * this.spacing(),
      y: this.chartHeight - (d.expense / this.maxValue()) * this.chartHeight
    }))
  );

  readonly incomeCurvePath = computed(() =>
    this.generateSmoothPath(this.incomePoints())
  );

  readonly expenseCurvePath = computed(() =>
    this.generateSmoothPath(this.expensePoints())
  );

  readonly incomeAreaPath = computed(() => {
    const pts = this.incomePoints();
    const curve = this.incomeCurvePath();
    if (!pts.length || !curve) return '';
    return `${curve} L ${pts[pts.length - 1].x} ${this.chartHeight} L 0 ${this.chartHeight} Z`;
  });

  readonly expenseAreaPath = computed(() => {
    const pts = this.expensePoints();
    const curve = this.expenseCurvePath();
    if (!pts.length || !curve) return '';
    return `${curve} L ${pts[pts.length - 1].x} ${this.chartHeight} L 0 ${this.chartHeight} Z`;
  });

  generateSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const cur = points[i];
      const next = points[i + 1];
      const cx = (cur.x + next.x) / 2;
      path += ` C ${cx} ${cur.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  }

  onChartMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    this.mousePosition.set({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }

  onDataPointHover(point: ICashFlowPoint | null): void {
    this.hoveredDataPoint.set(point);
  }
}
