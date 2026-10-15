import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { LucideAngularModule, Upload, X } from 'lucide-angular';
import { IActionLoaderData } from 'src/app/modules/common-verification/model/common-verification';
import { V4LoaderModalComponent } from 'src/app/shared/modal/v4-loader-modal/v4-loader-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

export interface IPersonalCloudAccount {
  personalAccountExists: boolean;
}

@Component({
  selector: 'app-v4-personal-account-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ],
  templateUrl: './v4-personal-account-details.component.html',
  styleUrls: ['./v4-personal-account-details.component.scss']
})
export class PersonalAccountDetailsV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<PersonalAccountDetailsV4Component>);
  private data = inject<IPersonalCloudAccount>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly UploadIcon = Upload;

  addressForm!: FormGroup;
  loading = false;
  personalAccountExists = false;
  file1Input!: File;
  file2Input!: File;
  occupation: { key: string; value: string }[] = [];

  occupationControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  occupationDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Select Occupation',
    displayField: 'value',
    outputField: 'key'
  };

  ngOnInit(): void {
    if (this.data?.personalAccountExists) {
      this.personalAccountExists = true;
    }
    this.initForm();
    this.getTypes();

    this.occupationControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.addressForm.controls.occupation.setValue(val);
      });
  }

  getTypes(): void {}

  initForm(): void {
    this.addressForm = this.fb.group({
      occupation: ['', [Validators.required]],
      document1: ['', [Validators.required]],
      document2: ['', [Validators.required]]
    });
  }

  createAddressBody(): FormData {
    const body = this.addressForm.value;
    const formData = new FormData();
    formData.append('personal[occupation]', body.occupation);
    formData.append(
      'personal[document][localNationalDocument]',
      this.file1Input
    );
    formData.append('personal[document][supportingDocument]', this.file2Input);
    formData.append('accountType', 'personalChecking');
    return formData;
  }

  addAddress(): void {
    const body = this.createAddressBody();
    if (this.personalAccountExists) {
      this.addressForm.removeControl('occupation');
      this.addressForm.removeControl('document1');
      this.addressForm.removeControl('document2');
    }
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) {
      return;
    }
    this.loading = true;

    this.dialog
      .open<V4LoaderModalComponent, IActionLoaderData>(V4LoaderModalComponent, {
        maxWidth: '450px',
        width: '90%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { type: { cloudBankPersonalAccount: body } }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          window.location.reload();
          this.dialogRef.close(res);
        } else {
          this.loading = false;
        }
      });
  }

  onFile1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.file1Input = input.files[0];
      this.addressForm.controls.document1.setValue(this.file1Input.name);
    }
  }

  onFile2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.file2Input = input.files[0];
      this.addressForm.controls.document2.setValue(this.file2Input.name);
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
