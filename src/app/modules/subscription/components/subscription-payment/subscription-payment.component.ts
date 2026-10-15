import { of, Subscription } from 'rxjs';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import {
  IChoosePlan,
  ICurrentAddOns,
  IPayloadAddonData,
  IPaymentMethodList
} from 'src/app/modules/subscription/model/subscription';
import { PaymentSection } from 'src/app/data/data/subscription';
import {
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IBankDropdown } from 'src/app/models/bank';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgClass, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { faArrowLeft, faXmark, faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { Store } from '@ngrx/store';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { DropDownBankProComponent } from '../../../../shared/components/drop-downs/drop-down-bank-pro/drop-down-bank-pro.component';
import { CommonHelpButtonComponent } from '../../../../layout/v3-layout/common-help-button/common-help-button.component';
import { IV3DropDownOnReady } from 'src/app/models/common';

@Component({
  selector: 'app-subscription-payment',
  templateUrl: './subscription-payment.component.html',
  styleUrls: ['./subscription-payment.component.scss'],
  standalone: true,
  imports: [
    CommonHelpButtonComponent,
    MatTooltip,
    FaIconComponent,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    ControlMessageComponent,
    DropDownBankProComponent,
    CurrencyPipe,
    NgOptimizedImage,
    WalletDropdownV3Component
  ]
})
export class SubscriptionPaymentComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private fb = inject(FormBuilder);
  private subscriptionService = inject(SubscriptionService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private appSettingService = inject(AppSettingsService);
  private themeService = inject(ThemeService);
  private store = inject(Store);

  @Input() selected_plan_details: IChoosePlan;
  @Input() isFromTrial: number;
  @Output() onChoosePlan = new EventEmitter<IChoosePlan>();

  appConfig: IAppConfig;

  isDarkMode = signal(false);

  brandLogoUrl(): string {
    if (this.isDarkMode()) {
      return (
        this.appConfig?.whiteLogo ||
        this.appConfig?.zilMoneyLogo ||
        'assets/white_label/zilmoney/assets/app_logo_white.svg'
      );
    }
    return this.appConfig?.zilMoneyLogo || 'assets/main/zil_Money_logo.svg';
  }

  payWithWalletForm: FormGroup;
  payWithCheck: FormGroup;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  subscriptions: Subscription[] = [];
  selectedList: 'Card' | 'Wallet' | 'Check' = 'Card' as const;
  payTypeList: IPaymentMethodList[] = PaymentSection.payMethordList();
  currentEnvironmentUrl: string;
  loading = {
    httpCalling: false,
    securedLoading: true,
    loadingCard: false
  };

  editMode = false;
  changePaymentMode = false;
  changeCardPaymentMode = false;
  isItDownGrade = false;
  cardLink = this.sanitizer.bypassSecurityTrustResourceUrl('' as string);
  grandTotal: number;
  payloadAddonData: IPayloadAddonData[] = [];
  temporaryPayloadAddonData: IPayloadAddonData[] = [];
  currentPlanQuantity: number;
  currentPlanCode: string;
  isExistingDataLoaded = false;
  openWalletDropDown = signal(false);
  successUrl: string;
  faXmark = faXmark;
  faArrowLeft = faArrowLeft;
  faTriangleExclamation = faTriangleExclamation;
  defaultWalletId = signal<string>('');

  ngOnInit(): void {
    this.loadAppSettings();
    this.routingLogic();
    this.initFormGroups();
  }

  getCurrentQuantity() {
    this.subscriptions.push(
      this.subscriptionService.getCurrentPlans().subscribe((res) => {
        if (res) {
          this.addPayloadDataForAddons(res.data.subscription.addOn);
          if(res.data.subscription.paymentMethod==='paywith_wallet'){
            this.selectedList = 'Wallet';
            this.defaultWalletId.set(res.data.subscription.wallet_id);
          }
        }
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      document.querySelector('.secured_loading')?.classList?.add('remove');
    }, 3000);
  }

  routingLogic() {
    if (this.router.url === '/manage/subscription/plan/change-payment' || this.router.url === '/v4/manage/subscription/plan/change-payment') {
      this.changePaymentMode = true;
      this.changePaymentMethod();
      return;
    }

    if (
      this.router.url === '/manage/subscription/plan/change-payment/card' || this.router.url === '/v4/manage/subscription/plan/change-payment/card' ||
      this.router.url === '/manage/subscription/plan/change-payment/update-card' || this.router.url === '/v4/manage/subscription/plan/change-payment/update-card'
    ) {
      this.changeCardPaymentMode = true;
      this.selectedList = 'Card';
      this.addOrUpdateCard();
      return;
    }

    if (
      this.router.url === '/manage/subscription/plan/change' || this.router.url === '/v4/manage/subscription/plan/change' ||
      this.router.url === '/manage/subscription/plan/change-addon' || this.router.url === '/v4/manage/subscription/plan/change-addon'
    ) {
      this.editMode = true;
    }

    if (this.router.url === '/manage/subscription/plan/change-addon' || this.router.url === '/v4/manage/subscription/plan/change-addon') {
      this.getCurrentQuantity();
    } else {
      this.addPayloadDataForAddons();
    }
  }

  initFormGroups() {
    this.payWithWalletForm = this.fb.group({
      wallet: ['', [Validators.required]]
    });

    this.payWithCheck = this.fb.group({
      bankAccount: ['', [Validators.required]],
      signature: ['', [Validators.required]]
    });
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      })
    );

    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.subscriptions.push(
      this.themeService
        .getThemeSwitch()
        .subscribe((dark) => this.isDarkMode.set(dark))
    );
  }

  /**
   * Adding addons data to an array that we will
   * use to pass in payload
   */
  addPayloadDataForAddons(existingAddonData?: ICurrentAddOns[]) {
    const selectedAddons = this.selected_plan_details.data.selectedAddon;

    /**
     * Pushing existing addons to payload array
     */
    if (existingAddonData) {
      for (let i = 0; i < existingAddonData.length; i += 1) {
        const existingData = existingAddonData[i];

        const existingPayloadAddonData = {
          addonCode: existingData.addonCode,
          name: existingData.addOnDetails.addonName,
          price: existingData.addOnDetails.price,
          quantity: existingData.qnt
        };
        this.payloadAddonData.push(existingPayloadAddonData);
      }
    }

    /**
     * Here we are checking if the user has already
     * added the current addon, if yes then we are
     * updating the quantity to the existing quantity because
     * Zoho Subscriptions backend requires the data
     * to be sent this way. If addon is newly added
     * we are pushing it to `payloadAddonData`
     */
    if (selectedAddons) {
      for (let i = 0; i < selectedAddons.length; i += 1) {
        const currentlyChosenAddons = selectedAddons[i];

        let addonExists = false;

        for (let j = 0; j < this.payloadAddonData.length; j += 1) {
          const currentAddonsOnPayload = this.payloadAddonData[j];

          if (
            currentlyChosenAddons.details.addonCode ===
            currentAddonsOnPayload.addonCode
          ) {
            currentAddonsOnPayload.quantity += currentlyChosenAddons.quantity;
            addonExists = true;
            break;
          }
        }
        if (!addonExists) {
          const nonExistingAddonData = {
            addonCode: currentlyChosenAddons.details.addonCode,
            name: currentlyChosenAddons.details.addonName,
            price: currentlyChosenAddons.details.price,
            quantity: currentlyChosenAddons.quantity
          };
          this.temporaryPayloadAddonData.push(nonExistingAddonData);
        }
      }
    }

    this.payloadAddonData = [
      ...this.payloadAddonData,
      ...this.temporaryPayloadAddonData
    ];

    if (this.selected_plan_details.data.grandTotal) {
      this.grandTotal = this.selected_plan_details.data.grandTotal;
    }
    this.onSubmitCard();
  }

  goBack(): void {
    if (this.changePaymentMode || this.changeCardPaymentMode) {
      this.subscriptionService.goToDashBoard();
      return;
    }

    this.onChoosePlan.emit({
      success: true,
      data: {
        planCode: this.selected_plan_details?.data?.planCode,
        intervelType: this.selected_plan_details?.data?.intervelType,
        nextStep: 'billingAddress',
        selectedAddon: this.selected_plan_details?.data?.selectedAddon,
        allData: this.selected_plan_details?.data?.allData,
        billingAddress: this.selected_plan_details?.data?.billingAddress,
        grandTotal: this.selected_plan_details?.data?.grandTotal
      }
    });
  }

  createCardBody() {
    const plan = this.selected_plan_details?.data;
    const payload = {
      planCode: plan?.planCode,
      addOns: this.payloadAddonData,
      successPageUrl: `https://${window.location.host}/manage/subscription/completed`,
      billingAddress: plan?.billingAddress,
      isFromTrial: 0
    };

    if (this.isFromTrial) {
      payload.isFromTrial = this.isFromTrial;
    }

    return payload;
  }

  createWalletBody() {
    const plan = this.selected_plan_details?.data;
    return {
      planCode: plan?.planCode,
      addOns: this.payloadAddonData,
      billingAddress: plan?.billingAddress,
      wallet: this.payWithWalletForm.value.wallet?.uuId
    };
  }

  createCheckBody() {
    const plan = this.selected_plan_details?.data;
    const input = this.payWithCheck.value;

    return {
      planCode: plan?.planCode,
      addOns: this.payloadAddonData,
      billingAddress: plan?.billingAddress,
      bankAccountId: input.bankAccount,
      digitalSignature: input.signature
    };
  }

  onSubmitCard() {
    // Change payment method
    if (this.changeCardPaymentMode) {
      this.addOrUpdateCard();
      return;
    }

    // Change payment method
    if (this.changePaymentMode) {
      this.changePaymentMethod();
      return;
    }

    if (!this.editMode) {
      this.createSubscriptionCard();
    } else {
      this.updateSubscriptionCard();
    }
  }

  // Create Wallet
  createSubscriptionCard(): void {
    this.loading.loadingCard = true;

    this.subscriptions.push(
      this.subscriptionService
        .createSubscriptionCard(this.createCardBody())
        .pipe(
          finalize(() => {
            this.loading.loadingCard = false;
          }),
          catchError((e) => {
            if (e.error.errorCode === 200) {
              this.isItDownGrade = true;
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
              res?.data?.url as string
            );
          }
        })
    );
  }

  // Update Wallet
  updateSubscriptionCard(): void {
    this.loading.loadingCard = true;
    this.subscriptions.push(
      this.subscriptionService
        .updateSubscriptionCard(this.createCardBody())
        .pipe(
          finalize(() => {
            this.loading.loadingCard = false;
          }),
          catchError((e) => {
            if (e.error.errorCode === 200) {
              this.isItDownGrade = true;
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
              res?.message?.url as string
            );
          }
        })
    );
  }

  onSubmitWallet() { 
    this.payWithWalletForm.markAllAsTouched();

    if (this.payWithWalletForm.invalid) {
      return;
    }

    if (this.changePaymentMode) {
      // change payment method
      this.changePaymentWalletAndCheck('wallet');
      return;
    }

    if (!this.editMode) {
      this.createSubscriptionWallet();
    } else {
      this.updateSubscriptionWallet();
    }
  }

  // Create Wallet
  createSubscriptionWallet(): void {
    this.loading.httpCalling = true;

    this.subscriptions.push(
      this.subscriptionService
        .createSubscriptionWallet(this.createWalletBody())
        .pipe(
          finalize(() => {
            this.loading.httpCalling = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            // localStorage.setItem('isSubscribed', '1');
            this.store.dispatch(WalletsActions.walletsReset());
            this.headerService.setHeaderValueChanged(true);
            this.router.navigateByUrl(
              'manage/subscription/completed?paymentMethod=2'
            );
          }
        })
    );
  }

  // Update Wallet
  updateSubscriptionWallet(): void {
    this.loading.httpCalling = true;

    this.subscriptions.push(
      this.subscriptionService
        .updateSubscriptionWallet(this.createWalletBody())
        .pipe(
          finalize(() => {
            this.loading.httpCalling = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.store.dispatch(WalletsActions.walletsReset());
            this.router.navigateByUrl(
              'manage/subscription/completed?paymentMethod=2'
            );
          }
        })
    );
  }

  onSubmitCheck() {
    this.payWithCheck.markAllAsTouched();

    if (
      this.payWithCheck.invalid ||
      this.getElement('bankAccErr_msg').innerHTML
    ) {
      return;
    }

    if (this.changePaymentMode) {
      // change payment method
      this.changePaymentWalletAndCheck('check');
      return;
    }

    if (!this.editMode) {
      this.createSubscriptionCheck();
    } else {
      this.updateSubscriptionCheck();
    }
  }

  // Create Check
  createSubscriptionCheck(): void {
    this.loading.httpCalling = true;

    this.subscriptions.push(
      this.subscriptionService
        .createSubscriptionCheck(this.createCheckBody())
        .pipe(
          finalize(() => {
            this.loading.httpCalling = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.headerService.setHeaderValueChanged(true);
            this.router.navigate([
              'manage/subscription/completed?paymentMethod=3'
            ]);
          }
        })
    );
  }

  // Update Check
  updateSubscriptionCheck(): void {
    this.loading.httpCalling = true;
    this.subscriptions.push(
      this.subscriptionService
        .updateSubscriptionCheck(this.createCheckBody())
        .pipe(
          finalize(() => {
            this.loading.httpCalling = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.router.navigate([
              'manage/subscription/completed?paymentMethod=3'
            ]);
          }
        })
    );
  }

  // Change payment Type wallet and check
  changePaymentWalletAndCheck(type: string): void {
    const check = {
      type,
      bankAccount: this.payWithCheck.value.bankAccount,
      signature: this.payWithCheck.value.signature
    };

    const wallet = {
      type,
      wallet: this.payWithWalletForm.value.wallet?.uuId
    };

    const bodyType = type === 'check' ? check : wallet;
    this.loading.httpCalling = true;

    this.subscriptionService
      .updatePaymentCheckAndWallet(bodyType)
      .pipe(
        finalize(() => {
          this.loading.httpCalling = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          if (type === 'wallet') {
            this.store.dispatch(WalletsActions.walletsReset());
          }
          this.openSuccessAlert('Payment method updated');
          this.router.navigate(['manage/subscription/dashboard']);
        }
      });
  }

  addOrUpdateCard(): void {
    this.loading.loadingCard = true;

    if (this.router.url.includes('update-card')) {
      this.successUrl = `https://${window.location.host}/manage/subscription/update-card/completed?type=1`;
    } else {
      this.successUrl = `https://${window.location.host}/manage/subscription/completed?type=1`;
    }
    this.subscriptionService
      .updateCard({ successPageUrl: this.successUrl })
      .pipe(
        finalize(() => {
          this.loading.loadingCard = false;
        }),
        catchError((e) => {
          if (e.error.errorCode === 200) {
            this.isItDownGrade = true;
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
            res?.data?.url as string
          );
        }
      });
  }

  changePaymentMethod(): void {
    this.loading.loadingCard = true;
    this.subscriptionService
      .updatePaymentCard()
      .pipe(
        finalize(() => {
          this.loading.loadingCard = false;
        }),
        catchError((e) => {
          if (e.error.errorCode === 200) {
            this.isItDownGrade = true;
          }
          return of(false);
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.cardLink = this.sanitizer.bypassSecurityTrustResourceUrl(
            res?.data?.url as string
          );
        }
      });
  }

  onBankChange(ev: IBankDropdown): void {
    const errEl = this.getElement('bankAccErr_msg');
    this.payWithCheck.controls.bankAccount.markAsTouched();
    this.payWithCheck.patchValue({ bankAccount: ev?.id });

    if (ev?.id && ev?.verified === 0) {
      errEl.innerHTML = 'This bank account is not verified.';
      errEl.style.display = 'block';
    } else {
      errEl.innerHTML = '';
      errEl.style.display = 'none';
    }
  }

  onClose(): void {
    if (this.changePaymentMode || this.changeCardPaymentMode) {
      this.subscriptionService.goToDashBoard();
      return;
    }

    this.subscriptionService.closeSubscriptionPage();
  }

  getElement(el: string): HTMLElement {
    return document.getElementById(el) as HTMLElement;
  }
  
  handleDropdownOpenChange(isOpen: boolean) {
    this.openWalletDropDown.set(isOpen)
  }

  showPaymentArea(title: 'Card' | 'Wallet' | 'Check') {
    this.selectedList = title;
    this.payWithWalletForm.markAsUntouched();
    this.payWithCheck.markAsUntouched();
    this.openWalletDropDown.set(false);
  }

  openWarningAlert(content: string) {
    return this.alertService.warningAlert({ content });
  }

  openSuccessAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  autoPopulateDropdown(
    ev: IV3DropDownOnReady,
  ) {
    if (
      ev.setItemWithId &&
      this.defaultWalletId()
    ) {
      ev.setItemWithId(this.defaultWalletId());
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
