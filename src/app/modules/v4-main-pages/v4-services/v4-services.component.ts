import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  SERVICES_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';

@Component({
  selector: 'app-v4-services',
  standalone: true,
  imports: [
    NgOptimizedImage,
    LucideAngularModule,
    CommonButtonV4Component,
    V4MainPageLayoutComponent
  ],
  templateUrl: './v4-services.component.html',
  styleUrls: ['./v4-services.component.scss']
})
export class V4ServicesComponent {
  private router = inject(Router);

  readonly CircleCheckIcon = CircleCheck;

  config: IMainPageConfig = SERVICES_CONFIG;

  onCtaClick(): void {
    this.router.navigate(['/v4/manage/virtual-card']);
  }

  onCardClick(card: IFeatureCard): void {
    if (card.comingSoon) return;
    if (card.routerLink) {
      this.router.navigate([`/v4/manage/${card.routerLink}`]);
    }
  }

  goToIntegrations(): void {
    this.router.navigate(['/v4/manage/thirdparty_app/index']);
  }
}
