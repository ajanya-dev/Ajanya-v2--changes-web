import { Component, inject, OnInit, signal } from '@angular/core';
import {
  Validators,
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { finalize, take } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faXmark, faCheck } from '@fortawesome/pro-solid-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { IConfirmVirtualAccount } from 'src/app/models/bank';
import { HttpHeaders } from '@angular/common/http';
import { UploadStatementModalComponent } from '../upload-statement-modal/upload-statement-modal.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

interface BankAccountForm {
  formGroup: FormGroup; 
  bankId: string | undefined;
  bankAccountName: string | undefined;
  accountNumber: string | undefined;
  routingNumber: number | undefined;
  bankAccountAddressLine1: string | undefined;
  bankAccountCity: string | undefined;
  bankAccountState: string | undefined;
  bankAccountZip: string | undefined;
  isConfirmed: boolean;
  isLoading: boolean;
}

@Component({
  selector: 'app-virtual-account-confirmation-modal',
  templateUrl: './virtual-account-confirmation-modal.component.html',
  styleUrls: ['./virtual-account-confirmation-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    FaIconComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    MatDialogClose,
    CommonInputFieldComponent
  ]
})
export class VirtualAccountConfirmationModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<VirtualAccountConfirmationModalComponent>);
  public data: { bankAccountIds: string[] } = inject(MAT_DIALOG_DATA, { optional: true });
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  bankAccounts: BankAccountForm[] = [];
  isLoading = signal(false);
  faXmark = faXmark;
  faCheck = faCheck;
  refreshTable = signal(false);
  private failedAttempts: { [key: number]: number } = {}; // Track failed attempts per account

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  initFormGroup(): FormGroup {
    return this.fb.group({
      AccountNumber: [
        '',
        [Validators.required, Validators.minLength(5), this.isAccountNoInvalid]
      ],
      ConfirmAccountNumber: [
        '',
        [
          Validators.required,
          ValidationService.isMatchingValidator(
            'AccountNumber',
            'Account number does not match'
          ),
          this.isAccountNoInvalid
        ]
      ],
      routingNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(9),
          ValidationService.routingNumberValidator
        ]
      ]
    });
  }

  loadBankAccounts() {
    this.isLoading.set(true);
    
    // Check if bankAccountIds exists before attempting to map over it
    if (!this.data || !this.data.bankAccountIds) {
      this.bankAccounts = [];
      this.isLoading.set(false);
      return;
    }
    
    const bankAccountPromises = this.data.bankAccountIds?.map(id => 
      this.bankAccService.viewBankById(id).toPromise()
    );
  
    Promise.all(bankAccountPromises)
      .then(responses => {
        this.bankAccounts = responses.map(res => ({
          bankId: res?.data?.bankId,
          bankAccountName: res?.data?.bankAccountName,
          accountNumber: res?.data?.bankAccountNumber,
          routingNumber: res?.data?.routingNumber,
          bankAccountAddressLine1: res?.data?.bankAccountAddressLine1,
          bankAccountCity: res?.data?.bankAccountCity,
          bankAccountState: res?.data?.bankAccountState,
          bankAccountZip: res?.data?.bankAccountZip,
          isConfirmed: false,
          isLoading: false,
          formGroup: this.initFormGroup()
        }));
      })
      .catch(error => {
        this.bankAccounts = [];
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  onAccountNumberBlur(formGroup: FormGroup) {
    formGroup.get('AccountNumber')?.setValue(formGroup.get('AccountNumber')?.value);
  }

  onAccountNumberFocus(formGroup: FormGroup) {
    formGroup.get('AccountNumber')?.setValue(formGroup.get('AccountNumber')?.value);
  }

  confirmAccount(index: number) {
    const account = this.bankAccounts[index];
    const formGroup = account.formGroup;
    
    formGroup.markAllAsTouched();

    if (formGroup.invalid) {
      return;
    }

    account.isLoading = true;

    const routingNumber = String(formGroup.value.routingNumber);

    // First check bank statement status
    this.bankAccService.checkBankStatementStatus(this.data.bankAccountIds[index])
      .pipe(take(1))
      .subscribe({
        next: (statusResponse) => {
          if (statusResponse.success && statusResponse.status === 0) {
            const data = {
              content: "Your account verification is currently under review. Please check back later or contact our support team for quicker approval.",
              doneMsg: 'Contact Now',
              cancelMsg: 'Not Now',
              isOk: true,
              isCancel: true
            };
            const action = this.alertService.warningAlert(data);
            action.afterClosed().subscribe((res) => {
              if (res) {
                this.dynamicWhiteLabelService.goToLiveChat();
              }
            });
            // Remove the verified account from the list
            this.bankAccounts.splice(index, 1);
            this.data.bankAccountIds.splice(index, 1);
            
            // If no accounts left, close the modal
            if (this.bankAccounts.length === 0) {
              this.dialogRef.close({success: false, refreshTable: this.refreshTable()});
              return;
            }
            
            // Reset loading state
            account.isLoading = false;
            return;
          }
          //////////////////////////
          // If status is false, proceed with routing number check
          this.bankAccService.getroutingNumber(routingNumber)
            .pipe(take(1))
            .subscribe({
              next: (routingResponse) => {
                const routingData = routingResponse.data;
                
                const formData: IConfirmVirtualAccount = {
                  bankAccountNumber: formGroup.value.AccountNumber,
                  bankId: account.bankId || '',
                  bankRoutingNumber: routingNumber,
                  bankName: account.bankAccountName || '',
                  bankAddress1: routingData?.address || '',
                  bankCity: routingData?.city || '',
                  bankState: routingData?.state || '',
                  bankZip: String(routingData?.zip || '')
                };

                const headerOptions = new HttpHeaders({
                  'Content-Type': 'application/json',
                  isDisable422: 'true'
                });

                this.bankAccService
                  .confirmVirtualAccount(this.data.bankAccountIds[index], formData, headerOptions)
                  .pipe(
                      take(1),
                      finalize(() => {
                        account.isLoading = false;
                      })
                    )
                    .subscribe({
                      next: (res: any) => {
                        if (res.success) {
                          account.isConfirmed = true;
                          // Reset failed attempts on success
                          this.failedAttempts[index] = 0;
                          const data = {
                            title: 'Success',
                            content: 'Account details updated successfully',
                            close: true,
                            timeout: 2000
                          };
                          this.alertService.successAlert(data);
                          this.refreshTable.set(true);
                          // Check if all accounts are confirmed
                          if (this.bankAccounts.every(acc => acc.isConfirmed)) {
                            this.dialogRef.close({success: true, refreshTable: this.refreshTable()});
                          }
                        } else {
                          // Increment failed attempts
                          this.failedAttempts[index] = (this.failedAttempts[index] || 0) + 1;
                          
                          if (this.failedAttempts[index] === 1) {
                            // Show warning alert only on first failed attempt
                            this.alertService.warningAlert({
                              title: 'Verification Failed',
                              content: 'We couldn\'t verify your original bank account number. It looks like the number you entered may be incorrect. Please go back and re-enter your original account number.',
                              close: false,
                              isOk: true,
                              doneMsg: 'OK'
                            });
                          } else if (this.failedAttempts[index] >= 2) {
                            this.alertService.infoAlert({
                              title: 'Verification Failed',
                              content: 'We couldn\'t verify your original bank account number.\nIt looks like the number you entered may be incorrect.\nIf you believe the AC number is correct, you can click below to upload the first page of your bank statement for manual verification.',
                              isOk: true,
                              isCancel: true,
                              doneMsg: 'Upload Statement',
                              cancelMsg: 'Cancel',
                              close: false
                            }).afterClosed().subscribe(result => {
                              if (result) {
                                this.dialog.open(UploadStatementModalComponent, {
                                  maxWidth: '510px',
                                  width: '100%',
                                  disableClose: true,
                                  autoFocus: false,
                                  data: { 
                                    encrypted_bankacc_id: this.data.bankAccountIds[index],
                                    accountNumber: formGroup.value.AccountNumber,
                                    routingNumber: formGroup.value.routingNumber,
                                    bankAccountId: account.bankId || ''
                                  }
                                }).afterClosed().subscribe(uploadResult => {
                                  if (uploadResult?.success) {
                                    this.bankAccounts[index].isConfirmed = true;
                                    // Check if all accounts are confirmed
                                    if (this.bankAccounts.every(acc => acc.isConfirmed)) {
                                      this.dialogRef.close({success: false, refreshTable: this.refreshTable()});
                                    }
                                  }
                                });
                              }
                            });
                          } 
                        }
                      },
                      error: (error) => {
                        // Increment failed attempts on error
                        this.failedAttempts[index] = (this.failedAttempts[index] || 0) + 1;
                        
                        if (this.failedAttempts[index] === 1) {
                          // Show warning alert only on first failed attempt
                          this.alertService.warningAlert({
                            title: 'Verification Failed',
                            content: 'We couldn\'t verify your original bank account number. It looks like the number you entered may be incorrect. Please go back and re-enter your original account number.',
                            close: false,
                            isOk: true,
                            doneMsg: 'OK'
                          });
                        } else if (this.failedAttempts[index] >= 2) {
                          this.alertService.infoAlert({
                            title: 'Verification Failed',
                            content: 'We couldn\'t verify your original bank account number.\nIt looks like the number you entered may be incorrect.\nIf you believe the AC number is correct, you can click below to upload the first page of your bank statement for manual verification.',
                            isOk: true,
                            isCancel: true,
                            doneMsg: 'Update',
                            cancelMsg: 'Cancel',
                            close: false
                          }).afterClosed().subscribe(result => {
                            if (result) {
                              this.dialog.open(UploadStatementModalComponent, {
                                maxWidth: '510px',
                                width: '100%',
                                disableClose: true,
                                autoFocus: false,
                                data: { 
                                  encrypted_bankacc_id: this.data.bankAccountIds[index],
                                  accountNumber: formGroup.value.AccountNumber,
                                  routingNumber: formGroup.value.routingNumber,
                                  bankAccountId: account.bankId || ''
                                }
                              }).afterClosed().subscribe(uploadResult => {
                                if (uploadResult?.success) {
                                  this.bankAccounts[index].isConfirmed = true;
                                  // Check if all accounts are confirmed
                                  if (this.bankAccounts.every(acc => acc.isConfirmed)) {
                                    this.dialogRef.close({success: false, refreshTable: this.refreshTable()});
                                  }
                                }
                              });
                            }
                          });
                        }
                      }
                    });
              },
              error: (error) => {
                account.isLoading = false;
              }
            });
        },
        error: (error) => {
          account.isLoading = false;
        }
      });
  }

  isAccountNoInvalid(
    control: AbstractControl
  ): { [key: string]: boolean } | boolean {
    if (!control.value) {
      return true;
    }
    if (String(control.value).substring(0, 1) === '-')
      return { invalidAccountNumber: true };
    return true;
  }

  isAnyAccountLoading(): boolean {
    return this.bankAccounts.some(account => account.isLoading);
  }

  onCloseModal(){
    this.dialogRef.close({success: false, refreshTable: this.refreshTable()});
  }

} 