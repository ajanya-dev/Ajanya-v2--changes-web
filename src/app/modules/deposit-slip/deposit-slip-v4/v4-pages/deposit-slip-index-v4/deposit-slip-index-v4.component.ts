import { Component, HostBinding, inject, OnInit } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { DepositSlipHeaderV4Component } from '../../v4-components/deposit-slip-header-v4/deposit-slip-header-v4.component';
import { DepositSlipListV4Component } from '../deposit-slip-list-v4/deposit-slip-list-v4.component';

@Component({
  selector: 'app-deposit-slip-index-v4',
  standalone: true,
  imports: [CommonLayoutV4Component],
  templateUrl: './deposit-slip-index-v4.component.html'
})
export class DepositSlipIndexV4Component implements OnInit {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);

  headerComponent = DepositSlipHeaderV4Component;
  detailsComponent = DepositSlipListV4Component;

  ngOnInit(): void {
    this.commonLayoutToggleV4Service.gridView.set(true);
  }
}
