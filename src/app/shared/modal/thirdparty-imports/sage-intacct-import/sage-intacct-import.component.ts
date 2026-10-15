import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router } from '@angular/router';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-sage-intacct-import',
  templateUrl: './sage-intacct-import.component.html',
  styleUrls: ['./sage-intacct-import.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgClass,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    NgFor,
    MatRadioButton
  ]
})
export class SageIntacctImportComponent implements OnInit {
  isConnected: number;
  dataLoaded = false;
  appId: string;
  loading = false;
  sageForm: FormGroup;
  subscriptions: Subscription[] = [];
  importTime = [
    { value: 1, name: '2 hours' },
    { value: 2, name: '12 hours' },
    { value: 3, name: '24 hours' },
    { value: 4, name: '3 days' },
    { value: 5, name: '7 days' },
    { value: 6, name: '14 days' },
    { value: 7, name: '30 days' }
  ];
  @Output() connectionStatus = new EventEmitter<boolean>();

  private formBuilder = inject(FormBuilder);
  private _integrationService = inject(IntegrationService);
  private _dialogData = inject(MAT_DIALOG_DATA);
  private __dialogRef = inject(MatDialogRef);
  private alertService = inject(AlertService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initFormGroup();
    this.checkSageConnected();
  }

  initFormGroup(): void {
    this.sageForm = this.formBuilder.group({
      importFrom: [''],
      importTime: [this.importTime[2].value]
    });
  }

  checkSageConnected() {
    this.subscriptions.push(
      this._integrationService
        .getConnectionDetails('sage-intacct')
        .pipe(
          finalize(() => {
            this.loading = false;
            this.dataLoaded = true;
          })
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
        })
    );
  }

  onSubmit() {
    const params: {
      type: number;
      importTime: { value: number; name: string };
    } = {
      type: 1,
      importTime: this.sageForm.value.importTime
    };
    if (this._dialogData.type === 'bills') {
      params.type = 1;
    } else if (this._dialogData.type === 'invoices') {
      params.type = 2;
    }
    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .importData(params, this.appId)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: res.message,
              close: true
            });
            this.__dialogRef.close({ success: true });
          }
        })
    );
  }

  goToThirdpartyHome() {
    this.router.navigate(['/manage/thirdparty_app/sage-intacct/home']);
    this.__dialogRef.close(false);
  }
}
