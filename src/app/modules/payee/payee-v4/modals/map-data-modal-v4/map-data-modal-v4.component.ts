import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IDisableUserOptionEvent,
  IPayeeImportStep2,
  IPayeeImportStepTwoRowData
} from 'src/app/modules/payee/payee-v2/model/payee';

@Component({
  selector: 'app-map-data-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, FormsModule],
  templateUrl: './map-data-modal-v4.component.html',
  styleUrls: ['./map-data-modal-v4.component.scss']
})
export class MapDataModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<MapDataModalV4Component>);
  private data = inject<{
    stepData: IPayeeImportStep2;
    payeeTypeId?: number;
  }>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);

  headerOptions: { key: string; value: string }[] = [];
  headerColumns: { selectedIndex: string }[] = [];
  excelArrayData: { key: number; value: string[] }[] = [];
  fileHeaders: unknown[] = [];
  isLoading = signal(false);

  mappedCount = signal(0);
  rowCount = signal(0);
  totalFields = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const { stepData } = this.data;
    if (!stepData) return;

    this.fileHeaders = stepData.fileHeader || [];

    // Parse rows into array data
    let i = 0;
    stepData.rows?.forEach((k2: IPayeeImportStepTwoRowData, index2: number) => {
      const data = stepData.rows;
      const k: string[] = Object.keys(k2);
      const k3: string[] = Object.values(k2);

      k.forEach((key: string, index3: number) => {
        if (key === '' && k3[index3] === '') {
          i += 1;
          const updatedRow: IPayeeImportStepTwoRowData = { ...k2 };
          delete updatedRow[key];
          data[index2] = updatedRow;
        }
      });

      if (stepData.rows.length !== i) {
        this.excelArrayData.push({ key: index2, value: k3 });
      } else {
        this.excelArrayData = [];
        data.forEach((ele: IPayeeImportStepTwoRowData, idx: number) => {
          this.excelArrayData.push({ key: idx, value: Object.values(ele) });
        });
      }
    });

    this.rowCount.set(this.excelArrayData.length);

    // Build header options
    this.headerOptions =
      stepData.header
        ?.filter((h: Record<string, string>) => h.displayName !== 'Match')
        .map((h: Record<string, string>) => ({
          key: h.value,
          value: h.displayName
        })) || [];

    this.totalFields.set(this.headerOptions.length);

    // Determine column count from first row data
    const colCount =
      this.excelArrayData[0]?.value?.length || this.fileHeaders?.length || 15;
    for (let j = 0; j < colCount; j += 1) {
      this.headerColumns.push({ selectedIndex: '' });
    }
  }

  onMappingChange(): void {
    const count = this.headerColumns.filter(
      (c) => c.selectedIndex !== ''
    ).length;
    this.mappedCount.set(count);
  }

  disableUsedOption(event: IDisableUserOptionEvent): void {
    const disabledList: number[] = [];
    if (event?.target?.value !== -1) {
      const allSelects: NodeListOf<HTMLSelectElement> =
        document.querySelectorAll('select');
      for (let i = 0; i < allSelects.length; i += 1) {
        if (allSelects[i].selectedIndex !== -1) {
          if (
            disabledList.findIndex((x) => x === allSelects[i].selectedIndex) ===
            -1
          ) {
            disabledList.push(allSelects[i].selectedIndex);
          }
        }
      }
      for (let i = 0; i < allSelects.length; i += 1) {
        for (let j = 0; j < allSelects[i].options.length; j += 1) {
          if (disabledList.findIndex((x) => x === j) !== -1) {
            allSelects[i].options[j].disabled = true;
          } else {
            allSelects[i].options[j].disabled = false;
          }
        }
      }
    }
  }

  submit(): void {
    const requiredAny1 = ['0'];
    let payeeNameSelected = false;
    const mapping = this.headerColumns.map((row) => {
      if (requiredAny1.includes(row.selectedIndex)) {
        payeeNameSelected = true;
      }
      return row.selectedIndex;
    });

    if (!payeeNameSelected) {
      this.alertService.warningAlert({
        content:
          'Please at least select payee name. This file cannot be processed'
      });
      return;
    }

    // Validate payee name length
    let errorFlg = false;
    let errorlineNo = -1;
    this.data.stepData?.rows?.forEach(
      (l: IPayeeImportStepTwoRowData, _index: number) => {
        if (l.name?.length > 100) {
          errorFlg = true;
          errorlineNo = _index + 1;
        }
      }
    );

    if (errorFlg) {
      this.alertService.warningAlert({
        content: `Payee name on line ${errorlineNo} exceeds 100 characters. This file cannot be processed`
      });
      return;
    }

    this.isLoading.set(true);
    const body: {
      mapping: unknown;
      uploadFromImport: string;
      payeeTypeId?: number;
    } = { mapping, uploadFromImport: 'yes' };
    if (this.data?.payeeTypeId != null) {
      body.payeeTypeId = this.data.payeeTypeId;
    }

    this.payeeService
      .multiImportStep3(body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          const noOfPayees = res?.data?.dupilcatedPayees?.length;
          if (noOfPayees > 0) {
            const msg = res?.data?.message ? `${res.data.message}. ` : '';
            this.alertService.warningAlert({
              title: 'Warning!',
              content: `${msg}Duplicate Payee Found: ${res.data.dupilcatedPayees[0]}. This payee cannot be added at this time`,
              close: true,
              timeout: 3000
            });
          } else if (res?.data?.message) {
            this.alertService.successAlert({
              title: 'Success!',
              content: res.data.message,
              close: true,
              timeout: 3000
            });
          }
          this.v3DataTableService.refreshV3DataTable();
          this.dialogRef.close({ success: true });
        }
      });
  }

  goBack(): void {
    this.dialogRef.close({ back: true });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
