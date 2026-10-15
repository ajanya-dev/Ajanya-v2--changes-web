import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faEllipsisVertical, faEye } from '@fortawesome/pro-solid-svg-icons';
import { IPaymentLinksCustomTableRes } from 'src/app/modules/data-table/components/data-table/data-table.model';

@Component({
  selector: 'app-payment-links-custom-links-cellrenderer',
  standalone: true,
  imports: [FaIconComponent, MatMenuTrigger, MatMenu, MatTooltip, NgClass],
  templateUrl: './payment-links-custom-links-cellrenderer.component.html'
})
export class PaymentLinksCustomLinksCellrendererComponent
  implements ICellRendererAngularComp
{
  faEllipsisVertical = faEllipsisVertical;
  faEye = faEye;

  paymentsCount = 0;

  params?: ICellRendererParams<IPaymentLinksCustomTableRes> & {
    buttons: { name: string; id: string; icon: IconProp }[];
    callBack: (param: {
      id: string;
      selectedRow: IPaymentLinksCustomTableRes;
    }) => void;
  };

  agInit(params: NonNullable<typeof this.params>): void {
    this.params = params;
    this.paymentsCount = params.data?.transaction_count ?? 0;
  }

  onClick(id: string) {
    const cb = this.params?.callBack;
    const selectedRow = this.params?.data;

    if (cb && selectedRow) {
      cb({ id, selectedRow });
    }
  }

  refresh(_: ICellRendererParams): boolean {
    return false;
  }
}
