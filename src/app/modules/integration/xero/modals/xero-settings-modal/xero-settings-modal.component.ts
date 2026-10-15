import { Component, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { IXeroSettings } from '../../../model/integration';
import { NgStyle } from '@angular/common';

/**
 * Component for configuring Xero settings.
 */
@Component({
  selector: 'app-xero-settings-modal',
  templateUrl: './xero-settings-modal.component.html',
  styleUrls: ['./xero-settings-modal.component.scss'],
  standalone: true,
  imports: [NgStyle, FormsModule, ReactiveFormsModule]
})
export class XeroSettingsModalComponent implements OnInit {
  subscriptions: Subscription[] = [];

  autoDownloading = new UntypedFormControl();

  loading = {
    defaultLoading: false,
    companyLoading: false
  };

  constructor(
    public _dialogRef: MatDialogRef<XeroSettingsModalComponent>,
    private _integrationService: IntegrationService
  ) {}

  ngOnInit(): void {
    this.getsettings();
  }

  /**
   * Retrieves Xero settings and populates the form.
   */
  getsettings() {
    this.subscriptions.push(
      this._integrationService
        .getXeroSettings()
        .subscribe((res: IXeroSettings) => {
          res.xero_webhook == 1
            ? this.autoDownloading.setValue(1)
            : this.autoDownloading.setValue(0);
        })
    );
  }

  /**
   * Posts Xero settings data to update auto-downloading configuration.
   */
  postQuickBookOnlineData() {
    this.loading.defaultLoading = true;
    this.subscriptions.push(
      this._integrationService
        .PostXeroSettings({ xero_webhook: this.autoDownloading.value ? 1 : 0 })
        .pipe(
          finalize(() => {
            this.loading.defaultLoading = false;
          })
        )
        //eslint-disable-next-line @typescript-eslint/no-empty-function
        .subscribe(() => {})
    );
  }

  /**
   * Closes the Xero settings modal.
   */
  close() {
    this._dialogRef.close(true);
  }
}
