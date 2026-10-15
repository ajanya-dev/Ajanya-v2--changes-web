import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import {
  debounceTime,
  finalize,
  Observable,
  Subject,
  Subscription,
  takeUntil
} from 'rxjs';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IBusinessDetails } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  CVSourceType,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { PayrollService } from 'src/app/modules/payroll-by-card/services/payroll.service';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  faBriefcase,
  faBuildings,
  faX,
  faCreditCard,
  faNoteSticky,
  faFileContract,
  faWallet,
} from '@fortawesome/pro-solid-svg-icons';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IWalletRoot, IWalletData } from 'src/app/models/wallet';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { RainTermsConditionComponent } from '../rain-terms-condition/rain-terms-condition.component';
import { ESignModalComponent } from '../e-sign-modal/e-sign-modal.component';
import { VirtualCardService } from '../../../../virtual-card/services/virtual-card.service';
import { IKybRecords } from '../../../../../models/wallet';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { DropDownWalletMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet-multi-select/drop-down-wallet-multi-select.component';
import { faCirclePlus } from '@fortawesome/pro-regular-svg-icons';

interface DialogData {
  source: CVSourceType;
  from?: string;
  applicationStatus: { kycStatus: number; kybStatus: number };
  walletNeeded?: boolean;
  mode?: 'map' | 'onboard' | 'home';
  kybRecords: IKybRecords[];
}

@Component({
  selector: 'app-existing-business',
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    NgClass,
    MatTooltip,
    FormsModule,
    MatSelectModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    ScrollToEndDirective,
    V35CommonDropDownSelectorComponent,
    DropDownWalletMultiSelectComponent

  ],
  templateUrl: './raincard-select-business.component.html',
  styleUrl: './raincard-select-business.component.scss'
})
export class RainCardSelectBusinessComponent implements OnInit, OnDestroy {
  // Services
  private readonly walletService = inject(WalletService);
  private readonly verificationService = inject(CommonVerificationService);
  private readonly alertService = inject(AlertService);
  private readonly virtualCardService = inject(VirtualCardService);
  private readonly gettingStartedService = inject(GettingStartedService);
  private readonly personaHelperService = inject(PersonaHelperService);
  private readonly payrollService = inject(PayrollService);
  private readonly router = inject(Router);
  public readonly walletDataService = inject(WalletDataV35Service);
  private readonly dialog = inject(MatDialog);
  private readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RainCardSelectBusinessComponent>
  );

  // State
  private readonly subscriptions: Subscription[] = [];
  private readonly destroySearch$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Public state
  public businessDetails: IBusinessDetails[] = [];
  public loading = false;
  public isOtherBusinessSelected = false;
  public selectedBusiness: IUserBusiness;
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
  public readonly faX = faX;
  public readonly faBriefcase = faBriefcase;
  public readonly faWallet = faWallet;
  public readonly faBuildings = faBuildings;
  public readonly faCreditCard = faCreditCard;
  public readonly faNoteStickey = faNoteSticky;
  public readonly faFileContract = faFileContract;
  public readonly faCirclePlus = faCirclePlus;

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
    // Sync the dropdown value with the selected wallet IDs
    const walletData = this.walletDataService.walletAccountsLisCardDatatSignal();
    this.selectedWalletValue = walletData?.filter(wallet => 
      this.selectedWalletIds.includes(wallet.id)
    ) || [];
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
      .subscribe((val) => {
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

    const relatedWallets = this.isWalletEnabled()
      ? this.selectedWalletIds.filter((item) => item !== walletId)
      : [];

    this.loading = true;
    this.subscriptions.push(
      this.walletService
        .applyCard(this.selectedBusiness?.id, walletId, relatedWallets)
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

  /**
   * @description Handles adding a new business.
   */
  addNewBusiness() {
    if (this.data?.applicationStatus?.kycStatus === 3) {
      this.alertService.warningAlert({
        content:
          'Your KYC application has been declined, and as a result, you are ineligible to apply for KYB at this time.'
      });
      return;
    }
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

  /**
   * @description Selects a business from the dropdown and updates the corresponding properties and states.
   * @param businessId - The selected business ID from the dropdown.
   */
  selectBusiness(businessId: string): void {
    if (!businessId) {
      this.isOtherBusinessSelected = true;
      this.selectedBusiness = undefined as any;
      this.selectedBusinessId = null;
      return;
    }

    // Find the selected business from the business details
    const selectedBusinessData = this.businessDetails.find(
      (business) => business.id === businessId
    );

    if (!selectedBusinessData) {
      this.alertService.warningAlert({
        content: 'Selected business not found. Please try again.'
      });
      return;
    }

    // Check if business status is valid (not declined)
    if (selectedBusinessData.status === 3) {
      this.alertService.warningAlert({
        content: 'This business has been declined. Please select another business.'
      });
      return;
    }

    // Update component state
    this.selectedBusinessId = selectedBusinessData.id;
    this.selectedBusiness = selectedBusinessData as IUserBusiness;
    this.isOtherBusinessSelected = false;
    this.isSolidBusiness = false; // Default to false since is_solid property doesn't exist in IBusinessDetails
  }

  openTermsDialog(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openDialog();
  }

  onCheckboxChange(event: Event): void {
    // Prevent default checkbox behavior
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
      .open(RainTermsConditionComponent, {
        width: '600px',
        panelClass: 'plaid-modal',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        if (res) {
          this.termsAccepted = true;
        } else {
          this.termsAccepted = false;
        }
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
    event.stopPropagation(); // prevents the label click from firing
    window.open('https://zilmoney.com/privacy-policy', '_blank');
  }

  /**
   * @description fetches already existing wallets.
   */

  getWalletDetails(): void {
    // this.sampleWallets  = this.walletDataService.walletAccountsSignal;
    this.walletDataService.setWallets(1, this.data?.from === 'iframe',true);
  }

  /**
   * @description Handles wallet selection from the dropdown.
   * @param walletIds - Array of selected wallet IDs from the dropdown.
   */
  selectWallets(wallets: IWalletData[]): void {
    this.selectedWalletIds = wallets?.map(wallet => wallet.id) || [];
    this.selectedWalletValue = wallets || [];
  }

  addWallet(item: string) {
    if (this.selectedWalletIds.includes(item)) {
      this.selectedWalletIds = this.selectedWalletIds.filter(
        (wallet) => wallet !== item
      );
    } else {
      this.selectedWalletIds.push(item);
    }
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
