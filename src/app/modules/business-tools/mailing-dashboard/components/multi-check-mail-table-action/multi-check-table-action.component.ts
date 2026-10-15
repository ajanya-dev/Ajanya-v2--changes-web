import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { IMailBatchData } from '../../models/group-mailing.model';

@Component({
selector: 'app-multi-check-table-action',
template: `
    <div class="flex items-center justify-center h-full">
    <fa-icon
        [icon]="faEye"
        (click)="viewDetails()"
        [title]="'View Details'"
        class="text-common-dark-blue-color cursor-pointer hover:opacity-80 transition-opacity"
    ></fa-icon>
    </div>
`,
styles: [],
standalone: true,
imports: [FaIconComponent]
})
export class MultiCheckTableActionComponent implements ICellRendererAngularComp {

    private router = inject(Router);

    faEye = faEye;

    params: ICellRendererParams<IMailBatchData>;

    agInit(params: ICellRendererParams<IMailBatchData>): void {
        this.params = params;
    }

    viewDetails(): void {
    if (this.params.data?.id) {
        const url = this.router.createUrlTree([
        '/manage/business-tools/mail-dashboard/multi-check-mail-table-details',
        this.params.data.id
        ]);
        window.open(url.toString(), '_blank');
    }
    }

    refresh(_: ICellRendererParams<IMailBatchData>): boolean {
    return false;
    }
}
