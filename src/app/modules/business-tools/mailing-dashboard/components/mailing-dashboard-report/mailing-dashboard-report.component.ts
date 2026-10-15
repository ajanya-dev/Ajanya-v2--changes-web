import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDownload, faFilePdf, faFilter, faImage } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { MailingDashboardCheckRecordsComponent } from '../mailing-dashboard-check-records/mailing-dashboard-check-records.component';
import { IMailingDashboardReport } from '../../models/group-mailing.model';
import { GroupMailingService } from '../../services/group-mailing.service';

Chart.register(...registerables);

@Component({
  selector: 'app-mailing-dashboard-report',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FaIconComponent,
    MailingDashboardCheckRecordsComponent,
    CommonModule,
    CommonButtonV35Component,
    CommonBackButtonV35Component
  ],
  templateUrl: './mailing-dashboard-report.component.html',
  styleUrl: './mailing-dashboard-report.component.scss'
})
export class MailingDashboardReportComponent implements OnInit, OnDestroy {
  private groupMailingService = inject(GroupMailingService);
  private datePipe = inject(DatePipe);

  isReportLaoding = signal(false);
  reportData = signal<IMailingDashboardReport | null>(null);
  shippingChart: Chart | null = null;
  selectedDate = signal<{ endDate: string; startDate: string } | undefined>(
    undefined
  );

  faDownload = faDownload;
  faFilePdf = faFilePdf;
  faImage = faImage;
  faFilter = faFilter;

  // Date form controls
  fromDate = new FormControl('');
  toDate = new FormControl('');

  ngOnInit(): void {
    this.initializeDateFilters();
    this.getMailingDashboardReport();
  }

  ngOnDestroy(): void {
    // Cleanup chart to prevent memory leaks
    if (this.shippingChart) {
      this.shippingChart.destroy();
      this.shippingChart = null;
    }
  }

  private initializeDateFilters() {
    // Set from date to current month first date
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate.setValue(
      this.datePipe.transform(firstDayOfMonth, 'yyyy-MM-dd')
    );
    this.toDate.setValue(this.datePipe.transform(today, 'yyyy-MM-dd'));
    this.selectedDate.set({
      startDate: this.fromDate.value as string,
      endDate: this.toDate.value as string
    });
  }

  getMailingDashboardReport() {
    this.isReportLaoding.set(true);
    this.groupMailingService
      .getMailingDashboardReport(
        this.fromDate.value as string,
        this.toDate.value as string
      )
      .pipe(
        finalize(() => this.isReportLaoding.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          this.reportData.set(res.data);
          // Initialize chart after data is loaded
          setTimeout(() => {
            this.initShippingChart();
          }, 100);
        }
      });
  }

  onFilterClicked() {
    if (this.fromDate.value && this.toDate.value) {
      this.selectedDate.set({
        startDate: this.fromDate.value,
        endDate: this.toDate.value
      });
      this.getMailingDashboardReport();
    }
  }

  exportChartAsImage() {
    if (this.shippingChart) {
      // Create a temporary canvas with heading
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const chartCanvas = this.shippingChart.canvas;
      const headingHeight = 60;
      const totalHeight = chartCanvas.height + headingHeight;
      
      tempCanvas.width = chartCanvas.width;
      tempCanvas.height = totalHeight;

      // Fill background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Add heading
      tempCtx.fillStyle = '#333333';
      tempCtx.font = 'bold 20px Arial';
      tempCtx.textAlign = 'center';
      tempCtx.fillText('Mailing Dashboard Report', tempCanvas.width / 2, 25);
      
      tempCtx.font = '14px Arial';
      tempCtx.fillStyle = '#666666';
      const dateRange = `${this.fromDate.value} to ${this.toDate.value}`;
      tempCtx.fillText(dateRange, tempCanvas.width / 2, 45);

      // Draw the chart below the heading
      tempCtx.drawImage(chartCanvas, 0, headingHeight);

      // Create download link
      const link = document.createElement('a');
      link.download = `mailing-dashboard-report-${this.fromDate.value}-to-${this.toDate.value}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exportChartAsPDF() {
    if (this.shippingChart) {
      // Dynamic import of jsPDF to avoid bundle size issues
      import('jspdf').then(({ default: jsPDF }) => {
        const chartCanvas = this.shippingChart?.canvas;
        if (!chartCanvas) return;
        
        // Create PDF
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Add heading
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Mailing Dashboard Report', pageWidth / 2, 20, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        const dateRange = `${this.fromDate.value} to ${this.toDate.value}`;
        pdf.text(dateRange, pageWidth / 2, 30, { align: 'center' });
        
        // Add chart image
        const chartImage = chartCanvas.toDataURL('image/png');
        const chartWidth = 200;
        const chartHeight = (chartWidth * chartCanvas.height) / chartCanvas.width;
        const chartX = (pageWidth - chartWidth) / 2;
        const chartY = 40;
        
        pdf.addImage(chartImage, 'PNG', chartX, chartY, chartWidth, chartHeight);
        
        // Add summary table
        if (this.reportData()?.shipping_types) {
          let yPos = chartY + chartHeight + 20;
          
          // Check if we need a new page for the table
          if (yPos > pageHeight - 60) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Summary Report', 20, yPos);
          
          yPos += 15;
          
          // Table headers
          const tableHeaders = ['Shipping Type', 'Check Mail Count', 'Group Check Mail', 'Total Count'];
          const columnWidths = [80, 40, 45, 35];
          const startX = 20;
          
          // Draw table header
          pdf.setFillColor(240, 240, 240);
          pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F');
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          let currentX = startX + 2;
          tableHeaders.forEach((header, index) => {
            pdf.text(header, currentX, yPos);
            currentX += columnWidths[index];
          });
          
          yPos += 15;
          
          // Draw table rows
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          this.reportData()?.shipping_types.forEach((type, index) => {
            // Check if we need a new page
            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = 20;
              
              // Reset font for data rows on new page (no headers on subsequent pages)
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10);
            }
            
            // Draw row background (alternating colors)
            if (index % 2 === 0) {
              pdf.setFillColor(248, 248, 248);
              pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F');
            }
            
            // Draw row content
            currentX = startX + 2;
            pdf.text(type.name, currentX, yPos);
            currentX += columnWidths[0];
            
            pdf.text(type.check_mail_count.toLocaleString(), currentX, yPos);
            currentX += columnWidths[1];
            
            pdf.text(type.group_check_mail_count.toLocaleString(), currentX, yPos);
            currentX += columnWidths[2];
            
            pdf.text(type.total_count.toLocaleString(), currentX, yPos);
            
            yPos += 12;
          });
          
          // Add total summary at the bottom
          yPos += 5;
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = 20;
          }
          
          const totalCheckMail = this.reportData()?.shipping_types.reduce((sum, type) => sum + type.check_mail_count, 0) || 0;
          const totalGroupCheckMail = this.reportData()?.shipping_types.reduce((sum, type) => sum + type.group_check_mail_count, 0) || 0;
          const grandTotal = this.reportData()?.shipping_types.reduce((sum, type) => sum + type.total_count, 0) || 0;
          
          // Draw total row with different background
          pdf.setFillColor(220, 220, 220);
          pdf.rect(startX, yPos - 5, pageWidth - 40, 10, 'F');
          
          pdf.setFont('helvetica', 'bold');
          currentX = startX + 2;
          pdf.text('TOTAL', currentX, yPos);
          currentX += columnWidths[0];
          
          pdf.text(totalCheckMail.toLocaleString(), currentX, yPos);
          currentX += columnWidths[1];
          
          pdf.text(totalGroupCheckMail.toLocaleString(), currentX, yPos);
          currentX += columnWidths[2];
          
          pdf.text(grandTotal.toLocaleString(), currentX, yPos);
          
          // Add total groups information
          yPos += 20;
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Total Groups: ${this.reportData()?.total_groups.toLocaleString()}`, startX, yPos);
        }
        
        // Download PDF
        pdf.save(`mailing-dashboard-report-${this.fromDate.value}-to-${this.toDate.value}.pdf`);
      }).catch();
    }
  }

  private initShippingChart() {
    const canvas = document.getElementById(
      'shippingChart'
    ) as HTMLCanvasElement;
    if (!canvas || !this.reportData()) return;

    // Destroy existing chart if it exists
    if (this.shippingChart) {
      this.shippingChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
            backgroundColor: 'rgba(116, 119, 231, 0.8)',
            borderColor: 'rgba(116, 119, 231, 1)',
            borderWidth: 2,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(116, 119, 231, 1)',
            hoverBorderColor: 'rgba(116, 119, 231, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#333',
            bodyFont: {
              size: 14,
              weight: 'bold'
            },
            padding: 10,
            borderColor: '#ddd',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label(context) {
                return `Total Count: ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: 'rgba(200, 200, 200, 0.15)'
            },
            ticks: {
              color: '#999',
              font: {
                size: 12
              }
            },
            border: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.25)'
            },
            ticks: {
              color: '#999',
              font: {
                size: 12
              },
              callback(value) {
                return value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
}
