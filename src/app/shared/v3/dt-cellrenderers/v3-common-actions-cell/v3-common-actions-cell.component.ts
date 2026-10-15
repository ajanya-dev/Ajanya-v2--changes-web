import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LucideAngularModule } from 'lucide-angular';
import { faEye, faTrash } from '@fortawesome/pro-solid-svg-icons';

interface IV3ActionCellRendererParams {
  onView?: (param: ICellRendererParams) => void;
  onDelete?: (param: ICellRendererParams) => void;
}

@Component({
  selector: 'app-v3-common-actions-cell',
  templateUrl: './v3-common-actions-cell.component.html',
  styleUrls: ['./v3-common-actions-cell.component.scss'],
  standalone: true,
  imports: [FaIconComponent, LucideAngularModule]
})
export class V3CommonActionsCellComponent implements AgRendererComponent {
  agGridCellRendererParams: ICellRendererParams & IV3ActionCellRendererParams;
  versionType = signal<string>('v3');

  faEye = faEye;
  faTrash = faTrash;

  /**
   * Initializes the cell renderer component with parameters.
   * @param {ICellRendererParams} params - The cell renderer parameters.
   */
  agInit(params: ICellRendererParams & { versionType?: string }): void {
    this.agGridCellRendererParams = params;
    this.versionType.set(params.versionType || 'v3');
  }

  /**
   * Handles the "View" action.
   */
  onView() {
    this.agGridCellRendererParams?.onView?.(this.agGridCellRendererParams);
  }

  /**
   * Handles the "Delete" action.
   */
  onDelete() {
    this.agGridCellRendererParams?.onDelete?.(this.agGridCellRendererParams);
  }

  refresh(): boolean {
    return false;
  }
}
