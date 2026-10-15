import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  Output
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { faGear } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IOdooImportedForm } from 'src/app/modules/integration/odoo/model/odoo';
import { OdooService } from 'src/app/modules/integration/odoo/service/odoo.service';

@Component({
  selector: 'app-odoo-import',
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    FontAwesomeModule,
    MatDialogModule,
    NgOptimizedImage
  ],
  templateUrl: './odoo-import.component.html',
  styleUrl: './odoo-import.component.scss'
})
export class OdooImportComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  public data: { type: string } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<OdooImportComponent>);
  private router = inject(Router);
  private odooService = inject(OdooService);

  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() completeImport = new EventEmitter<boolean>();

  subscriptions: Subscription[] = [];
  faXmark = faXmark;
  isConnected = false;
  importFrom: FormGroup<IOdooImportedForm>;
  loading = false;
  faGear = faGear;

  importTime = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' },
    { value: 6, name: 'Last 15 days' }
  ];

  ngOnInit(): void {
    this.initFormGroup();
    this.getOdooConnectionStatus();
  }

  getOdooConnectionStatus(): void {
    this.subscriptions.push(
      this.odooService.getOdooConnectionDetails().subscribe((res) => {
        if (res.success) {
          this.isConnected = res.data.connected === 1;
          this.connectionStatus.emit(this.isConnected);
        }
      })
    );
  }
  /**
   * @description Closes dialog and navigates to `odoo` integration home.
   */
  goToThirdpartyHome() {
    this.router.navigate(['manage/thirdparty_app/odoo/main']);
    this.dialogRef.close(false);
  }

  initFormGroup(): void {
    this.importFrom = this.fb.group({
      type: new FormControl<number | null>(1),
      time: new FormControl<number | null>(1)
    });
  }

  onSubmit(): void {
    const formValue = this.importFrom.value;
    const payload = {
      type: formValue.type || 1,
      time: formValue.time || 1
    };
    this.loading = true;
    this.subscriptions.push(
      this.odooService
        .importOdooData(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
            this.completeImport.emit(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
