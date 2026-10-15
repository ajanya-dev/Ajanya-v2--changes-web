import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { catchError, finalize } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { IVerifiedBankList } from 'src/app/modules/business-tools/plexe/model/plexe';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { DropDownVerifiedBusinessComponent } from '../../../../../shared/components/drop-downs/drop-down-verified-business/drop-down-verified-business.component';

@Component({
  selector: 'app-plexe-apply',
  templateUrl: './plexe-apply.component.html',
  styleUrls: ['./plexe-apply.component.scss'],
  standalone: true,
  imports: [
    DropDownVerifiedBusinessComponent,
    NgClass,
    NgIf,
    NgFor,
    FaIconComponent,
    MatTooltip,
    RouterLink,
    TruncatePipe
  ]
})
export class PlexeApplyComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  bankList: IVerifiedBankList[];
  selectedBankId: string;
  isLoading = false;
  banktotalLength = 0;
  bankPage = 1;
  businessId: string;
  bankAccountIds: string[] = [];
  btnDisable = false;
  disableVerify = false;
  spinning: number;
  isButton = false;

  constructor(
    private _plexeService: PlexeService,
    private _alertService: AlertService,
    private _router: Router,
    private __dialog: MatDialog,
    private _bankAccService: BankAccountsService
  ) {}

  ngOnInit(): void {
    this.loadBank();
  }

  /**
   * @description Get all yodlee connect banks.
   *
   */
  loadBank(): void {
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getAllYodleeConnectedBanks()
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.bankList = res.data;
            this.bankAccountIds = this.bankList
              .filter((obj) => obj.eligibility === 1)
              .map((obj) => obj.id);
          }
        })
    );
  }

  /**
   * @description Select business.
   *
   */
  selectBusiness(id: string): void {
    this.businessId = id;
  }

  /**
   * @description verifying selected bank.
   *
   */
  verifyBank(
    bankData: IVerifiedBankList,
    index: number,
    button: boolean
  ): void {
    const originalBankData = bankData;
    const { fullAccountNumber: bank_account_account_number, ...rest } =
      originalBankData;
    const updatedBankData = { ...rest, bank_account_account_number };

    this.isButton = button;
    this.spinning = index;
    this.disableVerify = true;
    this._bankAccService
      .verifyBankAccount(bankData?.id)
      .pipe(
        catchError((err) => {
          if (err.error.success === false) {
            const data = {
              mode: 'verify_now',
              verifyNowAccountData: updatedBankData
            };
            const dialogRef = this.__dialog.open(YodleeParentModalComponent, {
              disableClose: true,
              autoFocus: false,
              data: data,
              panelClass: 'yodlee-modal-new'
            });
            dialogRef.afterClosed().subscribe((res) => {
              if (res) {
                this.loadBank();
              }
            });
          }
          return of(false);
        }),
        finalize(() => {
          this.disableVerify = false;
        })
      )
      .subscribe((res) => {
        if (res.success == true) {
          this.loadBank();
        }
      });
  }

  /**
   * @description Reconnecting bank.
   *
   */
  reconnectToBank(providerId: string, index: number, button: boolean): void {
    this.isButton = button;
    this.spinning = index;

    const data = {
      mode: 'verify_now',
      verifyNowAccountData: { pk: providerId }
    };
    const dialogRef = this.__dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: data,
      panelClass: 'yodlee-modal-new'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loadBank();
      }
    });
  }

  /**
   * @description submit application.
   *
   */
  sumbit(): void {
    if (!this.businessId) {
      this.openWarningAlert('Please select a business');
      return;
    } else if (!this.bankAccountIds.length) {
      this.openWarningAlert('Please select at least one bank account');
      return;
    }

    const sendData: { businessKybId: string; bankAccount: string[] } = {
      businessKybId: this.businessId,
      bankAccount: this.bankAccountIds
    };

    this.btnDisable = true;
    this.subscription.push(
      this._plexeService
        .applicationSumbit(sendData)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this._router.navigate(['/manage/working-capital/success']);
          }
        })
    );
  }

  /**
   * @description Warning alert.
   *
   */
  openWarningAlert(
    content: string,
    doneMsg?: string
  ): MatDialogRef<WarningAlertComponent, boolean> {
    const data = {
      title: 'Error',
      content: content,
      doneMsg: doneMsg ? doneMsg : 'OK'
    };
    return this._alertService.warningAlert(data);
  }

  /**
   * @description open modal for add bank.
   *
   */
  addBank(): void {
    const data = {
      mode: 'connect_new_bank'
    };
    const dialogRef = this.__dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: data,
      panelClass: 'yodlee-modal-new'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loadBank();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
