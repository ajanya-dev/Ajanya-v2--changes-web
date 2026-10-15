import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-v4-custom-cell-editor',
  standalone: true,
  imports: [FormsModule, MatTooltip, LucideAngularModule, NgxMaskDirective],
  templateUrl: './v4-custom-cell-editor.component.html',
  styleUrls: ['./v4-custom-cell-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4CustomCellEditorComponent
  implements ICellEditorAngularComp, OnInit, OnDestroy
{
  private v3DataTableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private dataTableService = inject(DataTableService);
  private alert = inject(V4AlertService);

  params: ICellEditorParams;
  value: string;
  isUpdate = signal(false);
  tableName: 'check_list_table' | 'payment_table';
  destroy$ = new Subject();
  utils = Utils;
  valueNotUpdated = false;
  memo: string;
  amount: string;

  agInit(params: ICellEditorParams): void {
    this.params = params;
    this.value = this.params.value;
    this.tableName = params.colDef?.floatingFilterComponentParams?.tableName;
  }

  ngOnInit(): void {
    this.memo = this.params.data.description;
    this.amount = this.params.data.amount;
  }

  getValue(): string {
    return this.value;
  }

  isPopup(): boolean {
    return false;
  }

  update(): void {
    this.valueNotUpdated = true;
    if (
      this.tableName === 'check_list_table' ||
      (this.tableName === 'payment_table' &&
        this.params.data?.transfer_type_code === 'check')
    ) {
      this.checkPaymentsUpdate();
    } else {
      this.otherPaymentsUpdate();
    }
  }

  /**
   * @description Update the edited amount or memo of check based payments.
   */
  checkPaymentsUpdate() {
    this.isUpdate.set(true);
    const key = this.params.colDef.headerName?.toLowerCase() as string;
    const payload = {
      [key]: this.value
    };
    const checkId =
      this.tableName === 'check_list_table'
        ? this.params.data?.id
        : this.params.data?.transfer_id;
    this.paymentsService
      .updateCheckPayments(checkId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isUpdate.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.params.stopEditing();
            this.alert.successAlert({ content: res.message });
            if (this.tableName === 'check_list_table') {
              this.dataTableService.setRefreshStatus(true);
            }
          }
        },
        error: (err) => {
          if (err.status === 403) {
            this.params.stopEditing();
            this.alert.warningAlert({
              content: `You don't have permission to do this action.`
            });
            if (this.tableName === 'check_list_table') {
              this.dataTableService.setRefreshStatus(true);
            } else {
              this.v3DataTableService.refreshV3DataTable();
            }
          }
        }
      });
  }

  /**
   * @description Update the edited amount or memo of other payments like ACH,wire...etc..
   */
  otherPaymentsUpdate() {
    this.isUpdate.set(true);
    const key =
      this.params.colDef.headerName === 'Memo' ? 'description' : 'amount';
    const payload = {
      [key]: this.value
    };
    this.paymentsService
      .updatePayment(this.params.data?.uu_id, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isUpdate.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.params.stopEditing();
            this.alert.successAlert({ content: 'Successfully updated.' });
          }
        },
        error: (err) => {
          if (err.status === 403) {
            this.params.stopEditing();
            this.alert.warningAlert({
              content: `You don't have permission to do this action.`
            });
            this.v3DataTableService.refreshV3DataTable();
          }
        }
      });
  }

  onChange(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.stopPropagation(); // Prevents AG Grid from closing the editor
      event.preventDefault(); // Prevents default Enter key behavior
      this.update();
    }
  }

  ngOnDestroy(): void {
    if (!this.valueNotUpdated) {
      this.params.data.description = this.memo;
      this.params.data.amount = this.amount;
    }

    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
