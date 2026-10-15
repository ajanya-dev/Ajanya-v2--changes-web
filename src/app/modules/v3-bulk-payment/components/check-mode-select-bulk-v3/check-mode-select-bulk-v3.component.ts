import { Component, OnInit, OnDestroy, inject, output } from '@angular/core';
import {
  IBankSource,
  IPayee,
  IZilPyamentLists
} from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgIf, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/pro-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';

/**
 * interface with payment method property included to the interface `IZilPayments`.
 */
interface IZilPaymentListsExtended extends IZilPyamentLists {
  PaymentMethode?: string;
}

/**
 * @description Component for check mode selection in bulk payment.
 * Check mode selection is done for checks, to choose from print, mail or email.
 */
@Component({
  selector: 'app-check-mode-select-bulk-v3',
  templateUrl: './check-mode-select-bulk-v3.component.html',
  styleUrls: ['./check-mode-select-bulk-v3.component.scss'],
  standalone: true,
  imports: [NgIf, NgSelectModule, FormsModule, NgClass, FaIconComponent]
})
export class CheckModeSelectBulkV3Component implements OnInit, OnDestroy {
  faTrash = faTrash;

  public v3BulkPaymentService = inject(V3BulkPaymentService);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private activatedRoute = inject(ActivatedRoute);
  private checkService = inject(CheckService);

  myForm: FormGroup;
  checkPaymentsData: IZilPaymentListsExtended[] = [];
  checkPaymentMethode: {
    checkEmailPayments: IZilPaymentListsExtended[];
    checkMailPayments: IZilPaymentListsExtended[];
    checkPrintPayments: IZilPaymentListsExtended[];
    checkDDPayments: IZilPaymentListsExtended[];
  };

  subscription: Subscription[] = [];
  checkOption = this.v3BulkPaymentService.checkOption;
  allSelectedCheckTypes?: string;
  blankChecks: IZilPaymentListsExtended[] = [];
  chimeBankChecks: IZilPaymentListsExtended[] = [];
  zilBankChecks: IZilPaymentListsExtended[] = [];
  paymentMode: 'all-payments' | 'group-mail' = 'all-payments';

  onDoneClick = output<boolean>();
  isCheckPaymentsAvailable = output<void>();

  ngOnInit(): void {
    this.getPaymentData();
    this.getQueryParams();
    this.myForm = this.formBuilder.group({
      items: this.formBuilder.array([])
    });
    this.getBackbuttonEvent();
  }

    /**
  * Retrieves query parameters from the route.
  */
    getQueryParams() {
      this.subscription.push(
        this.activatedRoute.queryParams.subscribe((params) => {
          if(params?.type === 'check') {
            this.updateAllCheckTypeDropdown('Check Mail');
            this.paymentMode = 'group-mail';
          }else{
            this.paymentMode = this.activatedRoute.snapshot.queryParams.page;
          }
        })
      );
    }

  /**
   * method to reset data on back button click event.
   */
  getBackbuttonEvent() {
    this.subscription.push(
      this.v3BulkPaymentService.getBackButtonClicked().subscribe((_) => {
        this.getPaymentData();
        this.myForm = this.formBuilder.group({
          items: this.formBuilder.array([])
        });
      })
    );
  }

  /**
   * @description Gets the bulk paymentListData and filters only checks, for check mode selection.
   */
  getPaymentData() {
    this.subscription.push(
      this.v3BulkPaymentService.isBulkPaymentsApiReady$.subscribe({
        next: (res) => {
          if (res) {
            this.checkPaymentsData =
              this.v3BulkPaymentService.paymentListData?.filter(
                (obj) =>
                  obj.transferType === 'CHECK' && obj.sourceType === 'BANK'
              ) || [];
              if(this.checkPaymentsData.length !== 0 && !this.checkOption) {
                this.isCheckPaymentsAvailable.emit();
              }
            this.setCheckOptions();
            if (this.checkPaymentsData.length !== 0) {
              this.checkPaymentsData.sort(
                (a, b) => Number(a.referenceNo) - Number(b.referenceNo)
              );
              this.v3BulkPaymentService.setIsCheckModeSelected(false);
            }
            if (
              this.sharedService.enabledForProcessNow &&
              !this.v3BulkPaymentService.selectedCheckTypes.length
            ) {
              this.v3BulkPaymentService.selectedCheckTypes.length = 0;
              this.checkPaymentsData.forEach((data, i) => {
                if (data.payeeDefaultPaymentMethod === '') {
                  this.v3BulkPaymentService.selectedCheckTypes.push(undefined);
                } else if (data.payeeDefaultPaymentMethod === '1') {
                  this.v3BulkPaymentService.selectedCheckTypes.push(
                    'Check Print'
                  );
                  this.onDropdownChange(
                    'Check Print',
                    i,
                    data?.transferId,
                    '',
                    data?.payee,
                    true
                  );
                } else if (data.payeeDefaultPaymentMethod === '2') {
                  this.v3BulkPaymentService.selectedCheckTypes.push(
                    'Check Mail'
                  );
                  this.onDropdownChange(
                    'Check Mail',
                    i,
                    data?.transferId,
                    '',
                    data?.payee,
                    true
                  );
                } else if (data.payeeDefaultPaymentMethod === '3') {
                  this.v3BulkPaymentService.selectedCheckTypes.push('Check DD');
                  this.onDropdownChange(
                    'Check DD',
                    i,
                    data?.transferId,
                    '',
                    data?.payee,
                    true
                  );
                } else if (data.payeeDefaultPaymentMethod === '4') {
                  this.v3BulkPaymentService.selectedCheckTypes.push(
                    'Check Email'
                  );
                  this.onDropdownChange(
                    'Check Email',
                    i,
                    data?.transferId,
                    '',
                    data?.payee,
                    true
                  );
                }
              });
            }
          }
        }
      })
    );
  }

  updateAllCheckTypeDropdown(event: string) {
    const type = event.replace('Check', '');
    this.blankChecks = this.checkPaymentsData.filter((item) => !item.payee.id);
    this.zilBankChecks = this.checkPaymentsData.filter(
      (item) =>
        (item.source as IBankSource).isItZil
    );
    this.chimeBankChecks = this.checkPaymentsData.filter(
      (item) =>
        (item?.source as IBankSource)?.routingNumber === '103100195' ||
        (item?.source as IBankSource)?.routingNumber === '031101279' ||
        (item?.source as IBankSource)?.routingNumber === '084106768'
    );

    if (this.blankChecks.length && event !== 'Check Print') {
      this.alertService.failedAlert({
        content: `Blank check cannot be ${
          event === 'Check DD' ? 'Direct deposit' : type
        }ed, please update the check details.`
      });
    } else if (this.zilBankChecks.length && event !== 'Check DD') {
      this.alertService.warningAlert({
        content: `This check cannot be ${type}ed. Currently, the Zil account is only set up for ACH/Direct Deposit.`
      });
    } else if (this.chimeBankChecks.length && event !== 'Check DD') {
      this.alertService.warningAlert({
        content: `This check cannot be ${type}ed. Currently, the Chime account is only set up for ACH/Direct Deposit.`
      });
    }

    this.checkPaymentsData.forEach((check, i) => {
      this.onDropdownChange(
        event,
        i,
        check?.transferId,
        (check?.source as IBankSource)?.routingNumber,
        check.payee,
        false,
        (check?.source as IBankSource)?.isItZil
      );
      this.v3BulkPaymentService.selectedCheckTypes[i] = event;
    });
  }

  /**
   * @description Sets the selected mode (mail, print, email) for check.
   * @param event - select event.
   * @param index - index.
   * @param transferId - transfer id of the check.
   * @param routingNumber - routing number (Used here for checking for zil bank or chime bank).
   * @param isSingleSelection - Used to check `onDropdownChange` call from common payment method selection or not.
   */
  onDropdownChange(
    event: string,
    index: number,
    _: string,
    routingNumber: string,
    payee: IPayee,
    isSingleSelection: boolean,
    isItZil?: number
  ) {
    if (event !== this.allSelectedCheckTypes)
      this.allSelectedCheckTypes = undefined;
    const type = event.replace('Check', '');
    if (
      (routingNumber === '103100195' || routingNumber === '031101279' || routingNumber === '084106768') &&
      event !== 'Check DD'
    ) {
      if (isSingleSelection) {
        this.alertService.warningAlert({
          content: `This check cannot be ${type}ed. Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
        });
      }
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      this.checkPaymentsData[index].PaymentMethode = undefined;
      return;
    }

    if (isItZil && event !== 'Check DD') {
      if (isSingleSelection) {
        this.alertService.warningAlert({
          content: `This check cannot be ${type}ed. Currently, the Zil account is only set up for ACH/Direct Deposit.`
        });
      }
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      this.checkPaymentsData[index].PaymentMethode = undefined;
      return;
    }
    if (!payee.id && event !== 'Check Print') {
      if (isSingleSelection) {
        this.alertService.failedAlert({
          content: `Blank check cannot be ${type}ed, please update the check details`
        });
      }
      this.checkPaymentsData[index].PaymentMethode = undefined;
      this.v3BulkPaymentService.selectedCheckTypes[index] = undefined;
      return;
    }

    this.checkPaymentsData[index].PaymentMethode = event;
    this.v3BulkPaymentService.bulkPayChanges$.next(true);

    /**
     * @description
     * Temporarly commented this section, now checking the chime bank and zil bank based on routing number.
     */

    // if (event === 'Check Email') {
    //   this.subscription.push(
    //     this._v3BulkPaymentService.getCheckEmailDetails({ ids: [transferId] })
    //       .pipe(catchError((err) => {
    //         if (err.error.errorCode == 123) {
    //           this.alertService.failedAlert({ content: "This check can't be mailed. Neo-bank accounts are ready for ACH/Direct Deposit Only" });
    //         }
    //         return of(false);
    //       }))
    //       .subscribe((res) => {
    //         if (res) {
    //           this.checkPaymentsData[index].PaymentMethode = event;
    //         }
    //       })
    //   );
    //   return;
    // }
    // if (event === 'Check Mail') {
    //   this.subscription.push(
    //     this._v3BulkPaymentService.getCheckMailDetails({ ids: [transferId], is_signature: 1 })
    //       .pipe(catchError((err) => {
    //         if (err.error.errorCode == 123) {
    //           this.alertService.failedAlert({ content: "This check can't be mailed. Neo-bank accounts are ready for ACH/Direct Deposit Only" });
    //         }
    //         return of(false);
    //       }))
    //       .subscribe((res) => {
    //         if (res) {
    //           this.checkPaymentsData[index].PaymentMethode = event;
    //         }
    //       })
    //   );
    //   return;
    // }
    // this.checkPaymentsData[index].PaymentMethode = event;
  }

  /**
   * @description Groups checks into mail, email and print - based on user selection. validating Cheque.
   */
  payAsGroup() {
    this.v3BulkPaymentService.isBulkPayProcessing = true;
    this.v3BulkPaymentService.isBulkCheckProcessing = true;

    if (this.paymentMode === 'group-mail') {
      this.checkPaymentsData.forEach((data, i) => {
        this.checkPaymentsData[i].PaymentMethode = 'Check Mail';
      });
    }

    const noPaymentMethode = this.checkPaymentsData.some(
      (obj) => !obj.PaymentMethode || obj.PaymentMethode.trim() === ''
    );
    if (noPaymentMethode) {
      return;
    }
    const checkUuidList: string[] = [];
    const checkEmailUuidList: string[] = [];
    const checkDDUuidList: string[] = [];
    const checkMailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Mail'
    );
    const checkEmailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Email'
    );
    const checkDDPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check DD'
    );
    if (checkMailPayments.length !== 0) {
      checkMailPayments?.forEach((rowData) => {
        if (rowData.transferTypeCode === 'check') {
          checkUuidList.push(rowData.transferId);
        }
      });
      this.subscription.push(
        this.v3BulkPaymentService
          .getCheckMailDetails({ ids: checkUuidList, is_signature: 1 })
          .subscribe({
            next: () => {
              this.v3BulkPaymentService.isCheckPrintProcessing = true;
              this.v3BulkPaymentService.isCheckDDProcessing = true;
              this.groupPayments();
              this.onDoneClick.emit(true);
            }
          })
      );
    } else if (checkEmailPayments.length !== 0) {
      checkEmailPayments?.forEach((rowData) => {
        if (rowData.transferTypeCode === 'check') {
          checkEmailUuidList.push(rowData.transferId);
        }
      });
      this.subscription.push(
        this.v3BulkPaymentService
          .getCheckEmailDetails({ ids: checkEmailUuidList })
          .subscribe({
            next: () => {
              this.groupPayments();
              this.onDoneClick.emit(true);
            }
          })
      );
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;
    } else if (checkDDPayments.length !== 0) {
      checkDDPayments?.forEach((rowData) => {
        if (rowData.transferTypeCode === 'check') {
          checkDDUuidList.push(rowData.transferId);
        }
      });
      this.subscription.push(
        this.checkService
          .getDirectDepostModalData({
            cheques: checkDDUuidList
          })
          .subscribe({
            next: () => {
              this.groupPayments();
              this.onDoneClick.emit(true);
            }
          })
      );
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;
    } else {
      this.v3BulkPaymentService.isCheckPrintProcessing = true;
      this.v3BulkPaymentService.isCheckDDProcessing = true;

      this.groupPayments();
      this.onDoneClick.emit(true);
    }
  }

  /**
   * @description Groups checks into mail, email and print - based on user selection.
   */
  groupPayments() {
    const checkEmailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Email'
    );
    const checkMailPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Mail'
    );
    const checkPrintPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check Print'
    );
    const checkDDPayments = this.checkPaymentsData.filter(
      (obj) => obj.PaymentMethode === 'Check DD'
    );

    if (checkEmailPayments.length !== 0) {
      this.v3BulkPaymentService.checkEmailPayments.next(checkEmailPayments);
    }
    if (checkMailPayments.length !== 0) {
      this.v3BulkPaymentService.checkMailPayments.next(checkMailPayments);
    }

    this.v3BulkPaymentService.checkPrintPayments.next(checkPrintPayments);

    this.v3BulkPaymentService.checkDDPayments.next(checkDDPayments);

    this.checkPaymentsData = [];
    this.v3BulkPaymentService.setIsCheckModeSelected(true);
  }

  /**
   * @description Method to remove payment with user interaction.
   * @param index - index
   */
  removePayment(index: number) {
    const removedAmount = this.checkPaymentsData[index].amount;
    this.checkPaymentsData.splice(index, 1);
    this.v3BulkPaymentService.selectedCheckTypes.splice(index, 1);
    this.v3BulkPaymentService.paymentListData = this.checkPaymentsData;

    this.v3BulkPaymentService.totalPaymentAmount.update((amount) => amount - Number(removedAmount));
    this.v3BulkPaymentService.totalPaymentCount.update((count) => count - 1);
    if (!this.checkPaymentsData.length) {
      this.v3BulkPaymentService.setIsCheckModeSelected(true);
    }
  }

  /**
   * @description Formats the date by removing the time.
   * @param date - date with time.
   * @returns formatted date without time
   */
  formatDate(date: string) {
    const splitDate = date.split('_');
    return splitDate[0];
  }

  /**
   * Checks if the dropdown value is valid for a given index.
   * @param index - The index of the check payment data.
   * @returns Returns true if the dropdown value is selected, false otherwise.
   */
  isDropdownValid(index: number): boolean {
    const paymentMethod = this.checkPaymentsData[index].PaymentMethode;
    return !!paymentMethod;
  }

  /**
   * @description Checks if only checks are selected and  print, mail or email button is clicked from payments table directly and emits those checkData, skipping check mode selection.
   */
  setCheckOptions() {
    if (this.checkOption) {
      switch (this.checkOption) {
        case 'print':
          this.v3BulkPaymentService.checkPrintPayments.next(
            this.checkPaymentsData
          );
          break;
        case 'mail':
          this.v3BulkPaymentService.checkMailPayments.next(
            this.checkPaymentsData
          );
          break;
        case 'email':
          this.v3BulkPaymentService.checkEmailPayments.next(
            this.checkPaymentsData
          );
          break;
        default:
          break;
      }
      this.checkPaymentsData = [];
      this.v3BulkPaymentService.setIsCheckModeSelected(true);
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => {
      el?.unsubscribe();
    });
  }
}
