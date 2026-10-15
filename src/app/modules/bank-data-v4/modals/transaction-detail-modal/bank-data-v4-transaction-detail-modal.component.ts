import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { IBankDataV4TxnRow } from '../../models/bank-data-v4-api.types';

export interface IBankDataV4TransactionDetailModalData {
  transaction: IBankDataV4TxnRow;
  accountName: string;
  categoryName: string;
  categories: { id: string; name: string }[];
}

@Component({
  selector: 'app-bank-data-v4-transaction-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatDialogModule,
    V4SelectDropdownComponent,
    CommonButtonV4Component
  ],
  templateUrl: './bank-data-v4-transaction-detail-modal.component.html',
  styleUrls: ['./bank-data-v4-transaction-detail-modal.component.scss']
})
export class BankDataV4TransactionDetailModalComponent {
  readonly XIcon = X;
  private data = inject<IBankDataV4TransactionDetailModalData>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<BankDataV4TransactionDetailModalComponent>>(
      MatDialogRef
    );

  private alertService = inject(V4AlertService);

  readonly txn: IBankDataV4TxnRow = this.data.transaction;
  readonly accountName: string =
    this.data.accountName || this.data.transaction.account_id || '—';

  readonly categoryOptions: IV4SelectOption[] = [
    { id: '__none', name: '—', value: '' },
    ...(this.data.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      value: c.id
    }))
  ];

  // Editable fields (Save/Delete APIs not yet wired — surfacing UI per design)
  selectedCategoryId = signal<string>(
    (this.data.transaction.category_id_custom || '') as string
  );

  notes = signal<string>('');
  tags = signal<string>('');

  readonly amount = computed(() => {
    const v = this.txn.amountAmount;
    return typeof v === 'number' ? v : parseFloat(v as string) || 0;
  });

  readonly isCredit: boolean =
    (this.txn.base_type ?? '').toString().toUpperCase() === 'CREDIT';

  readonly description: string = (this.txn.description_custom ||
    this.txn.original_description ||
    '—') as string;

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.alertService.infoAlert({
      content: 'Saving transaction edits is not yet available.'
    });
  }

  delete(): void {
    this.alertService.infoAlert({
      content: 'Deleting transactions is not yet available.'
    });
  }
}
