import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, OnDestroy, OnInit, Signal, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IBankDropdown } from 'src/app/models/bank';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { Subject, finalize, firstValueFrom, takeUntil } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { faEye, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { MaintenanceAlertModalComponent } from 'src/app/shared/modal/maintenance-alert-modal/maintenance-alert-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ConfirmPayrollModalComponent } from '../confirm-payroll-modal/confirm-payroll-modal.component';
import { PayrollService } from '../../services/payroll.service';
import { PayrollStatementVerificationComponent } from '../payroll-statement-verification/payroll-statement-verification.component';
import { WireRoutingUpdateModalComponent } from '../../modal/wire-routing-update-modal/wire-routing-update-modal.component';

@Component({
  selector: 'app-v3-payroll-action',
  templateUrl: './v3-payroll-action.component.html',
  styleUrls: ['./v3-payroll-action.component.scss'],
  standalone: true,
  imports: [NgClass, MatTooltip, FaIconComponent]
})
export class V3PayrollActionComponent
  implements AgRendererComponent, OnInit, OnDestroy
{
  private dialog = inject(MatDialog);
  private payrollService = inject(PayrollService);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private v3DataTableService = inject(V3DataTableService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);

  destroy$ = new Subject();
  params: ICellRendererParams;
  commonTransactionTableRowData: ICommonTransactionTableData;
  status: number;
  statusText: string;
  grossPay: number;
  isManual = false;
  faEye = faEye;
  faTrash = faTrash;
  faSpinner = faSpinner;
  isDeleted = false;
  selectedPayrollId: string;
  isKycKybBypassed?: boolean;
  param: ICellRendererParams;
  kycCompleted: Signal<number | undefined>;
  creditCardMaintenanceMessage: string;
  personaVerify?: () => void;

  refresh(): boolean {
    return true;
  }

  agInit(
    params: ICellRendererParams & {
      kycCompleted: Signal<number | undefined>;
      personaVerify: () => void;
    }
  ) {
    this.param = params;
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
    this.headerService._headerData
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const headerData = res as IHeaderData;
        this.creditCardMaintenanceMessage =
          headerData.cardPaymentMaintananceMessage || '';
        if (headerData.kybBypassedUser === 1) {
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

    if(this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0){
      this.openMaintainenceModal();
      return;
    }

    if (this.payrollService.isWireRoutingSkipped()) {
      const dialogRef = this.dialog.open(WireRoutingUpdateModalComponent, {
        maxWidth: '550px',
        width: '93%',
        data: { bankAc: this.payrollService.selectedPayrollBank() },
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((wireRoutingAdded) => {
        if (wireRoutingAdded) {
          this.payrollService.isWireRoutingSkipped.set(false);
          this.runPayroll();
        }
      });
    }
    if (this.payrollService.isWireRoutingSkipped()) {
      return;
    }
    if (
      !this.kycCompleted() &&
      this.kycCompleted() !== 0 &&
      !this.isKycKybBypassed
    ) {
      if (this.personaVerify) {
        this.personaVerify();
      }
      return;
    }

    if (this.kycCompleted() === 3) {
      this.alertService.warningAlert({
        content: 'Your KYC verification has been rejected'
      });
      return;
    }
    const { selectedBank, selectedCardId } = this.payrollService;

    if (this.payrollService.isSelectedPaymentDisabled) {
      this.payrollService.checkPaymentMethodAllowedToUse.next(true);
      return;
    }

    if (!selectedBank) {
      this.alertService.warningAlert({
        content: 'Please Select a Bank Account'
      });
      return;
    }

    if (!selectedCardId) {
      this.alertService.warningAlert({ content: 'Please Select a Card' });
      return;
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
    if (!selectedBank) {
      this.showMissingInfoWarning('Please select a bank account!');
      return;
    }
    if (!selectedCardId) {
      this.showMissingInfoWarning('Please select a credit card!');
      return;
    }
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
      return;
    }
    if (microDepositCondition || approvalPendingCondition) {
      this.alertService.warningAlert({
        content: 'Bank account is not verified'
      });
      return;
    }
    if ((selectedBank as IBankDropdown).verified === 0) {
      this.paymentsService.verifyBankAccount(selectedBank.id);
      return;
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
          PayrollStatementVerificationComponent,
          {
            width: '500px',
            disableClose: true,
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
            this.openConfirmationModal('Pay');
          }
        });
      }
      return;
    }

    this.openConfirmationModal('Pay');
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
      this.dialog.open(ConfirmPayrollModalComponent, {
        maxWidth: '525px',
        width: '100%',
        autoFocus: false,
        disableClose: true,
        data: {
          amount,
          selectedBank: this.payrollService.selectedBank,
          grossPaay: grossPay,
          rowData: this.commonTransactionTableRowData,
          mode
        }
      });
    }
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
            takeUntil(this.destroy$)
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
    this.dialog.open(MaintenanceAlertModalComponent, {
      panelClass: 'plaid-modal',
      width: 'fit-content',
      data: {
        content: this.creditCardMaintenanceMessage
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
