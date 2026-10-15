import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
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
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgClass } from '@angular/common';
interface ICompanyData {
  mode: string;
  company: {
    id: string;
    name: string;
  };
}
@Component({
  selector: 'app-add-company',
  templateUrl: './add-company-modal.component.html',
  styleUrls: ['./add-company-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    ControlMessageComponent,
    MatDialogActions,
    NgClass
  ]
})
export class AddCompanyComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  companyName = new UntypedFormControl(null, [
    Validators.required,
    Validators.maxLength(50)
  ]);

  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public companyData: ICompanyData,
    private _bankDataService: BankDataService,
    private _dialogRef: MatDialogRef<AddCompanyComponent>
  ) {}

  ngOnInit(): void {
    if (this.companyData.mode === 'edit') {
      this.companyName.setValue(this.companyData.company.name);
    }
  }

  /**
   * @description  To add company or edit company.
   *
   */
  submit() {
    if (this.companyName.invalid) {
      return;
    }

    this.submitting = true;
    if (this.companyData.mode === 'new') {
      this.addNewCompany();
    } else if (this.companyData.mode === 'edit') {
      const body = {
        name: this.companyName.value,
        id: this.companyData?.company.id
      };
      this.updateCompany(body);
    }
  }

  /**
   * @description  To add company.
   *
   */
  addNewCompany() {
    this.subscription.push(
      this._bankDataService
        .addCompany(this.companyName.value)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          this._dialogRef.close(data);
        })
    );
  }

  /**
   * @description  To edit company.
   *
   */
  updateCompany(body: { name: string; id: string }) {
    this.subscription.push(
      this._bankDataService
        .updateCompany(body)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe((data) => {
          this._dialogRef.close(data);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
