import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, Minus } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';

export interface IRemittanceRow {
  id: string;
  invoiceNumber: string;
  itemName: string | null;
  itemDescription: string;
  itemQuantity: string;
  itemUnitCost: string;
  totalSingleRow: string;
}

export interface ICashExpenseRemittanceModalData {
  rows: IRemittanceRow[];
}

export interface ICashExpenseRemittanceModalResult {
  rows: IRemittanceRow[];
  total: number;
  insertIntoCashExpense: boolean;
}

function createEmptyRow(): IRemittanceRow {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    invoiceNumber: '',
    itemName: null,
    itemDescription: '',
    itemQuantity: '',
    itemUnitCost: '',
    totalSingleRow: '0.00'
  };
}

@Component({
  selector: 'app-cash-expense-remittance-modal-v4',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, LucideAngularModule, CommonButtonV4Component, CommonInputFieldV4Component, V4CommonDropDownSelectorComponent],
  templateUrl: './cash-expense-remittance-modal-v4.component.html'
})
export class CashExpenseRemittanceModalV4Component implements OnInit {
  readonly MinusIcon = Minus;

  private dialogRef = inject(MatDialogRef<CashExpenseRemittanceModalV4Component>);
  private cashExpenseService = inject(CashExpenseService);
  private destroyRef = inject(DestroyRef);
  data: ICashExpenseRemittanceModalData = inject(MAT_DIALOG_DATA);

  rows = signal<IRemittanceRow[]>([]);
  remittanceItems = signal<string[]>([]);
  /** When true, saved remittance lines are applied to the cash expense (API payload). */
  insertIntoCashExpenseFlag = signal(false);
  itemPage = 1;

  total = computed(() =>
    this.rows().reduce((sum, r) => sum + (parseFloat(r.totalSingleRow) || 0), 0)
  );

  ngOnInit(): void {
    this.rows.set(
      this.data.rows.length > 0
        ? [...this.data.rows]
        : Array.from({ length: 7 }, () => createEmptyRow())
    );
    this.loadItems();
  }

  private loadItems(): void {
    this.cashExpenseService
      .getCashExpenseRemittanceItems(1, '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) this.remittanceItems.set(res.data);
      });
  }

  onScrollItems(): void {
    this.itemPage += 1;
    this.cashExpenseService
      .getCashExpenseRemittanceItems(this.itemPage, '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.remittanceItems.update((items) => [...items, ...res.data]);
        }
      });
  }

  onSearchItems(term: string): void {
    this.cashExpenseService
      .getCashExpenseRemittanceItems(1, term)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) this.remittanceItems.set(res.data);
      });
  }

  addRow(): void {
    if (this.rows().length < 10) {
      this.rows.update((rows) => [...rows, createEmptyRow()]);
    }
  }

  removeLastRow(): void {
    if (this.rows().length > 1) {
      this.rows.update((rows) => rows.slice(0, -1));
    }
  }

  removeRow(id: string): void {
    if (this.rows().length > 1) {
      this.rows.update((rows) => rows.filter((r) => r.id !== id));
    }
  }

  clearRows(): void {
    this.rows.set(Array.from({ length: 7 }, () => createEmptyRow()));
  }

  updateField(id: string, field: keyof IRemittanceRow, value: string): void {
    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'itemQuantity' || field === 'itemUnitCost') {
          const qty = parseFloat(field === 'itemQuantity' ? value : updated.itemQuantity) || 0;
          const cost = parseFloat(field === 'itemUnitCost' ? value : updated.itemUnitCost) || 0;
          updated.totalSingleRow = (qty * cost).toFixed(2);
        }
        return updated;
      })
    );
  }

  updateItemName(id: string, value: string | null): void {
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, itemName: value } : row))
    );
  }

  save(): void {
    const filled = this.getFilledRows();
    const result: ICashExpenseRemittanceModalResult = {
      rows: filled,
      total: this.total(),
      insertIntoCashExpense: this.insertIntoCashExpenseFlag()
    };
    this.dialogRef.close(result);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  private getFilledRows(): IRemittanceRow[] {
    return this.rows().filter(
      (r) =>
        r.invoiceNumber ||
        r.itemName ||
        r.itemDescription ||
        parseFloat(r.totalSingleRow) > 0
    );
  }
}
