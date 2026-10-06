import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface ISpendingTrend {
  category: string;
  amount: number;
  trend: number;
  isAnomaly: boolean;
  history: number[];
  color: string;
}

export const CATEGORY_COLORS = [
  '#7924FF',
  '#0595E5',
  '#00a5b2',
  '#004a7c',
  '#9672DF',
  '#FF6B6B',
  '#FFB347',
  '#4ECDC4'
];

@Component({
  selector: 'app-spending-trends',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './spending-trends.component.html'
})
export class SpendingTrendsComponent {
  readonly data = input<ISpendingTrend[]>([]);
  readonly isLoading = input(false);

  hoveredCategory = signal<string | null>(null);

  readonly totalSpending = computed(() =>
    this.data().reduce((sum, t) => sum + t.amount, 0)
  );

  readonly donutSegments = computed(() => {
    const total = this.totalSpending();
    if (total === 0) return [];
    let currentAngle = -90;
    return this.data().map((trend) => {
      const percentage = (trend.amount / total) * 100;
      // Cap just under a full turn so a single 100% slice still draws a ring
      // (a true 360° arc collapses to a zero-length, non-rendering path).
      const angle = Math.min((percentage / 100) * 360, 359.99);
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const cx = 120;
      const cy = 120;
      const outerR = 90;
      const innerR = 60;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + outerR * Math.cos(startRad);
      const y1 = cy + outerR * Math.sin(startRad);
      const x2 = cx + outerR * Math.cos(endRad);
      const y2 = cy + outerR * Math.sin(endRad);
      const x3 = cx + innerR * Math.cos(endRad);
      const y3 = cy + innerR * Math.sin(endRad);
      const x4 = cx + innerR * Math.cos(startRad);
      const y4 = cy + innerR * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      return {
        ...trend,
        percentage: ((trend.amount / total) * 100).toFixed(1),
        path: `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`
      };
    });
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

  generateSparklinePath(history: number[]): string {
    if (history.length < 2) return '';
    const maxVal = Math.max(...history);
    const minVal = Math.min(...history);
    const range = maxVal - minVal || 1;
    const points = history.map((val, i) => ({
      x: (i / (history.length - 1)) * 80,
      y: 25 - ((val - minVal) / range) * 20
    }));
    return this.generateSmoothPath(points);
  }

  generateSparklineArea(history: number[]): string {
    const linePath = this.generateSparklinePath(history);
    if (!linePath) return '';
    return `${linePath} L 80 30 L 0 30 Z`;
  }

  onCategoryHover(category: string | null): void {
    this.hoveredCategory.set(category);
  }
}
