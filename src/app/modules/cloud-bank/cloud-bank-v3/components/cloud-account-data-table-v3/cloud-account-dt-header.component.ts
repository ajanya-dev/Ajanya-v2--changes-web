import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { IHeaderParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationCircle } from '@fortawesome/pro-solid-svg-icons';

@Component({
    selector: 'app-cloud-account-dt-header',
    standalone: true,
    imports: [
        FontAwesomeModule,
        MatTooltip
    ],
    template: `
    <div class="custom-header">
      <span>{{ params.displayName }} <fa-icon class="cursor-pointer ml-1" [icon]="faExclamationCircle" [matTooltip]="'Bank Account Holder Name'"/></span>
    </div>
  `,
    styleUrls: []
})
export class CloudAccountDTHeaderComponent implements IHeaderAngularComp {

    faExclamationCircle = faExclamationCircle;

    refresh(_params: IHeaderParams): boolean {
        // Implement refresh logic here if needed
        return true; // Return true to indicate that refresh was successful
    }

    public params!: IHeaderParams;

    agInit(params: IHeaderParams): void {
        this.params = params;
    }

}
