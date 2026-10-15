import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IConnectedCompanyList,
  IConnectedThirdPartyData
} from 'src/app/modules/integration/model/integration';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';

@Component({
  selector: 'app-v4-freshbooks-settings-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTooltipModule,
    LucideAngularModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-freshbooks-settings-modal.component.html',
  styleUrl: './v4-freshbooks-settings-modal.component.scss'
})
export class V4FreshbooksSettingsModalComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private dialogRef =
    inject<MatDialogRef<V4FreshbooksSettingsModalComponent>>(MatDialogRef);
  private destroyRef = inject(DestroyRef);

  data: IConnectedThirdPartyData = inject(MAT_DIALOG_DATA);

  autoDownloading = new UntypedFormControl();
  pushbackEnable = new UntypedFormControl();

  loading = signal({
    defaultLoading: false,
    payeeLoading: false,
    categoryLoading: false
  });

  isConnected = signal<number>(0);
  isFreshbooksExport = signal<number>(0);
  companyList: IConnectedCompanyList[] = [];

  ngOnInit(): void {
    this.getSettings();
    this.isConnected.set(this.data?.connected);
    this.isFreshbooksExport.set(this.data?.module?.freshbooksExport);
    this.pushbackEnable.setValue(this.data?.module?.freshbooksPushBackEnable);
    this.companyList = this.data?.companies || [];
  }

  getSettings(): void {
    this.integrationService
      .getFreshBooksSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data) {
          this.autoDownloading.setValue(
            res.data.freshbook_webhook === 1 ? 1 : 0
          );
          this.pushbackEnable.setValue(
            res.data.fb_push_back_enable === 1 ? 1 : 0
          );
        }
      });
  }

  saveSettings(): void {
    this.loading.update((l) => ({ ...l, defaultLoading: true }));

    this.integrationService
      .PostFreshBooksSettings({
        freshbook_webhook: this.autoDownloading.value ? 1 : 0,
        fb_push_back_enable: this.pushbackEnable.value ? 1 : 0
      })
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, defaultLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Settings updated successfully.',
            close: true
          });
        }
      });
  }

  onAutoDownloadingChange(): void {
    this.saveSettings();
  }

  onPushbackChange(): void {
    this.saveSettings();
  }

  openCompanyListModal(mode: 'Payee' | 'Category'): void {
    const sendingData = {
      mode,
      companyList: this.companyList
    };

    const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: sendingData,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (mode === 'Payee') {
          this.importFreshbookPayee(res.companyId);
        } else if (mode === 'Category') {
          this.importFreshbookCategories(res.companyId);
        }
      }
    });
  }

  importFreshbookPayee(companyId: string): void {
    this.loading.update((l) => ({ ...l, payeeLoading: true }));

    this.integrationService
      .importFreshBookPayee({ companyIds: [companyId] })
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, payeeLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  importFreshbookCategories(companyId: string): void {
    this.loading.update((l) => ({ ...l, categoryLoading: true }));

    this.integrationService
      .importFreshBookCategories({ companyIds: [companyId] })
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, categoryLoading: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
          this.dialogRef.close(true);
        }
      });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
