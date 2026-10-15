import {
  PaymentData,
  TPageId
} from './../../../../../modules/payments/shared/components/payments-main-v35/payments-data-v35';
import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { BehaviorSubject, Subscription, finalize } from 'rxjs';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from '../../../alert/alert.service';
import { PaymentsService } from '../../../payments/payments.service';
import { CompanyManagementService } from '../../../company/company-management.service';
import { Utils } from 'src/app/data/utils';
import { Router } from '@angular/router';
import { V4AlertService } from '../../../alert/v4-alert.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeAccessService {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private paymentsService = inject(PaymentsService);
  private companyManagementService = inject(CompanyManagementService);
  private router = inject(Router);
  private utils = Utils;
  internationalWireEnabled: number;
  isPaymentWireTransferEnabled = signal(false);

  private disabledMethods: ReturnType<
    typeof PaymentData.enablePaymentMethods
  >[string][] = [];

  public disabledMethods$: BehaviorSubject<
    ReturnType<typeof PaymentData.enablePaymentMethods>[string][]
  > = new BehaviorSubject(
    [] as ReturnType<typeof PaymentData.enablePaymentMethods>[string][]
  );

  private pageId?: TPageId;
  private enablePaymentMethods?: ReturnType<
    typeof PaymentData.enablePaymentMethods
  >;

  private isAlertOpened = false;
  public isDisabledPaymentSelected$ = new BehaviorSubject<
    false | ReturnType<typeof PaymentData.enablePaymentMethods>[string]
  >(false);

  public isDisabledPaymentsLoadingSignal: WritableSignal<boolean | undefined> =
    signal(false);
    
  private subscriptions: Subscription[] = [];
  private awaitingToValidate:
    | undefined
    | ReturnType<typeof PaymentData.enablePaymentMethods>[string] = undefined;

  initialize(config: { pageId?: TPageId }) {
    if (this.pageId === config.pageId) return;
    this.enablePaymentMethods = PaymentData.enablePaymentMethods(config.pageId);

    if (this.disabledMethods.length <= 0) {
      this.getAvailablePayments();
    }
    this.subscriptions.push(
      this.companyManagementService.getCompanyChange$.subscribe((res) => {
        if (res) {
          this.getAvailablePayments();
        }
      })
    );
  }

  /**
   * @description Opens alert modal for contacting customer support to enable the feature.
   */
  openAlertMessage(
    payAsItemId?: ReturnType<typeof PaymentData.enablePaymentMethods>[string],
    isV4: boolean = false
  ): void {
    if (this.router.url.includes('/manage/payments-table/index')) {
      return;
    }
    this.isAlertOpened = true;
    const data = {
      content: this.getContentMessage(payAsItemId),
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    
    const dialog = isV4 ? this.v4AlertService.infoAlert(data) : this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      this.isAlertOpened = false;
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }else{
        this.isDisabledPaymentSelected$.next(false);
      }
    });
  }

  private getContentMessage(payAsItemId: string | undefined): string {
    if (!payAsItemId) {
      return 'Please contact our customer support to enable this feature.';
    }
  
    let transferType: string;
    switch (payAsItemId) {
      case 'rtp':
        transferType = 'RTP';
        break;
      case 'international-payment':
        transferType = 'International Payment';
        break;
      case 'card-wire-transfer':
      case 'wallet-wire':
        transferType = 'Wire';
        break;
      default:
        transferType = this.utils.capitalize(payAsItemId);
    }
  
    return `${transferType} transfer is not enabled for this account. Please contact the support team to enable it.`;
  }
  

  /**
   * @description invoked on input value changes and validate the selected input. and return boolean based on the access, if access is denied then return false
   */
  onInputChanges(
    paymentType: ReturnType<typeof PaymentData.enablePaymentMethods>[string],
    config: { disableAlert: boolean } = { disableAlert: false },
    continueToProcessPayments?: boolean,
    isV4: boolean = false
  ): boolean {
    if (this.disabledMethods.length <= 0) {
      this.awaitingToValidate = paymentType;
    }
    if (
      this.disabledMethods.includes(paymentType) &&
      paymentType !== 'check_mail'
    ) {
      if (!this.isAlertOpened && !config.disableAlert && !continueToProcessPayments) {
        this.openAlertMessage(paymentType, isV4);
      }
      this.isDisabledPaymentSelected$.next(paymentType);
      return false;
    }
    return true;
  }

  openComingSoonMessage() {
    this.alertService.infoAlert({ content: 'Coming Soon!', close: true });
  }

  /**
   * Retrieves and processes available payment methods, disabling those that are specified in the response.
   *
   * @description
   * This method makes an call to the paymentsService to get information about disabled payments.
   * It updates the state of the component to reflect the disabled payment methods.
   *
   * @example
   * getAvailablePayments();
   */
  private getAvailablePayments(): void {
    this.isDisabledPaymentsLoadingSignal.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getDisablePayments()
        .pipe(
          finalize(() => {
            this.isDisabledPaymentsLoadingSignal.set(false);
          })
        )
        .subscribe((res) => {
          if (res?.data && this.enablePaymentMethods) {
            this.disabledMethods = [];
            const paymentMethodStatusArray = Object.entries(res.data);
            const enabledPaymentMethodsArray = Object.keys(
              this.enablePaymentMethods
            );
            paymentMethodStatusArray.forEach((item) => {
              const [paymentMethod, enabledStatus] = item;
              if (
                enabledStatus === 0 &&
                enabledPaymentMethodsArray.includes(paymentMethod) &&
                this.enablePaymentMethods?.[paymentMethod]
              ) {
                this.disabledMethods.push(
                  this.enablePaymentMethods[paymentMethod]
                );
              }
            });
            this.internationalWireEnabled = res?.data.internationalWireEnabled;
            this.isPaymentWireTransferEnabled.set(res?.data.isPaymentWireTransferEnabled === 1 || res?.data.isCardRailPaymentWireTransferEnabled === 1);
            this.disabledMethods$.next(this.disabledMethods);
            if (this.awaitingToValidate && this.disabledMethods.length) {
              this.onInputChanges(this.awaitingToValidate);
              this.awaitingToValidate = undefined;
            }
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.isDisabledPaymentsLoadingSignal.set(undefined);
    this.disabledMethods = [];
  }
}
