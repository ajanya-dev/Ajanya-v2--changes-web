/* eslint-disable no-param-reassign */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatDialog, MatDialogClose } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  AccuntNoValidator,
  ValidationService
} from 'src/app/shared/service/validation/validation.service';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IYodleeParentCommonData,
  IYodleeParentData,
  IYodleeProfile,
  yodleeAccDetails
} from 'src/app/models/yodlee';
import { IBankSource } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { NgIf, NgFor, NgClass, SlicePipe } from '@angular/common';
import { AccountDetailsFormModalComponent } from '../account-details-form-modal/account-details-form-modal.component';

/**
 *@description Modal component for adding bank account details through Yodlee.
 */
@Component({
  selector: 'app-add-account-details',
  templateUrl: './add-account-details.component.html',
  styleUrls: ['./add-account-details.component.scss'],
  standalone: true,
  imports: [NgIf, MatDialogClose, NgFor, NgClass, SlicePipe]
})
export class AddAccountDetailsComponent implements OnInit, OnDestroy {
  @Input() data: yodleeAccDetails[];
  @Input() commonData: IYodleeParentCommonData;
  @Output() next = new EventEmitter<{ bankAcs: IBankSource[] }>();
  @Output() prev = new EventEmitter<boolean>();
  @Output() errors = new EventEmitter<unknown>();
  accountsArray: yodleeAccDetails[];
  bankForm: UntypedFormGroup;
  formData: FormData = new FormData();
  subscriptions: Subscription[] = [];
  isLoading: boolean;
  isAutoClick = false;
  utils = Utils;
  fullAccountNo: string;
  isAddressRequired = false;

  constructor(
    private alertService: AlertService,
    private dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private bankAccService: BankAccountsService
  ) {}

  ngOnInit(): void {
    this.bankForm = this.fb.group({
      bankRoutingNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.routingNumberValidator
      ]),
      bankAccountNumber: new UntypedFormControl('', []),
      bankAccountName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.personNameValidator,
        Validators.minLength(5)
      ]),
      bankAccountNickName: new UntypedFormControl('', [Validators.required]),
      bankAccountAddressLine1: new UntypedFormControl('', [
        Validators.required
      ]),
      bankAccountAddressLine2: new UntypedFormControl('', []),
      bankAccountCity: new UntypedFormControl('', [Validators.required]),
      bankAccountState: new UntypedFormControl('', [Validators.required]),
      bankAccountZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ]),
      bankAccountCountry: new UntypedFormControl('', [Validators.required])
    });
    this.accountsArray = this.data;
    this.setBankFormVariables();
    this.checkAccountDetailsAndUpadateValidity();
  }

  /**
   * @description Opens dialog for adding missing bank account details.
   * @param accountDetails - Bank account details.
   */
  addMissingBankAccountDetails(accountDetails: yodleeAccDetails) {
    const dialogRef = this.dialog.open(AccountDetailsFormModalComponent, {
      maxWidth: '650px',
      width: '93%',
      disableClose: true,
      autoFocus: false,
      data: accountDetails,
      panelClass: 'modal-noPadding'
    });
    dialogRef.afterClosed().subscribe(() => {
      this.checkAccountDetailsAndUpadateValidity();
    });
  }

  /**
   * @description Method for initializing bank variables in `this.accountsArray`.
   */
  setBankFormVariables() {
    this.accountsArray.forEach((account: yodleeAccDetails) => {
      const modifiedAccount: yodleeAccDetails = { ...account }; // Create a new object based on the account parameter

      modifiedAccount.accountNo4Validation = modifiedAccount.fullAccountNumber
        ? modifiedAccount.fullAccountNumber
        : modifiedAccount.accountNumber;
      modifiedAccount.accountNo4Validation =
        modifiedAccount.accountNo4Validation?.replace(/x/g, '');
      modifiedAccount.bankFormData = {
        bankRoutingNumber: modifiedAccount.routingNumber
          ? modifiedAccount.routingNumber
          : '',
        bankAccountNumber: '',
        bankAccountName: modifiedAccount.accountName
          ? modifiedAccount.accountName
          : '',
        bankAccountNickName: modifiedAccount.accountNickName
          ? modifiedAccount.accountNickName
          : '',
        bankAccountAddressLine1: '',
        bankAccountAddressLine2: '',
        bankAccountCity: '',
        bankAccountState: '',
        bankAccountZip: '',
        bankAccountCountry: ''
      };
      const index = this.accountsArray.indexOf(account);
      if (index !== -1) {
        this.accountsArray[index] = modifiedAccount;
      }
    });
  }

  /**
   *@description Sets validators and bank form data to bank form.
   */
   checkAccountDetailsAndUpadateValidity() {
    /** todo - eslint erroes need to fix */
    this.accountsArray.forEach((account: yodleeAccDetails, index: number) => {
      if(account.isChase){
        account.isAddressVerificationRequired = 1;
        
      }
      this.bankForm.controls.bankAccountNumber.clearValidators();
      this.bankForm.controls.bankAccountNumber.setValidators([ Validators.required,Validators.minLength(5),AccuntNoValidator(account.accountNo4Validation)]);
      this.bankForm.updateValueAndValidity();
      this.bankForm.setValue(account.bankFormData);

      if (account?.isVerificationRequired === 0 && account?.isAddressVerificationRequired  === 0 ) {
        account.isValid = true;

        // eslint-disable-next-line no-unsafe-optional-chaining
        if(index === this.accountsArray?.length - 1){
          const allElementsMeetCondition = this.accountsArray.every(
            (item) => item.isVerificationRequired === 0 && item.isAddressVerificationRequired === 0);
            if(allElementsMeetCondition){
            this.isAutoClick = true;
            this.linkAccounts();
          }
        }
      }
      else if((account?.isVerificationRequired === 0 && account?.isAddressVerificationRequired === 1) ||
              (account?.isVerificationRequired === 1 && account?.isAddressVerificationRequired === 1 )){

        account.isValid = false;
        this.isAddressRequired = true;
        this.isAutoClick = false;

        if( account?.bankFormData?.bankAccountAddressLine1 === '' ||
          account?.bankFormData?.bankAccountCity === '' ||
          account?.bankFormData?.bankAccountState === '' ||
          account?.bankFormData?.bankAccountZip === ''
        ){
          account.isValid = false;
        }else{
          account.isValid = true;
        }

      }
      else if(account?.isVerificationRequired === 1 && account?.isAddressVerificationRequired === 0 ){
        account.isValid = false;
          if(this.bankForm?.controls?.bankAccountNumber?.value?.length >= 6){
            const accNumber = this.bankForm?.controls?.bankAccountNumber?.value;
            if(accNumber.endsWith(account?.accountNumber)){
              account.isValid = true;
            }else{
              account.isValid = false;
            }
        }else{
          account.isValid = false;
        }
      }
    });
  }


  /**
   * @description Goes to next page, if account is valid.
   */
  nextPage() {
    const accountsInValid = this.accountsArray.some(
      (account) => !account.isValid
    );

    if (accountsInValid) {
      this.alertService.warningAlert({
        content: 'Some of your account details are missing'
      });
    } else {
      this.linkAccounts();
    }
  }

  /**
   * @description Updates the form `this.formData` with values from `this.accountsArray` and creates the bank account with the data.
   */
  linkAccounts() {
    const data = this.commonData
      ?.dialogueInitializationData as IYodleeParentData;
    const appendKey = data.key as string;
    this.formData.append('key', appendKey);

    this.accountsArray.forEach((account: yodleeAccDetails) => {
      this.formData.append(`selected_banks[${account.ydId}][id]`, 'on');
      this.formData.append(
        `selected_banks[${account.ydId}][routing_number]`,
        account.bankFormData?.bankRoutingNumber
          ? account.bankFormData?.bankRoutingNumber
          : account.routingNumber
      );
      this.formData.append(
        `selected_banks[${account.ydId}][full_account_number]`,
        account.fullAccountNumber
      );
      this.formData.append(
        `selected_banks[${account.ydId}][provider]`,
        account.providerId
      );
      this.formData.append(
        `selected_banks[${account.ydId}][bank_account_account_number]`,
        account.bankFormData?.bankAccountNumber
          ? account.bankFormData?.bankAccountNumber
          : account.fullAccountNumber
      );
      this.formData.append(
        `selected_banks[${account.ydId}][account_nick_name]`,
        account.bankFormData?.bankAccountNickName
      );
      const profile = account.profile as IYodleeProfile;
      const addressLine1 =
        account.bankFormData?.bankAccountAddressLine1 || profile?.address || '';
      const addressLine2 =
        account.bankFormData?.bankAccountAddressLine2 ||
        profile?.address2 ||
        '';
      this.formData.append(
        `selected_banks[${account.ydId}][account_address]`,
        addressLine1 + addressLine2
      );

      this.formData.append(
        `selected_banks[${account.ydId}][account_zip]`,
        account.bankFormData?.bankAccountZip
          ? account.bankFormData?.bankAccountZip
          : profile?.zip
      );
      this.formData.append(
        `selected_banks[${account.ydId}][account_city]`,
        account.bankFormData?.bankAccountCity
          ? account.bankFormData?.bankAccountCity
          : profile?.city
      );
      this.formData.append(
        `selected_banks[${account.ydId}][account_state]`,
        account.bankFormData?.bankAccountState
          ? account.bankFormData?.bankAccountState
          : profile?.state
      );
      this.formData.append(
        `selected_banks[${account.ydId}][account_number]`,
        account.accountNumber
      );
      this.formData.append(
        `selected_banks[${account.ydId}][bank_account_account_name]`,
        account.bankFormData?.bankAccountName
      );
      this.formData.append(
        `selected_banks[${account.ydId}][account_country]`,
        account.bankFormData?.bankAccountCountry
          ? account.bankFormData?.bankAccountCountry
          : 'us'
      );
    });
    this.isLoading = true;
    this.subscriptions.push(
      this.bankAccService
        .yodleeAddBankAcc(this.formData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res && res.success) {
              const responseData = res.data || [];

              this.next.emit({ bankAcs: [...responseData] });

              this.bankAccService.bancAcEvents.next({
                message: 'Bank Account Created',
                bankAcs: [...responseData],
                accountsMetaData: this.accountsArray
              });
            }
          },
          error: () => {
            this.isLoading = false;
            this.errors.emit();
          }
        })
    );
  }

  /**
   * @description Emits `prev` event to go back to previous page.
   */
  previousPage() {
    this.prev.emit(true);
  }

  /**
   * @description Sets the full account number in `this.accountsArray`.
   * @param accNo - full account number.
   * @param index - index.
   */
  getFullAccNo(accNo: string, index: number): void {
    this.accountsArray[index].bankFormData.bankAccountNumber = accNo;
    this.checkAccountDetailsAndUpadateValidity();
  }

  /**
   * @description Method to remove account.
   * @param item - bank account to be removed.
   */
  accountRemove(item: yodleeAccDetails) {
    const index = this.accountsArray.indexOf(item);
    if (index !== -1) {
      this.accountsArray.splice(index, 1);
      if (this.accountsArray.length === 0) {
        this.prev.emit(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
