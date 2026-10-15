import { Router } from '@angular/router';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgIf } from '@angular/common';
import { PayrollConnectionModalComponent } from '../../components/payroll-connection-modal/payroll-connection-modal.component';
import { PayrollService } from '../../services/payroll.service';
import { PayrollListV35Component } from '../../components-v35/payroll-list-v35/payroll-list-v35.component';
import { PayrollDetailsV35Component } from '../../components-v35/payroll-details-v35/payroll-details-v35.component';
import { CommonLayoutV35Component } from '../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ComplianceFreezeComponent } from 'src/app/modules/compliance-freeze/compliance-freeze.component';

@Component({
  selector: 'app-payroll-v35',
  templateUrl: './payroll-ocw-v35.component.html',
  styleUrls: ['./payroll-ocw-v35.component.scss'],
  standalone: true,
  imports: [NgIf, FaIconComponent, CommonLayoutV35Component, ComplianceFreezeComponent]
})
export class PayrollOcwV35Component implements OnInit {
  listComponent = PayrollListV35Component;
  detailsComponent = PayrollDetailsV35Component;
  private localStorageService = inject(LocalStorageService);

  alreadyConnected = true;
  imageLoaded = false;
  subscriptions: Subscription[] = [];
  loading = true;
  private dialog = inject(MatDialog);
  private payrollService = inject(PayrollService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  public router = inject(Router);
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  complianceFreeze = signal(false);

  ngOnInit(): void {
    this.getPayrollApps();
    this.complianceFreeze.set(this.localStorageService.getItem('hasComplianceFreeze'));
    this.subscriptions.push(
      this.payrollService.isConnectedSuccess.subscribe((res) => {
        if (res) {
          this.dialog.closeAll();
        }
        this.getPayrollApps();
      })
    );
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isWhiteLabel')
    ) {
      this.router.navigate(['/manage/permission-denied']);
    }
  }

  /**
   * @description -etrieves the list of payroll applications and updates the connection status.
   */
  getPayrollApps() {
    this.subscriptions.push(
      this.payrollService.getPayrollDetails().subscribe((res) => {
        this.alreadyConnected = res.data.length > 0;
        this.loading = false;
      })
    );
  }

  /**
   * @description Method to open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description- Opens the Payroll Connection Modal for connecting new payroll applications.
   *
   */
  openModal() {
    this.dialog.open(PayrollConnectionModalComponent, {
      minWidth: '625px',
      width: '625px',
      disableClose: true
    });
  }

  goToExtensionPage(){
    window.open('https://chromewebstore.google.com/detail/zilmoney-payroll-by-credi/nfmlnpkpdnfddkbfepobdpfnlecbbacn', '_blank');
  }
}
