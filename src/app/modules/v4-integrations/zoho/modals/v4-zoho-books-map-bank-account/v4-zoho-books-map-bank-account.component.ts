import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject
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
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IMappingBankAccount } from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-zoho-books-map-bank-account',
  templateUrl: './v4-zoho-books-map-bank-account.component.html',
  styleUrls: ['./v4-zoho-books-map-bank-account.component.scss'],
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
export class V4ZohoBooksMapBankAccountComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4ZohoBooksMapBankAccountComponent>);
  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);

  readonly data: {
    zohoBookId: string;
    zohoBookData: IMappingBankAccount;
    mode?: string;
  } = inject(MAT_DIALOG_DATA);

  readonly providerCode = 'zoho_books' as const;

  loading = false;
  editmode = false;

  mapForm = new FormGroup({
    bankAccount: new FormControl('', Validators.required)
  });

  ngOnInit(): void {
    this.editmode = this.data.mode === 'edit';
    if (this.editmode && this.data.zohoBookData?.bankAccount) {
      this.mapForm.controls.bankAccount.setValue(
        this.data.zohoBookData.bankAccount
      );
    }
  }

  onDropdownReady(ev: IV3DropDownOnReady): void {
    if (this.editmode && this.data.zohoBookData?.bankAccount) {
      ev.setItemWithId?.(this.data.zohoBookData.bankAccount);
    }
  }

  bankDropDownChange(ev: IBankDropdown | null | undefined): void {
    if (ev?.id) {
      this.mapForm.controls.bankAccount.setValue(ev.id);
    } else {
      this.mapForm.controls.bankAccount.setValue('');
    }
  }

  submit(): void {
    this.mapForm.markAllAsTouched();
    if (this.mapForm.invalid) return;

    this.loading = true;
    this.integrationService
      .mapBankAccount(
        {
          bank_account: this.mapForm.value.bankAccount as string,
          id: this.data.zohoBookId
        },
        this.providerCode
      )
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: this.editmode
              ? 'Updated successfully.'
              : 'Bank account mapped successfully.',
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }
}
