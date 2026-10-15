import { Component, HostBinding, inject, OnInit, signal } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { ComplianceFreezeV4Component } from 'src/app/modules/compliance-freeze/compliance-freeze-v4/compliance-freeze-v4.component';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { InternationalPaymentHeaderV4Component } from '../../components/international-payment-header-v4/international-payment-header-v4.component';
import { InternationalPaymentListV4Component } from '../../components/international-payment-list-v4/international-payment-list-v4.component';

@Component({
  selector: 'app-international-payment-index-v4',
  standalone: true,
  imports: [CommonLayoutV4Component, ComplianceFreezeV4Component],
  templateUrl: './international-payment-index-v4.component.html'
})
export class InternationalPaymentIndexV4Component implements OnInit {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  // Not on the compliance-freeze view, which is normal page content.
  @HostBinding('class') get hostClass(): string {
    return this.complianceFreeze()
      ? 'flex flex-col flex-1'
      : 'flex flex-col flex-1 min-h-[720px]';
  }

  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private localStorageService = inject(LocalStorageService);

  headerComponent = InternationalPaymentHeaderV4Component;
  detailsComponent = InternationalPaymentListV4Component;
  complianceFreeze = signal(false);

  ngOnInit(): void {
    this.complianceFreeze.set(
      !!this.localStorageService.getItem('hasComplianceFreeze')
    );
    this.commonLayoutToggleV4Service.gridView.set(true);
  }
}
