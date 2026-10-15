import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { CloudBankListV35Component } from '../../components-v35/cloud-bank-list-v35/cloud-bank-list-v35.component';
import { CloudBankDetailsV35Component } from '../../components-v35/cloud-bank-details-v35/cloud-bank-details-v35.component';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { CloudWelcomePageV3Component } from '../../components/cloud-welcome-page-v3/cloud-welcome-page-v3.component';
import { CloudSubmittedV3Component } from '../../components/cloud-submitted-v3/cloud-submitted-v3.component';
import { CommonLayoutV35Component } from '../../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { ComingSoonComponent } from 'src/app/modules/common-components/components/coming-soon/coming-soon.component';
// import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';


@Component({
  selector: 'app-cloud-bank-index',
  templateUrl: './cloud-bank-index.component.html',
  styleUrls: ['./cloud-bank-index.component.scss'],
  standalone: true,
  imports: [
    CommonLayoutV35Component,
    CloudSubmittedV3Component,
    CloudWelcomePageV3Component,
    ComingSoonComponent
  ]
})
export class CloudBankIndexComponent implements OnInit, OnDestroy {
  /**
   * @description Injecting dependencies using inject method
   */
  public cloudAccService = inject(CloudBankService);
  private companyManagementService = inject(CompanyManagementService);
  public cloudListV35Service = inject(CloudListV35Service);

  /**
   * @description Variables
   */
  subscriptions: Subscription[] = [];
  currentUrl: string;
  listComponent = CloudBankListV35Component;
  detailsComponent = CloudBankDetailsV35Component;

  ngOnInit(): void {
    this.cloudListV35Service.onBoardingStatus();
  }

  /**
   * @description check whether company was switched from header dropdown.
   */
  getCompanyChange() {
    this.subscriptions.push(
      this.companyManagementService.getCompanyChange$.subscribe((res) => {
        if (res) {
          this.cloudListV35Service.onBoardingStatus();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
