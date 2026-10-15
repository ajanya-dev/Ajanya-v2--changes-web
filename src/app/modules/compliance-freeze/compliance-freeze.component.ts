import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  HostListener
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ContactSupportNewComponent } from 'src/app/shared/components/contact-support-new/contact-support-new.component';
import { IAppConfig } from 'src/app/models/app_settings';
import { Subscription } from 'rxjs';
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-regular-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { RerunVerificationComponent } from 'src/app/modules/payments/shared/modal/rerun-verification/rerun-verification.component';
import { ComplianceFreezeV4Component } from './compliance-freeze-v4/compliance-freeze-v4.component';

@Component({
  selector: 'app-compliance-freeze',
  templateUrl: './compliance-freeze.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CommonButtonV35Component,
    ContactSupportNewComponent,
    FaIconComponent,
    ComplianceFreezeV4Component
  ]
})
export class ComplianceFreezeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private appSettingsService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  private route = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);

  appConfig: IAppConfig | null = null;
  completeFreeze = true;
  readonly isV4 =
    this.localStorageService.getItem('isV4LayoutEnabled') === 1;
  readonly isStandalonePage =
    this.route.snapshot.routeConfig?.component === ComplianceFreezeComponent;
  private subscription: Subscription;

  /**
   * True when an EDD (Enhanced Due Diligence) request is pending for the user.
   * Falls back to the persisted `eddRequestData` because the header — which
   * populates the signal — is not rendered on the standalone freeze page.
   */
  readonly showEddVerify = computed(
    () =>
      this.headerService.eddTriggerStatus() ||
      !!this.localStorageService.getItem('eddRequestData')
  );

  faExclamationTriangle = faExclamationTriangle;
  faArrowLeft = faArrowLeft;
  faInfoCircle = faInfoCircle;

  ngOnInit(): void {
    this.subscription = this.appSettingsService.appConfig$.subscribe(
      (config) => {
        this.appConfig = config;
      }
    );

    window.history.pushState(null, '', window.location.href);
  }

  @HostListener('window:popstate')
  onPopState(): void {
    window.history.pushState(null, '', window.location.href);
  }

  /** Opens the Persona EDD verification flow. */
  openEddVerification(): void {
    this.dialog.open(RerunVerificationComponent, {
      panelClass: 'persona-modal',
      width: '400px',
      height: '720px',
      disableClose: true,
      data: {
        mode: 'edd',
        sourceType: CVSourceType.other,
        reVerificationId:
          this.localStorageService.getItem('rerunVerification')?.id,
        businessId: this.localStorageService.getItem('eddRequestData')?.kyb_id,
        eddInquiryId:
          this.localStorageService.getItem('eddRequestData')?.edd_inquiry_id
      }
    });
  }

  onSignOut(): void {
    this.authService.clearDataAndGoToLogin();
    window.location.href = '/login';
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
