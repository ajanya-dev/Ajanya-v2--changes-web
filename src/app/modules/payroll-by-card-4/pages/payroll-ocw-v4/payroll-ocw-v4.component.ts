import { Router } from '@angular/router';
import { Component, HostBinding, OnInit, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { ReplaySubject, Subscription } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { ComplianceFreezeV4Component } from 'src/app/modules/compliance-freeze/compliance-freeze-v4/compliance-freeze-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IPayrollApps } from '../../../payroll/model/payroll';
import { PayrollConnectionModalV4Component } from '../../components/payroll-connection-modal-v4/payroll-connection-modal-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PayrollHeaderV4Component } from '../../components-v4/payroll-header-v4/payroll-header-v4.component';
import { PayrollListV4Component } from '../../components-v4/payroll-list-v4/payroll-list-v4.component';
import { PayrollDetailsV4Component } from '../../components-v4/payroll-details-v4/payroll-details-v4.component';
import { CommonLayoutV4Component } from '../../../../layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { CommonButtonV4Component } from '../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-payroll-v4',
  templateUrl: './payroll-ocw-v4.component.html',
  styleUrls: ['./payroll-ocw-v4.component.scss'],
  standalone: true,
  imports: [
    CommonLayoutV4Component,
    NgOptimizedImage,
    CommonButtonV4Component,
    ComplianceFreezeV4Component,
    LucideAngularModule
  ]
})
export class PayrollOcwV4Component implements OnInit {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  // Only for the skeleton / common layout; onboarding is normal page content.
  @HostBinding('class') get hostClass(): string {
    return !this.complianceFreeze() && (this.loading || this.alreadyConnected)
      ? 'flex flex-col flex-1 min-h-[720px]'
      : 'flex flex-col flex-1';
  }

  headerComponent = PayrollHeaderV4Component;
  listComponent = PayrollListV4Component;
  detailsComponent = PayrollDetailsV4Component;

  alreadyConnected = true;
  subscriptions: Subscription[] = [];
  loading = true;
  complianceFreeze = signal(false);
  private dialog = inject(MatDialog);
  private payrollService = inject(PayrollService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private localStorageService = inject(LocalStorageService);
  public router = inject(Router);
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  private themeService = inject(ThemeService);
  isDarkMode = false;

  ngOnInit(): void {
    this.complianceFreeze.set(
      !!this.localStorageService.getItem('hasComplianceFreeze')
    );
    this.payrollService.payrollAppId = new ReplaySubject<IPayrollApps>(1);
    this.isDarkMode = this.themeService.isDarkMode;
    this.subscriptions.push(
      this.themeService.getThemeSwitch().subscribe((isDark) => {
        this.isDarkMode = isDark;
      })
    );
    this.getPayrollApps();
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
      this.router.navigate(['/v4/manage/permission-denied']);
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
    this.dialog.open(PayrollConnectionModalV4Component, {
      minWidth: '780px',
      width: '780px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  goToExtensionPage() {
    window.open(
      'https://chromewebstore.google.com/detail/zilmoney-payroll-by-credi/nfmlnpkpdnfddkbfepobdpfnlecbbacn',
      '_blank'
    );
  }
}
