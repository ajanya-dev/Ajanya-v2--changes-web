import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  LucideAngularModule,
  CircleHelp,
  FileText,
  Shield
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  SETTINGS_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';
import { UserService } from 'src/app/shared/service/user/user.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MatDialog } from '@angular/material/dialog';
import { DefaultPaymentV4Component } from 'src/app/modules/payments-v4/send-payment/modals/default-payment-v4/default-payment-v4.component';

@Component({
  selector: 'app-v4-settings',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonButtonV4Component,
    V4MainPageLayoutComponent
  ],
  templateUrl: './v4-settings.component.html',
  styleUrls: ['./v4-settings.component.scss']
})
export class V4SettingsComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  private matDialog = inject(MatDialog);

  readonly CircleHelpIcon = CircleHelp;
  readonly FileTextIcon = FileText;
  readonly ShieldIcon = Shield;

  config: IMainPageConfig = {
    ...structuredClone(SETTINGS_CONFIG),
    isLoading: true
  };

  securityBadges: string[] = [
    '256-bit Encryption',
    '2FA Available',
    'SOC 2 Compliant',
    'GDPR Ready'
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.userService
      .getUserStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.config.isLoading = false))
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.config.apiCards[0].value = res.data.accountStatus;
          this.config.apiCards[1].value = res.data.securityLevel;
          this.config.apiCards[1].subtitle = res.data.isTwoFactorEnabled
            ? '2FA Enabled'
            : '2FA Disabled';
          this.config.apiCards[2].value = String(res.data.activeUsersCount);
          this.config.apiCards[3].value = String(
            res.data.unreadNotificationsCount
          );
        }
      });
  }

  goToHelpCenter(): void {
    this.router.navigate(['/v4/manage/user-support']);
  }

  goToDeveloperDocs(): void {
    window.open(
      StaticWhiteLabelConditions.apiDocumentation,
      '_blank',
      'noopener'
    );
  }

  onCardClick(card: IFeatureCard): void {
    if (card.action === 'send-payment') {
      this.matDialog.open(DefaultPaymentV4Component, {
        panelClass: 'paddingless-modal-rounded',
        width: 'fit-content'
      });
      return;
    }
    if (card.routerLink) {
      this.router.navigate([`/v4/manage/${card.routerLink}`], {
        queryParams: card.queryParams
      });
    }
  }
}
