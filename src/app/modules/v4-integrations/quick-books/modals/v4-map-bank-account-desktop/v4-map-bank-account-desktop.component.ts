import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';

@Component({
  selector: 'app-v4-map-bank-account-desktop',
  templateUrl: './v4-map-bank-account-desktop.component.html',
  styleUrls: ['./v4-map-bank-account-desktop.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4ControlMessageComponent
  ]
})
export class V4MapBankAccountDesktopComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4MapBankAccountDesktopComponent>);
  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);

  public data: { qbId: string; mode?: string; bankAccountId?: string } =
    inject(MAT_DIALOG_DATA);

  loading = false;
  editmode = false;
  bankAccount = new FormControl('', Validators.required);

  ngOnInit(): void {
    if (this.data?.mode === 'edit') {
      this.editmode = true;
    }
  }

  onDropdownReady(ev: IV3DropDownOnReady): void {
    if (this.editmode && this.data?.bankAccountId) {
      ev.setItemWithId?.(this.data.bankAccountId);
    }
  }

  bankDropDownChange(ev: IBankDropdown | null | undefined): void {
    if (ev?.id) {
      this.bankAccount.setValue(ev.id);
    } else {
      this.bankAccount.setValue('');
    }
  }

  submit(): void {
    if (this.loading) return;
    this.bankAccount.markAsTouched();
    if (this.bankAccount.invalid) return;

    this.loading = true;

    if (this.editmode) {
      this.integrationService
        .updateMapQBDesktopBankAcc(this.data.qbId, {
          bankAccountId: this.bankAccount.value!
        })
        .pipe(
          finalize(() => (this.loading = false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: res?.message || 'Updated successfully.',
              close: true
            });
            this.dialogRef.close(true);
          }
        });
    } else {
      this.integrationService
        .mapQuickBooksDesktopBankAcc({
          bankAccountId: this.bankAccount.value!,
          qbId: this.data.qbId
        })
        .pipe(
          finalize(() => (this.loading = false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: res?.message || 'Bank account mapped successfully.',
              close: true
            });
            this.dialogRef.close(true);
          }
        });
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
