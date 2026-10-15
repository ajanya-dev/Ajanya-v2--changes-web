import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IXeroSettings } from 'src/app/modules/integration/model/integration';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-xero-settings-modal',
  standalone: true,
  templateUrl: './v4-xero-settings-modal.component.html',
  styleUrls: ['./v4-xero-settings-modal.component.scss'],
  imports: [ReactiveFormsModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4XeroSettingsModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4XeroSettingsModalComponent>);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  loading = signal({ fetching: false, saving: false });

  form = new FormGroup({
    autoDownloading: new FormControl<boolean>(false, { nonNullable: true })
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.loading.update((l) => ({ ...l, fetching: true }));
    this.integrationService
      .getXeroSettings()
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, fetching: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IXeroSettings) => {
        this.form.controls.autoDownloading.setValue(res?.xero_webhook === 1);
      });
  }

  save(): void {
    if (this.loading().saving) return;
    this.loading.update((l) => ({ ...l, saving: true }));
    this.integrationService
      .PostXeroSettings({
        xero_webhook: this.form.controls.autoDownloading.value ? 1 : 0
      })
      .pipe(
        finalize(() => this.loading.update((l) => ({ ...l, saving: false }))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.alertService.successAlert({
          content: 'Settings saved.',
          close: true
        });
        this.dialogRef.close(true);
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
