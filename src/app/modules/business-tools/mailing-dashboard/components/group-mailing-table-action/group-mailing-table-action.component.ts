import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { IGroupMailingRecord } from '../../models/group-mailing.model';

@Component({
  selector: 'app-group-mailing-table-action',
  template: `
    <div class="flex items-center justify-center h-full">
      <fa-icon [icon]="faEye" (click)="viewDetails()" [title]="'View Details'" class="text-common-dark-blue-color cursor-pointer hover:opacity-80 transition-opacity"></fa-icon>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule]
})
export class GroupMailingTableActionComponent
  implements ICellRendererAngularComp
{
  private router = inject(Router);

  faEye = faEye;

  params: ICellRendererParams<IGroupMailingRecord>;

  agInit(params: ICellRendererParams<IGroupMailingRecord>): void {
    this.params = params;
  }

  viewDetails(): void {
    if (this.params.data?.id) {
      // The list can be embedded in another page (payments-out check tab), so send
      // the current url along for the details page to come back to.
      this.router.navigate(
        ['/manage/business-tools/mail-dashboard/group-mailing/details', this.params.data.id],
        { state: { backUrl: this.router.url } }
      );
    }
  }

  refresh(_: ICellRendererParams<IGroupMailingRecord>): boolean {
    return false;
  }
}