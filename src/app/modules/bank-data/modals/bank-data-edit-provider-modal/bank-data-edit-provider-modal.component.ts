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
import { NgClass } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-bank-data-edit-provider-modal',
  templateUrl: './bank-data-edit-provider-modal.component.html',
  styleUrls: ['./bank-data-edit-provider-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions,
    NgClass
  ]
})
export class BankDataEditProviderModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  providerName: UntypedFormControl = new UntypedFormControl(
    null,
    Validators.required
  );
  updating = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { providerId: string; providerName: string },
    private _bankDataService: BankDataService,
    private dialogRef: MatDialogRef<BankDataEditProviderModalComponent>
  ) {}

  ngOnInit(): void {
    this.providerName.setValue(this.data.providerName);
  }

  /**
   * @description  To update provider.
   *
   */
  update() {
    this.updating = true;

    if (this.providerName.valid) {
      const body = { id: this.data.providerId, name: this.providerName.value };
      this._bankDataService
        .updateProvider(body)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.dialogRef.close({
              success: true,
              providerName: this.providerName.value
            });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
