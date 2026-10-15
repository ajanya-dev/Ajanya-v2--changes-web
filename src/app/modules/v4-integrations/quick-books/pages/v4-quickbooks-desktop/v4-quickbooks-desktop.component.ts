import {
  Component,
  computed,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  IQBDData,
  IquickBookDesktopFile
} from 'src/app/modules/integration/model/integration';
import { V4QbDesktopDownloadfileModalComponent } from '../../modals/v4-qb-desktop-downloadfile-modal/v4-qb-desktop-downloadfile-modal.component';
import { V4QbdSettingsComponent } from '../../modals/v4-qbd-settings/v4-qbd-settings.component';
import { V4QbdMappingComponent } from '../../modals/v4-qbd-mapping/v4-qbd-mapping.component';

@Component({
  selector: 'app-v4-quickbooks-desktop',
  templateUrl: './v4-quickbooks-desktop.component.html',
  styleUrls: ['./v4-quickbooks-desktop.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class V4QuickbooksDesktopComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);

  private destroyRef = inject(DestroyRef);

  isOldVersion = computed(() => IntegrationService.qbDesktopOldVersion());

  quickBookDesktopData: IQBDData;
  quickBookDesktopFiles: IquickBookDesktopFile[];
  allFiles: IquickBookDesktopFile[];
  isConnected = false;
  isPending = false;
  hasFiles = false;

  searchControl = new FormControl();
  payeeAddressSpecialSetting = new FormControl('0');
  enableOcwStyleStub = new FormControl('0');

  payeeAddressOptions = [
    { value: '0', label: 'Default' },
    { value: '1', label: 'Consider Payee Second Line as First Line' }
  ];
  ocwStyleStubOptions = [
    { value: '0', label: 'Disable' },
    { value: '1', label: 'Enable' }
  ];

  loading = signal({
    dataLoading: false,
    filesLoading: false,
    settingsLoading: false
  });

  actionLoadingFileId: string | undefined = undefined;

  ngOnInit(): void {
    this.getQuickBookDesktopData();
    this.getQuickbooksDesktopFiles();
  }

  getQuickBookDesktopData(): void {
    this.loading.update((l) => ({ ...l, dataLoading: true }));

    this.integrationService
      .getQuickBookDesktopData()
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, dataLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.quickBookDesktopData = res.data;
          this.payeeAddressSpecialSetting.setValue(
            res.data.payeeAddressSpecialSetting ? '1' : '0'
          );
          this.enableOcwStyleStub.setValue(
            res.data.enableOcwStyleStub ? '1' : '0'
          );
        }
      });
  }

  getQuickbooksDesktopFiles(): void {
    this.loading.update((l) => ({ ...l, filesLoading: true }));

    this.integrationService
      .getQuickbooksDesktopFiles()
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, filesLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.quickBookDesktopFiles = res.data.files;
          this.allFiles = [...res.data.files];
          this.hasFiles = this.quickBookDesktopFiles.length > 0;
          this.isConnected = this.quickBookDesktopFiles.some(
            (f) => f.status == 1
          );
          this.isPending =
            !this.isConnected &&
            this.quickBookDesktopFiles.some((f) => f.status == 0);
        } else {
          this.hasFiles = false;
          this.isConnected = false;
          this.isPending = false;
        }
      });
  }

  updateSetting(type: 'setting' | 'styleStub'): void {
    let data = {};
    if (type === 'setting') {
      data = {
        payeeAddressSpecialSetting: Number(
          this.payeeAddressSpecialSetting.value
        )
      };
    } else {
      data = {
        enableOcwStyleStub: Number(this.enableOcwStyleStub.value)
      };
    }

    this.loading.update((l) => ({ ...l, settingsLoading: true }));

    this.integrationService
      .updateQuickBookDesktopData(data)
      .pipe(
        finalize(() => {
          this.loading.update((l) => ({ ...l, settingsLoading: false }));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (type === 'setting') {
            this.quickBookDesktopData.payeeAddressSpecialSetting = Number(
              this.payeeAddressSpecialSetting.value
            );
          } else {
            this.quickBookDesktopData.enableOcwStyleStub = Number(
              this.enableOcwStyleStub.value
            );
          }
          this.alertService.successAlert({
            content: 'Updated Successfully.',
            close: true
          });
        }
      });
  }

  onDownloadFileClicked(): void {
    const dialogRef = this.dialog.open(V4QbDesktopDownloadfileModalComponent, {
      width: '460px',
      minHeight: '300px',
      panelClass: 'paddingless-modal-rounded'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickbooksDesktopFiles();
      }
    });
  }

  onDownloadCompanyFile(file: IquickBookDesktopFile): void {
    if (this.actionLoadingFileId) return;
    this.actionLoadingFileId = file.id;

    const sendingData = new FormData();
    sendingData.append('file_id', file.id);

    this.integrationService
      .quickbooksDesktopDownloadCompanyFile(sendingData)
      .pipe(
        finalize(() => {
          this.actionLoadingFileId = undefined;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.downloadURI(res.data);
        }
      });
  }

  onDisconnect(file: IquickBookDesktopFile): void {
    const confirm = this.alertService.confirmAlert({
      content: `Are you sure you want to disconnect ${file.companyName}?`
    });
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.disconnectFile(file);
      }
    });
  }

  private disconnectFile(file: IquickBookDesktopFile): void {
    this.actionLoadingFileId = file.id;

    const sendingData = new FormData();
    sendingData.append('file_id', file.id);

    this.integrationService
      .quickbooksDesktopDisconnectCompany(sendingData)
      .pipe(
        finalize(() => {
          this.actionLoadingFileId = undefined;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully disconnected.',
            close: true
          });
          this.getQuickbooksDesktopFiles();
        }
      });
  }

  onResetPassword(file: IquickBookDesktopFile): void {
    this.dialog.open(V4QbDesktopDownloadfileModalComponent, {
      width: '460px',
      minHeight: '300px',
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'edit', fileDetails: file }
    });
  }

  onDeleteFile(file: IquickBookDesktopFile, index: number): void {
    const confirm = this.alertService.confirmAlert({
      content: `Are you sure you want to delete ${file.nick_name} file?`
    });
    confirm.afterClosed().subscribe((r) => {
      if (r) {
        this.deleteFile(file, index);
      }
    });
  }

  private deleteFile(file: IquickBookDesktopFile, index: number): void {
    this.actionLoadingFileId = file.id;

    const sendingData = new FormData();
    sendingData.append('file_id', file.id);

    this.integrationService
      .deleteQBDesktopCompanyFile(sendingData)
      .pipe(
        finalize(() => {
          this.actionLoadingFileId = undefined;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully deleted.',
            close: true
          });
          this.quickBookDesktopFiles.splice(index, 1);
          this.allFiles = [...this.quickBookDesktopFiles];
          this.hasFiles = this.quickBookDesktopFiles.length > 0;
          this.isConnected = this.quickBookDesktopFiles.some(
            (f) => f.status == 1
          );
          this.isPending =
            !this.isConnected &&
            this.quickBookDesktopFiles.some((f) => f.status == 0);
        }
      });
  }

  openMoreSettings(): void {
    if (this.loading().dataLoading) return;
    const dialogRef = this.dialog.open(V4QbdSettingsComponent, {
      width: '650px',
      minHeight: '300px',
      panelClass: 'paddingless-modal-rounded',
      data: this.quickBookDesktopData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getQuickBookDesktopData();
      }
    });
  }

  onMapCompany(): void {
    this.dialog.open(V4QbdMappingComponent, {
      width: '900px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
  }

  onSearchFiles(input: HTMLInputElement): void {
    const value = input.value;
    if (value !== '') {
      this.quickBookDesktopFiles = this.allFiles.filter((file) =>
        file.nick_name.toLowerCase().includes(value.toLowerCase())
      );
    } else {
      this.quickBookDesktopFiles = [...this.allFiles];
    }
  }

  getFileStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Connected';
      case 2:
        return 'Disconnected';
      case 3:
      case 4:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  }

  getFileStatusClasses(status: number): Record<string, boolean> {
    return {
      'bg-v4-badge-warning-bg-color text-v4-badge-warning-text-color':
        status === 0,
      'bg-v4-badge-success-bg-color text-v4-badge-success-text-color':
        status === 1,
      'bg-v4-badge-neutral-bg-color text-v4-badge-neutral-text-color':
        status === 2,
      'bg-v4-badge-error-bg-color text-v4-badge-error-text-color':
        status === 3 || status === 4
    };
  }

  switchVersion(): void {
    const newIsOld = !IntegrationService.qbDesktopOldVersion();
    IntegrationService.setQBDData({ isOldVersion: newIsOld });
  }

  downloadURI(uri: string): void {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
