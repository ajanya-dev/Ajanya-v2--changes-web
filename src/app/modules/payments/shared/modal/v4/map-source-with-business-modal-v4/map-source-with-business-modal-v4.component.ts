import { Component, inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize, take } from 'rxjs';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { IBankDropdown, IBusinessDetails } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  CVSourceType,
  IUserBusiness
} from 'src/app/modules/common-verification/model/common-verification';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NgClass, NgStyle } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  faBriefcase,
  faBuildings,
  faWallet,
  faBuildingColumns,
  faCircleCheck,
  faCircleXmark,
  faCircleExclamation,
  faHourglassEnd,
  IconDefinition
} from '@fortawesome/pro-solid-svg-icons';
import { IWalletData } from 'src/app/models/wallet';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import { LucideAngularModule, X } from 'lucide-angular';

interface IInjectData {
  type: 'wallet' | 'bank' | 'card';
  wallet?: IWalletData;
  bank?: IBankDropdown;
  card?: IExistingCreditCards;
  mapNow?: boolean;
  source?: 'wallet-funding' | null;
}

interface IStatusInfo {
  status: string;
  icon: IconDefinition;
  color: string;
}

@Component({
  selector: 'app-map-source-with-business-modal-v4',
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    NgClass,
    NgStyle,
    MatTooltip,
    CommonButtonV4Component,
    LucideAngularModule
  ],
  templateUrl: './map-source-with-business-modal-v4.component.html',
  styleUrl: './map-source-with-business-modal-v4.component.scss'
})
export class MapSourceWithBusinessModalV4Component implements OnInit {
  private verificationService = inject(CommonVerificationService);
  private alertService = inject(V4AlertService);
  public injectData = inject<IInjectData>(MAT_DIALOG_DATA);
  public dialogRef = inject(
    MatDialogRef<MapSourceWithBusinessModalV4Component>
  );

  public dialog = inject(MatDialog);
  public personaHelperService = inject(PersonaHelperService);
  public router = inject(Router);
  public walletService = inject(WalletService);
  private cardService = inject(CardPaymentService);

  businessDetails: IBusinessDetails[] = [];
  loading: boolean = true; // Start with loading state
  selectedBusiness: IUserBusiness;
  faBriefcase = faBriefcase;
  faBuildings = faBuildings;
  faWallet = faWallet;
  faBuildingColumns = faBuildingColumns;
  XIcon = X;
  selectedBusinessId: string | null = null;
  mapNow: boolean = false;
  isLoading: boolean = false;
  sourceWalletFunding: boolean = false;

  // Status mapping with v4 color classes
  STATUS: IStatusInfo[] = [
    {
      color: 'v4-common-yellow-color',
      status: 'Pending',
      icon: faHourglassEnd
    },
    {
      color: 'v4-common-blue-color',
      status: 'InReview',
      icon: faCircleExclamation
    },
    {
      color: 'v4-common-green-color',
      status: 'Approved',
      icon: faCircleCheck
    },
    {
      color: 'v4-common-red-color',
      status: 'Rejected',
      icon: faCircleXmark
    },
    {
      color: 'v4-common-violet-color',
      status: 'Partner Approved',
      icon: faCircleCheck
    }
  ];

  // Getters for template usage
  get isWalletType(): boolean {
    return this.injectData.type === 'wallet';
  }

  get isBankType(): boolean {
    return this.injectData.type === 'bank';
  }

  get isCardType(): boolean {
    return this.injectData.type === 'card';
  }

  get sourceIcon() {
    return this.isWalletType ? this.faWallet : this.faBuildingColumns;
  }

  get sourceName(): string {
    if (this.isWalletType && this.injectData.wallet) {
      return this.injectData.wallet.walletName;
    }
    if (this.isBankType && this.injectData.bank) {
      return this.injectData.bank.nickName || this.injectData.bank.bankName;
    }
    return '';
  }

  get sourceDetails(): string {
    if (this.isWalletType && this.injectData.wallet) {
      return `Balance: $${this.injectData.wallet.availableBalance}`;
    }
    if (this.isBankType && this.injectData.bank) {
      return `Account: ${this.formatAccountNumber(this.injectData.bank.accountNumber)}`;
    }
    return '';
  }

  ngOnInit(): void {
    this.getBusinessDetails();
    this.sourceWalletFunding = this.injectData.source === 'wallet-funding';
  }

  /**
   * Get status information for a business based on status number
   */
  getStatusInfo(statusNumber: number): IStatusInfo {
    if (statusNumber >= 0 && statusNumber < this.STATUS.length) {
      return this.STATUS[statusNumber];
    }
    return this.STATUS[0]; // Default to Pending if invalid status
  }

  /**
   * Check if business is selectable (status === 2 for Approved)
   */
  isBusinessSelectable(item: IUserBusiness): boolean {
    return this.isCardType ? item.status !== 3 : item.status === 2;
  }

  /**
   * What the two refusals name. A card takes any business that is not Rejected —
   * a pending one included — so saying "approved" there asked for a status the
   * rule does not require, over rows the list lets the user click.
   */
  get selectableStatusLabel(): string {
    return this.isCardType ? 'approved or pending' : 'approved';
  }

  /**
   * Format account number to show only last 4 digits
   */
  formatAccountNumber(accountNumber: string | number): string {
    const strAccountNumber = accountNumber.toString();
    if (strAccountNumber.length > 4) {
      return `****${strAccountNumber.slice(-4)}`;
    }
    return strAccountNumber;
  }

  /**
   * @description Fetches details of businesses.
   */
  getBusinessDetails(): void {
    this.loading = true;
    this.verificationService
      .getUserBusinesses()
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) this.businessDetails = res.data as IBusinessDetails[];
      });
  }

  /**
   * @description Selects a business and updates the corresponding properties and states.
   * @param item - The IUserBusiness object representing the selected business.
   */
  selectBusiness(item?: IUserBusiness) {
    // Check if business is selectable (status === 2 for Approved)
    if (
      !item ||
      (!this.isBusinessSelectable(item) && !this.sourceWalletFunding)
    ) {
      return;
    }

    if (item) {
      this.selectedBusinessId = item.id;
      this.selectedBusiness = item;
    }
  }

  /**
   * @description Maps selected business with wallet or bank
   */
  mapBusiness(): void {
    if (!this.selectedBusiness?.id) {
      this.alertService.warningAlert({
        content: `Please select an ${this.selectableStatusLabel} business before proceeding.`
      });
      return;
    }
    this.mapNow = this.injectData.mapNow || false;
    if (this.isCardType) {
      this.completeCardMapping(
        this.injectData.card?.cardId || '',
        this.selectedBusiness?.id || ''
      );
      return;
    }

    if (this.mapNow) {
      this.completeWalletMapping(
        this.injectData.wallet?.id || '',
        this.selectedBusiness?.id || ''
      );
    } else {
      this.dialogRef.close({
        success: true,
        business: this.selectedBusiness,
        sourceType: this.injectData.type,
        sourceId: this.isWalletType
          ? this.injectData.wallet?.id
          : this.injectData.bank?.id
      });
    }
  }

  completeWalletMapping(walletId: string, kybId: string) {
    this.isLoading = true;
    this.walletService
      .completeWalletMapping(walletId, kybId)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res: { success: boolean; message: string }) => {
        if (res.success) {
          this.dialogRef.close({
            success: true,
            business: this.selectedBusiness,
            sourceType: this.injectData.type,
            sourceId: this.isWalletType
              ? this.injectData.wallet?.id
              : this.injectData.bank?.id
          });
        }
      });
  }

  completeCardMapping(cardId: string, kybId: string) {
    this.isLoading = true;
    this.cardService
      .completeCardMapping(cardId, kybId)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res: { success: boolean; message: string }) => {
        if (res.success) {
          this.dialogRef.close({
            success: true,
            business: this.selectedBusiness,
            sourceType: this.injectData.type,
            sourceId: this.isWalletType
              ? this.injectData.wallet?.id
              : this.injectData.card?.cardId
          });
        }
      });
  }

  addNewBusiness(): void {
    if (environment.isV4Persona) {
      this.personaHelperService.openModal(
        'kyc_kyb',
        CVSourceType.add_new_business
      );
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
    this.dialogRef.close({ addNewBusiness: true });
  }
}
