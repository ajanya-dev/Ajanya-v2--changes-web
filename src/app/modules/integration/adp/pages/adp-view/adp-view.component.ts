import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { IADPPayrollComponentConfig } from 'src/app/modules/integration/model/integration';
import { ScriptService } from 'src/app/core/services/script.service';
import { ICompanyDetailsItemADP } from 'src/app/modules/integration/model/integration';
import { AdpPayrollComponent } from '../adp-payroll/adp-payroll.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { HelpWidgetComponent } from '../../../../user-support/components/help-widget/help-widget.component';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
/**
 * Component responsible for viewing and managing ADP integration settings.
 */
@Component({
  selector: 'app-adp-view',
  templateUrl: './adp-view.component.html',
  styleUrls: ['./adp-view.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgOptimizedImage,
    HelpWidgetComponent,
    CommonButtonV35Component,
    FaIconComponent,
    AdpPayrollComponent,
    NgClass
  ]
})
export class AdpViewComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  redirectUrl: string;
  redirect: string;
  getcompany: ICompanyDetailsItemADP[] = [];
  isConnected: string | number;

  instructions: string[] = [
    'Connect ADP account',
    'Add Card and Bank Account',
    'Process Payroll'
  ];
  isADPMarketPlaceUser: boolean;
  passwordUpdated: number;
  loading: boolean;
  newUser: boolean;
  adpPayrollDetails: IADPPayrollComponentConfig = {
    hideBack: true,
    companyId: undefined,
    isSubComponent: true
  };

  /**
   * Constructor for AdpViewComponent.
   *
   * @param adpService - Service for ADP integration.
   * @param activatedRoute - Service to access route parameters.
   * @param router - Angular router service.
   * @param alert - Service for displaying alerts.
   * @param scriptService - Service for managing scripts.
   */
  constructor(
    private adpService: AdpService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private alert: AlertService,
    private scriptService: ScriptService
  ) {}

  /**
   * Initialization method called when the component is created.
   */
  ngOnInit(): void {
    this.listCompany();
    this.getCallBacks();
    this.processADPUserDetails();
    this.scriptService.addADPZohoSrcipt();
  }

  /**
   * Navigates to the ADP setup page for a specific company.
   *
   * @param item - The company details.
   */
  adpSetting(item: ICompanyDetailsItemADP) {
    this.router.navigate([
      'manage/thirdparty_app/adp/setup',
      item.id,
      item.companyName
    ]);
  }

  /**
   * Processes ADP user details from route parameters.
   */
  processADPUserDetails() {
    this.subscriptions.push(
      this.activatedRoute.params.subscribe((res) => {
        if (res?.userStatus == 'new_user') {
          this.newUser = true;
        }
      })
    );
    this.subscriptions.push(
      this.adpService.adpUserDetails.subscribe((res) => {
        if (res?.adpMarketPlaceUser == 1) {
          this.isADPMarketPlaceUser = true;
          this.passwordUpdated = res?.passwordUpdated;
        }
      })
    );
  }

  /**
   * Initiates the ADP company consent process.
   *
   * @param id - The company ID.
   */
  connect(id: string) {
    this.subscriptions.push(
      this.adpService.adpCompanyConsent(id).subscribe((res) => {
        if (res.success) {
          window.location.href = res.redirectUrl;
        }
      })
    );
  }

  /**
   * Handles callback responses after connecting or disconnecting ADP.
   */
  getCallBacks() {
    this.activatedRoute.queryParams.subscribe((res) => {
      if (res?.state) {
        const sendingData = {
          state: res.state
        };
        this.subscriptions.push(
          this.adpService.getCompany(sendingData).subscribe((res) => {
            if (res.success) {
              this.alert.successAlert({ content: 'Successfully Connected' });
              this.listCompany();
              this.router.navigate([], { queryParams: {} });
            }
          })
        );
      }
      if (res?.disconnected) {
        this.subscriptions.push(
          this.adpService
            .disconnectADPConfirm(res.disconnected)
            .subscribe((res) => {
              if (res.success) {
                this.alert.successAlert({
                  content: 'Successfully disconnected'
                });
                this.listCompany();
                this.router.navigate([], { queryParams: {} });
              }
            })
        );
      }
    });
  }

  /**
   * Initiates the process of disconnecting ADP for a specific company.
   * @param id - The company ID.
   */
  disConnect(id: string) {
    this.subscriptions.push(
      this.adpService.disconnectADPInitiate(id).subscribe((res) => {
        if (res.success) {
          window.location.href = res.redirectUrl;
        }
      })
    );
  }

  /**
   * Initiates the process of connecting ADP.
   */
  connectAdp() {
    this.subscriptions.push(
      this.adpService.connectAdp().subscribe((res) => {
        if (res.success) {
          window.location.href = res.redirectUrl;
        }
      })
    );
  }

  /**
   * Lists the companies integrated with ADP and sets the active company for payroll processing.
   */
  listCompany() {
    this.loading = true;
    this.subscriptions.push(
      this.adpService.listCompanies().subscribe(
        (res) => {
          this.loading = false;
          this.getcompany = res.data;
          if (this.getcompany?.length > 0) {
            if (this.getcompany[0].isOnboarded != 1) {
              this.router.navigate(['/manage/thirdparty_app/adp/onboard']);
            }
            const adpPayrollDetailsTemp = { ...this.adpPayrollDetails };
            adpPayrollDetailsTemp.companyId = this.getcompany[0].id;
            adpPayrollDetailsTemp.companyName = this.getcompany[0].companyName;
            this.adpPayrollDetails = adpPayrollDetailsTemp;
          }
          this.isConnected = res.data.length;
        },
        () => {
          this.loading = false;
        }
      )
    );
  }

  /**
   * Navigates to the ADP payroll processing page for a specific company.
   *
   * @param item - The company details.
   */
  payroll(item: ICompanyDetailsItemADP) {
    if (item?.connectionStatus == 1) {
      this.alert.infoAlert({
        content: 'Please connect the company to view payroll'
      });
      return;
    }
    this.router.navigate([
      'manage/thirdparty_app/adp/adp-payroll',
      item.id,
      item.companyName
    ]);
  }

  /**
   * Handles the success callback after onboarding a company with ADP.
   *
   * @param isSuccess - Indicates whether onboarding was successful.
   */
  onBoardSuccess(isSuccess: boolean) {
    if (isSuccess) {
      this.passwordUpdated = 1;
    }
  }

  /**
   * Navigates to the ADP payroll transactions page.
   */
  goToTransactions() {
    this.router.navigate(['manage/thirdparty_app/adp/payroll-transactions']);
  }

  /**
   * Destroy component and unsubscribe from subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.scriptService.removeScript(['zsiqchatADP']);
  }
}
