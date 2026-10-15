import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { IHeaderParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';

interface IHeaderWithTooltipParams extends IHeaderParams {
  headerText?: string;
  tooltipText?: string;
  iconClass?: string;
}

@Component({
  selector: 'app-header-with-tooltip',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatTooltip
  ],
  template: `
    <div class="custom-header flex items-center">
      <span>{{ headerText || params.displayName }}</span>
      <fa-icon 
        class="cursor-pointer ml-1 text-blue-500" 
        [icon]="faInfoCircle" 
        [matTooltip]="tooltipText || 'Information'"
        matTooltipPosition="above"
      />
    </div>
  `,
  styleUrls: []
})
export class HeaderWithTooltipComponent implements IHeaderAngularComp {

  faInfoCircle = faInfoCircle;
  headerText?: string;
  tooltipText?: string;
  iconClass?: string;

  refresh(_params: IHeaderParams): boolean {
    return true;
  }

  public params!: IHeaderWithTooltipParams;

  agInit(params: IHeaderWithTooltipParams): void {
    this.params = params;
    this.headerText = params.headerText;
    this.tooltipText = params.tooltipText;
    this.iconClass = params.iconClass;
  }
}
