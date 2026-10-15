import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  standalone: true,
  selector: 'app-square-import',
  templateUrl: './square-import.component.html',
  styleUrls: ['./square-import.component.scss'],
  imports: [
    NgOptimizedImage,
    MatRadioGroup,
    MatRadioButton,
    ReactiveFormsModule,
    CommonButtonV35Component
  ]
})
export class SquareImportComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private dialogRef = inject(MatDialogRef);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private alertService = inject(AlertService);

  @Output() connectionStatus = new EventEmitter<boolean>();
  @Output() clickBackButton = new EventEmitter<boolean>();
  @Output() compelteImport = new EventEmitter<boolean>();

  isConnected = signal<boolean>(false);
  subscriptions: Subscription[] = [];
  loading: boolean = false;
  squareForm: FormGroup;

  importTime = [
    { value: 1, name: 'Last 2 hours' },
    { value: 2, name: 'Last 12 hours' },
    { value: 3, name: 'Last 24 hours' },
    { value: 4, name: 'Last 3 days' },
    { value: 5, name: 'Last 7 days' }
  ];

  ngOnInit() {
    this.initFormGroup();
    this.getSquareData();
  }

  initFormGroup(): void {
    this.squareForm = this.formBuilder.group({
      importTime: [this.importTime[2].value]
    });
  }

  /**
   * Retrieves square integration data.
   */
  getSquareData(): void {
    this.subscriptions.push(
      this.integrationService.getSquareDetails().subscribe((res) => {
        if (res.success) {
          if (res.data.connected === 1) {
            this.isConnected.set(true);
            this.connectionStatus.emit(true);
          } else {
            this.isConnected.set(false);
            this.connectionStatus.emit(false);
          }
        }
      })
    );
  }

  goToThirdpartyHome() {
    this.router.navigate(['/manage/thirdparty_app/square']);
    this.dialogRef.close(false);
  }

  back() {
    this.clickBackButton.next(true);
  }

  onSubmit() {
    const formValue = this.squareForm.value;
    const payload = {
      importTime: formValue.importTime as number,
      type : 1
    };
    this.loading = true;
    this.subscriptions.push(
      this.integrationService
        .importFromSquare(payload)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.compelteImport.emit(true);
            this.alertService.successAlert({ close: true });
          }
        })
    );
  }
}
