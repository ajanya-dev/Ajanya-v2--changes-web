import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgFor, NgClass } from '@angular/common';
interface ICompany {
  id: string;
  name: string;
}
interface IAccounts {
  additional_status: string;
  available_balance_amount: string;
  checked: boolean;
  company_id: string;
  current_balance: string;
  id: string;
  last_updated: string;
  name: string;
  nick_name: string;
  refresh_status: string;
  short_name: string;
  status: number;
}
interface IGetBank {
  bankName: string;
  company: string;
  id: string;
  nickName: string;
  accountName: string;
}
@Component({
  selector: 'app-bank-data-edit-account-modal',
  templateUrl: './bank-data-edit-account-modal.component.html',
  styleUrls: ['./bank-data-edit-account-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgSelectModule,
    NgFor,
    MatDialogActions,
    NgClass
  ]
})
export class BankDataEditAccountModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  companies: ICompany[] = [];
  account: IAccounts = {
    additional_status: '',
    available_balance_amount: '',
    checked: false,
    company_id: '',
    current_balance: '',
    id: '',
    last_updated: '',
    name: '',
    nick_name: '',
    refresh_status: '',
    short_name: '',
    status: 0
  };

  accountData: IGetBank;
  accountForm: UntypedFormGroup;

  submitting = false;
  isLoading = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      companies: ICompany[];
      account: IAccounts;
      providerName: string;
    },
    private _bankDataService: BankDataService,
    private _dialogRef: MatDialogRef<BankDataEditAccountModalComponent>,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.companies = this.data?.companies;
    this.account = this.data?.account;
    this.getBankData();
  }

  initForm(data: IGetBank) {
    this.accountForm = this.fb.group({
      id: [this.account.id],
      nick_name: [data.nickName, Validators.required],
      company: [null]
    });
  }

  /**
   * @description  To get bank data.
   *
   */
  getBankData() {
    this.isLoading.set(true);
    this._bankDataService.getAccountData(this.account.id)
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe((data) => {
      this.accountData = data?.data;
      this.initForm(this.accountData);
    });
  }

  /**
   * @description  To submit the form to update bank.
   *
   */
  submit() {
    if (this.accountForm.invalid) {
      return;
    }

    this.submitting = true;
    this.subscriptions.push(
      this._bankDataService
        .updateBank(this.accountForm.value)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          this._dialogRef.close(data);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
