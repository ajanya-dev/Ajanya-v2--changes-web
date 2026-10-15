import { Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';

interface ICustomJobsActionParams extends ICellRendererParams {
  onActionClick: (row: unknown, id: string) => void;
}

interface IActionItem {
  id: string;
  label: string;
  icon: string;
}

interface IActionGroup {
  title: string;
  items: IActionItem[];
}

@Component({
  selector: 'app-custom-jobs-report-action-v4',
  standalone: true,
  imports: [LucideAngularModule, MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip],
  templateUrl: './custom-jobs-report-action-v4.component.html'
})
export class CustomJobsReportActionV4Component implements AgRendererComponent {
  private params!: ICustomJobsActionParams;
  private rowData: unknown;

  readonly groupedActions: IActionGroup[] = [
    {
      title: 'DOCUMENTS',
      items: [
        { id: 'id_report', label: 'Job Details Report', icon: 'file-text' },
        { id: 'id_audit_report', label: 'Job Audit Report', icon: 'file-text' },
        { id: 'id_file', label: 'Download File', icon: 'download' }
      ]
    }
  ];

  agInit(params: ICustomJobsActionParams): void {
    this.params = params;
    this.rowData = params.data;
  }

  refresh(params: ICustomJobsActionParams): boolean {
    this.params = params;
    this.rowData = params.data;
    return true;
  }

  onActionClick(id: string): void {
    this.params.onActionClick?.(this.rowData, id);
  }
}
