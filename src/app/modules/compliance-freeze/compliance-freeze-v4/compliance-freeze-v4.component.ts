import {
  Component,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { Info, LogOut, X, LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ContactSupportModalV4Component } from 'src/app/shared/modal/contact-support-modal-v4/contact-support-modal-v4.component';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { RerunVerificationComponent } from 'src/app/modules/payments/shared/modal/rerun-verification/rerun-verification.component';

export type ComplianceFreezeV4Variant = 'page' | 'modal';

export interface ComplianceFreezeV4ModalData {
  variant?: ComplianceFreezeV4Variant;
}

@Component({
  selector: 'app-compliance-freeze-v4',
  templateUrl: './compliance-freeze-v4.component.html',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class ComplianceFreezeV4Component implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private appSettingsService = inject(AppSettingsService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private dialogRef = inject(MatDialogRef<ComplianceFreezeV4Component>, {
    optional: true
  });

  /**
   * True when an EDD (Enhanced Due Diligence) request is pending. Falls back to
   * the persisted `eddRequestData` because the header — which populates the
   * signal — is not rendered on the standalone freeze page.
   */
  readonly showEddVerify = computed(
    () =>
      this.headerService.eddTriggerStatus() ||
      !!this.localStorageService.getItem('eddRequestData')
  );

  readonly InfoIcon = Info;
  readonly LogOutIcon = LogOut;
  readonly XIcon = X;

  @Input() variant: ComplianceFreezeV4Variant = 'page';
  @Input() showSignOut = false;

  appConfig: IAppConfig | null = null;
  private subscription?: Subscription;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data?: ComplianceFreezeV4ModalData
  ) {
    if (data?.variant) {
      this.variant = data.variant;
    } else if (this.dialogRef) {
      this.variant = 'modal';
    }
  }

  ngOnInit(): void {
    this.subscription = this.appSettingsService.appConfig$.subscribe(
      (config) => {
        this.appConfig = config;
      }
    );

    if (this.variant === 'page') {
      window.history.pushState(null, '', window.location.href);
    }
  }

  @HostListener('window:popstate')
  onPopState(): void {
    if (this.variant === 'page') {
      window.history.pushState(null, '', window.location.href);
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  onSignOut(): void {
    this.dialogRef?.close();
    this.authService.clearDataAndGoToLogin();
    window.location.href = '/login';
  }

  /** Opens the Persona EDD verification flow. */
  openEddVerification(): void {
    this.dialogRef?.close();
    this.dialog.open(RerunVerificationComponent, {
      panelClass: 'paddingless-modal-rounded',
      width: '400px',
      height: 'auto',
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

  onContactNow(): void {
    this.dialogRef?.close();
    this.dialog.open(ContactSupportModalV4Component, {
      width: '400px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
