import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, DestroyRef, OnInit, Signal, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IBankDropdown } from 'src/app/models/bank';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { finalize, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { NgClass } from '@angular/common';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule } from 'lucide-angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { MaintenanceAlertModalV4Component } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal-v4.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ConfirmPayrollModalV4Component } from '../confirm-payroll-modal-v4/confirm-payroll-modal-v4.component';
import { PayrollSummaryModalV4Component } from '../payroll-summary-modal-v4/payroll-summary-modal-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { PayrollStatementVerificationV4Component } from '../payroll-statement-verification-v4/payroll-statement-verification-v4.component';
import { WireRoutingUpdateModalV4Component } from '../../modal/wire-routing-update-modal-v4/wire-routing-update-modal-v4.component';

@Component({
  selector: 'app-v4-payroll-action',
  templateUrl: './v4-payroll-action.component.html',
  styleUrls: ['./v4-payroll-action.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    MatMenuModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4PayrollActionComponent implements AgRendererComponent, OnInit {
  private dialog = inject(MatDialog);
  private payrollService = inject(PayrollService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);
  params: ICellRendererParams;
  commonTransactionTableRowData: ICommonTransactionTableData;
  // One renderer, two columns: the left-pinned Actions column draws the kebab
  // menu and the right-pinned Status column draws the badge / Confirm Payment
  // button.
  // Splitting it into two components would duplicate validateBankAndCard().
  mode: 'view' | 'status' = 'status';
  status: number;
  statusText: string;
  grossPay: number;
  isManual = false;
  isDeleted = false;
  selectedPayrollId: string;
  isKycKybBypassed?: boolean;
  param: ICellRendererParams;
  kycCompleted: Signal<number | undefined>;
  creditCardMaintenanceMessage: string;
  headerData: IHeaderData;
  personaVerify?: () => void;

  refresh(): boolean {
    return true;
  }

  agInit(
    params: ICellRendererParams & {
      kycCompleted: Signal<number | undefined>;
      personaVerify: () => void;
      mode?: 'view' | 'status';
    }
  ) {
    this.param = params;
    this.mode = params.mode ?? 'status';
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
      this.status = params.data.status;
      this.getStatusText();
    }
    this.kycCompleted = params.kycCompleted;
    this.personaVerify = params.personaVerify;
  }

  ngOnInit(): void {
    this.isManual = !!this.payrollService.selectedApp?.manual;
    this.getHeaderData();
  }

  /**
   * Method for getting user header data
   */
  getHeaderData() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.headerData = res as IHeaderData;
        this.creditCardMaintenanceMessage =
          this.headerData.cardPaymentMaintananceMessage || '';
        if (this.headerData.kybBypassedUser === 1) {
          this.isKycKybBypassed = true;
        }
      });
  }

  getStatusText() {
    switch (this.status) {
      case 1:
        this.statusText = 'Processing';
        break;
      case 2:
        this.statusText = 'Completed';
        break;
      case 4:
        this.statusText = 'Failed';
        break;
      case 5:
        this.statusText = 'Automatic Payment';
        break;
      case 6:
        this.statusText = 'Rejected';
        break;
      default:
        break;
    }
  }

  /**
   *
   * @description - Initiates the payroll processing.
   */
  async runPayroll() {
    const isValid = await this.validateBankAndCard();
    if (!isValid) return;
    this.openConfirmationModal('Pay');
  }

  private async validateBankAndCard(): Promise<boolean> {
    if (this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0) {
      this.openMaintainenceModal();
      return false;
    }

    if (this.payrollService.isWireRoutingSkipped()) {
      const dialogRef = this.dialog.open(WireRoutingUpdateModalV4Component, {
        maxWidth: '550px',
        width: '93%',
        data: { bankAc: this.payrollService.selectedPayrollBank() },
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      });
      dialogRef.afterClosed().subscribe((wireRoutingAdded) => {
        if (wireRoutingAdded) {
          this.payrollService.isWireRoutingSkipped.set(false);
          this.runPayroll();
        }
      });
    }
    if (this.payrollService.isWireRoutingSkipped()) {
      return false;
    }
    if (
      !this.kycCompleted() &&
      this.kycCompleted() !== 0 &&
      !this.isKycKybBypassed
    ) {
      if (this.personaVerify) {
        this.personaVerify();
      }
      return false;
    }

    if (this.kycCompleted() === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return false;
    }
    const { selectedBank, selectedCardId } = this.payrollService;

    if (this.payrollService.isSelectedPaymentDisabled) {
      this.payrollService.checkPaymentMethodAllowedToUse.next(true);
      return false;
    }

    // Both missing is the first-run case, where naming only one of them sends
    // the user back for a second warning as soon as they fix it.
    if (!selectedBank && !selectedCardId) {
      this.alertService.warningAlert({
        content:
          'Select a bank account and a credit card before confirming this payment.'
      });
      return false;
    }

    if (!selectedBank) {
      this.alertService.warningAlert({
        content: 'Please Select a Bank Account'
      });
      return false;
    }

    if (!selectedCardId) {
      this.alertService.warningAlert({ content: 'Please Select a Card' });
      return false;
    }

    const microDepositCondition =
      (selectedBank as IBankDropdown).verifiedBy === 3 &&
      (selectedBank as IBankDropdown).achApplicationStatus !== 1;
    const approvalPendingCondition =
      (selectedBank as IBankDropdown).verifiedBy === 4 &&
      (selectedBank as IBankDropdown).achApplicationStatus !== 1;
    const verifyInstantlyOnly =
      ((selectedBank as IBankDropdown).verifiedBy === 12 ||
        (selectedBank as IBankDropdown).verifiedBy === 6) &&
      (selectedBank as IBankDropdown).achApplicationStatus !== 1;
    if (verifyInstantlyOnly) {
      const data = {
        title: 'Error',
        content: 'Please verify your bank account',
        doneMsg: 'Verify Now',
        cancelMsg: 'Cancel',
        isCancel: true
      };
      const res = this.alertService.warningAlert(data);
      res.afterClosed().subscribe((resp) => {
        if (resp) {
          this.verifyInstantly();
        }
      });
      return false;
    }
    if (microDepositCondition || approvalPendingCondition) {
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return false;
    }
    if ((selectedBank as IBankDropdown).verified === 0) {
      const verifyData = {
        title: 'Error',
        content: 'Please verify your bank account',
        doneMsg: 'Verify Now',
        cancelMsg: 'Cancel',
        isCancel: true
      };
      const verifyRef = this.alertService.warningAlert(verifyData);
      verifyRef.afterClosed().subscribe((result) => {
        if (result) {
          this.dialog.open(BankVerificationModalV4Component, {
            panelClass: 'paddingless-modal',
            width: '448px',
            maxWidth: '95vw',
            data: {
              bankId: selectedBank.id,
              bankDetails: {
                verifiedBy: (selectedBank as IBankDropdown).verifiedBy,
                country: (selectedBank as IBankDropdown).country
              }
            },
            disableClose: true
          });
        }
      });
      return false;
    }

    if (selectedBank.payrollVerified === 0) {
      const data = {
        title: 'Error',
        content: 'The selected bank account is not payroll verified.',
        doneMsg: 'Verify Now',
        cancelMsg: 'Cancel',
        isCancel: true
      };

      const res = await firstValueFrom(
        this.alertService.warningAlert(data).afterClosed()
      );

      if (res) {
        const dialgoRef = this.dialog.open(
          PayrollStatementVerificationV4Component,
          {
            width: '500px',
            disableClose: true,
            panelClass: 'paddingless-modal-rounded',
            data: {
              bankAccountId: selectedBank.id,
              companyId: this.payrollService.selectedApp.id,
              companyType: this.payrollService.selectedApp.manual
            }
          }
        );

        dialgoRef.afterClosed().subscribe((val: { success: boolean }) => {
          if (val.success) {
            this.payrollService.payrollStatementApplicationSuccess.next(true);
          }
        });
      }
      return false;
    }

    return true;
  }

  verifyInstantly() {
    this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        mode: 'verify_now',
        verifyNowAccountData: this.payrollService.selectedBank
      },
      panelClass: 'yodlee-modal-new'
    });
  }

  /**
   * @description -Opens a confirmation modal for a payroll transaction based on the specified mode.
   * @param mode  - The mode of the confirmation modal (e.g., 'Pay', 'Edit', etc.).
   *
   */
  openSummaryModal() {
    if (this.commonTransactionTableRowData.id) {
      const amount =
        this.payrollService.chargeData[this.commonTransactionTableRowData.id];
      const grossPay =
        this.payrollService.editedGrossPay[
          this.commonTransactionTableRowData.id
        ];
      this.dialog.open(PayrollSummaryModalV4Component, {
        maxWidth: '500px',
        width: '95%',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          amount,
          selectedBank: this.payrollService.selectedBank,
          grossPaay: grossPay,
          rowData: this.commonTransactionTableRowData
        }
      });
    }
  }

  openConfirmationModal(mode: string) {
    const { selectedBank } = this.payrollService;
    if ((selectedBank as IBankDropdown)?.isRtpAllowed === false) {
      this.alertService.warningAlert({
        content:
          'RTP is not allowed for this bank account.Please select another bank account.'
      });
      return;
    }
    if (this.commonTransactionTableRowData.id) {
      const amount =
        this.payrollService.chargeData[this.commonTransactionTableRowData.id];
      const grossPay =
        this.payrollService.editedGrossPay[
          this.commonTransactionTableRowData.id
        ];
      if (amount > grossPay) {
        this.showMissingInfoWarning(
          'Processing amount should not be greater than payroll amount'
        );
        return;
      }
      this.dialog.open(ConfirmPayrollModalV4Component, {
        maxWidth: '900px',
        width: '95%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          amount,
          selectedBank: this.payrollService.selectedBank,
          grossPaay: grossPay,
          rowData: this.commonTransactionTableRowData,
          mode,
          gatewayType: this.resolveGatewayType()
        }
      });
    }
  }

  /**
   * The selected card's gateway wins; the account-level gateway is the
   * fallback. Checked against null rather than truthiness so a gateway type
   * of 0 is not mistaken for "not set".
   */
  private resolveGatewayType(): number | undefined {
    const cardGateway = this.payrollService.selectedCardId?.gatewayType;
    if (cardGateway != null) return Number(cardGateway);

    const accountGateway = this.headerData?.credit_card_gateway_type;
    if (accountGateway != null) return Number(accountGateway);

    return undefined;
  }

  showMissingInfoWarning(message: string) {
    this.alertService.warningAlert({ content: message });
  }

  /**
   * @description Delete the selected payroll.
   * @param {string}payrollId - Selected payroll id.
   */
  deletePayroll(payrollId: string | undefined): void {
    if (![0, 3].includes(this.status)) return;
    const data = {
      content: 'Are you sure to delete this payroll?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    };
    const action = this.alertService.confirmAlert(data);
    action.afterClosed().subscribe((response) => {
      if (response) {
        this.selectedPayrollId = payrollId as string;
        this.isDeleted = true;
        this.payrollService
          .deletePayroll(payrollId as string)
          .pipe(
            finalize(() => {
              this.isDeleted = false;
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({ content: res.message });
              this.v3DataTableService.refreshV3DataTable();
            }
          });
      }
    });
  }

  openMaintainenceModal(): void {
    this.dialog.open(MaintenanceAlertModalV4Component, {
      panelClass: 'paddingless-modal-rounded',
      width: 'fit-content',
      data: {
        content: this.creditCardMaintenanceMessage
      }
    });
  }
}
