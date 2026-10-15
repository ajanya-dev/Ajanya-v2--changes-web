import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { Router, ActivatedRoute, Data, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IQBDData } from 'src/app/modules/integration/model/integration';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CustomerSupportComponent } from '../../../../../shared/components/customer-support/customer-support.component';
import { NgStyle } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

/**
 * Component for managing QuickBooks Desktop integration settings.
 */
@Component({
  selector: 'app-quickbooks-desktop-old',
  templateUrl: './quickbooks-desktop-old.component.html',
  styleUrls: ['./quickbooks-desktop-old.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    RouterLink,
    CustomerSupportComponent
  ]
})
export class QuickbooksDesktopOldComponent implements OnInit, OnDestroy {
  private _dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new UntypedFormControl(this.positionOptions[1]);

  payeeAddressSpecialSetting = new UntypedFormControl();
  enableOcwStyleStub = new UntypedFormControl();

  loading = false;
  mailText: string;
  email: string;
  downloadLink: string;
  videoLink: string;
  subscriptions: Subscription[] = [];
  quickBookDesktopData: IQBDData;
  routeData: Data;

  constructor(
    private _integrationService: IntegrationService,
    private _alertService: AlertService,
    private router: Router,
    private routes: ActivatedRoute,
    private _localStorageService: LocalStorageService
  ) {}

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this.getQuickBookDesktop();
    this.email = this._localStorageService.getItem('email')!;

    //get data from route
    this.routes.data.subscribe((data: Data) => {
      this.routeData = data;
    });
  }

  /**
   * Get QuickBooks Desktop integration settings.
   */
  getQuickBookDesktop(): void {
    this.loading = true;

    this.subscriptions.push(
      this._integrationService
        .getQuickBookDesktopData()
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.quickBookDesktopData = res.data;
            this.downloadLink = res.data.version5Link;
            this.videoLink = res.data.videoLink;
            res.data.payeeAddressSpecialSetting
              ? this.payeeAddressSpecialSetting.setValue(1)
              : this.payeeAddressSpecialSetting.setValue(0);
            res.data.enableOcwStyleStub
              ? this.enableOcwStyleStub.setValue(1)
              : this.enableOcwStyleStub.setValue(0);
          }
        })
    );
  }

  /**
   * Update QuickBooks Desktop integration settings based on the type.
   * @param {string} type - The type of setting to update ('setting' or 'styleStub').
   */
  updateQuickBookDesktop(type: string): void {
    const data = {
      payeeAddressSpecialSetting:
        type == 'setting'
          ? Number(this.payeeAddressSpecialSetting.value)
          : Number(this.quickBookDesktopData.payeeAddressSpecialSetting),
      enableOcwStyleStub:
        type == 'styleStub'
          ? Number(this.enableOcwStyleStub.value)
          : Number(this.quickBookDesktopData.enableOcwStyleStub)
    };

    this.loading = true;
    this.subscriptions.push(
      this._integrationService
        .updateQuickBookDesktopData(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (type == 'setting') {
              this.quickBookDesktopData.payeeAddressSpecialSetting = Number(
                this.payeeAddressSpecialSetting.value
              );
            } else {
              this.quickBookDesktopData.enableOcwStyleStub = Number(
                this.enableOcwStyleStub.value
              );
            }

            this.openSuccessAlert('Updated Successfully.');
          }
        })
    );
  }

  /**
   * Navigate to the previous URL.
   */
  backUrl() {
    if (this.routeData.backUrl) {
      this.router.navigate([this.routeData.backUrl]);
    } else {
      this.router.navigate(['/manage/thirdparty_app/index']);
    }
  }

  /**
   * Navigate to the mapping page for company integration.
   */
  onMapCompany(): void {
    this.router.navigate([
      'manage/thirdparty_app/quickBooks/qb_desktop/mapping'
    ]);
  }

  /**
   * Open the default email client with a support mailto link.
   */
  onSupportMail(): void {
    this.mailText = `mailto:${this.email}`;
    window.location.href = this.mailText;
  }

  /**
   * Open a live chat or help website, depending on the configuration.
   */
  goToLiveChat(): void {
    this._dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * Open a success alert with the given content.
   * @param {string} content - The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }

  /**
   * Set QuickBooks Desktop version data.
   */
  setQBDVersion() {
    IntegrationService.setQBDData({ isOldVersion: false });
  }

  /**
   * Clean up and unsubscribe from subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
