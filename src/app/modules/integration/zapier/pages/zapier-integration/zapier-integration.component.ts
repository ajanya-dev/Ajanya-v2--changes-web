import { Utils } from 'src/app/data/utils';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { NgStyle, NgFor } from '@angular/common';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing Zapier integration.
 */
@Component({
  selector: 'app-zapier-integration',
  templateUrl: './zapier-integration.component.html',
  styleUrls: ['./zapier-integration.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgStyle,
    NgFor,
    CustomerSupportComponent,
    DemoVideoComponent
  ]
})
export class ZapierIntegrationComponent implements OnInit {
  loading = false;
  subscriptions: Subscription[] = [];
  connectionLink: string;
  utils = Utils;
  appConfig: IAppConfig;
  instructions = [
    'Click on Connect Now',
    'Create a new Zap and set the trigger',
    'Select Online Check Writer to set action',
    'Connect with your Online Check Writer account',
    'Match the fields from your trigger application'
  ];

  constructor(
    private _integrationService: IntegrationService,
    private _appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.getZapierData();

    this.subscriptions.push(
      this._appSettingService.appConfig$.subscribe((res) => {
        this.appConfig = res as IAppConfig;
      })
    );
  }

  /**
   * Retrieves Zapier integration data.
   */
  getZapierData(): void {
    this.loading = true;

    this.subscriptions.push(
      this._integrationService
        .getZapierData()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.connectionLink = res.data.connectLink;
          }
        })
    );
  }

  /**
   * Initiates the connection to Zapier.
   */
  onConnect(): void {
    window.location.href = this.connectionLink;
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param {number} index - The index of the current element in the iteration.
   * @returns {number} - The unique identifier for the element at the specified index.
   */
  trackByIndex(index: number) {
    return index;
  }
}
