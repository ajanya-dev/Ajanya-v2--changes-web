import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IMailBatchData } from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';

@Component({
  selector: 'app-v4-multi-check-table-action',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        (click)="viewDetails(); $event.stopPropagation()"
        matTooltip="View Batch Details"
      >
        <lucide-icon name="eye" [size]="16" class="v4-action-icon"></lucide-icon>
      </button>
    </div>
  `
})
export class V4MultiCheckTableActionComponent implements ICellRendererAngularComp {
  private router = inject(Router);

  params: ICellRendererParams<IMailBatchData>;

  agInit(params: ICellRendererParams<IMailBatchData>): void {
    this.params = params;
  }

  viewDetails(): void {
    if (this.params.data?.id) {
      this.router.navigate([
        '/v4/manage/business-tools/mail-dashboard/multi-check-mail-table-details',
        this.params.data.id
      ]);
    }
  }

  refresh(_: ICellRendererParams<IMailBatchData>): boolean {
    return false;
  }
}
