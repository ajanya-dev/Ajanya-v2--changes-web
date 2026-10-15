import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Settings, Clock } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';

@Component({
  selector: 'app-v4-netsuite-import',
  templateUrl: './v4-netsuite-import.component.html',
  styleUrls: ['./v4-netsuite-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    V4RadioGroupComponent,
    CommonButtonV4Component,
    LucideAngularModule,
    NgOptimizedImage,
    V4CommonDropDownSelectorComponent
  ]
})
export class V4NetsuiteImportComponent implements OnInit {
  private netSuiteintegrationService = inject(NetsuiteIntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4NetsuiteImportComponent>);
  public netSuiteType: { type: string } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  completeImport = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly ClockIcon = Clock;

  loading = false;
  dataLoaded = false;
  isConnected: boolean;

  readonly env = environment;

  cachedDefaultSubsidiaryId = signal<string | null>(null);
  defaultSubsidiaryId = signal<string | null>(null);
  subsidiaryList = signal<{ id: string; name: string }[]>([]);
  subsidiaryListWithDefault = computed(() =>
    this.subsidiaryList().map((item) => ({
      ...item,
      defaultLabel:
        item.id === this.cachedDefaultSubsidiaryId() ? 'Default' : ''
    }))
  );

  subsidiaryLoading = signal<boolean>(false);
  subsidiaryPage = 1;
  subsidiaryHasMore = true;
  subsidiarySearchTerm = '';
  subsidiarySearch$ = new Subject<string>();

  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' },
    { id: 6, name: 'Last 15 days' }
  ];

  downloadFilter = [
    { id: 0, name: 'Download All' },
    { id: 1, name: 'Download only mark as print later' }
  ];

  netsuiteForm = this.fb.group({
    type: [1],
    importTime: [this.importTime[2].id],
    downloadFilter: [0],
    billPaymentId: ''
  });

  ngOnInit(): void {
    this.onCheckNetSuiteConnection();
    this.getSettings();
    this.getSubsidiary();
    this.subsidiarySearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((term) => {
        this.subsidiarySearchTerm = term;
        this.subsidiaryPage = 1;
        this.subsidiaryHasMore = true;
        this.subsidiaryList.set([]);
        this.getSubsidiary();
      });
  }

  onCheckNetSuiteConnection(): void {
    this.netSuiteintegrationService
      .getNetSuiteConnectionDetails()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data.connected === 0) {
            this.isConnected = false;
            this.connectionStatus.emit(false);
          } else {
            this.isConnected = true;
            this.connectionStatus.emit(true);
          }
        }
      });
  }

  getSettings(): void {
    this.subsidiaryLoading.set(true);
    this.netSuiteintegrationService
      .getSettings()
      .pipe(
        finalize(() => this.subsidiaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data.defaultSubsidiaryId) {
            const selectedId = res.data.defaultSubsidiaryId;
            const selectedName = res.data.defaultSubsidiaryName ?? '';
            this.subsidiaryList.update((list) => {
              const exists = list.some((item) => item.id === selectedId);
              if (exists) return list;
              return [{ id: selectedId, name: selectedName }, ...list];
            });
          }
          this.defaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.cachedDefaultSubsidiaryId.set(res.data.defaultSubsidiaryId);
          this.netsuiteForm.controls.downloadFilter.setValue(
            res.data.downloadFilter
          );
        }
      });
  }

  getSubsidiary(): void {
    if (!this.subsidiaryHasMore) return;
    this.subsidiaryLoading.set(true);
    this.netSuiteintegrationService
      .getSubsidiary(
        this.subsidiaryPage,
        this.subsidiarySearchTerm || undefined
      )
      .pipe(
        finalize(() => this.subsidiaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (!res.data?.length) {
            this.subsidiaryHasMore = false;
            return;
          }
          this.subsidiaryList.update((list) => {
            const existingIds = new Set(list.map((item) => item.id));
            return [
              ...list,
              ...res.data.filter((item) => !existingIds.has(item.id))
            ];
          });
          this.subsidiaryPage += 1;
        }
      });
  }

  onSubsidiaryScrollToEnd(): void {
    this.getSubsidiary();
  }

  onSubsidiarySearch(term: string): void {
    this.subsidiarySearch$.next(term);
  }

  onSubsidiarySearchClear(): void {
    this.subsidiarySearchTerm = '';
    this.subsidiaryPage = 1;
    this.subsidiaryHasMore = true;
    this.subsidiaryList.set([]);
    this.getSubsidiary();
  }

  setSubsidiaryId(event: string): void {
    this.defaultSubsidiaryId.set(event);
  }

  onSubmit(): void {
    const formValue = this.netsuiteForm.value;
    const subsidiaryId = this.defaultSubsidiaryId() ?? '';
    const payload = {
      type: formValue.type as number,
      importTime: formValue.importTime as number,
      downloadFilter: formValue.downloadFilter as number,
      importSingleBillPayment: formValue.billPaymentId !== '' ? 1 : 0,
      billPaymentId:
        formValue.billPaymentId !== '' ? formValue.billPaymentId : undefined,
      importBill: this.selectedType() === 'bills' ? 1 : 0,
      importBillPayment: this.selectedType() === 'checks' ? 1 : 0,
      subsidiaryIds: subsidiaryId ? [subsidiaryId] : ([] as string[])
    };
    this.loading = true;
    this.netSuiteintegrationService
      .importData(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.completeImport.emit(true);
          this.alertService.successAlert({ close: true });
        }
      });
  }

  goToThirdpartyHome() {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { source: 'payments', openAppId: 'netsuite' }
    });
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.emit(true);
  }
}
