import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Signal, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize, Observable, Subject, Subscription, debounceTime, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';

import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IBusinessDetails } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  CVSourceType,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { environment } from 'src/environments/environment';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { PayrollService } from 'src/app/modules/payroll-by-card/services/payroll.service';
import { IWalletRoot, IWalletData, IKybRecords } from 'src/app/models/wallet';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { VirtualCardService } from 'src/app/modules/virtual-card/services/virtual-card.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { WalletMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-multi-select-dropdown-v4/wallet-multi-select-dropdown-v4.component';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal';
import { ESignModalComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/e-sign-modal/e-sign-modal.component';
import { V4RainTermsConditionComponent } from 'src/app/shared/modal/v4-rain-terms-condition/v4-rain-terms-condition.component';

interface DialogData {
  sourceType?: CVSourceType;
  source?: CVSourceType;
  from?: string;
  applicationStatus: { kycStatus: number; kybStatus: number };
  walletNeeded?: boolean;
  mode?: 'map' | 'onboard' | 'home';
  kybRecords: IKybRecords[];
}

@Component({
  selector: 'app-raincard-select-business-v4',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    WalletMultiSelectDropdownV4Component,
    LucideAngularModule
  ],
  templateUrl: './raincard-select-business-v4.component.html',
  styleUrl: './raincard-select-business-v4.component.scss'
})
export class RaincardSelectBusinessV4Component implements OnInit, OnDestroy {
  // Services
  private readonly walletService = inject(WalletService);
  private readonly verificationService = inject(CommonVerificationService);
  private readonly alertService = inject(V4AlertService);
  private readonly virtualCardService = inject(VirtualCardService);
  private readonly gettingStartedService = inject(GettingStartedService);
  private readonly personaHelperService = inject(PersonaHelperService);
  private readonly payrollService = inject(PayrollService);
  private readonly router = inject(Router);
  public readonly walletDataService = inject(WalletDataV35Service);
  private readonly dialog = inject(MatDialog);
  public readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private readonly dialogRef = inject(MatDialogRef<RaincardSelectBusinessV4Component>);

  // State
  private readonly subscriptions: Subscription[] = [];
  private readonly destroySearch$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Public state
  public businessDetails: IBusinessDetails[] = [];
  public loading = false;
  public isOtherBusinessSelected = false;
  public selectedBusiness: IUserBusiness | undefined;
  public selectedBusinessValue: string = ''; // For dropdown ngModel
  public selectedWalletValue: IWalletData[] = []; // For wallet dropdown ngModel
  public isSolidBusiness: boolean;
  public esignAccepted = false;
  public termsAccepted = false;
  public termsAccepted5 = false;
  public termsAccepted6 = false;
  public isDialogOpen = false;
  public isWalletEnabled = signal<boolean>(false);
  public selectedWallets = new FormControl<string[]>([]);
  public sampleWallets: Signal<IWalletRoot | undefined>;
  public selectedBusinessId: string | null = null;
  public selectedWalletIds: string[] = [];
  public searchTerm = signal('');
  public scrollCount = 1;
  public walletData$: Observable<IWalletRoot>;
  public currentSearch = '';
  public isLoading = signal(false);
  public showTerms = signal(true);

  // Icons
  public readonly XIcon = X;

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchSubscription();
    this.syncWalletSelection();
  }

  private initializeComponent(): void {
    this.isWalletEnabled.set(Boolean(this.data.walletNeeded));
    if (this.data.walletNeeded && this.data.mode !== 'map') {
      this.showTerms.set(false);
    }
    this.getBusinessDetails();
    if (this.isWalletEnabled()) {
      this.getWalletDetails();
    }
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroySearch$))
      .subscribe((searchTerm) => {
        this.currentSearch = searchTerm;
        this.scrollCount = 1;
        this.walletDataService.walletAccountsLisCardDatatSignal.set([]);
        this.walletDataService.setWalletsForWalletenabled(
          this.scrollCount,
          searchTerm,
          this.data.from === 'iframe'
        );
      });
  }

  private syncWalletSelection(): void {
    const walletData = this.walletDataService.walletAccountsLisCardDatatSignal();
    this.selectedWalletValue =
      walletData?.filter((wallet) => this.selectedWalletIds.includes(wallet.id)) || [];
  }

  private getBusinessDetails(): void {
    this.subscriptions.push(
      this.verificationService.getUserBusinesses().subscribe((res) => {
        if (res.success) this.businessDetails = res.data as IBusinessDetails[];
      })
    );
  }

  private validateTermsAndConditions(): boolean {
    if (
      this.showTerms() &&
      (!this.esignAccepted ||
        !this.termsAccepted ||
        !this.termsAccepted5 ||
        !this.termsAccepted6)
    ) {
      this.alertService.warningAlert({
        content: 'Please accept the terms and conditions before proceeding.'
      });
      return false;
    }
    return true;
  }

  private validateBusinessSelection(): boolean {
    if (!this.selectedBusiness?.id && !this.isOtherBusinessSelected) {
      this.alertService.warningAlert({
        content: 'Please select a business before proceeding.'
      });
      return false;
    }
    return true;
  }

  private validateWalletSelection(): boolean {
    if (this.selectedWalletIds.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select a wallet before proceeding.'
      });
      return false;
    }
    return true;
  }

  private validateKybStatus(): boolean {
    const records = this.walletDataService.userKybRecordsSignal().length
      ? this.walletDataService.userKybRecordsSignal()
      : this.data.kybRecords || [];

    const record = records.find((rec) => rec.id === this.selectedBusiness?.id);

    if (record?.status === 'rejected') {
      this.alertService.warningAlert({
        content:
          'Verification rejected for this business. Please select another business.'
      });
      return false;
    }
    return true;
  }

  private handleCompletedKyb(): void {
    if (this.data?.from === 'iframe' || this.data?.from === 'home') {
      this.mapWalletToBusiness();
    } else {
      this.navigateToCreateCard();
    }
  }

  private mapWalletToBusiness(): void {
    const walletId = this.isWalletEnabled()
      ? this.selectedWalletIds
      : [this.walletDataService.walletDataSignal()?.id].filter(
          (id): id is string => id !== undefined
        );

    if (walletId.length === 0) {
      this.alertService.warningAlert({
        content: 'No wallet selected. Please try again.',
        timeout: 3000
      });
      return;
    }

    const payload = {
      businessId: this.selectedBusinessId as string,
      walletId
    };

    this.loading = true;
    this.virtualCardService
      .mapWalletToBusiness(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((val: { success: boolean }) => {
        if (val.success) {
          this.dialogRef.close({
            success: true,
            proceedPayment: this.data?.from === 'home'
          });
        }
      });
  }

  private navigateToCreateCard(): void {
    this.dialogRef.close();
    this.router.navigate(['/manage/wallet/card/create-card'], {
      queryParams: {
        walletId: this.walletDataService.walletDataSignal()?.uuId,
        businessId: this.selectedBusiness?.id
      }
    });
  }

  private applyCardForBusiness(): void {
    const walletId = this.isWalletEnabled()
      ? this.selectedWalletIds[0]
      : this.walletDataService.walletDataSignal()?.id;

    if (!walletId) {
      this.alertService.warningAlert({
        content: 'No wallet selected. Please try again.',
        timeout: 3000
      });
      return;
    }

    const businessId = this.selectedBusiness?.id;
    if (!businessId) {
      this.alertService.warningAlert({
        content: 'Please select a business before proceeding.'
      });
      return;
    }

    const relatedWallets = this.isWalletEnabled()
      ? this.selectedWalletIds.filter((item) => item !== walletId)
      : [];

    this.loading = true;
    this.subscriptions.push(
      this.walletService
        .applyCard(businessId, walletId, relatedWallets)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.dialogRef.close({ success: true });
            this.alertService.successAlert({
              content:
                'Your application has been submitted successfully. Access to your card request will be granted upon approval.',
              timeout: 3000
            });
          }
        })
    );
  }

  applyCard(): void {
    if (!this.validateTermsAndConditions()) return;
    if (!this.validateBusinessSelection()) return;
    if (this.isWalletEnabled() && !this.validateWalletSelection()) return;
    if (!this.validateKybStatus()) return;

    if (this.isOtherBusinessSelected) {
      this.addNewBusiness();
      return;
    }

    const records = this.walletDataService.userKybRecordsSignal().length
      ? this.walletDataService.userKybRecordsSignal()
      : this.data.kybRecords || [];

    const record = records.find((rec) => rec.id === this.selectedBusiness?.id);

    if (record?.status === 'completed') {
      this.handleCompletedKyb();
      return;
    }

    this.applyCardForBusiness();
  }

  addNewBusiness() {
    if (this.data?.applicationStatus?.kycStatus === 3) {
      this.alertService.warningAlert({
        content:
          'Your KYC application has been declined, and as a result, you are ineligible to apply for KYB at this time.'
      });
      return;
    }
    this.customDoubleSideModalService.closeAll();
    if (environment.isV4Persona) {
      const isKycVerifed =
        this.gettingStartedService.gettingStartedData.isKycStatusDone;
      if (!isKycVerifed) {
        this.personaHelperService.openModal('kyc').subscribe((res) => {
          if (res?.data.inquiry_type === 'kyb') {
            this.payrollService.openBusinessListModal();
          }
        });
      } else {
        this.personaHelperService
          .openModal('kyb', CVSourceType.add_new_business)
          .subscribe((res) => {
            if (res?.data?.inquiry_id) {
              this.payrollService.openBusinessListModal();
            }
          });
      }
    } else {
      this.router.navigate(['/manage/users/verify-user-id'], {
        queryParams: {
          type: CVSourceType.add_new_business,
          from: this.data?.from
        }
      });
    }
    this.dialogRef.close();
  }

  selectBusiness(businessId: string): void {
    if (!businessId) {
      this.isOtherBusinessSelected = true;
      this.selectedBusiness = undefined;
      this.selectedBusinessId = null;
      return;
    }

    const selectedBusinessData = this.businessDetails.find(
      (business) => business.id === businessId
    );

    if (!selectedBusinessData) {
      this.alertService.warningAlert({
        content: 'Selected business not found. Please try again.'
      });
      return;
    }

    if (selectedBusinessData.status === 3) {
      this.alertService.warningAlert({
        content: 'This business has been declined. Please select another business.'
      });
      return;
    }

    this.selectedBusinessId = selectedBusinessData.id;
    this.selectedBusiness = selectedBusinessData as IUserBusiness;
    this.isOtherBusinessSelected = false;
    this.isSolidBusiness = false;
  }

  openTermsDialog(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openDialog();
  }

  onCheckboxChange(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isDialogOpen) {
      this.openDialog();
    }
  }

  openDialog() {
    if (this.isDialogOpen) return;
    this.isDialogOpen = true;
    this.dialog
      .open(V4RainTermsConditionComponent, {
        width: '600px',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        this.termsAccepted = !!res;
      });
  }

  closeEsignModal(): void {
    this.dialogRef.close();
  }

  openEsignModal(): void {
    this.dialog.open(ESignModalComponent, {
      width: '70%',
      height: '80%',
      disableClose: false
    });
  }

  openPrivacyPolicy(event: MouseEvent) {
    event.stopPropagation();
    window.open('https://zilmoney.com/privacy-policy', '_blank');
  }

  getWalletDetails(): void {
    this.walletDataService.setWallets(1, this.data?.from === 'iframe', true);
  }

  selectWallets(wallets: IWalletData[]): void {
    this.selectedWalletIds = wallets?.map((wallet) => wallet.id) || [];
    this.selectedWalletValue = wallets || [];
  }

  searchWallet(searchTerm: string) {
    this.currentSearch = searchTerm;
    this.scrollCount = 1;
    this.walletDataService.setWalletsForWalletenabled(
      this.scrollCount,
      this.currentSearch
    );
  }

  onScrollToEnd() {
    this.scrollCount += 1;
    this.walletDataService.setWalletsForWalletenabled(
      this.scrollCount,
      this.currentSearch
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
    this.destroySearch$.next();
    this.destroySearch$.complete();
  }
}

