import { Utils } from 'src/app/data/utils';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Params } from '@angular/router';
import { LucideAngularModule, Landmark, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { GoogleAddressService } from '../../../../../core/services/google-address.service';

interface IBankAddress {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface IInvalidBank {
  cheque_sno: string;
  bank_account_id: string;
  bank_name: string;
  address: IBankAddress;
}

interface IBankData {
  enc_id: string;
  bank_account_account_name: string;
  bank_account_address_line_1: string;
  bank_account_address_line_2: string;
  bank_account_city: string;
  bank_account_state: string;
  bank_account_zip: string;
  bank_account_country: string;
}

type BankItemForm = FormGroup<{
  checkNo: FormControl<string>;
  enc_id: FormControl<string>;
  name: FormControl<string>;
  address_line_1: FormControl<string>;
  address_line_2: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  zip: FormControl<string>;
  country: FormControl<string>;
}>;

type EditBankFormType = FormGroup<{
  item: FormArray<BankItemForm>;
}>;

@Component({
  selector: 'app-update-bank-modal',
  templateUrl: './update-bank-modal-v4.component.html',
  styleUrls: ['./update-bank-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    AddressAutocompleteV4Component
  ]
})
export class UpdateBankModalV4Component implements OnInit {
  public datas: Params = inject(MAT_DIALOG_DATA);
  private fb = inject(NonNullableFormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private checkService = inject(CheckService);
  private alert = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<UpdateBankModalV4Component>);
  private destroyRef = inject(DestroyRef);

  EditBankForm: EditBankFormType;

  payeeAddress: { [key: string]: string }[] = [];
  errMsg: string;
  array: { [key: string]: string }[] = [];
  utils = Utils;

  disabled = false;

  LandmarkIcon = Landmark;
  XIcon = X;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.googleAddressService.resetGoogleAutocompleteAPI();
    });
  }

  ngOnInit(): void {
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initFormGroup();

    this.payeeAddress = this.datas as { [key: string]: string }[];

    this.setCloneData();
  }

  onAddressSelected(address: IGoogleAddress, i: number): void {
    const formGrp = this.itemArray.at(i);
    formGrp.controls.address_line_1.setValue(address.address ?? '');
    formGrp.controls.city.setValue(address.city ?? '');
    formGrp.controls.state.setValue(address.state ?? '');
    formGrp.controls.zip.setValue(address.zip ?? '');
    formGrp.controls.country.setValue(address.country ?? '');
  }

  initFormGroup() {
    this.EditBankForm = this.fb.group({
      item: this.fb.array<BankItemForm>([this.createBankCtrl()])
    });
  }

  createBankCtrl(): BankItemForm {
    return this.fb.group({
      checkNo: [''],
      enc_id: [''],
      name: ['', [Validators.required, ValidationService.personNameValidator]],
      address_line_1: [''],
      address_line_2: [''],
      city: [''],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

  get itemArray(): FormArray<BankItemForm> {
    return this.EditBankForm.controls.item;
  }

  addCtrl() {
    this.itemArray.push(this.createBankCtrl());
  }

  removeCtrl(i: number) {
    this.itemArray.removeAt(i);
  }

  setCloneData() {
    if (this.datas !== null) {
      if (this.datas.type === 'multi-update') {
        this.checkService
          .getbank({ ids: this.datas.id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res: { data: IBankData[] }) => {
            this.datas.invalidbank.forEach((ele: IInvalidBank) => {
              this.array.push({
                checkNo: ele.cheque_sno,
                enc_id: ele.bank_account_id,
                name: ele.bank_name,
                address_line_1: ele.address.address_line_1,
                address_line_2: ele.address.address_line_2,
                city: ele.address.city,
                state: ele.address.state,
                zip: ele.address.zip,
                country: ele.address.country
              });

              this.addCtrl();
              this.removeCtrl(res.data.length);
            });
            this.EditBankForm.patchValue({
              item: this.array
            });

            // Several checks render as a table - it needs the full row width.
            // The panel class lifts Material's default 80vw max-width, which
            // would otherwise clip the dialog on callers that don't set one.
            if (this.itemArray.length > 1) {
              this.dialogRef.addPanelClass('v4-address-table-modal');
              this.dialogRef.updateSize('1280px');
            }
          });
      } else {
        this.checkService
          .getbank({ ids: [this.datas.id] })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res: { data: IBankData[] }) => {
            res.data.forEach((ele: IBankData) => {
              this.array.push({
                checkNo: this.datas.checkNo,
                enc_id: ele.enc_id,
                name: ele.bank_account_account_name,
                address_line_1: ele.bank_account_address_line_1,
                address_line_2: ele.bank_account_address_line_2,
                city: ele.bank_account_city,
                state: ele.bank_account_state,
                zip: ele.bank_account_zip,
                country: ele.bank_account_country
              });

              this.addCtrl();
              this.removeCtrl(res.data.length);
            });
            this.EditBankForm.patchValue({
              item: this.array
            });
          });
      }
    }
  }

  update() {
    this.EditBankForm.markAllAsTouched();
    if (!this.EditBankForm.valid) return;

    const bankData = this.itemArray.getRawValue();

    this.disabled = true;

    this.checkService
      .updatebank(bankData)
      .pipe(
        catchError(() => {
          this.disabled = false;
          return of(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: { success: boolean; message: string }) => {
        const Udata = {
          title: 'Success',
          content: 'Bank address updated',
          close: true,
          timeout: 2000
        };

        if (res.success && res.message !== 'Updated') {
          const close = this.alert.successAlert(Udata);

          close.afterClosed().subscribe((result) => {
            if (result) {
              this.dialogRef.close(result);
            }
          });
        } else {
          this.disabled = false;
        }
      });
  }
}
