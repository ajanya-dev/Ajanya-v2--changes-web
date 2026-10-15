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
  selector: 'app-v4-square-import',
  templateUrl: './v4-square-import.component.html',
  styleUrls: ['./v4-square-import.component.scss'],
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
export class V4SquareImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4SquareImportComponent>);
  public data: { type: string } = inject(MAT_DIALOG_DATA);
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
  isConnected = false;

  // Only 5 time spans (no 14d/30d)
  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' }
  ];

  squareForm = this.fb.group({
    importTime: [this.importTime[2].id]
  });

  ngOnInit(): void {
    this.getSquareData();
  }

  getSquareData(): void {
    this.integrationService
      .getSquareDetails()
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data.connected === 1) {
            this.isConnected = true;
            this.connectionStatus.emit(true);
          } else {
            this.isConnected = false;
            this.connectionStatus.emit(false);
          }
        }
      });
  }

  onSubmit(): void {
    const formValue = this.squareForm.value;
    const payload = {
      importTime: formValue.importTime as number,
      type: 1
    };
    this.loading = true;
    this.integrationService
      .importFromSquare(payload)
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

  goToThirdpartyHome(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: 'square' }
    });
    this.dialogRef.close(false);
  }

  back(): void {
    this.clickBackButton.emit(true);
  }
}
