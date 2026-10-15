import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPayeeData } from '../../../payee-v2/model/payee';

@Component({
  selector: 'app-payee-merge-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './payee-merge-modal-v4.component.html',
  styleUrls: ['./payee-merge-modal-v4.component.scss']
})
export class PayeeMergeModalV4Component implements OnInit {
  private payeeService = inject(PayeeService);
  private dialogRef = inject(MatDialogRef<PayeeMergeModalV4Component>);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  public payeeData = inject<IPayeeData[]>(MAT_DIALOG_DATA);

  selectedPayee = signal<IPayeeData | null>(null);
  loading = signal(false);
  payeeIds: string[] = [];

  ngOnInit(): void {
    this.payeeIds = this.payeeData.map((payee) => payee.encrypted_id);
  }

  selectPayee(payee: IPayeeData): void {
    this.selectedPayee.set(payee);
  }

  mergePayee(): void {
    const selected = this.selectedPayee();
    if (!selected) {
      this.alertService.warningAlert({
        content: 'Please select a master payee to merge'
      });
      return;
    }

    this.loading.set(true);
    this.payeeService
      .mergePayee({
        selectedMasterPayeeId: selected.encrypted_id,
        selectedPayeeIds: this.payeeIds
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((response) => {
        if (response.success) {
          this.alertService.successAlert({
            title: 'Success!',
            content: response.data,
            close: true,
            timeout: 3000
          });
          this.dialogRef.close({ success: response.success });
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
