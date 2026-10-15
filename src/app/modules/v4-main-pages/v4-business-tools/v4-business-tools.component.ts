import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4MainPageLayoutComponent } from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component';
import {
  IFeatureCard,
  IMainPageConfig,
  BUSINESS_TOOLS_CONFIG
} from 'src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data';

@Component({
  selector: 'app-v4-business-tools',
  standalone: true,
  imports: [V4MainPageLayoutComponent, CommonButtonV4Component],
  templateUrl: './v4-business-tools.component.html',
  styleUrls: ['./v4-business-tools.component.scss']
})
export class V4BusinessToolsComponent {
  private router = inject(Router);

  config: IMainPageConfig = BUSINESS_TOOLS_CONFIG;

  onCardClick(card: IFeatureCard): void {
    if (card.routerLink) {
      this.router.navigate([`/v4/manage/${card.routerLink}`]);
    }
  }
}
