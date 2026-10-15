import { finalize } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { IAttachmentFromPhoneCheckDetails } from 'src/app/modules/check/model/check';
import { NgIf, NgFor, NgStyle, NgClass, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-attachment-from-phone',
  templateUrl: './attachment-from-phone.component.html',
  styleUrls: ['./attachment-from-phone.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, NgStyle, NgClass, CurrencyPipe]
})
export class AttachmentFromPhoneComponent implements OnInit, OnDestroy {
  acceptedFormat = '.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,.rtf,.jpg,.jpeg,.png';
  subscriptions: Subscription[] = [];
  uuId: string;
  formData = new FormData();
  appConfig: IAppConfig;
  selectedFiles: File[] = [];
  checkDetails: IAttachmentFromPhoneCheckDetails;
  linkExpired = true;
  loading = {
    defaultLoading: false,
    uploading: false
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private _checkService: CheckService,
    public _appSettingService: AppSettingsService,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadAppSettings();
    this.getParams();
    this.getCheckDetails();
  }

  getParams(): void {
    this.activatedRoute.params.subscribe((res) => {
      this.uuId = res.uuId;
    });
  }

  loadAppSettings(): void {
    this.subscriptions.push(
      this._appSettingService.appConfig$.subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      })
    );
  }

  getCheckDetails(): void {
    this.loading.defaultLoading = true;

    this.subscriptions.push(
      this._checkService
        .getMobileAttachmentCheckData(this.uuId)
        .pipe(finalize(() => (this.loading.defaultLoading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.checkDetails = res.data;
            this.linkExpired = false;
          }
        })
    );
  }

  uploadInput(event: any): void {
    const file: File = event.target.files[0];
    const splited = file?.name.split('.');
    const fileType = `.${splited[splited?.length - 1]}`;

    if (!this.acceptedFormat.includes(fileType)) {
      this._alertService.warningAlert({
        content: `The attachment must be a file of type: ${this.acceptedFormat}`
      });
      return;
    }

    if (this.maxSizeValidator(file.size)) {
      return;
    }

    this.selectedFiles.push(file);
  }

  onDeleteAttachment(index: number): void {
    this.selectedFiles.forEach((_a: any, i: number) => {
      if (i == index) {
        this.selectedFiles.splice(i, 1);
      }
    });
  }

  createAttachmentBody(): void {
    this.formData.append('uuid', this.uuId);
    for (const item of this.selectedFiles) {
      this.formData.append(`attachment[]`, item);
    }
  }

  onSubmit(): void {
    this.createAttachmentBody();
    this.loading.uploading = true;

    this.subscriptions.push(
      this._checkService
        .addAttachmentFromMobileDevice(this.formData)
        .pipe(finalize(() => (this.loading.uploading = false)))
        .subscribe((res) => {
          if (res.success) {
            this._alertService.successAlert({ content: 'Attachment added.' });
            this.linkExpired = true;
          }
        })
    );
  }

  maxSizeValidator(size: number): boolean {
    const divider = 1e6;
    if (size / divider > 10) {
      this._alertService.warningAlert({ content: 'Maximum size is 10MB.' });
      return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
