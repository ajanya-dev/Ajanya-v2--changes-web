import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IPayeeImportStep2 } from 'src/app/modules/payee/payee-v2/model/payee';
import { MapDataModalV4Component } from '../map-data-modal-v4/map-data-modal-v4.component';

@Component({
  selector: 'app-import-payee-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './import-payee-modal-v4.component.html',
  styleUrls: ['./import-payee-modal-v4.component.scss']
})
export class ImportPayeeModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<ImportPayeeModalV4Component>);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private data = inject<{ payeeTypeId?: number; title?: string }>(
    MAT_DIALOG_DATA,
    {
      optional: true
    }
  );

  title = this.data?.title ?? 'Import Vendors/Contacts';

  fileName = signal('No file selected');
  file: File | undefined;
  templateFile =
    'https://api-staging.api.ocw.sebipay.com/cdn/download/sample_multi_data_file.xlsx';

  isLoading = signal(false);
  isSampleFileLoading = signal(false);

  ngOnInit(): void {
    this.fetchSampleFileUrl();
  }

  private fetchSampleFileUrl(): void {
    this.isSampleFileLoading.set(true);
    this.payeeService
      .checkWhetherIsBankingACHUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSampleFileLoading.set(false))
      )
      .subscribe((data) => {
        if (data.success) {
          this.templateFile = data.data.sampleFileUrl;
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file?.name) {
      this.file = file;
      this.fileName.set(file.name);
    }
    // Reset so the same file can be re-selected
    input.value = '';
  }

  downloadSampleFile(): void {
    window.location.href = this.templateFile;
  }

  import(): void {
    if (!this.file?.name) {
      this.alertService.warningAlert({
        content: 'Please click on browse and select a valid file'
      });
      return;
    }

    const formData = new FormData();
    formData.append('template', 'templateFile');
    formData.append('excelFile', this.file);
    formData.append('includeHeader', 'true');
    formData.append('payeeTypeId', String(this.data?.payeeTypeId ?? ''));

    this.isLoading.set(true);
    this.payeeService
      .multiImportStep2(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((data) => {
        if (data.success) {
          this.dialogRef.close(false);
          this.openMapDataModal(data.data);
        }
      });
  }

  private openMapDataModal(stepData: IPayeeImportStep2): void {
    const payeeTypeId = this.data?.payeeTypeId;
    const mapRef = this.dialog.open(MapDataModalV4Component, {
      width: '95%',
      maxWidth: '900px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { stepData, payeeTypeId }
    });

    mapRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.back) {
          // Re-open this import modal
          this.dialog.open(ImportPayeeModalV4Component, {
            width: '95%',
            maxWidth: '672px',
            disableClose: true,
            panelClass: 'paddingless-modal-rounded',
            data: { payeeTypeId, title: this.title }
          });
        }
      });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
