import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule, X } from 'lucide-angular';
import { IBankData } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AchService } from 'src/app/shared/service/ach/ach.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { AchPreviewModalV4Component } from 'src/app/modules/ach/modals/ach-preview-modal-v4/ach-preview-modal-v4.component';
import { AchEmailModalV4Component } from '../ach-email-modal-v4/ach-email-modal-v4.component';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component
  ],
  selector: 'app-ach-authorization-form-v4',
  templateUrl: './ach-authorization-form-v4.component.html',
  styleUrls: ['./ach-authorization-form-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchAuthorizationFormV4Component implements OnInit {
  readonly XIcon = X;

  private dialogRef = inject(MatDialogRef<AchAuthorizationFormV4Component>);
  private dialog = inject(MatDialog);
  private achService = inject(AchService);
  private dialogData: IBankData = inject(MAT_DIALOG_DATA);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  savingPreview = signal(false);
  savingEmail = signal(false);
  digitalSignPreview = '';

  achForm = new FormGroup({
    bankAccount: new FormControl('', [Validators.required]),
    to: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    fullName: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    title: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ]),
    digitalSign: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ])
  });

  ngOnInit(): void {
    if (this.dialogData?.encrypted_bankacc_id) {
      this.achForm.controls.bankAccount.setValue(
        this.dialogData.encrypted_bankacc_id
      );
    }
  }

  onDropdownReady(event: IV3DropDownOnReady): void {
    if (this.dialogData?.encrypted_bankacc_id && event.setItemWithId) {
      event.setItemWithId(this.dialogData.encrypted_bankacc_id);
    }
  }

  onBankSelect(event: { id: string } | null | undefined): void {
    this.achForm.controls.bankAccount.markAsTouched();
    this.achForm.controls.bankAccount.setValue(event?.id ?? '');
  }

  onDigitalSignKeyUp(): void {
    this.digitalSignPreview = this.achForm.controls.digitalSign.value ?? '';
  }

  private buildFormBody() {
    const data = this.achForm.value;
    return {
      bankaccount_id: data.bankAccount ?? '',
      authorize_name: data.to ?? '',
      fullname: data.fullName ?? '',
      title: data.title ?? '',
      digital_signature: data.digitalSign ?? ''
    };
  }

  saveAndPreview(): void {
    this.achForm.markAllAsTouched();
    if (this.achForm.invalid) return;

    this.savingPreview.set(true);
    const processedData = this.buildFormBody();

    this.achService
      .sendAchForm(processedData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.achService
              .previewAchForm(res.data.form_id)
              .pipe(
                finalize(() => {
                  this.savingPreview.set(false);
                  this.changeDetectorRef.detectChanges();
                }),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe({
                next: (previewRes) => {
                  this.dialog.open(AchPreviewModalV4Component, {
                    maxWidth: '800px',
                    width: '100%',
                    height: '90vh',
                    panelClass: 'paddingless-modal-rounded',
                    disableClose: false,
                    autoFocus: false,
                    restoreFocus: false,
                    data: previewRes.data.url
                  });
                  this.resetFormFields();
                }
              });
          }
        },
        error: () => {
          this.savingPreview.set(false);
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  saveAndEmail(): void {
    this.achForm.markAllAsTouched();
    if (this.achForm.invalid) return;

    this.savingEmail.set(true);
    const processedData = this.buildFormBody();

    this.achService
      .sendAchForm(processedData)
      .pipe(
        finalize(() => {
          this.savingEmail.set(false);
          this.changeDetectorRef.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const emailDialogRef = this.dialog.open(AchEmailModalV4Component, {
              maxWidth: '400px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: res.data.form_id,
              panelClass: 'paddingless-modal-rounded'
            });
            emailDialogRef.afterClosed().subscribe((modalResponse) => {
              if (modalResponse !== false) {
                this.resetFormFields();
                this.dialogRef.close(true);
              }
            });
          }
        }
      });
  }

  private resetFormFields(): void {
    this.achForm.controls.to.reset('');
    this.achForm.controls.fullName.reset('');
    this.achForm.controls.title.reset('');
    this.achForm.controls.digitalSign.reset('');
    this.digitalSignPreview = '';
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
