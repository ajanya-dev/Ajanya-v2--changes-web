import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { finalize, take } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { faImage, faFilePdf } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IMailingDashboardReport } from '../../../models/group-mailing.model';
import { GroupMailingService } from '../../../services/group-mailing.service';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4CheckRecordsComponent } from './v4-check-records/v4-check-records.component';

Chart.register(...registerables);

@Component({
  selector: 'app-v4-mailing-dashboard-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    FaIconComponent,
    V4DatePickerComponent,
    CommonButtonV4Component,
    V4CheckRecordsComponent
  ],
  providers: [DatePipe],
  templateUrl: './v4-mailing-dashboard-report.component.html',
  styleUrl: './v4-mailing-dashboard-report.component.scss'
})
export class V4MailingDashboardReportComponent implements OnInit, OnDestroy {
  private groupMailingService = inject(GroupMailingService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  isReportLoading = signal(false);
  reportData = signal<IMailingDashboardReport | null>(null);
  shippingChart: Chart | null = null;
  selectedDate = signal<{ endDate: string; startDate: string } | undefined>(undefined);

  faImage = faImage;
  faFilePdf = faFilePdf;

  fromDate = new FormControl('');
  toDate = new FormControl('');

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({ hidden: true, animation: false });
    this.initializeDateFilters();
    this.getMailingDashboardReport();
  }

  ngOnDestroy(): void {
    if (this.shippingChart) {
      this.shippingChart.destroy();
      this.shippingChart = null;
    }
  }

  private initializeDateFilters(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fromDate.setValue(this.datePipe.transform(firstDayOfMonth, 'yyyy-MM-dd'));
    this.toDate.setValue(this.datePipe.transform(today, 'yyyy-MM-dd'));
    this.selectedDate.set({
      startDate: this.fromDate.value as string,
      endDate: this.toDate.value as string
    });
  }

  getMailingDashboardReport(): void {
    this.isReportLoading.set(true);
    this.groupMailingService
      .getMailingDashboardReport(this.fromDate.value as string, this.toDate.value as string)
      .pipe(
        finalize(() => this.isReportLoading.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          this.reportData.set(res.data);
          setTimeout(() => this.initShippingChart(), 100);
        }
      });
  }

  onFilterClicked(): void {
    if (this.fromDate.value && this.toDate.value) {
      this.selectedDate.set({
        startDate: this.fromDate.value,
        endDate: this.toDate.value
      });
      this.getMailingDashboardReport();
    }
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  /** Extract price portion from shipping type name (e.g. "First Class $1.25" → "$1.25") */
  getPrice(name: string): string {
    const match = name?.match(/\$[\d,]+\.?\d*/);
    return match ? match[0] : '';
  }

  /** Return the name without the embedded price */
  getTypeName(name: string): string {
    return name?.replace(/\$[\d,]+\.?\d*/g, '').trim() ?? name;
  }

  exportChartAsImage(): void {
    if (!this.shippingChart) return;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const chartCanvas = this.shippingChart.canvas;
    const headingHeight = 60;
    tempCanvas.width = chartCanvas.width;
    tempCanvas.height = chartCanvas.height + headingHeight;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.fillStyle = '#333333';
    tempCtx.font = 'bold 20px Arial';
    tempCtx.textAlign = 'center';
    tempCtx.fillText('Mailing Dashboard Report', tempCanvas.width / 2, 25);

    tempCtx.font = '14px Arial';
    tempCtx.fillStyle = '#666666';
    tempCtx.fillText(`${this.fromDate.value} to ${this.toDate.value}`, tempCanvas.width / 2, 45);
    tempCtx.drawImage(chartCanvas, 0, headingHeight);

    const link = document.createElement('a');
    link.download = `mailing-dashboard-report-${this.fromDate.value}-to-${this.toDate.value}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportChartAsPDF(): void {
    if (!this.shippingChart) return;
    import('jspdf').then(({ default: jsPDF }) => {
      const chartCanvas = this.shippingChart?.canvas;
      if (!chartCanvas) return;

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mailing Dashboard Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${this.fromDate.value} to ${this.toDate.value}`, pageWidth / 2, 30, { align: 'center' });

      const chartImage = chartCanvas.toDataURL('image/png');
      const chartWidth = 200;
      const chartHeight = (chartWidth * chartCanvas.height) / chartCanvas.width;
      const chartX = (pageWidth - chartWidth) / 2;
      const chartY = 40;

      pdf.addImage(chartImage, 'PNG', chartX, chartY, chartWidth, chartHeight);

      if (this.reportData()?.shipping_types) {
        let yPos = chartY + chartHeight + 20;
        if (yPos > pageHeight - 60) { pdf.addPage(); yPos = 20; }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary Report', 20, yPos);
        yPos += 15;

        const tableHeaders = ['Shipping Type', 'Check Mail Count', 'Group Check Mail', 'Total Count'];
        const columnWidths = [80, 40, 45, 35];
        const startX = 20;

        pdf.setFillColor(240, 240, 240);
        pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        let currentX = startX + 2;
        tableHeaders.forEach((header, index) => { pdf.text(header, currentX, yPos); currentX += columnWidths[index]; });
        yPos += 15;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        this.reportData()?.shipping_types.forEach((type, index) => {
          if (yPos > pageHeight - 30) { pdf.addPage(); yPos = 20; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); }
          if (index % 2 === 0) { pdf.setFillColor(248, 248, 248); pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F'); }
          currentX = startX + 2;
          pdf.text(type.name, currentX, yPos); currentX += columnWidths[0];
          pdf.text(type.check_mail_count.toLocaleString(), currentX, yPos); currentX += columnWidths[1];
          pdf.text(type.group_check_mail_count.toLocaleString(), currentX, yPos); currentX += columnWidths[2];
          pdf.text(type.total_count.toLocaleString(), currentX, yPos);
          yPos += 12;
        });

        yPos += 5;
        if (yPos > pageHeight - 30) { pdf.addPage(); yPos = 20; }

        const totalCheckMail = this.reportData()?.shipping_types.reduce((s, t) => s + t.check_mail_count, 0) || 0;
        const totalGroupCheckMail = this.reportData()?.shipping_types.reduce((s, t) => s + t.group_check_mail_count, 0) || 0;
        const grandTotal = this.reportData()?.shipping_types.reduce((s, t) => s + t.total_count, 0) || 0;

        pdf.setFillColor(220, 220, 220);
        pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F');
        pdf.setFont('helvetica', 'bold');
        currentX = startX + 2;
        pdf.text('TOTAL', currentX, yPos); currentX += columnWidths[0];
        pdf.text(totalCheckMail.toLocaleString(), currentX, yPos); currentX += columnWidths[1];
        pdf.text(totalGroupCheckMail.toLocaleString(), currentX, yPos); currentX += columnWidths[2];
        pdf.text(grandTotal.toLocaleString(), currentX, yPos);

        yPos += 20;
        if (yPos > pageHeight - 20) { pdf.addPage(); yPos = 20; }
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total Groups: ${this.reportData()?.total_groups.toLocaleString()}`, startX, yPos);
      }

      pdf.save(`mailing-dashboard-report-${this.fromDate.value}-to-${this.toDate.value}.pdf`);
    }).catch();
  }

  private initShippingChart(): void {
    const canvas = document.getElementById('v4ShippingChart') as HTMLCanvasElement;
    if (!canvas || !this.reportData()) return;

    if (this.shippingChart) {
      this.shippingChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-theme');

    const tickColor = isDark ? '#9fb0cb' : '#9CA3AF';
    const gridColor = isDark ? 'rgba(58, 62, 71, 0.8)' : 'rgba(229, 231, 235, 0.6)';
    const tooltipBg = isDark ? 'rgba(28, 41, 60, 0.97)' : 'rgba(255, 255, 255, 0.97)';
    const tooltipTitle = isDark ? '#f8fafc' : '#111827';
    const tooltipBody = isDark ? '#c9cfe0' : '#374151';
    const tooltipBorder = isDark ? '#3a3e47' : '#E5E7EB';

    const chartData = this.reportData()?.shipping_types || [];
    const labels = chartData.map((item) => item.name);
    const data = chartData.map((item) => item.total_count);

    this.shippingChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Count',
            data,
            backgroundColor: 'rgba(109, 40, 217, 1)',
            borderColor: 'rgba(109, 40, 217, 1)',
            borderWidth: 0,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(109, 40, 217, 1)',
            minBarLength: 4
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
            backgroundColor: tooltipBg,
            titleColor: tooltipTitle,
            bodyColor: tooltipBody,
            bodyFont: { size: 13, weight: 'bold' },
            padding: 12,
            borderColor: tooltipBorder,
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (context) => `Total Count: ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11 } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              callback: (value) => value.toLocaleString()
            }
          }
        }
      }
    });
  }
}
