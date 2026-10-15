import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Settings, Clock } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-workday-import',
  templateUrl: './v4-workday-import.component.html',
  styleUrls: ['./v4-workday-import.component.scss'],
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
    NgOptimizedImage
  ]
})
export class V4WorkdayImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4WorkdayImportComponent>);
  public data: { type: string } = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  // Signal-based inputs/outputs
  connectionStatus = output<boolean>();
  clickBackButton = output<boolean>();
  selectedType = input<string>();

  // Lucide icons
  readonly SettingsIcon = Settings;
  readonly ClockIcon = Clock;

  loading = false;
  dataLoaded = false;
  isConnected: number;
  appId: string;

  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' },
    { id: 6, name: 'Last 14 days' },
    { id: 7, name: 'Last 30 days' }
  ];

  workdayForm = this.fb.group({
    importTime: [this.importTime[2].id]
  });

  ngOnInit(): void {
    this.checkConnection();
  }

  checkConnection(): void {
    this.integrationService
      .getConnectionDetails('workday')
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.appId = res.data.id;
          this.isConnected = res.data.connected;
          if (this.isConnected) {
            this.connectionStatus.emit(true);
          } else {
            this.connectionStatus.emit(false);
          }
        }
      });
  }

  onSubmit(): void {
    const params: { type: number; importTime: number } = {
      type: 1,
      importTime: this.workdayForm.value.importTime
    };
    if (this.data.type === 'bills') {
      params.type = 1;
    } else if (this.data.type === 'invoices') {
      params.type = 2;
    }
    this.loading = true;
    this.integrationService
      .importData(params, this.appId)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: res.message,
            close: true
          });
          this.dialogRef.close({ success: true });
        }
      });
  }

  goToThirdpartyHome(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: 'workday' }
    });
    this.dialogRef.close(false);
  }

  back(): void {
    this.clickBackButton.emit(true);
  }
}
