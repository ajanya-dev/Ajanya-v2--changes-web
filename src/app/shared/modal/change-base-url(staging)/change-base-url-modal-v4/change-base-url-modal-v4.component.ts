import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, X } from 'lucide-angular';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

@Component({
  selector: 'app-change-base-url-modal-v4',
  templateUrl: './change-base-url-modal-v4.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    MatTooltip,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ]
})
export class ChangeBaseUrlModalV4Component implements OnInit {
  readonly XIcon = X;

  url = new UntypedFormControl('https://', [Validators.required]);
  isChangedUrlExist: string;
  rootUrl: string;

  constructor(
    private dialogRef: MatDialogRef<ChangeBaseUrlModalV4Component>,
    private alertService: AlertService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.url.markAsTouched();
    this.isChangedUrlExist = this.localStorageService.getItem('tempRoot')!;
    this.rootUrl = environment.rootUrl?.split('/api')[0];
  }

  onSubmit(): void {
    if (this.url.invalid) return;
    this.localStorageService.setItem('tempRoot', this.url.value);
    this.alertService.successAlert({
      content: `URL changed to<br><span style="color: red">${this.url.value}</span>`,
      close: true
    });
    this.dialogRef.close();
  }

  resetBaseUrl(): void {
    this.localStorageService.removeItem('tempRoot');
    this.alertService.successAlert({ content: 'Reset to default.', close: true });
    this.dialogRef.close();
  }
}
