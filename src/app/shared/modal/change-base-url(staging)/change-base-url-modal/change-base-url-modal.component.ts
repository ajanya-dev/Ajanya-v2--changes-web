import { Component, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Method to change the root url.
 */
@Component({
  selector: 'app-change-base-url-modal',
  templateUrl: './change-base-url-modal.component.html',
  styleUrls: ['./change-base-url-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgIf,
    MatDialogActions,
    MatTooltip,
    MatDialogClose
  ]
})
export class ChangeBaseUrlModalComponent implements OnInit {
  url = new UntypedFormControl('https://', [Validators.required]);
  isChangedUrlExist: string;
  rootUrl: string;

  constructor(
    private __matDilogRef: MatDialogRef<ChangeBaseUrlModalComponent>,
    private _alertService: AlertService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.url.markAsTouched();
    this.isChangedUrlExist = this.localStorageService.getItem('tempRoot')!;
    this.rootUrl = environment.rootUrl?.split('/api')[0];
  }

  /**
   * @description Method to set the root url to localStorage and show alert.
   */
  onSubmit(): void {
    if (this.url.invalid) {
      return;
    }
    this.localStorageService.setItem('tempRoot', this.url.value);
    this._alertService.successAlert({
      content: `URL changed to<br><span style="color: red" >${this.url.value}</span>`,
      close: true
    });
    this.__matDilogRef.close();
  }

  /**
   * @description Method to reset the base url to default and show alert.
   */
  resetBaseUrl(): void {
    this.localStorageService.removeItem('tempRoot');
    this._alertService.successAlert({
      content: `Reset to default.`,
      close: true
    });
    this.__matDilogRef.close();
  }
}
