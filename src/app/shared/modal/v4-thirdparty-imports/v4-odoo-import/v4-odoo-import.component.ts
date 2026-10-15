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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Settings, Clock } from 'lucide-angular';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';
import { IOdooImportedForm } from 'src/app/modules/integration/odoo/model/odoo';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-odoo-import',
  templateUrl: './v4-odoo-import.component.html',
  styleUrls: ['./v4-odoo-import.component.scss'],
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
export class V4OdooImportComponent implements OnInit {
  private odooService = inject(OdooService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4OdooImportComponent>);
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

  isConnected = false;
  loading = false;
  dataLoaded = false;
  odooForm: FormGroup<IOdooImportedForm>;

  importTime = [
    { id: 1, name: 'Last 2 hours' },
    { id: 2, name: 'Last 12 hours' },
    { id: 3, name: 'Last 24 hours' },
    { id: 4, name: 'Last 3 days' },
    { id: 5, name: 'Last 7 days' },
    { id: 6, name: 'Last 15 days' }
  ];

  ngOnInit(): void {
    this.initFormGroup();
    this.getOdooConnectionStatus();
  }

  initFormGroup(): void {
    this.odooForm = this.fb.group({
      type: new FormControl<number | null>(1),
      time: new FormControl<number | null>(1)
    });
  }

  getOdooConnectionStatus(): void {
    this.odooService
      .getOdooConnectionDetails()
      .pipe(
        finalize(() => {
          this.dataLoaded = true;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.isConnected = res.data.connected === 1;
          this.connectionStatus.emit(this.isConnected);
        }
      });
  }

  onSubmit(): void {
    const formValue = this.odooForm.value;
    const payload = {
      type: formValue.type || 1,
      time: formValue.time || 1
    };
    this.loading = true;
    this.odooService
      .importOdooData(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.completeImport.emit(true);
        }
      });
  }

  goToThirdpartyHome(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: 'odoo' }
    });
    this.dialogRef.close(false);
  }

  back(): void {
    this.clickBackButton.emit(true);
  }
}
